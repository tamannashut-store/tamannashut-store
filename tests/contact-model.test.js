import test from "node:test";
import assert from "node:assert/strict";
import Contact from "../server/src/models/Contact.js";

test("contact messages enforce production length limits", async () => {
  const invalid = new Contact({ name: "A", email: "test@example.com", message: "short" });
  await assert.rejects(invalid.validate(), (error) => {
    assert.ok(error?.errors?.name);
    assert.ok(error?.errors?.message);
    return true;
  });

  const valid = new Contact({ name: "Test Parent", email: "TEST@EXAMPLE.COM", message: "I need help with my recent order." });
  await valid.validate();
  assert.equal(valid.email, "test@example.com");
});
