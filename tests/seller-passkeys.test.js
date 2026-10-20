import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { encodeCBOR } from '@levischuck/tiny-cbor';
import { sellerPasskeyHandlers, passkeyConfig, passkeyUserID } from '../server/src/services/sellerPasskeyService.js';
import { isRateLimitedAuthRequest } from '../server/src/utils/authRateLimit.js';

const origin = 'https://www.tamannashut.com';
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, set() {}, json(body) { this.body = body; return this; } });
const matches = (doc, filter) => Object.entries(filter).every(([k, v]) => {
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    if ('$gt' in v) return doc[k] > v.$gt;
    if ('$lt' in v) return doc[k] < v.$lt;
  }
  return String(doc[k]) === String(v);
});
const query = value => ({ select() { return this; }, lean() { return Promise.resolve(value); }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
function collection(records) {
  return {
    create: async doc => {
      if (doc.credentialId && records.some(k => k.credentialId === doc.credentialId)) throw new Error('Duplicate key');
      const record = { ...doc, _id: crypto.randomBytes(12).toString('hex'), createdAt: new Date(), attempts: 0 };
      records.push(record); return record;
    },
    find: f => query(records.filter(d => matches(d, f))),
    findOne: f => query(records.find(d => matches(d, f))),
    countDocuments: async f => records.filter(d => matches(d, f)).length,
    findOneAndDelete: async f => { const i = records.findIndex(d => matches(d, f)); return i < 0 ? null : records.splice(i, 1)[0]; },
    findOneAndUpdate: async (f, update) => {
      const d = records.find(d => matches(d, f)); if (!d) return null;
      for (const [k, v] of Object.entries(update.$inc || {})) d[k] = (d[k] || 0) + v;
      Object.assign(d, update.$set); return { ...d };
    },
    updateOne: async (f, update) => {
      const d = records.find(d => matches(d, f)); if (!d) return { matchedCount: 0 };
      Object.assign(d, update.$set); return { matchedCount: 1 };
    },
  };
}
function fixture() {
  const user = { _id: '66aa11bb22cc33dd44ee55ff', accountType: 'seller', sellerAccessStatus: 'active', sessionVersion: 0,
    name: 'Seller', email: 'seller@example.com', password: 'hash', async save() {} };
  const users = [user], keys = [], challenges = [], audits = []; let mailCode, delivery = true;
  const h = sellerPasskeyHandlers({ users: { findById: id => query(users.find(u => String(u._id) === String(id))) },
    keys: collection(keys), challenges: collection(challenges), comparePassword: async p => p === 'correct-password',
    email: async (_to, _subject, html) => { mailCode = html.match(/>(\d{6})<\/div>/)[1]; return { sent: delivery }; },
    audit: async e => audits.push(e), sessionPayload: u => ({ token: 'verified-session', user: { id: u._id, accountType: u.accountType } }),
  });
  const call = async (method, body = {}, current = user, requestOrigin = origin) => {
    const r = response(); await h[method]({ user: current, body, headers: { origin: requestOrigin } }, r); return r;
  };
  return { h, user, users, keys, challenges, audits, call, code: () => mailCode, failDelivery: () => { delivery = false; } };
}
const begin = f => f.call('beginManagement', { action: 'add', password: 'correct-password', name: 'Test phone' });
const confirm = async (f, sent) => f.call('confirmManagement', { challengeToken: sent.body.challengeToken, code: f.code() });

// A software authenticator used only in tests. All signatures are verified by the real library.
function authenticator(user) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = publicKey.export({ format: 'jwk' });
  const cose = new Map([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(jwk.x, 'base64url')], [-3, Buffer.from(jwk.y, 'base64url')]]);
  const id = crypto.randomBytes(32), b64 = value => Buffer.from(value).toString('base64url');
  const rpHash = crypto.createHash('sha256').update('tamannashut.com').digest();
  const data = (type, challenge, options = {}) => Buffer.from(JSON.stringify({ type, challenge, origin: options.origin || origin, crossOrigin: false }));
  return {
    registration(challenge, options = {}) {
      const size = Buffer.alloc(2); size.writeUInt16BE(id.length);
      const flags = options.uv === false ? 0x41 : 0x45;
      const authData = Buffer.concat([rpHash, Buffer.from([flags]), Buffer.alloc(4), Buffer.alloc(16), size, Buffer.from(id), Buffer.from(encodeCBOR(cose))]);
      return { id: b64(id), rawId: b64(id), type: 'public-key', clientExtensionResults: {}, response: {
        clientDataJSON: b64(data('webauthn.create', challenge, options)), transports: ['internal'],
        attestationObject: b64(encodeCBOR(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]))),
      } };
    },
    assertion(challenge, options = {}) {
      const counter = Buffer.alloc(4); counter.writeUInt32BE(options.counter || 1);
      const authData = Buffer.concat([rpHash, Buffer.from([options.uv === false ? 0x01 : 0x05]), counter]);
      const clientData = data('webauthn.get', challenge, options);
      const signed = Buffer.concat([authData, crypto.createHash('sha256').update(clientData).digest()]);
      return { id: b64(id), rawId: b64(id), type: 'public-key', clientExtensionResults: {}, response: {
        clientDataJSON: b64(clientData), authenticatorData: b64(authData), signature: b64(crypto.sign('sha256', signed, privateKey)),
        userHandle: options.userHandle || passkeyUserID(user).toString('base64url'),
      } };
    },
  };
}
async function enroll(f) {
  const options = await confirm(f, await begin(f)); assert.equal(options.statusCode, 200);
  const device = authenticator(f.user);
  const result = await f.call('register', { challengeToken: options.body.challengeToken, credential: device.registration(options.body.options.challenge) });
  assert.equal(result.statusCode, 200); return device;
}
async function login(f, device, overrides = {}) {
  const options = await f.call('beginAuthentication');
  return f.call('authenticate', { challengeToken: options.body.challengeToken, credential: device.assertion(options.body.options.challenge, overrides) });
}

test('seller enrolls with password + fresh email then signs in with a real verified passkey', async () => {
  const f = fixture(), device = await enroll(f);
  assert.equal(f.keys.length, 1); assert.equal(f.keys[0].name, 'Test phone');
  const result = await login(f, device); assert.equal(result.statusCode, 200); assert.equal(result.body.token, 'verified-session');
  assert.equal(f.keys[0].counter, 1); assert.ok(f.keys[0].lastUsedAt); assert.equal(f.audits.length, 2);
});
test('password alone and undelivered email never permit enrollment', async () => {
  const f = fixture(); assert.equal((await f.call('beginManagement', { action: 'add', password: 'wrong' })).statusCode, 400);
  assert.equal(f.challenges.length, 0); f.failDelivery();
  const sent = await begin(f); assert.equal(sent.statusCode, 503);
  assert.equal((await f.call('confirmManagement', { challengeToken: 'not-issued', code: f.code() })).statusCode, 400);
  assert.equal(f.keys.length, 0); assert.equal(f.challenges[0].ready, undefined);
});
test('email codes are limited to five attempts, bound to user/session, and expire', async () => {
  const f = fixture(), sent = await begin(f);
  const other = { ...f.user, _id: 'other' }; f.users.push(other);
  assert.equal((await f.call('confirmManagement', { challengeToken: sent.body.challengeToken, code: f.code() }, other)).statusCode, 400);
  for (let i = 0; i < 5; i++) assert.equal((await f.call('confirmManagement', { challengeToken: sent.body.challengeToken, code: 'xxxxxx' })).statusCode, 400);
  assert.equal((await confirm(f, sent)).statusCode, 400);
  const g = fixture(), s = await begin(g); g.challenges[0].expiresAt = new Date(0); assert.equal((await confirm(g, s)).statusCode, 400);
  const j = fixture(), t = await begin(j); j.user.sessionVersion++; assert.equal((await confirm(j, t)).statusCode, 400);
});
test('concurrent email confirmations consume the challenge only once', async () => {
  const f = fixture(), sent = await begin(f);
  const results = await Promise.all([confirm(f, sent), confirm(f, sent)]);
  assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 400]);
});
test('registration requires device user verification and trusted origin', async () => {
  for (const override of [{ uv: false }, { origin: 'https://evil.example' }]) {
    const f = fixture(), options = await confirm(f, await begin(f)), device = authenticator(f.user);
    const result = await f.call('register', { challengeToken: options.body.challengeToken, credential: device.registration(options.body.options.challenge, override) });
    assert.equal(result.statusCode, 400); assert.equal(f.keys.length, 0);
  }
});
test('authentication rejects wrong origins, challenges, user handles, UV and signatures', async () => {
  const f = fixture(), device = await enroll(f);
  for (const override of [{ uv: false }, { origin: 'https://evil.example' }, { userHandle: 'different-seller' }]) {
    assert.equal((await login(f, device, override)).statusCode, 400);
  }
  const o = await f.call('beginAuthentication');
  const credential = device.assertion('wrong-challenge');
  assert.equal((await f.call('authenticate', { challengeToken: o.body.challengeToken, credential })).statusCode, 400);
  const p = await f.call('beginAuthentication'), bad = device.assertion(p.body.options.challenge); bad.response.signature = 'AAAA';
  assert.equal((await f.call('authenticate', { challengeToken: p.body.challengeToken, credential: bad })).statusCode, 400);
});
test('authentication challenge replay and signature-counter replay are rejected', async () => {
  const f = fixture(), device = await enroll(f), options = await f.call('beginAuthentication');
  const body = { challengeToken: options.body.challengeToken, credential: device.assertion(options.body.options.challenge) };
  const results = await Promise.all([f.call('authenticate', body), f.call('authenticate', body)]);
  assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 400]);
  assert.equal((await login(f, device, { counter: 1 })).statusCode, 400);
});
test('pending, suspended, closed and administrator accounts cannot use seller passkeys', async () => {
  for (const status of ['pending', 'suspended', 'closed', 'rejected']) {
    const f = fixture(), device = await enroll(f); f.user.sellerAccessStatus = status;
    assert.equal((await login(f, device)).statusCode, 400); assert.equal((await begin(f)).statusCode, 403);
  }
  const f = fixture(), device = await enroll(f); f.user.accountType = 'platform_admin';
  assert.equal((await login(f, device)).statusCode, 400); assert.equal((await begin(f)).statusCode, 403);
});
test('removal requires a fresh email code, scopes ownership, and revokes subsequent sign-in', async () => {
  const f = fixture(), device = await enroll(f);
  const list = await f.call('list'); assert.equal(list.body.passkeys.length, 1); assert.equal(list.body.passkeys[0].publicKey, undefined);
  f.challenges.length = 0;
  const sent = await f.call('beginManagement', { action: 'remove', credentialId: f.keys[0].credentialId, password: 'correct-password' });
  assert.equal(f.keys.length, 1);
  const result = await confirm(f, sent); assert.equal(result.body.removed, true); assert.equal(f.keys.length, 0);
  assert.equal((await login(f, device)).statusCode, 400);
});
test('public options reveal no account existence and reject untrusted request origins', async () => {
  const f = fixture(), r = await f.call('beginAuthentication'); assert.equal(r.statusCode, 200);
  assert.equal(r.body.options.allowCredentials?.length || 0, 0);
  assert.equal((await f.call('beginAuthentication', {}, f.user, 'https://evil.example')).statusCode, 403);
  assert.equal((await f.call('beginAuthentication', {}, f.user, null)).statusCode, 403);
});
test('origin configuration is pinned and all passkey write routes are throttled', () => {
  assert.equal(passkeyConfig({}).rpID, 'tamannashut.com');
  assert.throws(() => passkeyConfig({ PASSKEY_ORIGINS: 'https://evil.example' }));
  assert.throws(() => passkeyConfig({ PASSKEY_ORIGINS: 'http://www.tamannashut.com' }));
  assert.equal(passkeyConfig({ PASSKEY_RP_ID: 'localhost', PASSKEY_ORIGINS: 'http://localhost:4173' }).rpID, 'localhost');
  for (const route of ['manage', 'confirm', 'register', 'options', 'authenticate']) assert.equal(isRateLimitedAuthRequest('POST', `/seller-passkeys/${route}`), true);
});
