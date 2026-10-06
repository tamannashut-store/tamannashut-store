import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { sellerApplicationCredentials, submitSellerApplication } from "../server/src/services/sellerApplicationService.js";

const body = { name: "Test Seller", password: "SellerSecure42", confirmPassword: "SellerSecure42", legalBusinessName: "Example Business", tradeName: "Example Store", businessType: "proprietorship", businessPhone: "9876543210", authorizedSignatoryName: "Test Seller", gstin: "19ABCDE1234F1Z5", pan: "ABCDE1234F", registeredAddressLine1: "123 Example Road", registeredAddressCity: "Howrah", registeredAddressState: "West Bengal", registeredAddressPincode: "711310", pickupSameAsRegistered: true, bankAccountHolder: "Test Seller", bankAccountType: "savings", bankAccountNumber: "1234567890", confirmBankAccountNumber: "1234567890", ifsc: "ABCD0123456", gstDeclaration: true, bankDeclaration: true, termsAccepted: true };
const customer = () => ({ _id: "customer-1", email: "customer@example.com", accountType: "customer", passwordLoginEnabled: false, emailVerifiedAt: new Date(), sessionVersion: 3, cart: [{ productId: "existing-product" }] });
const query = (value) => ({ select() { return this; }, session: async () => value });

function fixture({ failProfile = false, invitation = false } = {}) {
    let persisted = customer(); const profiles = []; let accepted = false;
    const invite = { email: persisted.email, save: async () => { accepted = true; } };
    return {
        user: () => persisted, profiles, accepted: () => accepted,
        deps: {
            Users: { findOne: () => query({ ...persisted, save: async function () { persisted = { ...this }; return this; } }), create: () => { throw new Error("Existing customers must never be recreated"); } },
            Profiles: { create: async (rows) => { if (failProfile) throw new Error("Database unavailable"); profiles.push(...rows); } },
            Invitations: { findOne: () => query(invitation ? invite : null) },
            transaction: async (operation) => {
                const original = { ...persisted }; const length = profiles.length;
                try { return await operation({ transaction: true }); }
                catch (error) { persisted = original; profiles.length = length; accepted = false; throw error; }
            },
        },
    };
}
process.env.SELLER_DATA_ENCRYPTION_KEY = "seller-application-tests-encryption-key";

test("customer ownership and verified email are required before conversion", async () => {
    const user = customer();
    await assert.rejects(sellerApplicationCredentials(user, body), { status: 401 });
    await assert.rejects(sellerApplicationCredentials(user, body, { authenticatedId: "another-customer" }), { status: 401 });
    await assert.rejects(sellerApplicationCredentials({ ...user, emailVerifiedAt: null }, body, { authenticatedId: user._id }), { status: 403 });
    const invited = await sellerApplicationCredentials({ ...user, emailVerifiedAt: null }, body, { authenticatedId: user._id, invitedEmail: user.email });
    assert.ok(await bcrypt.compare(body.password, invited.password));
});

test("seller application cannot replace administrator or seller credentials", async () => {
    for (const overrides of [{ accountType: "platform_admin" }, { accountType: "seller" }, { isAdmin: true }, { sellerRole: "owner" }]) {
        await assert.rejects(sellerApplicationCredentials({ ...customer(), ...overrides }, body, { authenticatedId: "customer-1" }), { status: 409 });
    }
});

test("existing password must be confirmed and is preserved", async () => {
    const password = await bcrypt.hash("OriginalPassword42", 4);
    const user = { ...customer(), passwordLoginEnabled: true, password };
    await assert.rejects(sellerApplicationCredentials(user, body, { authenticatedId: user._id }), { status: 400 });
    const result = await sellerApplicationCredentials(user, { ...body, password: "OriginalPassword42" }, { authenticatedId: user._id });
    assert.equal(result.password, password);
});

test("passwordless applicants must create a strong confirmed Seller Centre password", async () => {
    for (const password of ["password123", "short", "letterswithoutnumbers"]) await assert.rejects(sellerApplicationCredentials(customer(), { ...body, password, confirmPassword: password }, { authenticatedId: "customer-1" }), { status: 400 });
    await assert.rejects(sellerApplicationCredentials(customer(), { ...body, confirmPassword: "different" }, { authenticatedId: "customer-1" }), { status: 400 });
});

test("public application retains the customer ID and cart, encrypts details, and grants pending access only", async () => {
    const f = fixture();
    const result = await submitSellerApplication({ authenticatedId: "customer-1", body }, f.deps);
    assert.deepEqual(result, { userId: "customer-1", reusedCustomer: true });
    assert.equal(f.user().accountType, "seller"); assert.equal(f.user().sellerAccessStatus, "pending"); assert.equal(f.user().isAdmin, false);
    assert.equal(f.user().sessionVersion, 4); assert.deepEqual(f.user().cart, [{ productId: "existing-product" }]);
    assert.equal(f.profiles[0].userId, "customer-1");
    assert.ok(f.profiles[0].bankAccountEncrypted); assert.equal(f.profiles[0].bankAccountNumber, undefined);
});

test("a failed profile write rolls back account conversion and invitation acceptance", async () => {
    const f = fixture({ failProfile: true, invitation: true });
    await assert.rejects(submitSellerApplication({ authenticatedId: "customer-1", invitationToken: "test-token", body }, f.deps));
    assert.equal(f.user().accountType, "customer"); assert.equal(f.user().sessionVersion, 3); assert.equal(f.profiles.length, 0); assert.equal(f.accepted(), false);
});

test("an invited existing customer must sign in, and acceptance reuses the account", async () => {
    const f = fixture({ invitation: true });
    await assert.rejects(submitSellerApplication({ invitationToken: "test-token", body }, f.deps), { status: 401 });
    assert.equal(f.user().accountType, "customer");
    await submitSellerApplication({ authenticatedId: "customer-1", invitationToken: "test-token", body }, f.deps);
    assert.equal(f.accepted(), true); assert.equal(f.user()._id, "customer-1");
});

test("expired invitations and invalid applications never convert customers", async () => {
    const f = fixture();
    await assert.rejects(submitSellerApplication({ authenticatedId: "customer-1", invitationToken: "expired", body }, f.deps), { status: 404 });
    await assert.rejects(submitSellerApplication({ authenticatedId: "customer-1", body: { ...body, termsAccepted: false } }, f.deps), { status: 400 });
    assert.equal(f.user().accountType, "customer"); assert.equal(f.profiles.length, 0);
});


test("new invited applicants receive a pending seller account and consume the invitation", async () => {
    let created; let savedProfile; let accepted = false;
    const invitation = { email: "new-seller@example.com", save: async () => { accepted = true; } };
    const deps = {
        Users: { findOne: () => query(null), create: async ([row]) => { created = { ...row, _id: "new-seller" }; return [created]; } },
        Profiles: { create: async ([row]) => { savedProfile = row; } },
        Invitations: { findOne: () => query(invitation) }, transaction: operation => operation({}),
    };
    const result = await submitSellerApplication({ invitationToken: "new-invitation", body }, deps);
    assert.equal(result.reusedCustomer, false); assert.equal(created.email, invitation.email);
    assert.equal(created.sellerAccessStatus, "pending"); assert.equal(created.isAdmin, false); assert.ok(created.emailVerifiedAt);
    assert.equal(savedProfile.userId, "new-seller"); assert.equal(accepted, true);
});
