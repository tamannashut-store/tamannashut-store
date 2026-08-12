import test from "node:test";
import assert from "node:assert/strict";
import User from "../server/src/models/User.js";

test("user JSON never exposes authentication secrets", () => {
  const user = new User({
    name: "Test Customer",
    email: "test@example.com",
    password: "stored-password-hash",
    passwordResetToken: "stored-reset-hash",
    passwordResetExpires: new Date(Date.now() + 60_000),
  });
  const json = user.toJSON();
  assert.equal("password" in json, false);
  assert.equal("passwordResetToken" in json, false);
  assert.equal("passwordResetExpires" in json, false);
});

test("password is excluded from user queries unless explicitly selected", () => {
  assert.equal(User.schema.path("password").options.select, false);
});
