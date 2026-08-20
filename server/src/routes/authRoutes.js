import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import SellerInvitation from "../models/SellerInvitation.js";
import SellerProfile from "../models/SellerProfile.js";
import SellerSettlement from "../models/SellerSettlement.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { admin, protect, seller, sellerApplicant } from "../middleware/authMiddleware.js";
import { sendEmail } from "../utils/sendEmail.js";
import { emailVerificationTemplate, passwordResetEmailTemplate, sellerInvitationEmailTemplate, sellerVerificationEmailTemplate, twoFactorCodeEmailTemplate } from "../utils/emailTemplates.js";
import { verifyShiprocketDeliveryPostcode } from "../services/shiprocketService.js";
import { loginPortalError } from "../utils/loginPortal.js";
import { decryptSellerValue, effectiveSellerVerification, encryptedSellerProfile, normalizeSellerDetails, sellerProfileCompleteness } from "../utils/sellerOnboarding.js";
import { recordAudit } from "../utils/recordAudit.js";
import { accountTypeFor, isPlatformAdmin, publicAccount } from "../utils/accountRoles.js";
import { passwordPolicyError } from "../utils/passwordPolicy.js";
import { createEmailVerification, createTwoFactorCode, hashAuthSecret, maskEmail, safeSecretEqual } from "../utils/authSecurity.js";
import { normalizeIndianPhone } from "../utils/phone.js";
import { checkPhoneVerification, phoneVerificationConfigured, sendPhoneVerification } from "../services/phoneVerificationService.js";

const router = express.Router();

const sessionPayload = (user) => ({
    token: jwt.sign({ id: user._id, sessionVersion: user.sessionVersion || 0 }, process.env.JWT_SECRET, { expiresIn: "7d" }),
    user: publicAccount(user),
});

const sendVerificationEmail = async (user) => {
    const verification = createEmailVerification();
    user.emailVerificationRequiredAt ||= new Date();
    user.emailVerificationToken = verification.tokenHash;
    user.emailVerificationExpires = verification.expiresAt;
    user.emailVerificationSentAt = new Date();
    await user.save();
    const url = `${process.env.CLIENT_URL || "https://www.tamannashut.com"}/verify-email/${verification.token}`;
    return sendEmail(user.email, "Verify your Tamanna's Hut email", emailVerificationTemplate(user, url));
};

const issueTwoFactorChallenge = async (user) => {
    const factor = createTwoFactorCode();
    user.twoFactorCodeHash = factor.codeHash;
    user.twoFactorExpires = factor.expiresAt;
    user.twoFactorAttempts = 0;
    await user.save();
    const delivery = await sendEmail(user.email, "Your Seller Centre security code", twoFactorCodeEmailTemplate(user, factor.code));
    if (!delivery?.sent) return null;
    return {
        requiresTwoFactor: true,
        challengeToken: jwt.sign({ id: user._id, type: "seller-centre-2fa", sessionVersion: user.sessionVersion || 0 }, process.env.JWT_SECRET, { expiresIn: "15m" }),
        maskedEmail: maskEmail(user.email),
    };
};


// REGISTER

router.post("/register", async (req, res) => {

    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        const passwordError = passwordPolicyError(password);
        if (name.length < 2 || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || passwordError) {
            return res.status(400).json({ message: passwordError || "Enter a valid name and email address" });
        }
        if (req.body.termsAccepted !== true) return res.status(400).json({ message: "Accept the Terms and Privacy Policy to create an account" });
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verification = createEmailVerification();
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            marketingConsent: req.body.marketingConsent === true,
            termsAcceptedAt: new Date(),
            emailVerificationRequiredAt: new Date(),
            emailVerificationToken: verification.tokenHash,
            emailVerificationExpires: verification.expiresAt,
            emailVerificationSentAt: new Date(),
        });
        const verifyUrl = `${process.env.CLIENT_URL || "https://www.tamannashut.com"}/verify-email/${verification.token}`;
        const delivery = await sendEmail(user.email, "Verify your Tamanna's Hut email", emailVerificationTemplate(user, verifyUrl));
        if (!delivery?.sent) {
            await User.deleteOne({ _id: user._id });
            return res.status(503).json({ message: "Verification email could not be delivered. Please try creating the account again shortly" });
        }
        return res.status(201).json({ verificationRequired: true, email: user.email, message: "Check your email to activate your account" });
    } catch (error) {
        res.status(error?.code === 11000 ? 409 : 500).json({ message: error?.code === 11000 ? "An account already exists for this email" : process.env.NODE_ENV === "production" ? "Account could not be created" : error.message });
    }
});


// CUSTOMER AND SELLER LOGIN
const loginForPortal = (adminPortal = false) => async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

        const user = await User.findOne({ email }).select("+password +emailVerificationRequiredAt");
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const portalError = loginPortalError(user, adminPortal);
        if (portalError) return res.status(403).json({ message: portalError });

        if (!adminPortal && user.emailVerificationRequiredAt && !user.emailVerifiedAt) {
            return res.status(403).json({ message: "Verify your email before signing in", code: "EMAIL_NOT_VERIFIED", email: user.email });
        }

        if (adminPortal) {
            const challenge = await issueTwoFactorChallenge(user);
            if (!challenge) return res.status(503).json({ message: "Security code could not be delivered. Please try again shortly" });
            res.set("Cache-Control", "no-store");
            return res.status(202).json(challenge);
        }

        user.lastLoginAt = new Date();
        await user.save();
        return res.json(sessionPayload(user));

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

router.post("/login", loginForPortal(false));
router.post("/admin-login", loginForPortal(true));

const userFromTwoFactorChallenge = async (challengeToken) => {
    const payload = jwt.verify(String(challengeToken || ""), process.env.JWT_SECRET);
    if (payload.type !== "seller-centre-2fa") throw new Error("Invalid security challenge");
    const user = await User.findById(payload.id).select("+twoFactorCodeHash +twoFactorExpires +twoFactorAttempts");
    if (!user || Number(payload.sessionVersion || 0) !== Number(user.sessionVersion || 0)) throw new Error("Invalid security challenge");
    return user;
};

router.post("/admin-login/verify", async (req, res) => {
    try {
        const user = await userFromTwoFactorChallenge(req.body.challengeToken);
        const code = String(req.body.code || "").replace(/\D/g, "");
        const portalError = loginPortalError(user, true);
        if (portalError) return res.status(403).json({ message: portalError });
        if (!user || !user.twoFactorCodeHash || !user.twoFactorExpires || user.twoFactorExpires <= new Date()) return res.status(400).json({ message: "This security code has expired. Request a new code" });
        if (Number(user.twoFactorAttempts || 0) >= 5) return res.status(429).json({ message: "Too many incorrect codes. Request a new code" });
        if (code.length !== 6 || !safeSecretEqual(hashAuthSecret(code), user.twoFactorCodeHash)) {
            user.twoFactorAttempts = Number(user.twoFactorAttempts || 0) + 1;
            await user.save();
            return res.status(400).json({ message: "Incorrect security code" });
        }
        user.twoFactorCodeHash = undefined;
        user.twoFactorExpires = undefined;
        user.twoFactorAttempts = 0;
        user.lastLoginAt = new Date();
        await user.save();
        res.set("Cache-Control", "no-store");
        return res.json(sessionPayload(user));
    } catch {
        return res.status(400).json({ message: "This security challenge is invalid or has expired" });
    }
});

router.post("/admin-login/resend", async (req, res) => {
    try {
        const user = await userFromTwoFactorChallenge(req.body.challengeToken);
        if (!user) return res.status(400).json({ message: "This security challenge is invalid or has expired" });
        const portalError = loginPortalError(user, true);
        if (portalError) return res.status(403).json({ message: portalError });
        const challenge = await issueTwoFactorChallenge(user);
        if (!challenge) return res.status(503).json({ message: "Security code could not be delivered" });
        res.set("Cache-Control", "no-store");
        return res.json(challenge);
    } catch {
        return res.status(400).json({ message: "This security challenge is invalid or has expired" });
    }
});

router.post("/verify-email", async (req, res) => {
    try {
        const tokenHash = hashAuthSecret(req.body.token);
        const user = await User.findOne({ emailVerificationToken: tokenHash, emailVerificationExpires: { $gt: new Date() } }).select("+emailVerificationToken +emailVerificationExpires +emailVerificationRequiredAt +emailVerificationSentAt");
        if (!user) return res.status(400).json({ message: "This verification link is invalid or has expired" });
        user.emailVerifiedAt = new Date();
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        user.emailVerificationSentAt = undefined;
        user.lastLoginAt = new Date();
        await user.save();
        return res.json({ ...sessionPayload(user), message: "Email verified successfully" });
    } catch (error) {
        return res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Email could not be verified" : error.message });
    }
});

router.post("/verify-email/resend", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
        const user = await User.findOne({ email }).select("+emailVerificationRequiredAt +emailVerificationSentAt +emailVerificationToken +emailVerificationExpires");
        if (!user || !user.emailVerificationRequiredAt || user.emailVerifiedAt) return res.json({ message: "If verification is required, a new link has been sent" });
        if (user.emailVerificationSentAt && Date.now() - user.emailVerificationSentAt.getTime() < 60_000) return res.status(429).json({ message: "Please wait one minute before requesting another email" });
        const delivery = await sendVerificationEmail(user);
        if (!delivery?.sent) return res.status(503).json({ message: "Verification email could not be delivered" });
        return res.json({ message: "A new verification link has been sent" });
    } catch (error) {
        return res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Verification email could not be sent" : error.message });
    }
});

router.get("/phone-verification/status", protect, (req, res) => res.json({
    configured: phoneVerificationConfigured(),
    phone: req.user.phone || "",
    verified: Boolean(req.user.phoneVerifiedAt),
}));

router.post("/phone-verification/send", protect, async (req, res) => {
    try {
        if (accountTypeFor(req.user) !== "customer") return res.status(403).json({ message: "Phone verification is available for customer accounts" });
        const phone = normalizeIndianPhone(req.body.phone);
        if (!phone) return res.status(400).json({ message: "Enter a valid Indian mobile number" });
        const duplicate = await User.exists({ _id: { $ne: req.user._id }, phoneNormalized: phone, phoneVerifiedAt: { $ne: null } });
        if (duplicate) return res.status(409).json({ message: "This phone number is already verified on another account" });
        const user = await User.findById(req.user._id).select("+phoneNormalized +phoneVerificationSentAt");
        if (user.phoneVerificationSentAt && Date.now() - user.phoneVerificationSentAt.getTime() < 60_000) return res.status(429).json({ message: "Please wait one minute before requesting another code" });
        await sendPhoneVerification(phone);
        if (user.phoneNormalized !== phone) user.phoneVerifiedAt = null;
        user.phone = phone;
        user.phoneNormalized = phone;
        user.phoneVerificationSentAt = new Date();
        await user.save();
        return res.json({ message: "Verification code sent", phone });
    } catch (error) { return res.status(error.status || 502).json({ message: error.status ? error.message : "Verification code could not be sent" }); }
});

router.post("/phone-verification/check", protect, async (req, res) => {
    try {
        if (accountTypeFor(req.user) !== "customer") return res.status(403).json({ message: "Phone verification is available for customer accounts" });
        const phone = normalizeIndianPhone(req.body.phone);
        const code = String(req.body.code || "").replace(/\D/g, "");
        if (!phone || code.length < 4 || code.length > 10) return res.status(400).json({ message: "Enter the code sent to your phone" });
        const duplicate = await User.exists({ _id: { $ne: req.user._id }, phoneNormalized: phone, phoneVerifiedAt: { $ne: null } });
        if (duplicate) return res.status(409).json({ message: "This phone number is already verified on another account" });
        const result = await checkPhoneVerification(phone, code);
        if (result.status !== "approved") return res.status(400).json({ message: "The verification code is incorrect or expired" });
        const user = await User.findById(req.user._id).select("+phoneNormalized +phoneVerificationSentAt");
        user.phone = phone;
        user.phoneNormalized = phone;
        user.phoneVerifiedAt = new Date();
        user.phoneVerificationSentAt = null;
        await user.save();
        return res.json({ message: "Phone number verified", phone, verified: true });
    } catch (error) { return res.status(error?.code === 11000 ? 409 : error.status || 502).json({ message: error?.code === 11000 ? "This phone number is already verified on another account" : error.status ? error.message : "Phone number could not be verified" }); }
});

const ownerOnly = (req, res, next) => {
    if (!isPlatformAdmin(req.user)) return res.status(403).json({ message: "Only the platform administrator can manage seller accounts" });
    return next();
};

router.post("/seller-invitations", protect, admin, ownerOnly, async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid seller email address" });
        if (await User.exists({ email })) return res.status(409).json({ message: "An account already exists for this email" });
        await SellerInvitation.deleteMany({ email, acceptedAt: null });
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const invitation = await SellerInvitation.create({ email, tokenHash, invitedBy: req.user._id, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) });
        const inviteUrl = `${process.env.CLIENT_URL || "https://www.tamannashut.com"}/seller/register/${token}`;
        const delivery = await sendEmail(email, "Invitation to Tamanna's Hut Seller Centre", sellerInvitationEmailTemplate(inviteUrl));
        if (!delivery?.sent) {
            await SellerInvitation.deleteOne({ _id: invitation._id });
            return res.status(502).json({ message: "The invitation email could not be delivered" });
        }
        await recordAudit({ user: req.user, action: "seller.invited", entityType: "seller_invitation", entityId: invitation._id, summary: `Invited seller ${email}` });
        return res.status(201).json({ message: "Secure seller invitation sent", expiresAt: invitation.expiresAt });
    } catch (error) {
        return res.status(error.status || 500).json({ message: process.env.NODE_ENV === "production" ? "Seller invitation could not be created" : error.message });
    }
});

router.get("/seller-invitations/:token", async (req, res) => {
    try {
        const tokenHash = crypto.createHash("sha256").update(String(req.params.token || "")).digest("hex");
        const invitation = await SellerInvitation.findOne({ tokenHash, acceptedAt: null, expiresAt: { $gt: new Date() } }).select("email expiresAt").lean();
        if (!invitation) return res.status(404).json({ message: "This seller invitation is invalid or has expired" });
        return res.json({ email: invitation.email, expiresAt: invitation.expiresAt });
    } catch (error) {
        return res.status(500).json({ message: "Seller invitation could not be checked" });
    }
});

router.post("/seller-invitations/:token/accept", async (req, res) => {
    let createdUser;
    try {
        const tokenHash = crypto.createHash("sha256").update(String(req.params.token || "")).digest("hex");
        const invitation = await SellerInvitation.findOne({ tokenHash, acceptedAt: null, expiresAt: { $gt: new Date() } });
        if (!invitation) return res.status(404).json({ message: "This seller invitation is invalid or has expired" });
        if (await User.exists({ email: invitation.email })) return res.status(409).json({ message: "An account already exists for this email" });
        const name = String(req.body.name || "").trim();
        const password = String(req.body.password || "");
        const passwordError = passwordPolicyError(password);
        if (name.length < 2 || name.length > 80 || passwordError) return res.status(400).json({ message: passwordError || "Enter your full name" });
        const details = normalizeSellerDetails(req.body);
        const securedProfile = encryptedSellerProfile(details);
        createdUser = await User.create({ name, email: invitation.email, password: await bcrypt.hash(password, 10), isAdmin: false, accountType: "seller", sellerRole: "member", sellerAccessStatus: "pending", emailVerifiedAt: new Date() });
        await SellerProfile.create({ userId: createdUser._id, ...securedProfile });
        invitation.acceptedAt = new Date();
        await invitation.save();
        return res.status(201).json({ message: "Seller details submitted for owner verification" });
    } catch (error) {
        if (createdUser?._id) await Promise.allSettled([User.deleteOne({ _id: createdUser._id }), SellerProfile.deleteOne({ userId: createdUser._id })]);
        return res.status(error.status || (error?.code === 11000 ? 409 : 500)).json({ message: error.status ? error.message : error?.code === 11000 ? "A seller account already exists for this email" : process.env.NODE_ENV === "production" ? "Seller account could not be created" : error.message });
    }
});

router.get("/seller-team", protect, admin, ownerOnly, async (_req, res) => {
    try {
        res.set("Cache-Control", "no-store");
        const [users, profiles, invitations] = await Promise.all([
            User.find({ $or: [{ accountType: "seller" }, { sellerRole: "member" }] }).select("name email isAdmin accountType sellerRole sellerAccessStatus createdAt").sort({ createdAt: 1 }).lean(),
            SellerProfile.find().select("+gstinEncrypted +panEncrypted +bankAccountEncrypted +ifscEncrypted").lean(),
            SellerInvitation.find({ acceptedAt: null, expiresAt: { $gt: new Date() } }).select("email expiresAt createdAt").sort({ createdAt: -1 }).lean(),
        ]);
        const profilesByUser = new Map(profiles.map((profile) => [String(profile.userId), profile]));
        const sellers = users.map((user) => {
            const profile = profilesByUser.get(String(user._id));
            const compliance = profile ? effectiveSellerVerification(profile) : null;
            return { ...user, profile: profile ? {
                legalBusinessName: profile.legalBusinessName,
                tradeName: profile.tradeName,
                businessType: profile.businessType,
                businessPhone: profile.businessPhone,
                authorizedSignatoryName: profile.authorizedSignatoryName,
                registeredAddress: profile.registeredAddress,
                pickupAddress: profile.pickupAddress,
                gstin: decryptSellerValue(profile.gstinEncrypted),
                pan: decryptSellerValue(profile.panEncrypted),
                bankAccountHolder: profile.bankAccountHolder,
                bankAccountType: profile.bankAccountType,
                bankAccountNumber: decryptSellerValue(profile.bankAccountEncrypted),
                ifsc: decryptSellerValue(profile.ifscEncrypted),
                gstVerification: profile.gstVerification,
                bankVerification: profile.bankVerification,
                verificationStatus: compliance.status,
                recordedVerificationStatus: profile.verificationStatus,
                completeness: compliance,
                submittedAt: profile.submittedAt,
                reviewedAt: profile.reviewedAt,
                reviewNote: profile.reviewNote,
            } : null };
        });
        return res.json({ sellers, invitations });
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.status ? error.message : process.env.NODE_ENV === "production" ? "Seller team could not be loaded" : error.message });
    }
});

router.patch("/seller-team/:userId/verification", protect, admin, ownerOnly, async (req, res) => {
    try {
        const status = String(req.body.status || "").toLowerCase();
        const note = String(req.body.note || "").trim().slice(0, 500);
        if (!['verified', 'rejected'].includes(status)) return res.status(400).json({ message: "Choose verified or rejected" });
        if (status === "rejected" && note.length < 5) return res.status(400).json({ message: "Explain what the seller needs to correct" });
        if (status === "verified" && (req.body.gstVerified !== true || req.body.bankVerified !== true)) return res.status(400).json({ message: "Confirm both the official GST record and bank ownership proof before approval" });
        const user = await User.findOne({ _id: req.params.userId, $or: [{ accountType: "seller" }, { sellerRole: "member" }] });
        const profile = await SellerProfile.findOne({ userId: req.params.userId });
        if (!user || !profile) return res.status(404).json({ message: "Seller verification record not found" });
        const completeness = sellerProfileCompleteness(profile);
        if (status === "verified" && !completeness.complete) {
            return res.status(409).json({ message: `Seller application is incomplete: ${completeness.missingFields.join(", ")}`, missingFields: completeness.missingFields });
        }
        profile.verificationStatus = status;
        profile.reviewedAt = new Date();
        profile.reviewedBy = req.user._id;
        profile.reviewNote = note;
        if (status === "verified") {
            profile.gstVerification = { ...(profile.gstVerification?.toObject?.() || profile.gstVerification || {}), status: "verified", source: "official_portal_manual_review", checkedAt: new Date(), legalName: profile.legalBusinessName, registrationStatus: "Active" };
            profile.bankVerification = { ...(profile.bankVerification?.toObject?.() || profile.bankVerification || {}), status: "verified", source: "bank_proof_manual_review", checkedAt: new Date(), beneficiaryName: profile.bankAccountHolder };
        }
        user.sellerAccessStatus = status === "verified" ? "active" : "rejected";
        await Promise.all([
            profile.save(), user.save(),
            Product.updateMany({ sellerId: user._id }, { $set: { sellerComplianceHold: status !== "verified" } }),
        ]);
        await recordAudit({ user: req.user, action: `seller.${status}`, entityType: "seller", entityId: user._id, summary: `${status === "verified" ? "Approved" : "Rejected"} seller ${user.email}` });
        await sendEmail(user.email, status === "verified" ? "Seller Centre access approved" : "Seller verification needs attention", sellerVerificationEmailTemplate(user, status === "verified", note));
        return res.json({ message: status === "verified" ? "Seller approved" : "Seller verification rejected" });
    } catch (error) {
        return res.status(error.status || 500).json({ message: process.env.NODE_ENV === "production" ? "Seller verification could not be updated" : error.message });
    }
});

router.get("/seller-profile/me", protect, sellerApplicant, async (req, res) => {
    try {
        res.set("Cache-Control", "no-store");
        const profile = await SellerProfile.findOne({ userId: req.user._id }).lean();
        if (!profile) return res.status(404).json({ message: "Seller profile not found" });
        const compliance = effectiveSellerVerification(profile);
        return res.json({
            account: publicAccount(req.user),
            profile: {
                legalBusinessName: profile.legalBusinessName,
                tradeName: profile.tradeName,
                businessType: profile.businessType,
                businessPhone: profile.businessPhone,
                authorizedSignatoryName: profile.authorizedSignatoryName,
                registeredAddress: profile.registeredAddress,
                pickupAddress: profile.pickupAddress,
                gstinLast4: profile.gstinLast4,
                panLast4: profile.panLast4,
                bankAccountHolder: profile.bankAccountHolder,
                bankAccountType: profile.bankAccountType,
                bankAccountLast4: profile.bankAccountLast4,
                ifscLast4: profile.ifscLast4,
                gstVerification: profile.gstVerification,
                bankVerification: profile.bankVerification,
                verificationStatus: compliance.status,
                recordedVerificationStatus: profile.verificationStatus,
                completeness: compliance,
                submittedAt: profile.submittedAt,
                reviewedAt: profile.reviewedAt,
                reviewNote: profile.reviewNote,
            },
        });
    } catch (error) { return res.status(500).json({ message: "Seller profile could not be loaded" }); }
});

router.put("/seller-profile/me/business-details", protect, sellerApplicant, async (req, res) => {
    try {
        const text = (key, max = 200) => String(req.body[key] || "").trim().slice(0, max);
        const address = (prefix) => ({
            line1: text(`${prefix}Line1`), line2: text(`${prefix}Line2`), city: text(`${prefix}City`, 100),
            state: text(`${prefix}State`, 100), pincode: String(req.body[`${prefix}Pincode`] || "").replace(/\D/g, ""),
        });
        const businessType = text("businessType", 40);
        const businessPhone = String(req.body.businessPhone || "").replace(/\s/g, "");
        const registeredAddress = address("registeredAddress");
        const pickupAddress = req.body.pickupSameAsRegistered === true ? { ...registeredAddress } : address("pickupAddress");
        if (text("legalBusinessName", 120).length < 2 || text("tradeName", 120).length < 2 || !["proprietorship", "partnership", "llp", "private_limited", "public_limited", "trust", "society", "other"].includes(businessType)) return res.status(400).json({ message: "Enter the legal name, trade name and business constitution" });
        if (!/^\+?[0-9]{10,13}$/.test(businessPhone) || text("authorizedSignatoryName", 120).length < 2) return res.status(400).json({ message: "Enter a valid business phone and authorised signatory" });
        if (req.body.declarationsAccepted !== true) return res.status(400).json({ message: "Confirm that the updated business and fulfilment details are accurate" });
        for (const [label, value] of [["registered", registeredAddress], ["pickup", pickupAddress]]) {
            if (value.line1.length < 5 || value.city.length < 2 || value.state.length < 2 || !/^\d{6}$/.test(value.pincode)) return res.status(400).json({ message: `Enter a complete ${label} business address` });
        }
        const profile = await SellerProfile.findOne({ userId: req.user._id });
        if (!profile) return res.status(404).json({ message: "Seller profile not found" });
        profile.legalBusinessName = text("legalBusinessName", 120);
        profile.tradeName = text("tradeName", 120);
        profile.businessType = businessType;
        profile.businessPhone = businessPhone;
        profile.authorizedSignatoryName = text("authorizedSignatoryName", 120);
        profile.registeredAddress = registeredAddress;
        profile.pickupAddress = pickupAddress;
        profile.declarationsAcceptedAt = new Date();
        profile.verificationStatus = "pending";
        profile.reviewedAt = null;
        profile.reviewedBy = null;
        profile.reviewNote = "Business details updated by seller. GST and bank checks require administrator review.";
        profile.submittedAt = new Date();
        await Promise.all([
            profile.save(),
            Product.updateMany({ sellerId: req.user._id }, { $set: { sellerComplianceHold: true } }),
        ]);
        await recordAudit({ user: req.user, action: "seller.profile_resubmitted", entityType: "seller", entityId: req.user._id, summary: "Seller updated business and fulfilment details" });
        return res.json({ message: "Business details submitted for verification" });
    } catch (error) {
        return res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Seller details could not be updated" : error.message });
    }
});

router.delete("/seller-profile/me", protect, sellerApplicant, async (req, res) => {
    try {
        const confirmation = String(req.body.confirmation || "").trim().toUpperCase();
        const password = String(req.body.password || "");
        const reason = String(req.body.reason || "").trim().slice(0, 500);
        if (confirmation !== "CLOSE") return res.status(400).json({ message: "Type CLOSE to confirm seller account closure" });
        const user = await User.findById(req.user._id).select("+password");
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: "Enter your current password to close the seller account" });
        const openOrderStatuses = ["Pending", "Processing", "Confirmed", "Packed", "Shipped", "Cancellation Requested", "Return Requested", "Return Approved", "Return Picked Up", "Returned", "Refund Pending", "RTO Initiated"];
        const [openOrder, openSettlement] = await Promise.all([
            Order.exists({ "products.sellerId": user._id, status: { $in: openOrderStatuses } }),
            SellerSettlement.exists({ sellerId: user._id, status: { $in: ["pending", "eligible", "held"] } }),
        ]);
        if (openOrder) return res.status(409).json({ message: "This seller account has an active order, return or refund. Complete it before closing the account" });
        if (openSettlement) return res.status(409).json({ message: "This seller account has an unsettled payout. Record or resolve the payout before closing the account" });
        const profile = await SellerProfile.findOne({ userId: user._id });
        await recordAudit({ user, action: "seller.account_closed", entityType: "seller", entityId: user._id, summary: `Seller requested account closure${reason ? `: ${reason}` : ""}` });
        await Product.updateMany({ sellerId: user._id }, { $set: { status: "archived" } });
        if (profile) {
            profile.closure = { status: "closed", requestedAt: new Date(), completedAt: new Date(), reason };
            await profile.save();
        }
        user.name = "Closed seller";
        user.email = `closed-${user._id}@deleted.invalid`;
        user.phone = "";
        user.address = "";
        user.city = "";
        user.state = "";
        user.pincode = "";
        user.cart = [];
        user.password = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
        user.passwordChangedAt = new Date();
        user.sessionVersion = (user.sessionVersion || 0) + 1;
        user.sellerAccessStatus = "closed";
        await user.save();
        return res.json({ message: "Seller account closed. Listings are archived and sign-in access has been removed" });
    } catch (error) {
        return res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Seller account could not be closed" : error.message });
    }
});

router.post("/forgot-password", async (req, res) => {
    const response = { message: "If an account exists for that email, a password reset link has been sent" };
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
        const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");
        if (!user) return res.status(404).json({ message: "No account was found with this email address", code: "ACCOUNT_NOT_FOUND" });
        const token = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
        user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        const resetUrl = `${process.env.CLIENT_URL || "https://www.tamannashut.com"}/reset-password/${token}`;
        const delivery = await sendEmail(user.email, "Reset your Tamanna's Hut password", passwordResetEmailTemplate(user, resetUrl));
        if (!delivery?.sent) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
        }
        return res.json(response);
    } catch (error) {
        console.error("PASSWORD RESET REQUEST ERROR:", String(error?.message || "Request failed").slice(0, 200));
        return res.json(response);
    }
});

router.post("/reset-password/:token", async (req, res) => {
    try {
        const password = String(req.body.password || "");
        const passwordError = passwordPolicyError(password);
        if (passwordError) return res.status(400).json({ message: passwordError });
        const tokenHash = crypto.createHash("sha256").update(String(req.params.token || "")).digest("hex");
        const user = await User.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } }).select("+passwordResetToken +passwordResetExpires");
        if (!user) return res.status(400).json({ message: "This reset link is invalid or has expired" });
        user.password = await bcrypt.hash(password, 10);
        user.passwordChangedAt = new Date();
        user.sessionVersion = (user.sessionVersion || 0) + 1;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        return res.json({ message: "Password reset successfully. You can now sign in", loginPath: accountTypeFor(user) === "customer" ? "/login" : "/admin-login" });
    } catch (error) {
        return res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Password could not be reset" : error.message });
    }
});
router.get("/profile/:id", protect, async (req, res) => {

    try {

        if (String(req.user._id) !== req.params.id && !isPlatformAdmin(req.user)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const user = await User.findById(
            req.params.id
        ).select("-password");

        return res.json(user);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

});
router.put("/profile/:id", protect, async (req, res) => {

    try {

        if (String(req.user._id) !== req.params.id && !isPlatformAdmin(req.user)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const user = await User.findById(req.params.id).select("+phoneNormalized");

        if (!user) {

            return res.status(404).json({
                message: "User not found",
            });

        }

        const name = String(req.body.name || "").trim();
        const phone = String(req.body.phone || "").trim();
        const address = String(req.body.address || "").trim();
        const pincode = String(req.body.pincode || "").trim();
        if (name.length < 2 || name.length > 80) return res.status(400).json({ message: "Enter a valid full name" });
        const normalizedPhone = normalizeIndianPhone(phone);
        if (!normalizedPhone) return res.status(400).json({ message: "Enter a valid Indian mobile number" });
        if (address.length < 10 || address.length > 300) return res.status(400).json({ message: "Enter a complete delivery address" });
        if (!/^\d{6}$/.test(pincode)) return res.status(400).json({ message: "Enter a valid 6-digit pincode" });
        const locality = await verifyShiprocketDeliveryPostcode(pincode, false);
        user.name = name;
        if (user.phoneNormalized && user.phoneNormalized !== normalizedPhone) user.phoneVerifiedAt = null;
        user.phone = normalizedPhone;
        user.phoneNormalized = normalizedPhone;
        user.address = address;
        user.city = locality.city;
        user.state = locality.state;
        user.pincode = locality.pincode;

        if (typeof req.body.marketingConsent === "boolean") {
            user.marketingConsent = req.body.marketingConsent;
        }

        const updatedUser = await user.save();
        return res.json(updatedUser);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

});

router.delete("/profile/:id", protect, async (req, res) => {
    try {
        if (String(req.user._id) !== req.params.id) return res.status(403).json({ message: "Access denied" });
        const user = await User.findById(req.params.id).select("+password");
        if (!user) return res.status(404).json({ message: "User not found" });
        if (accountTypeFor(user) !== "customer") return res.status(400).json({ message: "Seller Centre accounts cannot be deleted from the customer profile" });
        const password = String(req.body.password || "");
        if (!password || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ message: "Enter your current password to delete the account" });
        const activeStatuses = ["Pending", "Processing", "Confirmed", "Packed", "Shipped", "Cancellation Requested", "Return Requested", "Return Approved", "Return Picked Up", "Refund Pending", "RTO Initiated"];
        if (await Order.exists({ userId: user._id, status: { $in: activeStatuses } })) return res.status(409).json({ message: "Your account has an active order, return or refund. Complete it before deleting your account" });
        await Product.updateMany({ "reviews.userId": String(user._id) }, { $set: { "reviews.$[review].name": "Deleted customer", "reviews.$[review].userId": "" } }, { arrayFilters: [{ "review.userId": String(user._id) }] });
        await User.deleteOne({ _id: user._id });
        return res.json({ message: "Your account has been deleted" });
    } catch (error) {
        return res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Account could not be deleted" : error.message });
    }
});

const changePassword = async (req, res) => {
    try {
        if (req.params.id && String(req.user._id) !== req.params.id) {
            return res.status(403).json({ message: "Access denied" });
        }
        const currentPassword = String(req.body.currentPassword || "");
        const newPassword = String(req.body.newPassword || "");
        const passwordError = passwordPolicyError(newPassword);
        if (!currentPassword || passwordError) return res.status(400).json({ message: !currentPassword ? "Enter your current password" : passwordError });
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "Choose a new password different from your current password" });
        }
        const user = await User.findById(req.user._id).select("+password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordChangedAt = new Date();
        user.sessionVersion = (user.sessionVersion || 0) + 1;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        return res.json({ success: true, message: "Password changed. Please sign in again", loginPath: accountTypeFor(user) === "customer" ? "/login" : "/admin-login" });
    } catch (error) {
        res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Password could not be changed" : error.message });
    }
};

router.put("/change-password", protect, changePassword);
router.put("/change-password/:id", protect, changePassword);

export default router;
