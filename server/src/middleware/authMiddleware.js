import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "Not authorized",
            });
        }

        const token = authHeader.split(" ")[1];

        console.log("TOKEN:", token);

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("DECODED:", decoded);

        const user = await User.findById(decoded.id)
            .select("-password");

        console.log("USER FOUND:", user);

        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        req.user = user;

        next();

    } catch (error) {

        console.log("AUTH ERROR:", error);

        return res.status(401).json({
            message: "Token invalid",
        });

    }

};

export const admin = (req, res, next) => {

    console.log("ADMIN CHECK:", req.user);

    if (
        req.user &&
        req.user.isAdmin
    ) {
        return next();
    }

    return res.status(403).json({
        message: "Admin only",
    });

};