import test from "node:test";
import assert from "node:assert/strict";
import { detectImageType, validateUploadedImages } from "../server/src/middleware/upload.js";

const file = (mimetype, buffer, originalname = "photo") => ({ mimetype, buffer, originalname });

test("image signatures identify supported formats", () => {
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8, 0xff, ...new Array(9).fill(0)])), "image/jpeg");
  assert.equal(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])), "image/png");
  assert.equal(detectImageType(Buffer.from("RIFF0000WEBP", "ascii")), "image/webp");
  const avif = Buffer.from("0000ftypavif", "ascii");
  avif.writeUInt32BE(avif.length, 0);
  const heic = Buffer.from("0000ftypheic", "ascii");
  heic.writeUInt32BE(heic.length, 0);
  assert.equal(detectImageType(avif), "image/avif");
  assert.equal(detectImageType(heic), "image/heif");
});

test("AVIF is recognized when it appears as a compatible ISO media brand", () => {
  const buffer = Buffer.alloc(24);
  buffer.writeUInt32BE(buffer.length, 0);
  buffer.write("ftyp", 4, "ascii");
  buffer.write("mif1", 8, "ascii");
  buffer.write("avif", 16, "ascii");
  assert.equal(detectImageType(buffer), "image/avif");
});

test("image validation rejects a file whose content does not match its MIME type", () => {
  const req = { files: [file("image/jpeg", Buffer.from("not an image"), "fake.jpg")] };
  validateUploadedImages(req, {}, (error) => {
    assert.equal(error?.status, 400);
    assert.match(error?.message || "", /not a valid supported image/);
  });
});

test("image validation accepts a genuine declared image", () => {
  const req = { files: [file("image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]), "photo.png")] };
  validateUploadedImages(req, {}, (error) => assert.equal(error, undefined));
});
