import mongoose from "mongoose";

const asciiLetterOrDigit = (character) => /[A-Za-z0-9]/.test(character);

export const isValidEmailAddress = (value) => {
  if (typeof value !== "string" || value.length < 3 || value.length > 254) return false;
  const at = value.indexOf("@");
  if (at < 1 || at !== value.lastIndexOf("@") || at > 64) return false;
  const local = value.slice(0, at);
  const labels = value.slice(at + 1).split(".");
  if (labels.length < 2 || !local.split("").every((character) => !/\s/.test(character))) return false;
  return labels.every((label) => label.length > 0 && label.length <= 63
    && asciiLetterOrDigit(label[0]) && asciiLetterOrDigit(label[label.length - 1])
    && label.split("").every((character) => asciiLetterOrDigit(character) || character === "-"));
};

export const objectIdFromInput = (value, label = "identifier") => {
  if (typeof value !== "string" || !/^[a-fA-F0-9]{24}$/.test(value)) {
    throw Object.assign(new Error(`Enter a valid ${label}`), { status: 400 });
  }
  return new mongoose.Types.ObjectId(value);
};

export const razorpayIdFromInput = (value, prefix, label = "payment identifier") => {
  if (typeof value !== "string" || value.length > 100 || !value.startsWith(`${prefix}_`) || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw Object.assign(new Error(`Invalid ${label}`), { status: 400 });
  }
  return value;
};
