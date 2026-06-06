import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();


// REGISTER

router.post("/register", async (req, res) => {

    try {
        const { name, email, password } = req.body;
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
            {
                id: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );
        res.status(201).json({
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

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(400).json({
                message: "Invalid Email",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {

            return res.status(400).json({
                message: "Invalid Password",
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

        res.json({
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
router.get("/profile/:id", async (req, res) => {

    try {

        const user = await User.findById(
            req.params.id
        ).select("-password");

        res.json(user);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

});
router.put("/profile/:id", async (req, res) => {

    try {

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

        user.pincode =
            req.body.pincode || user.pincode;

        const updatedUser =
            await user.save();

        res.json(updatedUser);
        alert("Profile Updated")

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });

    }

});

router.put("/change-password/:id", async (req, res) => {

    try {

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

        await user.save();

        res.json({
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