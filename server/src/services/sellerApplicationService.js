import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import User from "../models/User.js";
import SellerProfile from "../models/SellerProfile.js";
import SellerInvitation from "../models/SellerInvitation.js";
import { accountTypeFor } from "../utils/accountRoles.js";
import { passwordPolicyError } from "../utils/passwordPolicy.js";
import { encryptedSellerProfile, normalizeSellerDetails } from "../utils/sellerOnboarding.js";

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

export async function sellerApplicationCredentials(user, body, { invitedEmail, authenticatedId, compare = bcrypt.compare, hash = bcrypt.hash } = {}) {
    const name = String(body.name || "").trim();
    if (name.length < 2 || name.length > 80) fail(400, "Enter your full name");
    const password = String(body.password || "");
    if (user) {
        if (accountTypeFor(user) !== "customer" || user.isAdmin || user.sellerRole) fail(409, "This account already has Seller Centre access. Sign in there to manage it");
        if (String(authenticatedId || "") !== String(user._id)) fail(401, "Sign in to the existing customer account before applying");
        if (!user.email || (!user.emailVerifiedAt && invitedEmail !== user.email)) fail(403, "Sign in using an email verification code before applying as a seller");
        if (user.passwordLoginEnabled !== false && user.password) {
            if (!await compare(password, user.password)) fail(400, "Enter your existing account password");
            return { name, password: user.password };
        }
    }
    const passwordError = passwordPolicyError(password);
    if (passwordError) fail(400, passwordError);
    if (password !== body.confirmPassword) fail(400, "Passwords do not match");
    return { name, password: await hash(password, 10) };
}

// The account, encrypted application and invitation are committed together.
// A failed application never deletes or replaces an existing customer's account.
export async function submitSellerApplication({ authenticatedId, invitationToken, body }, {
    Users = User, Profiles = SellerProfile, Invitations = SellerInvitation,
    transaction = (operation) => mongoose.connection.transaction(operation),
} = {}) {
    const profile = encryptedSellerProfile(normalizeSellerDetails(body));
    return transaction(async (session) => {
        let invitation;
        if (invitationToken) {
            const tokenHash = createHash("sha256").update(String(invitationToken)).digest("hex");
            invitation = await Invitations.findOne({ tokenHash, acceptedAt: null, expiresAt: { $gt: new Date() } }).session(session);
            if (!invitation) fail(404, "This seller invitation is invalid or has expired");
        } else if (!authenticatedId) fail(401, "Sign in before applying as a seller");
        const user = await Users.findOne(invitation ? { email: invitation.email } : { _id: authenticatedId }).select("+password").session(session);
        if (!invitation && !user) fail(401, "Sign in before applying as a seller");
        const credentials = await sellerApplicationCredentials(user, body, { authenticatedId, invitedEmail: invitation?.email });
        const updates = { ...credentials, isAdmin: false, accountType: "seller", sellerRole: "member", sellerAccessStatus: "pending", passwordLoginEnabled: true, emailVerifiedAt: user?.emailVerifiedAt || new Date() };
        let applicant;
        if (user) {
            Object.assign(user, updates);
            // Revoke customer sessions. Seller Centre sign-in requires its security code.
            user.sessionVersion = Number(user.sessionVersion || 0) + 1;
            applicant = await user.save({ session });
        } else {
            [applicant] = await Users.create([{ ...updates, email: invitation.email }], { session });
        }
        await Profiles.create([{ userId: applicant._id, ...profile }], { session });
        if (invitation) { invitation.acceptedAt = new Date(); await invitation.save({ session }); }
        return { userId: applicant._id, reusedCustomer: Boolean(user) };
    });
}
