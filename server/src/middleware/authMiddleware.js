import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { hasActiveSellerCentreAccess, isMarketplaceSeller, isPlatformAdmin } from "../utils/accountRoles.js";

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
    if (req.user && isPlatformAdmin(req.user)) {
        return next();
    }

    return res.status(403).json({
        message: "Admin only",
    });

};

export const sellerCentre = (req, res, next) => {
    if (req.user && hasActiveSellerCentreAccess(req.user)) return next();
    return res.status(403).json({ message: "Active Seller Centre account required" });
};

export const seller = (req, res, next) => {
    if (req.user && isMarketplaceSeller(req.user) && req.user.sellerAccessStatus === "active") return next();
    return res.status(403).json({ message: "Active seller account required" });
};

export const sellerApplicant = (req, res, next) => {
    if (req.user && isMarketplaceSeller(req.user) && req.user.sellerAccessStatus !== "closed" && req.user.sellerAccessStatus !== "suspended") return next();
    return res.status(403).json({ message: "Seller applicant account required" });
};
