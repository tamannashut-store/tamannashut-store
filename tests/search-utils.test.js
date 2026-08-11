import assert from "node:assert/strict";
import test from "node:test";
import { buildSearchRegex } from "../server/src/utils/search.js";

test("exact search remains literal and case insensitive", () => {
  const regex = buildSearchRegex("Baby Set");
  assert.equal(regex.test("Premium baby set"), true);
  assert.equal(regex.test("Baby dress"), false);
});

test("fuzzy search tolerates one missing, extra, or incorrect character", () => {
  assert.equal(buildSearchRegex("maron", { fuzzy: true }).test("Maroon"), true);
  assert.equal(buildSearchRegex("orangge", { fuzzy: true }).test("Orange"), true);
  assert.equal(buildSearchRegex("cotton", { fuzzy: true }).test("cotxon"), true);
});

test("fuzzy multi-word search keeps token order", () => {
  const regex = buildSearchRegex("bby drss", { fuzzy: true });
  assert.equal(regex.test("Premium baby summer dress"), true);
  assert.equal(regex.test("Dress for baby"), false);
});
