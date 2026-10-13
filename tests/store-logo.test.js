import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import jwt from "jsonwebtoken";
import { Writable } from "node:stream";
import authRoutes from "../server/src/routes/authRoutes.js";
import User from "../server/src/models/User.js";
import SellerProfile from "../server/src/models/SellerProfile.js";
import cloudinary from "../server/src/config/cloudinary.js";

test("logo upload requires a seller session, valid image, and updates only their own profile without resetting approval", async () => {
  process.env.JWT_SECRET = "logo-test-secret";
  const originals = { user: User.findById, profile: SellerProfile.findOne, upload: cloudinary.uploader.upload_stream };
  let accountType = "seller", uploads = 0, saves = 0;
  const profile = { verificationStatus: "verified", save: async () => { saves++; } };
  User.findById = () => ({ select: async () => ({ _id: "own-seller", accountType, sellerAccessStatus: "active" }) });
  SellerProfile.findOne = async filter => { assert.deepEqual(filter, { userId: "own-seller" }); return profile; };
  cloudinary.uploader.upload_stream = (_options, callback) => new Writable({ write(_chunk, _encoding, done) { done(); }, final(done) { uploads++; callback(null, { secure_url: "https://res.cloudinary.com/test/logo.png", public_id: "private-storage-id" }); done(); } });
  const app = express(); app.use("/auth", authRoutes); app.use((error, _req, res, _next) => res.status(error.status || 500).json({ message: error.message }));
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/auth/seller-profile/me/logo`;
  const headers = { Authorization: `Bearer ${jwt.sign({ id: "own-seller" }, process.env.JWT_SECRET)}` };
  const payload = bytes => { const form = new FormData(); form.append("logo", new Blob([bytes], { type: "image/png" }), "logo.png"); form.append("userId", "another-seller"); return form; };
  try {
    assert.equal((await fetch(url, { method: "PUT" })).status, 401);
    accountType = "customer"; assert.equal((await fetch(url, { method: "PUT", headers })).status, 403);
    accountType = "seller";
    assert.equal((await fetch(url, { method: "PUT", headers, body: payload("not an image") })).status, 400);
    assert.equal(uploads, 0);
    const response = await fetch(url, { method: "PUT", headers, body: payload(Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0])) });
    assert.equal(response.status, 200); assert.equal((await response.json()).logoUrl, "https://res.cloudinary.com/test/logo.png");
    assert.equal(uploads, 1); assert.equal(saves, 1); assert.equal(profile.verificationStatus, "verified");
  } finally { await new Promise(resolve => server.close(resolve)); User.findById = originals.user; SellerProfile.findOne = originals.profile; cloudinary.uploader.upload_stream = originals.upload; }
});
