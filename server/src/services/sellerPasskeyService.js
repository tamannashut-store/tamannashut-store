import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import User from '../models/User.js';
import SellerPasskey from '../models/SellerPasskey.js';
import PasskeyChallenge from '../models/PasskeyChallenge.js';
import { isMarketplaceSeller, hasActiveSellerCentreAccess } from '../utils/accountRoles.js';
import { createTwoFactorCode, hashAuthSecret, safeSecretEqual, maskEmail } from '../utils/authSecurity.js';
import { sendEmail } from '../utils/sendEmail.js';
import { passkeyCodeEmailTemplate } from '../utils/emailTemplates.js';
import { recordAudit } from '../utils/recordAudit.js';

// Never derive the RP or allowed origins from request-controlled Host headers.
export function passkeyConfig(env = process.env) {
  const rpID = env.PASSKEY_RP_ID || 'tamannashut.com';
  const origins = (env.PASSKEY_ORIGINS || 'https://www.tamannashut.com,https://tamannashut.com').split(',').map(s => s.trim()).filter(Boolean);
  if (!origins.length || origins.some(value => {
    const url = new URL(value);
    return url.origin !== value || (url.protocol !== 'https:' && !(rpID === 'localhost' && url.protocol === 'http:'))
      || !(url.hostname === rpID || url.hostname.endsWith(`.${rpID}`));
  })) throw new Error('Invalid passkey origin configuration');
  return { rpID, origins };
}

export const passkeyUserID = user => crypto.createHash('sha256').update(`seller-passkey:${user._id}`).digest();
const eligible = user => user && isMarketplaceSeller(user) && hasActiveSellerCentreAccess(user);
const invalid = res => res.status(400).json({ message: 'Passkey verification failed or expired. Try again, or sign in with your password and email code.' });

export function sellerPasskeyHandlers({ users = User, keys = SellerPasskey, challenges = PasskeyChallenge,
  webauthn = { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse },
  email = sendEmail, comparePassword = bcrypt.compare, audit = recordAudit, sessionPayload, config = () => passkeyConfig(),
} = {}) {
  const originAllowed = (req, res) => {
    if (!config().origins.includes(req.headers.origin)) {
      res.status(403).json({ message: 'Open Seller Centre on the approved website to use passkeys.' });
      return false;
    }
    res.set('Cache-Control', 'no-store');
    return true;
  };
  const saveChallenge = async fields => {
    const token = crypto.randomBytes(32).toString('base64url');
    await challenges.create({ ...fields, tokenHash: hashAuthSecret(token), expiresAt: new Date(Date.now() + 5 * 60_000) });
    return token;
  };
  // Consume before verification: even concurrent requests cannot reuse a challenge.
  const consume = (token, kind, extra = {}) => challenges.findOneAndDelete({
    tokenHash: hashAuthSecret(String(token || '')), kind, ready: true, expiresAt: { $gt: new Date() }, ...extra,
  });
  const auditKey = (user, action, id) => audit({ user, action, entityType: 'SellerPasskey', entityId: id, summary: `Seller passkey ${action}` });

  return {
    list: async (req, res) => {
      if (!eligible(req.user)) return res.status(403).json({ message: 'An active seller account is required.' });
      res.set('Cache-Control', 'no-store');
      const records = await keys.find({ userId: req.user._id }).select('credentialId name createdAt lastUsedAt').lean();
      return res.json({ passkeys: records.map(k => ({ id: k.credentialId, name: k.name, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt })) });
    },
    beginManagement: async (req, res) => {
      try {
        if (!originAllowed(req, res)) return;
        const user = await users.findById(req.user._id).select('+password');
        if (!eligible(user)) return res.status(403).json({ message: 'An active seller account is required.' });
        const action = req.body.action;
        if (!['add', 'remove'].includes(action)) return invalid(res);
        if (!await comparePassword(String(req.body.password || ''), user.password || '')) return res.status(400).json({ message: 'Incorrect current password.' });
        const credentialId = String(req.body.credentialId || '');
        if (action === 'remove' && !await keys.findOne({ userId: user._id, credentialId })) return invalid(res);
        if (action === 'add' && await keys.countDocuments({ userId: user._id }) >= 10) return res.status(400).json({ message: 'Remove an old passkey before adding another (maximum 10).' });
        // Per-account delivery cooldown in addition to the route/IP rate limiter.
        const recent = await challenges.findOne({ userId: user._id, kind: 'email', createdAt: { $gt: new Date(Date.now() - 60_000) } });
        if (recent) return res.status(429).json({ message: 'Wait one minute before requesting another security code.' });
        const factor = createTwoFactorCode();
        const token = await saveChallenge({ userId: user._id, sessionVersion: user.sessionVersion || 0, kind: 'email', action,
          credentialId, name: String(req.body.name || 'My passkey').trim().slice(0, 60) || 'My passkey', codeHash: factor.codeHash });
        const delivery = await email(user.email, `Confirm ${action === 'add' ? 'adding' : 'removing'} a seller passkey`, passkeyCodeEmailTemplate(user, factor.code, action));
        if (!delivery?.sent) return res.status(503).json({ message: 'Security email could not be delivered. No passkey has been changed.' });
        await challenges.updateOne({ tokenHash: hashAuthSecret(token) }, { $set: { ready: true } });
        return res.json({ challengeToken: token, maskedEmail: maskEmail(user.email) });
      } catch { return invalid(res); }
    },
    confirmManagement: async (req, res) => {
      try {
        if (!originAllowed(req, res)) return;
        const user = await users.findById(req.user._id);
        if (!eligible(user)) return res.status(403).json({ message: 'An active seller account is required.' });
        const filter = { tokenHash: hashAuthSecret(req.body.challengeToken), kind: 'email', ready: true,
          userId: user._id, sessionVersion: user.sessionVersion || 0, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } };
        const attempt = await challenges.findOneAndUpdate(filter, { $inc: { attempts: 1 } }, { new: true });
        if (!attempt || !/^\d{6}$/.test(String(req.body.code || '')) || !safeSecretEqual(hashAuthSecret(req.body.code), attempt.codeHash)) return invalid(res);
        const consumed = await consume(req.body.challengeToken, 'email', { userId: user._id, sessionVersion: user.sessionVersion || 0 });
        if (!consumed) return invalid(res);
        if (consumed.action === 'remove') {
          const removed = await keys.findOneAndDelete({ userId: user._id, credentialId: consumed.credentialId });
          if (!removed) return invalid(res);
          await auditKey(user, 'removed', removed._id);
          return res.json({ removed: true, message: 'Passkey removed. Password and email-code sign-in is still available.' });
        }
        const existing = await keys.find({ userId: user._id });
        if (existing.length >= 10) return invalid(res);
        const { rpID } = config();
        const options = await webauthn.generateRegistrationOptions({ rpID, rpName: "Tamanna's Hut Seller Centre", userID: passkeyUserID(user),
          userName: user.email, userDisplayName: user.name, attestationType: 'none',
          excludeCredentials: existing.map(k => ({ id: k.credentialId, transports: k.transports })),
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        });
        const challengeToken = await saveChallenge({ userId: user._id, sessionVersion: user.sessionVersion || 0,
          kind: 'register', challenge: options.challenge, name: consumed.name, ready: true });
        return res.json({ options, challengeToken });
      } catch { return invalid(res); }
    },
    register: async (req, res) => {
      try {
        if (!originAllowed(req, res)) return;
        const user = await users.findById(req.user._id);
        if (!eligible(user)) return invalid(res);
        const challenge = await consume(req.body.challengeToken, 'register', { userId: user._id, sessionVersion: user.sessionVersion || 0 });
        if (!challenge || await keys.countDocuments({ userId: user._id }) >= 10) return invalid(res);
        const { rpID, origins } = config();
        const result = await webauthn.verifyRegistrationResponse({ response: req.body.credential, expectedChallenge: challenge.challenge,
          expectedOrigin: origins, expectedRPID: rpID, requireUserVerification: true });
        if (!result.verified || !result.registrationInfo) return invalid(res);
        const { credential } = result.registrationInfo;
        const fresh = await users.findById(user._id);
        if (!eligible(fresh) || (fresh.sessionVersion || 0) !== challenge.sessionVersion) return invalid(res);
        const key = await keys.create({ userId: user._id, credentialId: credential.id, publicKey: Buffer.from(credential.publicKey),
          counter: credential.counter, transports: credential.transports || [], name: challenge.name });
        await auditKey(user, 'added', key._id);
        return res.json({ message: 'Passkey added. You can now sign in using your device unlock instead of an email code.' });
      } catch { return invalid(res); }
    },
    beginAuthentication: async (req, res) => {
      try {
        if (!originAllowed(req, res)) return;
        const options = await webauthn.generateAuthenticationOptions({ rpID: config().rpID, userVerification: 'required' });
        const challengeToken = await saveChallenge({ kind: 'authenticate', challenge: options.challenge, ready: true });
        return res.json({ options, challengeToken });
      } catch { return invalid(res); }
    },
    authenticate: async (req, res) => {
      try {
        if (!originAllowed(req, res)) return;
        const challenge = await consume(req.body.challengeToken, 'authenticate');
        if (!challenge) return invalid(res);
        const key = await keys.findOne({ credentialId: String(req.body.credential?.id || '') }).select('+publicKey');
        if (!key) return invalid(res);
        const user = await users.findById(key.userId);
        if (!eligible(user) || req.body.credential?.response?.userHandle !== passkeyUserID(user).toString('base64url')) return invalid(res);
        const { rpID, origins } = config();
        const result = await webauthn.verifyAuthenticationResponse({ response: req.body.credential, expectedChallenge: challenge.challenge,
          expectedOrigin: origins, expectedRPID: rpID, requireUserVerification: true,
          credential: { id: key.credentialId, publicKey: new Uint8Array(key.publicKey), counter: key.counter, transports: key.transports },
        });
        if (!result.verified) return invalid(res);
        const updated = await keys.updateOne({ _id: key._id, counter: key.counter }, { $set: { counter: result.authenticationInfo.newCounter, lastUsedAt: new Date() } });
        if (updated.matchedCount !== 1) return invalid(res);
        const fresh = await users.findById(user._id);
        if (!eligible(fresh) || (fresh.sessionVersion || 0) !== (user.sessionVersion || 0)) return invalid(res);
        fresh.lastLoginAt = new Date();
        await fresh.save();
        await auditKey(fresh, 'sign_in', key._id);
        return res.json(sessionPayload(fresh));
      } catch { return invalid(res); }
    },
  };
}
