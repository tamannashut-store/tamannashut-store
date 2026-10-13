import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { storefrontProductFilter } from "./productVisibility.js";

export const publicStoreStats = async (store, { Products = Product, Users = User } = {}) => {
  const filter = storefrontProductFilter({ sellerId: store.id });
  const [productCount, followerCount, reviews] = await Promise.all([
    Products.countDocuments(filter),
    Users.countDocuments({ accountType: "customer", followedStores: store.id }),
    Products.aggregate([
      { $match: { ...filter, sellerId: new mongoose.Types.ObjectId(store.id) } },
      { $unwind: "$reviews" },
      { $match: { "reviews.status": { $in: ["approved", null] }, "reviews.rating": { $gte: 1, $lte: 5 } } },
      { $group: { _id: null, averageRating: { $avg: "$reviews.rating" }, ratingCount: { $sum: 1 } } },
    ]),
  ]);
  return { ...store, productCount, followerCount, ratingCount: reviews[0]?.ratingCount || 0, averageRating: reviews[0]?.averageRating || 0 };
};
