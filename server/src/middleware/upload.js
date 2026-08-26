import multer from "multer";

const storage = multer.memoryStorage();

const ascii = (buffer, start, end) => buffer.subarray(start, end).toString("ascii");

export const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return "";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (ascii(buffer, 0, 4) === "RIFF" && ascii(buffer, 8, 12) === "WEBP") return "image/webp";
  if (ascii(buffer, 4, 8) !== "ftyp") return "";

  const declaredBoxSize = buffer.readUInt32BE(0);
  const boxEnd = Math.min(declaredBoxSize >= 16 ? declaredBoxSize : buffer.length, buffer.length, 64);
  const brands = [ascii(buffer, 8, 12)];
  for (let offset = 16; offset + 4 <= boxEnd; offset += 4) brands.push(ascii(buffer, offset, offset + 4));
  if (brands.some((brand) => ["avif", "avis"].includes(brand))) return "image/avif";
  if (brands.some((brand) => ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand))) return "image/heif";
  return "";
};

const declaredTypeMatches = (declared, detected) => {
  if (declared === detected) return true;
  return ["image/heic", "image/heif"].includes(declared) && detected === "image/heif";
};

export const validateUploadedImages = (req, _res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  const invalidFile = files.find((file) => !declaredTypeMatches(file.mimetype, detectImageType(file.buffer)));
  if (invalidFile) {
    return next(Object.assign(new Error(`The file ${invalidFile.originalname || "uploaded"} is not a valid supported image`), { status: 400 }));
  }
  return next();
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, callback) => {
    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/heic",
      "image/heif",
    ]);
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
    callback(null, true);
  },
});

export default upload;
