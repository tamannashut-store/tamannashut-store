import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { normalizeIndianPhone } from "../utils/phone.js";
import { accountTypeFor } from "../utils/accountRoles.js";
import { hashAuthSecret } from "../utils/authSecurity.js";
import { sendPhoneVerification, checkPhoneVerification } from "./phoneVerificationService.js";

const invalidChallenge = { message: "This login code is incorrect or expired. Request a new code." };
const customerFilter = (phone) => ({ phoneNormalized: phone, phoneVerifiedAt: { $type: "date" }, accountType: "customer", isAdmin: { $ne: true }, sellerRole: { $ne: "member" } });
const emailReady = (user) => !user.emailVerificationRequiredAt || Boolean(user.emailVerifiedAt);

export const phoneLoginHandlers = ({ model = User, send = sendPhoneVerification, check = checkPhoneVerification, sessionPayload }) => ({
  send: async (req, res) => {
    try {
      const phone = normalizeIndianPhone(req.body.phone);
      if (!phone) return res.status(400).json({ message: "Enter a valid Indian mobile number" });
      const user = await model.findOne(customerFilter(phone)).select("+emailVerificationRequiredAt +phoneLoginSentAt");
      if (!user || accountTypeFor(user) !== "customer" || !emailReady(user)) return res.status(400).json({ message: "Use email sign-in, then verify your mobile number in your profile to enable mobile login." });
      const nonce = crypto.randomBytes(32).toString("hex");
      const challengeToken = jwt.sign({ id: String(user._id), phone, nonce, sessionVersion: user.sessionVersion || 0, type: "customer-phone-login" }, process.env.JWT_SECRET, { expiresIn: "10m" });
      const claimed = await model.findOneAndUpdate({
        _id: user._id, ...customerFilter(phone),
        $or: [{ phoneLoginSentAt: null }, { phoneLoginSentAt: { $lte: new Date(Date.now() - 60_000) } }],
      }, { $set: { phoneLoginSentAt: new Date(), phoneLoginChallengeHash: hashAuthSecret(nonce), phoneLoginAttempts: 0 } }, { new: true });
      if (!claimed) return res.status(429).json({ message: "Please wait one minute before requesting another code" });
      await send(phone);
      res.set("Cache-Control", "no-store");
      return res.json({ challengeToken, message: "Login code sent to your mobile number" });
    } catch (error) {
      return res.status(error.status || 502).json({ message: error.status ? error.message : "Login code could not be sent. Try again shortly." });
    }
  },
  check: async (req, res) => {
    let payload;
    try {
      payload = jwt.verify(String(req.body.challengeToken || ""), process.env.JWT_SECRET);
      if (payload.type !== "customer-phone-login" || !normalizeIndianPhone(payload.phone) || !payload.nonce) throw new Error("Invalid challenge");
    } catch { return res.status(400).json(invalidChallenge); }
    try {
      const code = String(req.body.code || "").trim();
      if (!/^\d{4,10}$/.test(code)) return res.status(400).json({ message: "Enter the numeric code sent to your mobile" });
      const filter = { _id: payload.id, ...customerFilter(payload.phone), sessionVersion: payload.sessionVersion, phoneLoginChallengeHash: hashAuthSecret(payload.nonce) };
      const user = await model.findOneAndUpdate({ ...filter, phoneLoginAttempts: { $lt: 5 } }, { $inc: { phoneLoginAttempts: 1 } }, { new: true }).select("+emailVerificationRequiredAt");
      if (!user || !emailReady(user)) return res.status(400).json(invalidChallenge);
      const result = await check(payload.phone, code);
      if (result.status !== "approved") return res.status(400).json(invalidChallenge);
      // Consume the challenge atomically: the same OTP cannot open two sessions.
      const loggedIn = await model.findOneAndUpdate(filter, { $set: { phoneLoginChallengeHash: null, phoneLoginAttempts: 0, lastLoginAt: new Date() } }, { new: true }).select("+emailVerificationRequiredAt");
      if (!loggedIn || !emailReady(loggedIn)) return res.status(400).json(invalidChallenge);
      res.set("Cache-Control", "no-store");
      return res.json(sessionPayload(loggedIn));
    } catch (error) {
      if ([20404, 60200, 60202].includes(error.code)) return res.status(400).json(invalidChallenge);
      return res.status(error.status || 502).json({ message: error.status ? error.message : "Mobile login could not be completed. Try again shortly." });
    }
  },
});
