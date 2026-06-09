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

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
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

dotenv.config();
const app = express();
app.set("trust proxy", 1);
app.set("etag", true);
app.use(
  cors({
    origin: [
      "https://www.tamannashut.com",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

app.use(helmet());
app.use(compression());
app.use(express.json());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "server/src/uploads"))
);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/", sitemapRoutes);
app.use("/", googleFeedRoutes);
app.use("/", robotsRoutes);
app.use(limiter);
app.get("/api", (req, res) => {
  res.json({ message: "API is working" });
});
app.use(errorHandler);
mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected")).catch((err) => console.log(err));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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