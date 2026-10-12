import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { encodeBankProof, bankProofUpload, BANK_PROOF_MAX_BYTES } from "../server/src/middleware/bankProofUpload.js";
import { decryptSellerValue, effectiveSellerVerification } from "../server/src/utils/sellerOnboarding.js";
import SellerProfile from "../server/src/models/SellerProfile.js";
import User from "../server/src/models/User.js";
import jwt from "jsonwebtoken";
import authRoutes from "../server/src/routes/authRoutes.js";

process.env.SELLER_DATA_ENCRYPTION_KEY = "bank-proof-tests-use-an-isolated-key";
const pdf = Buffer.from("%PDF-1.4\nprivate bank proof test\n%%EOF");

test("bank documents are encrypted and omitted from ordinary profile queries", () => {
  const proof = encodeBankProof({ buffer: pdf, mimetype: "application/pdf" });
  assert.deepEqual(Buffer.from(decryptSellerValue(proof.encryptedPayload), "base64"), pdf);
  assert.equal(proof.encryptedPayload.includes("private bank proof"), false);
  assert.equal(proof.digest.length, 64);
  assert.equal(SellerProfile.schema.path("bankProof.encryptedPayload").options.select, false);
  assert.equal(SellerProfile.schema.options.optimisticConcurrency, true);
});

test("bank uploads reject missing, oversized and mismatched content types", () => {
  for (const file of [undefined, { buffer: Buffer.from("<script>fake</script>"), mimetype: "application/pdf" },
    { buffer: pdf, mimetype: "image/png" }, { buffer: Buffer.alloc(BANK_PROOF_MAX_BYTES + 1), mimetype: "application/pdf" }]) {
    assert.throws(() => encodeBankProof(file), { status: 400 });
  }
});

test("pending applications cannot be complete without a bank document", () => {
  const result = effectiveSellerVerification({ verificationStatus: "pending", gstVerification: { status: "verified" }, bankVerification: { status: "verified" } });
  assert.equal(result.status, "needs_update");
  assert.ok(result.missingFields.includes("Bank ownership document"));
});

test("multipart bank uploads enforce one supported document and reject absent files", async () => {
  const app = express(); app.post("/upload", bankProofUpload, (req, res) => res.json({ digest: req.bankProof.digest }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/upload`;
  try {
    const valid = new FormData(); valid.append("bankProof", new Blob([pdf], { type: "application/pdf" }), "proof.pdf");
    assert.equal((await fetch(url, { method: "POST", body: valid })).status, 200);
    assert.equal((await fetch(url, { method: "POST", body: new FormData() })).status, 400);
    const duplicate = new FormData(); duplicate.append("bankProof", new Blob([pdf], { type: "application/pdf" }), "proof.pdf"); duplicate.append("bankProof", new Blob([pdf], { type: "application/pdf" }), "second.pdf");
    assert.equal((await fetch(url, { method: "POST", body: duplicate })).status, 400);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test("private downloads reject guests and other sellers; own documents download without caching", async () => {
  process.env.JWT_SECRET = "bank-proof-test-session-secret";
  const originalUser = User.findById; const originalProfile = SellerProfile.findOne;
  const proof = encodeBankProof({ buffer: pdf, mimetype: "application/pdf" });
  const users = { alice: { _id: "alice", accountType: "seller", sellerRole: "member", sellerAccessStatus: "pending" },
    owner: { _id: "owner", accountType: "platform_admin", isAdmin: true, sellerRole: "owner" } };
  const lookups = [];
  User.findById = (id) => ({ select: async () => users[id] });
  SellerProfile.findOne = (filter) => ({ select: async () => { lookups.push(filter); return { bankProof: proof }; } });
  const app = express(); app.use("/auth", authRoutes);
  const server = app.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/auth`;
  const headers = (id) => ({ Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}` });
  try {
    assert.equal((await fetch(`${base}/seller-profile/me/bank-proof`)).status, 401);
    assert.equal((await fetch(`${base}/seller-team/bob/bank-proof`, { headers: headers("alice") })).status, 403);
    assert.equal(lookups.length, 0);
    const own = await fetch(`${base}/seller-profile/me/bank-proof`, { headers: headers("alice") });
    assert.equal(own.status, 200); assert.deepEqual(lookups[0], { userId: "alice" });
    assert.equal(own.headers.get("cache-control"), "no-store"); assert.match(own.headers.get("content-disposition"), /^attachment;/);
    assert.deepEqual(Buffer.from(await own.arrayBuffer()), pdf);
    assert.equal((await fetch(`${base}/seller-team/bob/bank-proof`, { headers: headers("owner") })).status, 200);
    assert.deepEqual(lookups[1], { userId: "bob" });
  } finally { User.findById = originalUser; SellerProfile.findOne = originalProfile; await new Promise((resolve) => server.close(resolve)); }
});
