import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import CustomerAuthChallenge from "../models/CustomerAuthChallenge.js";
import { hashAuthSecret, safeSecretEqual } from "../utils/authSecurity.js";
import { normalizeIndianPhone } from "../utils/phone.js";
import { isValidEmailAddress } from "../utils/inputSecurity.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendPhoneVerification, checkPhoneVerification } from "./phoneVerificationService.js";

const customerScope = { accountType: "customer", isAdmin: { $ne: true }, sellerRole: { $ne: "member" } };
const invalid = { message: "This code is incorrect or expired. Request a new code." };
const contactFilter = (channel, contact) => channel === "phone" ? { phoneNormalized: contact, phoneVerifiedAt: { $type: "date" } } : { email: contact };

export function customerOtpHandlers({ users = User, challenges = CustomerAuthChallenge, email = sendEmail, sms = sendPhoneVerification, checkSms = checkPhoneVerification, sessionPayload }) {
  return {
    send: async (req, res) => {
      let claimed;
      try {
        const purpose = req.otpPurpose || req.body.purpose;
        let channel = req.body.channel;
        let contact = String(req.body.contact || "").trim().toLowerCase();
        if (!["register", "login", "delete", "link-email"].includes(purpose)) return res.status(400).json({ message: "Choose signup or sign-in" });
        if (purpose === "link-email" && (channel !== "email" || !req.user || req.user.accountType !== "customer" || req.user.email)) return res.status(403).json({ message: "Only a mobile-only customer account can add an email" });
        if (purpose === "delete") {
          if (!req.user || req.user.accountType !== "customer") return res.status(403).json({ message: "Access denied" });
          channel = req.user.email ? "email" : "phone";
          contact = req.user.email || req.user.phone;
        }
        contact = channel === "phone" ? normalizeIndianPhone(contact) : contact;
        if (!["email", "phone"].includes(channel) || !contact || (channel === "email" && !isValidEmailAddress(contact))) return res.status(400).json({ message: "Enter a valid email address or Indian mobile number" });
        if (purpose === "register" && req.body.termsAccepted !== true) return res.status(400).json({ message: "Accept the Terms and Privacy Policy to create an account" });
        const name = String(req.body.name || "").trim() || "Customer";
        if (purpose === "register" && (name.length < 2 || name.length > 80)) return res.status(400).json({ message: "Enter a valid name or leave it empty" });
        const existingContact = await users.findOne(contactFilter(channel, contact));
        if (purpose === "link-email" && existingContact) return res.status(409).json({ message: "This email already has an account. Sign in using that email instead" });
        const user = purpose === "link-email" ? await users.findOne({ _id: req.user._id, ...customerScope, email: null }) : existingContact;
        if (purpose === "register" && user) return res.status(409).json({ message: "An account already uses this contact. Please sign in." });
        if (purpose !== "register" && (!user || user.accountType !== "customer" || user.isAdmin || user.sellerRole === "member" || (["delete", "link-email"].includes(purpose) && String(user._id) !== String(req.user._id)))) return res.status(400).json({ message: "No customer account was found. Create an account or use the contact already verified in your profile." });
        const nonce = crypto.randomBytes(32).toString("hex");
        const code = String(crypto.randomInt(100000, 1000000));
        const now = new Date();
        const key = purpose === "link-email" ? `${purpose}:${user._id}` : `${purpose}:${channel}:${contact}`;
        try {
          claimed = await challenges.findOneAndUpdate({ key, $or: [{ sentAt: null }, { sentAt: { $lte: new Date(now.getTime() - 60_000) } }] }, { $set: {
            purpose, channel, contact, userId: user?._id || null, sessionVersion: user?.sessionVersion || 0,
            name, marketingConsent: channel === "email" && req.body.marketingConsent === true,
            nonceHash: hashAuthSecret(nonce), codeHash: channel === "email" ? hashAuthSecret(`${nonce}:${code}`) : null,
            ready: false, attempts: 0, sentAt: now, expiresAt: new Date(now.getTime() + 600_000),
          } }, { upsert: true, new: true });
        } catch (error) { if (error.code === 11000) return res.status(429).json({ message: "Please wait one minute before requesting another code" }); throw error; }
        if (channel === "phone") await sms(contact);
        else {
          const delivery = await email(contact, "Your Tamanna's Hut verification code", `<p>Your ${purpose === "link-email" ? "email verification" : purpose === "delete" ? "account deletion" : purpose === "register" ? "signup" : "sign-in"} code is <strong>${code}</strong>.</p><p>It expires in 10 minutes. Never share this code. If you did not request it, ignore this email.</p>`);
          if (!delivery?.sent) throw new Error("Email delivery failed");
        }
        const ready = await challenges.findOneAndUpdate({ _id: claimed._id, nonceHash: hashAuthSecret(nonce) }, { $set: { ready: true } }, { new: true });
        if (!ready) throw new Error("Challenge changed");
        const challengeToken = jwt.sign({ id: String(claimed._id), nonce, type: "customer-otp", purpose }, process.env.JWT_SECRET, { expiresIn: "10m" });
        res.set("Cache-Control", "no-store");
        return res.json({ challengeToken, channel, message: `Verification code sent to your ${channel === "phone" ? "mobile number" : "email"}` });
      } catch (error) {
        if (claimed) await challenges.updateOne({ _id: claimed._id, nonceHash: claimed.nonceHash }, { $set: { ready: false, sentAt: null } });
        return res.status(error.status || 502).json({ message: "Verification code could not be sent. Please try again shortly." });
      }
    },
    check: async (req, res) => {
      try {
        let payload;
        try { payload = jwt.verify(String(req.body.challengeToken || ""), process.env.JWT_SECRET); } catch { return res.status(400).json(invalid); }
        if (payload.type !== "customer-otp" || !payload.nonce || !["register", "login", "delete", "link-email"].includes(payload.purpose) || (["delete", "link-email"].includes(payload.purpose) && !req.user) || (req.otpPurpose && payload.purpose !== req.otpPurpose)) return res.status(400).json(invalid);
        const code = String(req.body.code || "").trim();
        if (!/^\d{4,10}$/.test(code)) return res.status(400).json(invalid);
        const filter = { _id: payload.id, nonceHash: hashAuthSecret(payload.nonce), purpose: payload.purpose, ready: true, expiresAt: { $gt: new Date() } };
        const challenge = await challenges.findOneAndUpdate({ ...filter, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true });
        if (!challenge) return res.status(400).json(invalid);
        let user;
        if (challenge.purpose !== "register") {
          user = await users.findOne({ _id: challenge.userId, ...customerScope, ...(challenge.purpose === "link-email" ? { email: null } : contactFilter(challenge.channel, challenge.contact)), sessionVersion: challenge.sessionVersion });
          if (!user || (["delete", "link-email"].includes(challenge.purpose) && String(user._id) !== String(req.user._id))) return res.status(400).json(invalid);
        }
        const approved = challenge.channel === "email" ? safeSecretEqual(challenge.codeHash, hashAuthSecret(`${payload.nonce}:${code}`)) : (await checkSms(challenge.contact, code)).status === "approved";
        if (!approved) return res.status(400).json(invalid);
        const consumed = await challenges.findOneAndUpdate(filter, { $set: { ready: false } }, { new: true });
        if (!consumed) return res.status(400).json(invalid);
        if (challenge.purpose === "register") {
          user = await users.create({ name: challenge.name, accountType: "customer", passwordLoginEnabled: false, termsAcceptedAt: new Date(), lastLoginAt: new Date(), marketingConsent: challenge.marketingConsent,
            ...(challenge.channel === "email" ? { email: challenge.contact, emailVerifiedAt: new Date() } : { phone: challenge.contact, phoneNormalized: challenge.contact, phoneVerifiedAt: new Date() }),
          });
        } else if (challenge.purpose === "link-email") {
          user = await users.findOneAndUpdate({ _id: user._id, ...customerScope, email: null, sessionVersion: challenge.sessionVersion }, { $set: { email: challenge.contact, emailVerifiedAt: new Date() } }, { new: true });
          if (!user) return res.status(400).json(invalid);
        } else if (challenge.purpose === "delete") {
          res.set("Cache-Control", "no-store");
          return res.json({ deletionToken: jwt.sign({ id: String(user._id), sessionVersion: user.sessionVersion || 0, type: "customer-delete" }, process.env.JWT_SECRET, { expiresIn: "5m" }) });
        } else {
          user = await users.findOneAndUpdate({ _id: user._id, ...customerScope, ...contactFilter(challenge.channel, challenge.contact), sessionVersion: challenge.sessionVersion }, { $set: { lastLoginAt: new Date(), ...(challenge.channel === "email" ? { emailVerifiedAt: new Date() } : {}) }, ...(challenge.channel === "email" ? { $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 } } : {}) }, { new: true });
          if (!user) return res.status(400).json(invalid);
        }
        res.set("Cache-Control", "no-store");
        return res.json(sessionPayload(user));
      } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "An account already uses this contact. Please sign in." });
        if ([20404, 60200, 60202].includes(error.code)) return res.status(400).json(invalid);
        return res.status(502).json({ message: "Verification could not be completed. Please request a new code." });
      }
    },
  };
}
