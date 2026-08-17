import "./instrument.js";
// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// dotenv.config();
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import productRoutes from "./routes/productRoutes.js";
// import paymentRoutes from "./routes/paymentRoutes.js";
// import authRoutes from "./routes/authRoutes.js";
// import path from "path";
// import orderRoutes from "./routes/orderRoutes.js";
// import User from "./models/User.js";
// import dashboardRoutes from "./routes/dashboardRoutes.js";
// import couponRoutes from "./routes/couponRoutes.js";
// import sitemapRoutes from "./routes/sitemapRoutes.js";
// import googleFeedRoutes from "./routes/googleFeedRoutes.js";
// import robotsRoutes from "./routes/robotsRoutes.js";
// import contactRoutes from "./routes/contactRoutes.js";
// import compression from "compression";
// import rateLimit from "express-rate-limit";
// import helmet from "helmet";
// import errorHandler from "./middleware/errorHandler.js";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import compression from "compression";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";
import productRoutes from "./routes/productRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import sitemapRoutes from "./routes/sitemapRoutes.js";
import googleFeedRoutes from "./routes/googleFeedRoutes.js";
import robotsRoutes from "./routes/robotsRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import { razorpayWebhook } from "./routes/razorpayWebhook.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import socialRoutes from "./routes/socialRoutes.js";
import crypto from "crypto";
import * as Sentry from "@sentry/node";
import Product from "./models/Product.js";
import { backfillProductSlugs } from "./utils/productSlug.js";

const app = express();
app.set("trust proxy", 1);
app.set("etag", true);
app.use(
  cors({
    origin: [
      "https://www.tamannashut.com",
      "https://tamannashut.com",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.use(helmet());
app.use(compression());
app.use((req, res, next) => {
  req.requestId = req.get("x-request-id") || crypto.randomUUID();
  res.set("x-request-id", req.requestId);
  next();
});
app.post("/api/payment/webhook", express.raw({ type: "application/json", limit: "256kb" }), razorpayWebhook);
app.use(express.json({ limit: "1mb" }));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});
app.use("/api", limiter);
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "server/src/uploads"))
);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/logistics", shippingRoutes);
app.use("/api/social", socialRoutes);
app.use("/", sitemapRoutes);
app.use("/", googleFeedRoutes);
app.use("/", robotsRoutes);
app.get("/api", (req, res) => {
  res.json({ message: "API is working" });
});
app.get("/api/health/live", (req, res) => {
  res.json({ status: "ok", uptimeSeconds: Math.floor(process.uptime()) });
});
app.get("/api/health/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready" });
});
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
let server;
const start = async () => {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) throw new Error("Required server configuration is missing");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
  const migratedSlugs = await backfillProductSlugs(Product);
  if (migratedSlugs) console.log(`Product URLs prepared: ${migratedSlugs}`);
  server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};
const shutdown = async (signal) => {
  console.log(`${signal} received; shutting down`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.close();
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
start().catch((error) => {
  Sentry.captureException(error);
  console.error("Server startup failed:", error.message);
  Sentry.flush(2000).finally(() => process.exit(1));
});

// app.post("/api/register", async (req, res) => {
//     try {
//       const { name, email, password } = req.body;

//       const existingUser = await User.findOne({ email });

//       if (existingUser) {
//         return res.status(400).json({
//           success: false,
//           message: "User already exists",
//         });
//       }

//       const hashedPassword = await bcrypt.hash(password, 10);

//       const user = new User({
//         name,
//         email,
//         password: hashedPassword,
//       });

//       await user.save();

//       res.json({
//         success: true,
//         message: "User created successfully",
//       });
//     } catch (error) {
//       console.log(error);

//       res.status(500).json({
//         success: false,
//         message: "Server error",
//       });
//     }
//   });

//   app.post("/api/login", async (req, res) => {
//     try {
//       const { email, password } = req.body;

//       const user = await User.findOne({ email });

//       if (!user) {
//         return res.status(400).json({
//           success: false,
//           message: "User not found",
//         });
//       }

//       const isMatch = await bcrypt.compare(password, user.password);

//       if (!isMatch) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid password",
//         });
//       }

//       const token = jwt.sign(
//         {
//           id: user._id,
//         },
//         process.env.JWT_SECRET,
//         {
//           expiresIn: "7d",
//         }
//       );

//       res.json({
//         success: true,
//         message: "Login successful",
//         token,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//         },
//       });
//     } catch (error) {
//       console.log(error);

//       res.status(500).json({
//         success: false,
//         message: "Server error",
//       });
//     }
//   });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
