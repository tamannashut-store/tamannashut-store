import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { phoneLoginHandlers } from "../server/src/services/phoneLoginService.js";
import { isRateLimitedAuthRequest } from "../server/src/utils/authRateLimit.js";
import User from "../server/src/models/User.js";

process.env.JWT_SECRET = "phone-login-unit-test-secret";
const phone = "+919876543210";
const customer = () => ({ _id: "66aa11bb22cc33dd44ee55ff", accountType: "customer", phoneNormalized: phone, phoneVerifiedAt: new Date(), phoneLoginSentAt: null, phoneLoginAttempts: 0, sessionVersion: 0 });
const query = (value) => ({ select: async () => value, then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) });
const response = () => ({ statusCode: 200, headers: {}, status(value) { this.statusCode = value; return this; }, set(key, value) { this.headers[key] = value; return this; }, json(value) { this.body = value; return this; } });
const fixture = (user = customer()) => {
  let sends = 0, checks = 0;
  let approval = "approved";
  const model = {
    findOne: (filter) => query(user && user.phoneVerifiedAt && user.accountType === filter.accountType && user.phoneNormalized === filter.phoneNormalized ? { ...user } : null),
    findOneAndUpdate: (filter, update) => {
      if (!user || user.accountType !== "customer" || !user.phoneVerifiedAt || user.phoneNormalized !== filter.phoneNormalized || user.sessionVersion !== (filter.sessionVersion ?? user.sessionVersion)) return query(null);
      if (filter.phoneLoginChallengeHash && filter.phoneLoginChallengeHash !== user.phoneLoginChallengeHash) return query(null);
      if (filter.phoneLoginAttempts && user.phoneLoginAttempts >= filter.phoneLoginAttempts.$lt) return query(null);
      if (filter.$or && user.phoneLoginSentAt && Date.now() - user.phoneLoginSentAt.getTime() < 60_000) return query(null);
      Object.assign(user, update.$set || {});
      if (update.$inc) user.phoneLoginAttempts += update.$inc.phoneLoginAttempts;
      return query({ ...user });
    },
  };
  const handlers = phoneLoginHandlers({ model, send: async () => { sends++; }, check: async () => { checks++; return { status: approval }; }, sessionPayload: (value) => ({ token: "test-session", user: { id: value._id } }) });
  return { user, handlers, sends: () => sends, checks: () => checks, rejectCodes: () => { approval = "pending"; } };
};
const sendChallenge = async (f) => { const res = response(); await f.handlers.send({ body: { phone: "9876543210" } }, res); return res; };

test("verified customers receive a challenge bound to their normalized number", async () => {
  const f = fixture();
  const res = await sendChallenge(f);
  assert.equal(res.statusCode, 200);
  assert.equal(f.sends(), 1);
  assert.equal(jwt.verify(res.body.challengeToken, process.env.JWT_SECRET).phone, phone);
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("unverified phones, seller accounts, and pending email verification cannot use phone login", async () => {
  for (const change of [{ phoneVerifiedAt: null }, { accountType: "seller" }, { emailVerificationRequiredAt: new Date(), emailVerifiedAt: null }]) {
    const f = fixture({ ...customer(), ...change });
    const res = await sendChallenge(f);
    assert.equal(res.statusCode, 400);
    assert.equal(f.sends(), 0);
  }
});

test("phone login resending is limited per account", async () => {
  const f = fixture();
  await sendChallenge(f);
  const res = await sendChallenge(f);
  assert.equal(res.statusCode, 429);
  assert.equal(f.sends(), 1);
});

test("an approved OTP issues a session and cannot be replayed", async () => {
  const f = fixture();
  const { body } = await sendChallenge(f);
  const request = { body: { challengeToken: body.challengeToken, code: "123456" } };
  const res = response();
  await f.handlers.check(request, res);
  assert.equal(res.body.token, "test-session");
  assert.equal(f.user.phoneLoginChallengeHash, null);
  const replay = response();
  await f.handlers.check(request, replay);
  assert.equal(replay.statusCode, 400);
  assert.equal(f.checks(), 1);
});

test("incorrect OTPs are blocked after five checks", async () => {
  const f = fixture();
  f.rejectCodes();
  const { body } = await sendChallenge(f);
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = response();
    await f.handlers.check({ body: { challengeToken: body.challengeToken, code: "123456" } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.token, undefined);
  }
  assert.equal(f.checks(), 5);
});

test("expired, wrong-purpose, and invalid challenges never call the OTP provider", async () => {
  const f = fixture();
  const payload = { id: f.user._id, phone, nonce: "test", sessionVersion: 0 };
  for (const token of ["invalid", jwt.sign({ ...payload, type: "seller-centre-2fa" }, process.env.JWT_SECRET), jwt.sign({ ...payload, type: "customer-phone-login" }, process.env.JWT_SECRET, { expiresIn: -1 })]) {
    const res = response();
    await f.handlers.check({ body: { challengeToken: token, code: "123456" } }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(f.checks(), 0);
});

test("changing the phone or revoking sessions invalidates a login challenge", async () => {
  for (const change of [{ phoneNormalized: "+919876543211" }, { sessionVersion: 1 }]) {
    const f = fixture();
    const { body } = await sendChallenge(f);
    Object.assign(f.user, change);
    const res = response();
    await f.handlers.check({ body: { challengeToken: body.challengeToken, code: "123456" } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(f.checks(), 0);
  }
});

test("mobile login routes are rate-limited and challenges never leak through user JSON", () => {
  assert.equal(isRateLimitedAuthRequest("POST", "/phone-login/send"), true);
  assert.equal(isRateLimitedAuthRequest("POST", "/phone-login/check"), true);
  const user = new User({ name: "Test", email: "test@example.com", password: "hash", phoneLoginChallengeHash: "secret", phoneLoginSentAt: new Date(), phoneLoginAttempts: 4 });
  assert.equal("phoneLoginChallengeHash" in user.toJSON(), false);
  assert.equal("phoneLoginAttempts" in user.toJSON(), false);
});
