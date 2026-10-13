import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { publicSellerStore } from "../server/src/utils/sellerStore.js";
import User from "../server/src/models/User.js";
import SellerProfile from "../server/src/models/SellerProfile.js";
import Product from "../server/src/models/Product.js";
import productRoutes from "../server/src/routes/productRoutes.js";

const id = "66aa11bb22cc33dd44ee5500";
const otherId = "66aa11bb22cc33dd44ee5501";
const profile = { legalBusinessName: "Private Legal Name", tradeName: "SAJUNI SAHEBA", businessType: "proprietorship", businessPhone: "9876543210", authorizedSignatoryName: "Private Owner",
  registeredAddress: { line1: "Private address", city: "Howrah", state: "West Bengal", pincode: "711310" }, pickupAddress: { line1: "Private address", city: "Howrah", state: "West Bengal", pincode: "711310" },
  gstinLast4: "F1Z5", panLast4: "234F", bankAccountHolder: "Private Owner", bankAccountLast4: "7890", ifscLast4: "3456", declarationsAcceptedAt: new Date(),
  verificationStatus: "verified", gstVerification: { status: "verified" }, bankVerification: { status: "verified" }, bankProof: { digest: "proof", uploadedAt: new Date() } };
const user = { accountType: "seller", sellerAccessStatus: "active", name: "Private Owner", email: "private@example.com" };
const userQuery = (value) => ({ select() { return this; }, lean: async () => value });

test("store identity uses trade name and never exposes legal, contact or bank details", async () => {
  const result = await publicSellerStore(id, { Users: { findById: () => userQuery(user) }, Profiles: { findOne: () => userQuery(profile) } });
  assert.deepEqual(result, { id, name: "SAJUNI SAHEBA", slug: "sajuni-saheba", path: `/store/${id}/sajuni-saheba` });
  for (const privateText of ["Private Owner", "private@example.com", "7890", "Private address"]) assert.equal(JSON.stringify(result).includes(privateText), false);
});

test("unverified, held, closed and invalid stores are unavailable", async () => {
  for (const access of ["pending", "rejected", "suspended", "closed"]) {
    assert.equal(await publicSellerStore(id, { Users: { findById: () => userQuery({ ...user, sellerAccessStatus: access }) } }), null);
  }
  assert.equal(await publicSellerStore(id, { Users: { findById: () => userQuery(user) }, Profiles: { findOne: () => userQuery({ ...profile, bankProof: null }) } }), null);
  assert.equal(await publicSellerStore("invalid", { Users: { findById: () => { throw new Error("Invalid identifiers must not query the database"); } } }), null);
});

test("public store catalogue keeps seller scope and listing visibility in all filters", async () => {
  const originals = { findUser: User.findById, profile: SellerProfile.findOne, find: Product.find, count: Product.countDocuments, distinct: Product.distinct, aggregate: Product.aggregate };
  const queries = [];
  const rows = [{ _id: "one", sellerId: id, status: "active", approvalStatus: "approved" }, { _id: "two", sellerId: id, status: "active", approvalStatus: "approved" },
    { _id: "draft", sellerId: id, status: "draft", approvalStatus: "pending" }, { _id: "held", sellerId: id, status: "active", approvalStatus: "approved", sellerComplianceHold: true }, { _id: "other", sellerId: otherId, status: "active", approvalStatus: "approved" }];
  const matches = (filter) => { queries.push(filter); return rows.filter((row) => row.sellerId === filter.sellerId && row.status === filter.status && filter.approvalStatus.$in.includes(row.approvalStatus) && row.sellerComplianceHold !== true); };
  User.findById = () => userQuery(user); SellerProfile.findOne = () => userQuery(profile);
  Product.find = (filter) => ({ sort() { return this; }, skip() { return this; }, limit() { return this; }, lean: async () => matches(filter) });
  Product.countDocuments = async (filter) => matches(filter).length;
  Product.distinct = async (_field, filter) => { matches(filter); return []; };
  Product.aggregate = async (pipeline) => { matches(pipeline[0].$match); return []; };
  const app = express(); app.use("/products", productRoutes); const server = app.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/products`;
  try {
    const response = await fetch(`${base}?store=${id}&search=kurta&sort=price-asc`); assert.equal(response.status, 200);
    const data = await response.json(); assert.equal(data.store.name, "SAJUNI SAHEBA"); assert.deepEqual(data.products.map((row) => row._id), ["one", "two"]);
    assert.ok(queries.every((query) => query.sellerId === id && query.sellerComplianceHold.$ne === true));
    assert.equal((await fetch(`${base}?store=invalid`)).status, 404);
    User.findById = () => userQuery({ ...user, sellerAccessStatus: "suspended" });
    assert.equal((await fetch(`${base}?store=${id}`)).status, 404);
  } finally {
    User.findById = originals.findUser; SellerProfile.findOne = originals.profile; Product.find = originals.find; Product.countDocuments = originals.count; Product.distinct = originals.distinct; Product.aggregate = originals.aggregate;
    await new Promise((resolve) => server.close(resolve));
  }
});
