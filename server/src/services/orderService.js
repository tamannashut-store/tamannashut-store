import mongoose from "mongoose";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import SellerProfile from "../models/SellerProfile.js";
import { sendEmail } from "../utils/sendEmail.js";
import { adminNewOrderEmailTemplate, orderEmailTemplate } from "../utils/emailTemplates.js";
import { sendWhatsApp } from "../utils/sendWhatsApp.js";
import { nextInvoiceNumber } from "../utils/invoiceNumber.js";
import { gstRateForApparelUnit } from "../utils/gst.js";
import { storefrontProductFilter } from "../utils/productVisibility.js";
import { groupSellerLines, syncOrderSettlementsSafely } from "./sellerSettlementService.js";

const money = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const selectProductImage = (product, variant, selectedSize) => {
  const images = Array.isArray(product?.images) ? product.images : [];
  const color = String(variant?.color || "").trim().toLowerCase();
  const size = String(selectedSize || variant?.size || "").trim().toLowerCase();
  const sameColor = (image) => color && String(image.color || "").trim().toLowerCase() === color;
  const sameSize = (image) => size && String(image.size || "").trim().toLowerCase() === size;
  return images.find((image) => sameColor(image) && sameSize(image))
    || images.find((image) => sameColor(image) && !String(image.size || "").trim())
    || images.find(sameColor)
    || images.find((image) => !String(image.color || "").trim() && sameSize(image))
    || images.find((image) => !String(image.color || "").trim() && !String(image.size || "").trim())
    || images[0];
};

export const normalizeCustomer = (customer) => {
  const requiredFields = ["name", "email", "phone", "address", "city", "pincode"];
  const cleanCustomer = Object.fromEntries(
    requiredFields.map((field) => [field, String(customer?.[field] || "").trim().slice(0, field === "address" ? 500 : 150)])
  );
  cleanCustomer.state = String(customer?.state || customer?.State || "").trim().slice(0, 150);
  if (requiredFields.some((field) => !cleanCustomer[field])) {
    throw Object.assign(new Error("Complete all delivery address fields"), { status: 400 });
  }
  if (cleanCustomer.name.length < 2 || cleanCustomer.address.length < 10) {
    throw Object.assign(new Error("Enter the recipient's full name and a complete delivery address"), { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanCustomer.email)) {
    throw Object.assign(new Error("Enter a valid email address"), { status: 400 });
  }
  if (!/^\+?[0-9]{10,13}$/.test(cleanCustomer.phone.replace(/\s/g, "")) || !/^\d{6}$/.test(cleanCustomer.pincode)) {
    throw Object.assign(new Error("Enter a valid phone number and pincode"), { status: 400 });
  }
  return { ...cleanCustomer, phone: cleanCustomer.phone.replace(/\s/g, "") };
};

export const calculateCart = async (items, couponCode = "") => {
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
    throw Object.assign(new Error("Your cart is empty or invalid"), { status: 400 });
  }

  const normalized = items.map((item) => ({
    productId: String(item._id || item.productId || ""),
    selectedSize: String(item.selectedSize || "").trim(),
    selectedSku: String(item.selectedSku || "").trim().toUpperCase(),
    qty: Number(item.qty),
  }));
  for (const item of normalized) {
    if (!mongoose.isValidObjectId(item.productId) || !item.selectedSize || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20) {
      throw Object.assign(new Error("Your cart contains an invalid item"), { status: 400 });
    }
  }

  const productIds = [...new Set(normalized.map((item) => item.productId))];
  const products = await Product.find(storefrontProductFilter({ _id: { $in: productIds } })).lean();
  const productById = new Map(products.map((product) => [String(product._id), product]));

  const lines = normalized.map((item) => {
    const product = productById.get(item.productId);
    if (!product) throw Object.assign(new Error("A product in your cart is no longer available"), { status: 409 });
    const variant = product.variants?.find((entry) => (item.selectedSku ? entry.sku === item.selectedSku : entry.size === item.selectedSize) && entry.active !== false);
    const sizeData = variant || product.sizeStock?.find((entry) => entry.size === item.selectedSize);
    if (!sizeData || Number(sizeData.stock) < item.qty) {
      throw Object.assign(new Error(`${product.name} (${item.selectedSize}) has insufficient stock`), { status: 409 });
    }
    const price = money(variant?.price ?? product.price);
    const image = selectProductImage(product, variant, item.selectedSize);
    return {
      _id: product._id,
      sellerId: product.sellerId || null,
      name: product.name,
      price,
      qty: item.qty,
      selectedSize: item.selectedSize,
      selectedColor: variant?.color || "",
      sku: variant?.sku || "",
      hsnCode: product.hsnCode || "",
      image: image?.url || "",
      lineTotal: money(price * item.qty),
    };
  });

  const subtotal = money(lines.reduce((sum, item) => sum + item.lineTotal, 0));
  let coupon = null;
  let discount = 0;
  const normalizedCode = String(couponCode || "").trim().toUpperCase();
  if (normalizedCode) {
    coupon = await Coupon.findOne({
      code: normalizedCode,
      active: true,
      $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    }).lean();
    if (!coupon) throw Object.assign(new Error("Coupon is invalid or expired"), { status: 400 });
    discount = money(subtotal * (Number(coupon.discount) / 100));
  }
  const discountRatio = subtotal > 0 ? discount / subtotal : 0;
  lines.forEach((line) => {
    line.gstRate = gstRateForApparelUnit(line.price * (1 - discountRatio));
  });

  return {
    products: lines,
    subtotal,
    discount,
    totalAmount: money(Math.max(subtotal - discount, 0)),
    couponCode: coupon?.code || "",
    couponPercent: coupon?.discount || 0,
  };
};

const restoreReservations = async (reservedItems) => {
  await Promise.allSettled(
    reservedItems.flatMap((item) => [
      Product.updateOne(
        { _id: item._id, "sizeStock.size": item.selectedSize },
        { $inc: { "sizeStock.$.stock": item.qty } }
      ),
      Product.updateOne(
        { _id: item._id },
        { $inc: { "variants.$[variant].stock": item.qty } },
        { arrayFilters: [{ [item.sku ? "variant.sku" : "variant.size"]: item.sku || item.selectedSize, "variant.active": { $ne: false } }] }
      ),
    ])
  );
};

export const createOrderWithReservedStock = async ({ user, customer, cart, payment, idempotencyKey }) => {
  const safeKey = String(idempotencyKey || "").trim().slice(0, 100);
  if (!safeKey) throw Object.assign(new Error("Missing checkout request identifier"), { status: 400 });

  const existing = await Order.findOne({ userId: user._id, idempotencyKey: safeKey });
  if (existing) return { order: existing, created: false };

  const validPayment = (payment?.method === "COD" && payment?.status === "Pending")
    || (payment?.method === "Online" && payment?.status === "Paid" && payment?.paymentId);
  if (!validPayment) throw Object.assign(new Error("Order payment could not be verified"), { status: 400 });

  const cleanCustomer = normalizeCustomer(customer);

  const reservedItems = [];
  try {
    for (const item of cart.products) {
      const result = await Product.updateOne(
        {
          _id: item._id,
          ...storefrontProductFilter(),
          sizeStock: { $elemMatch: { size: item.selectedSize, stock: { $gte: item.qty } } },
        },
        { $inc: { "sizeStock.$.stock": -item.qty } }
      );
      if (result.modifiedCount !== 1) {
        throw Object.assign(new Error(`${item.name} (${item.selectedSize}) just went out of stock`), { status: 409 });
      }
      await Product.updateOne(
        { _id: item._id },
        { $inc: { "variants.$[variant].stock": -item.qty } },
        { arrayFilters: [{ [item.sku ? "variant.sku" : "variant.size"]: item.sku || item.selectedSize, "variant.active": { $ne: false } }] }
      );
      reservedItems.push(item);
    }

    const invoiceNumber = await nextInvoiceNumber();
    const sellerGroups = groupSellerLines({ products: cart.products });
    const candidateSellerIds = [...sellerGroups.keys()];
    const profiles = candidateSellerIds.length ? await SellerProfile.find({ userId: { $in: candidateSellerIds }, verificationStatus: "verified" }).select("userId pickupAddress").lean() : [];
    const sellerIds = profiles.map((profile) => String(profile.userId));
    const profileBySeller = new Map(profiles.map((profile) => [String(profile.userId), profile]));
    const sellerFulfillments = sellerIds.map((sellerId) => ({
      sellerId,
      status: "pending",
      itemSkus: sellerGroups.get(sellerId).map((item) => item.sku || String(item._id)),
      pickupAddress: profileBySeller.get(sellerId)?.pickupAddress || {},
      provider: "platform_managed",
    }));
    const order = await Order.create({
      userId: user._id,
      customerName: cleanCustomer.name,
      email: cleanCustomer.email,
      phone: cleanCustomer.phone,
      address: cleanCustomer.address,
      city: cleanCustomer.city,
      state: cleanCustomer.state,
      pincode: cleanCustomer.pincode,
      products: cart.products,
      subtotal: cart.subtotal,
      discount: cart.discount,
      couponCode: cart.couponCode,
      totalAmount: cart.totalAmount,
      paymentId: payment.paymentId || "",
      razorpayOrderId: payment.razorpayOrderId || "",
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      status: "Pending",
      idempotencyKey: safeKey,
      invoiceNumber,
      inventoryRestored: false,
      statusHistory: [{ status: "Pending", note: "Order placed" }],
      sellerFulfillments,
    });
    await syncOrderSettlementsSafely(order);
    await User.updateOne({ _id: user._id }, { $set: { cart: [], cartUpdatedAt: null } });
    return { order, created: true };
  } catch (error) {
    await restoreReservations(reservedItems);
    if (error.code === 11000) {
      const duplicate = await Order.findOne({ userId: user._id, idempotencyKey: safeKey });
      if (duplicate) return { order: duplicate, created: false };
    }
    throw error;
  }
};

export const sendOrderNotifications = async (order) => {
  const cod = order.paymentMethod === "COD";
  const customerEmail = sendEmail(
    order.email,
    `${cod ? "COD Order Received" : "Payment Confirmed"} - Tamanna's Hut`,
    orderEmailTemplate(order)
  );
  const shortId = String(order._id || "").slice(-8).toUpperCase();
  const adminEmail = process.env.ADMIN_EMAIL
    ? sendEmail(process.env.ADMIN_EMAIL, `New ${cod ? "COD" : "online"} order #${shortId} - Rs. ${Number(order.totalAmount || 0).toLocaleString("en-IN")}`, adminNewOrderEmailTemplate(order))
    : Promise.resolve();
  const phone = order.phone.startsWith("+") ? order.phone : `+91${order.phone}`;
  const whatsapp = sendWhatsApp(phone, `${cod ? "COD order received. No payment has been collected yet." : "Payment verified and order received."}\n\nOrder ID: ${order._id}\nAmount: ₹${order.totalAmount}\nStatus: ${order.status}`);
  await Promise.allSettled([customerEmail, adminEmail, whatsapp]);
};

export const restoreOrderStock = async (order) => {
  if (order.inventoryRestored) return;
  await Promise.all(
    order.products.flatMap((item) => [
      Product.updateOne(
        { _id: item._id, "sizeStock.size": item.selectedSize },
        { $inc: { "sizeStock.$.stock": Number(item.qty) } }
      ),
      Product.updateOne(
        { _id: item._id },
        { $inc: { "variants.$[variant].stock": Number(item.qty) } },
        { arrayFilters: [{ [item.sku ? "variant.sku" : "variant.size"]: item.sku || item.selectedSize, "variant.active": { $ne: false } }] }
      ),
    ])
  );
  order.inventoryRestored = true;
};
