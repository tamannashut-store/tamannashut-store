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

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id)
            .select("-password +passwordChangedAt");

        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        if ((decoded.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) {
            return res.status(401).json({
                message: "Your session has expired. Please sign in again",
                code: "SESSION_EXPIRED",
            });
        }

        const passwordChangedAt = user.passwordChangedAt
            ? Math.floor(user.passwordChangedAt.getTime() / 1000)
            : 0;
        if (passwordChangedAt && decoded.iat < passwordChangedAt) {
            return res.status(401).json({
                message: "Your password changed. Please sign in again",
                code: "SESSION_EXPIRED",
            });
        }

        req.user = user;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Token invalid",
        });

    }

};

export const admin = (req, res, next) => {
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
