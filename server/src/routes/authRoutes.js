import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();


// REGISTER

router.post("/register", async (req, res) => {

    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        if (name.length < 2 || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) {
            return res.status(400).json({ message: "Enter a valid name, email and password of at least 8 characters" });
        }
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );
          
          return res.status(201).json({
            token,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              isAdmin: user.isAdmin,
            },
          });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});


// LOGIN

router.post("/login", async (req, res) => {

    try {

        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {

            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
});

router.post("/forgot-password", async (req, res) => {
    const response = { message: "If an account exists for that email, a password reset link has been sent" };
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
        const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");
        if (!user) return res.json(response);
        const token = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
        user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        const resetUrl = `${process.env.CLIENT_URL || "https://www.tamannashut.com"}/reset-password/${token}`;
        const delivery = await sendEmail(user.email, "Reset your Tamanna's Hut password", `<h2>Reset your password</h2><p>Use the secure link below within 30 minutes:</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`);
        if (!delivery?.sent) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
        }
        return res.json(response);
    } catch (error) {
        console.error("PASSWORD RESET REQUEST ERROR:", String(error?.message || "Request failed").slice(0, 200));
        return res.json(response);
    }
});

router.post("/reset-password/:token", async (req, res) => {
    try {
        const password = String(req.body.password || "");
        if (password.length < 8 || password.length > 128) return res.status(400).json({ message: "Password must be between 8 and 128 characters" });
        const tokenHash = crypto.createHash("sha256").update(String(req.params.token || "")).digest("hex");
        const user = await User.findOne({ passwordResetToken: tokenHash, passwordResetExpires: { $gt: new Date() } }).select("+passwordResetToken +passwordResetExpires");
        if (!user) return res.status(400).json({ message: "This reset link is invalid or has expired" });
        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        return res.json({ message: "Password reset successfully. You can now sign in" });
    } catch (error) {
        return res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Password could not be reset" : error.message });
    }
});
router.get("/profile/:id", protect, async (req, res) => {

    try {

        if (String(req.user._id) !== req.params.id && !req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied" });
        }

        const user = await User.findById(
            req.params.id
        ).select("-password");

        return res.json(user);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

});
router.put("/profile/:id", protect, async (req, res) => {

    try {

        if (String(req.user._id) !== req.params.id && !req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied" });
        }

        const user = await User.findById(
            req.params.id
        );

        if (!user) {

            return res.status(404).json({
                message: "User not found",
            });

        }

        user.name =
            req.body.name || user.name;

        user.phone =
            req.body.phone || user.phone;

        user.address =
            req.body.address || user.address;

        user.city =
            req.body.city || user.city;

        user.state =
            req.body.state || user.state || user.State;

        user.pincode =
            req.body.pincode || user.pincode;

        const updatedUser = await user.save();
        return res.json(updatedUser);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

});

router.put("/change-password/:id", protect, async (req, res) => {

    try {

        if (String(req.user._id) !== req.params.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        const { currentPassword, newPassword } =
            req.body;

        const user = await User.findById(
            req.params.id
        );

        if (!user) {

            return res.status(404).json({
                message: "User not found",
            });

        }

        const isMatch =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!isMatch) {

            return res.status(400).json({
                message: "Current password incorrect",
            });

        }

        user.password =
            await bcrypt.hash(
                newPassword,
                10
            );
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        return res.json({
            success: true,
            message: "Password changed",
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

});

export default router;
