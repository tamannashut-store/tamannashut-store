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
  assert.equal(valid.topic, "general");
  assert.equal(valid.status, "open");
});

test("contact requests store a structured topic, order reference and workflow status", async () => {
  const request = new Contact({ name: "Test Parent", email: "test@example.com", topic: "return", orderReference: "B06F8E07", message: "The delivered item is damaged and needs review.", status: "in_progress" });
  await request.validate();
  assert.equal(request.topic, "return");
  assert.equal(request.orderReference, "B06F8E07");
  assert.equal(request.status, "in_progress");

  request.topic = "unknown";
  await assert.rejects(request.validate(), /`unknown` is not a valid enum value/);
});
