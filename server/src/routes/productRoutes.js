import express from "express";
import { buildSearchRegex, escapeRegex } from "../utils/search.js";
import Product from "../models/Product.js";
import upload from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { admin, protect } from "../middleware/authMiddleware.js";
import InventoryLog from "../models/InventoryLog.js";
import Order from "../models/Order.js";
import { recordAudit } from "../utils/recordAudit.js";

const router = express.Router();
const approvedReviews = (reviews = []) => reviews.filter((review) => !review.status || review.status === "approved");
const refreshReviewSummary = (product) => {
  const visible = approvedReviews(product.reviews);
  product.averageRating = visible.length ? visible.reduce((sum, review) => sum + Number(review.rating || 0), 0) / visible.length : 0;
  product.approvedReviewCount = visible.length;
};
const lowStockExpression = {
  $cond: [
    { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
    { $anyElementTrue: { $map: {
      input: { $filter: { input: "$variants", as: "variant", cond: { $ne: ["$$variant.active", false] } } },
      as: "variant",
      in: { $lte: [{ $ifNull: ["$$variant.stock", 0] }, { $ifNull: ["$lowStockThreshold", 3] }] },
    } } },
    { $anyElementTrue: { $map: {
      input: { $ifNull: ["$sizeStock", []] },
      as: "item",
      in: { $lte: [{ $ifNull: ["$$item.stock", 0] }, { $ifNull: ["$lowStockThreshold", 3] }] },
    } } },
  ],
};
const parseProductFields = (body) => {
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const mrp = Number(body.mrp || body.price);
  const description = String(body.description || "").trim().slice(0, 5000);
  const category = String(body.category || "").trim().toLowerCase().replace(/\s+/g, "-");
  const sizeStock = JSON.parse(body.sizeStock || "[]");
  const baseSku = String(body.baseSku || "").trim().toUpperCase().slice(0, 60);
  const color = String(body.color || "").trim().slice(0, 80);
  const fabric = String(body.fabric || "").trim().slice(0, 120);
  const ageGroup = String(body.ageGroup || "").trim().slice(0, 80);
  const status = ["draft", "active", "archived"].includes(body.status) ? body.status : "active";
  const lowStockThreshold = Math.max(Number(body.lowStockThreshold) || 0, 0);
  const tags = JSON.parse(body.tags || "[]")
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);

  if (!name || name.length > 200) {
    throw Object.assign(new Error("Product name is required and must be under 200 characters"), { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    throw Object.assign(new Error("Enter a valid product price"), { status: 400 });
  }
  if (!Number.isFinite(mrp) || mrp < price) {
    throw Object.assign(new Error("MRP must be equal to or greater than the selling price"), { status: 400 });
  }
  if (!["girls", "boys", "new-arrivals"].includes(category)) {
    throw Object.assign(new Error("Select a valid product category"), { status: 400 });
  }
  if (!Array.isArray(sizeStock) || sizeStock.length > 30) {
    throw Object.assign(new Error("Invalid size inventory"), { status: 400 });
  }

  const normalizedStock = sizeStock.map((item) => {
    const size = String(item.size || "").trim().slice(0, 30);
    const stock = Number(item.stock);
    if (!size || !Number.isInteger(stock) || stock < 0) {
      throw Object.assign(new Error("Every size must have a valid non-negative stock quantity"), { status: 400 });
    }
    return { size, stock };
  });

  const submittedVariants = body.variants ? JSON.parse(body.variants) : [];
  const normalizedVariants = (submittedVariants.length ? submittedVariants : normalizedStock.map((item) => ({
    sku: `${baseSku || name.replace(/[^a-z0-9]/gi, "-")}-${item.size}`,
    size: item.size,
    color,
    stock: item.stock,
    price,
    active: true,
  }))).map((variant) => {
    const sku = String(variant.sku || "").trim().toUpperCase().slice(0, 80);
    const size = String(variant.size || "").trim().slice(0, 30);
    const variantStock = Number(variant.stock);
    const variantPrice = variant.price === "" || variant.price == null ? price : Number(variant.price);
    if (!sku || !size || !Number.isInteger(variantStock) || variantStock < 0 || !Number.isFinite(variantPrice) || variantPrice < 0) {
      throw Object.assign(new Error("Every variant requires a SKU, size, valid price and non-negative stock"), { status: 400 });
    }
    return {
      sku,
      size,
      color: String(variant.color || color).trim().slice(0, 80),
      stock: variantStock,
      price: variantPrice,
      active: variant.active !== false,
    };
  });
  if (new Set(normalizedVariants.map((variant) => variant.sku)).size !== normalizedVariants.length) {
    throw Object.assign(new Error("Variant SKUs must be unique within a product"), { status: 400 });
  }
  if (!normalizedVariants.length) {
    throw Object.assign(new Error("Add at least one product variant"), { status: 400 });
  }
  const stockBySize = new Map();
  normalizedVariants.forEach((variant) => stockBySize.set(variant.size, (stockBySize.get(variant.size) || 0) + variant.stock));
  const syncedSizeStock = [...stockBySize].map(([size, stock]) => ({ size, stock }));

  return {
    name, price, mrp, baseSku, description, category, color: color || normalizedVariants[0]?.color || "", fabric, ageGroup,
    tags, status, lowStockThreshold, variants: normalizedVariants, sizeStock: syncedSizeStock,
  };
};

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "tamannas-hut-products" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// router.get("/", async (req, res) => {

//   try {

//     const products = await Product.find();
//     res.set("Cache-Control", "public, max-age=60");
//     res.json(products);

//   } catch (error) {

//     res.status(500).json({
//       message: error.message,
//     });

//   }
// });

router.post("/", protect, admin, upload.array("images", 30), async (req, res) => {
  try {
    const fields = parseProductFields(req.body);
    let images = [];

    if (req.files && req.files.length > 0) {

      try {

        const uploadPromises = req.files.map(
          (file) => uploadToCloudinary(file.buffer)
        );

        const results = await Promise.all(uploadPromises);

        const imageColors = JSON.parse(req.body.imageColors || "[]");
        const imageSizes = JSON.parse(req.body.imageSizes || "[]");
        images = results.map((result, index) => ({
          url: result.secure_url,
          public_id: result.public_id,
          color: String(imageColors[index] || "").trim().slice(0, 80),
          size: String(imageSizes[index] || "").trim().slice(0, 30),
        }));

      } catch (err) {

        console.log("Cloudinary upload failed:", err.message);

        return res.status(500).json({
          message: "Image upload failed",
        });

      }
    }

    if (images.length === 0) {
      return res.status(400).json({ message: "At least one product image is required" });
    }

    const product = new Product({ ...fields, images });

    await product.save();

    return res.status(201).json(product);
  } catch (error) {
    console.log(error);
    return res.status(error.status || 500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 48);
    const filter = {};
    filter.status = { $nin: ["draft", "archived"] };

    const search = String(req.query.search || "").trim().slice(0, 100);
    if (search) {
      const searchRegex = buildSearchRegex(search);
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { color: searchRegex },
        { fabric: searchRegex },
        { ageGroup: searchRegex },
        { tags: searchRegex },
      ];
    }

    const category = String(req.query.category || "").trim();
    if (category) {
      const categoryPattern = category === "new-arrivals"
        ? "^new(?:-|\\s)arrivals$"
        : `^${escapeRegex(category)}$`;
      filter.category = new RegExp(categoryPattern, "i");
    }

    const size = String(req.query.size || "").trim().slice(0, 20);
    if (size) {
      filter.$and = [...(filter.$and || []), { $or: [{ sizeStock: { $elemMatch: { size, stock: { $gt: 0 } } } }, { variants: { $elemMatch: { size, stock: { $gt: 0 }, active: { $ne: false } } } }] }];
    } else if (req.query.inStock === "true") {
      filter.$and = [...(filter.$and || []), { $or: [{ sizeStock: { $elemMatch: { stock: { $gt: 0 } } } }, { variants: { $elemMatch: { stock: { $gt: 0 }, active: { $ne: false } } } }] }];
    }

    const color = String(req.query.color || "").trim().slice(0, 60);
    if (color) {
      const exactColor = new RegExp(`^${escapeRegex(color)}$`, "i");
      filter.$and = [...(filter.$and || []), { $or: [{ color: exactColor }, { variants: { $elemMatch: { color: exactColor, active: { $ne: false } } } }] }];
    }
    [["fabric", "fabric"], ["ageGroup", "ageGroup"]].forEach(([queryKey, field]) => { const value = String(req.query[queryKey] || "").trim().slice(0, 60); if (value) filter[field] = new RegExp(`^${escapeRegex(value)}$`, "i"); });

    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      filter.price = {};
      if (Number.isFinite(minPrice)) filter.price.$gte = Math.max(minPrice, 0);
      if (Number.isFinite(maxPrice)) filter.price.$lte = Math.max(maxPrice, 0);
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      rating: { averageRating: -1, createdAt: -1 },
    };
    const sort = sortOptions[req.query.sort] || sortOptions.newest;

    let searchMode = "exact";
    if (search && search.length >= 3 && await Product.countDocuments(filter) === 0) {
      const fuzzyRegex = buildSearchRegex(search, { fuzzy: true });
      filter.$or = [
        { name: fuzzyRegex },
        { description: fuzzyRegex },
        { category: fuzzyRegex },
        { color: fuzzyRegex },
        { fabric: fuzzyRegex },
        { ageGroup: fuzzyRegex },
        { tags: fuzzyRegex },
      ];
      searchMode = "fuzzy";
    }

    const skip = (page - 1) * limit;

    const activeFilter = { status: { $nin: ["draft", "archived"] } };
    const [products, total, variantSizes, legacySizes, colors, variantColors, fabrics, ageGroups, priceRange] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
      Product.distinct("variants.size", activeFilter),
      Product.distinct("sizeStock.size", activeFilter),
      Product.distinct("color", activeFilter),
      Product.distinct("variants.color", activeFilter),
      Product.distinct("fabric", activeFilter),
      Product.distinct("ageGroup", activeFilter),
      Product.aggregate([{ $match: activeFilter }, { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }]),
    ]);

    res.set(
      "Cache-Control",
      "public, max-age=30, s-maxage=300, stale-while-revalidate=86400"
    );

    const publicProducts = products.map(({ reviews: _reviews, ...product }) => ({
      ...product,
      approvedReviewCount: Number(product.approvedReviewCount || 0),
    }));

    res.json({
      products: publicProducts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total,
      pageSize: limit,
      searchMode,
      availableSizes: [...new Set([...variantSizes, ...legacySizes].filter(Boolean))].sort((left, right) => left.localeCompare(right, undefined, { numeric: true })),
      filterOptions: {
        colors: [...new Set([...colors, ...variantColors].filter(Boolean))].sort(),
        fabrics: fabrics.filter(Boolean).sort(),
        ageGroups: ageGroups.filter(Boolean).sort(),
        price: priceRange[0] || { min: 0, max: 0 },
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/suggestions/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim().slice(0, 60);
    if (query.length < 2) return res.json({ suggestions: [] });
    let regex = buildSearchRegex(query);
    const baseFilter = { status: { $nin: ["draft", "archived"] } };
    let suggestionFilter = { ...baseFilter, $or: [{ name: regex }, { tags: regex }, { category: regex }, { color: regex }, { "variants.color": regex }] };
    if (await Product.countDocuments(suggestionFilter) === 0 && query.length >= 3) {
      regex = buildSearchRegex(query, { fuzzy: true });
      suggestionFilter = { ...baseFilter, $or: [{ name: regex }, { tags: regex }, { category: regex }, { color: regex }, { "variants.color": regex }] };
    }
    const products = await Product.find(suggestionFilter).select("name category images price").sort({ averageRating: -1, createdAt: -1 }).limit(6).lean();
    return res.set("Cache-Control", "public, max-age=60").json({ suggestions: products.map((product) => ({ id: product._id, name: product.name, category: product.category, image: product.images?.[0]?.url || "", price: product.price })) });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/:id/related", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("category tags").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    const related = await Product.find({ _id: { $ne: product._id }, status: { $nin: ["draft", "archived"] }, $or: [{ category: product.category }, { tags: { $in: product.tags || [] } }] }).select("-reviews").sort({ averageRating: -1, createdAt: -1 }).limit(8).lean();
    return res.json({ products: related });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/admin/list", protect, admin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = {};
    const search = String(req.query.search || "").trim().slice(0, 100);
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ name: regex }, { baseSku: regex }, { "variants.sku": regex }];
    }
    if (["draft", "active", "archived"].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.inventory === "low") filter.$expr = lowStockExpression;
    const products = await Product.find(filter).select("-reviews").sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
    const total = await Product.countDocuments(filter);
    return res.json({ products, totalProducts: total, currentPage: page, totalPages: Math.max(Math.ceil(total / limit), 1) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch("/admin/bulk-status", protect, admin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.slice(0, 100) : [];
    const status = req.body.status;
    if (!ids.length || !["draft", "active", "archived"].includes(status)) {
      return res.status(400).json({ message: "Select products and a valid status" });
    }
    const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { status } });
    return res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/admin/:id/inventory-history", protect, admin, async (req, res) => {
  try {
    const logs = await InventoryLog.find({ productId: req.params.id }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/admin/reviews/list", protect, admin, async (req, res) => {
  try {
    const requestedStatus = String(req.query.status || "pending").toLowerCase();
    const status = ["all", "pending", "approved", "rejected"].includes(requestedStatus) ? requestedStatus : "pending";
    const products = await Product.find({ "reviews.0": { $exists: true } }).select("name images reviews").sort({ updatedAt: -1 }).lean();
    const reviews = products.flatMap((product) => (product.reviews || []).map((review) => ({
      ...review,
      status: review.status || "approved",
      productId: product._id,
      productName: product.name,
      productImage: product.images?.[0]?.url || "",
    }))).filter((review) => status === "all" || review.status === status).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    return res.json({ reviews, counts: reviews.reduce((result, review) => ({ ...result, [review.status]: (result[review.status] || 0) + 1 }), {}) });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.patch("/admin/:productId/reviews/:reviewId", protect, admin, async (req, res) => {
  try {
    const status = String(req.body.status || "").toLowerCase();
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Choose approve or reject" });
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    review.status = status;
    review.moderatedAt = new Date();
    review.moderatedBy = req.user.email || String(req.user._id);
    refreshReviewSummary(product);
    await product.save();
    await recordAudit({ user: req.user, action: `review.${status}`, entityType: "product_review", entityId: review._id, summary: `${status === "approved" ? "Published" : "Rejected"} review for ${product.name}`, metadata: { productId: String(product._id), rating: review.rating } });
    return res.json({ success: true, review, averageRating: product.averageRating, approvedReviewCount: product.approvedReviewCount });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    product.reviews = approvedReviews(product.reviews);
    product.approvedReviewCount = product.reviews.length;
    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});
router.put(
  "/:id",
  protect,
  admin,
  upload.array("images", 30),
  async (req, res) => {
    let uploadedImages = [];
    try {

      const product = await Product.findById(
        req.params.id
      );


      if (!product) {

        return res.status(404).json({
          message: "Product not found",
        });

      }


      const previousVariants = product.variants?.length
        ? product.variants.map((variant) => ({ sku: variant.sku, size: variant.size, stock: variant.stock }))
        : product.sizeStock.map((item) => ({ sku: `${product.baseSku || product._id}-${item.size}`, size: item.size, stock: item.stock }));
      const fields = parseProductFields(req.body);
      product.name = fields.name;
      product.price = fields.price;
      product.description = fields.description;
      product.category = fields.category;
      product.sizeStock = fields.sizeStock;
      product.mrp = fields.mrp;
      product.baseSku = fields.baseSku;
      product.color = fields.color;
      product.fabric = fields.fabric;
      product.ageGroup = fields.ageGroup;
      product.tags = fields.tags;
      product.status = fields.status;
      product.lowStockThreshold = fields.lowStockThreshold;
      product.variants = fields.variants;


      const originalImages = product.images.map((image) => ({
        url: image.url,
        public_id: image.public_id,
        color: image.color || "",
        size: image.size || "",
      }));

      let retainedImages = originalImages;
      if (req.body.existingImages !== undefined) {
        const requestedImages = JSON.parse(req.body.existingImages || "[]");
        const originalById = new Map(
          originalImages.map((image) => [image.public_id, image])
        );

        retainedImages = requestedImages.map((image) => {
          const original = originalById.get(image.public_id);
          if (!original) throw new Error("Invalid existing image selection");
          return { ...original, color: String(image.color ?? original.color ?? "").trim().slice(0, 80), size: String(image.size ?? original.size ?? "").trim().slice(0, 30) };
        });
      }

      if (req.files?.length) {
        const results = await Promise.all(
          req.files.map((file) => uploadToCloudinary(file.buffer))
        );
        const newImageColors = JSON.parse(req.body.newImageColors || "[]");
        const newImageSizes = JSON.parse(req.body.newImageSizes || "[]");
        uploadedImages = results.map((result, index) => ({
          url: result.secure_url,
          public_id: result.public_id,
          color: String(newImageColors[index] || "").trim().slice(0, 80),
          size: String(newImageSizes[index] || "").trim().slice(0, 30),
        }));
      }

      let nextImages = [...retainedImages, ...uploadedImages];
      if (req.body.imageOrder) {
        const imageOrder = JSON.parse(req.body.imageOrder);
        const retainedById = new Map(
          retainedImages.map((image) => [image.public_id, image])
        );

        nextImages = imageOrder.map((item) => {
          if (item.type === "existing") {
            const image = retainedById.get(item.public_id);
            if (!image) throw new Error("Invalid image order");
            return image;
          }

          if (item.type === "new") {
            const image = uploadedImages[Number(item.fileIndex)];
            if (!image) throw new Error("Invalid new image order");
            return image;
          }

          throw new Error("Invalid image order");
        });
      }

      if (nextImages.length === 0) {
        const imageError = new Error("At least one product image is required");
        imageError.status = 400;
        throw imageError;
      }
      if (nextImages.length > 30) {
        const imageError = new Error("Maximum 30 images allowed");
        imageError.status = 400;
        throw imageError;
      }

      product.images = nextImages;


      const updatedProduct =
        await product.save();

      const previousBySku = new Map(previousVariants.map((variant) => [variant.sku, variant]));
      const inventoryChanges = fields.variants
        .filter((variant) => Number(previousBySku.get(variant.sku)?.stock ?? 0) !== variant.stock)
        .map((variant) => {
          const previousStock = Number(previousBySku.get(variant.sku)?.stock ?? 0);
          return {
            productId: product._id,
            sku: variant.sku,
            size: variant.size,
            previousStock,
            newStock: variant.stock,
            change: variant.stock - previousStock,
            reason: String(req.body.inventoryReason || "Product listing updated").slice(0, 200),
            changedBy: req.user._id,
          };
        });
      if (inventoryChanges.length) await InventoryLog.insertMany(inventoryChanges);

      const retainedIds = new Set(nextImages.map((image) => image.public_id));
      const removedImages = originalImages.filter(
        (image) => !retainedIds.has(image.public_id)
      );
      await Promise.allSettled(
        removedImages.map((image) => cloudinary.uploader.destroy(image.public_id))
      );


      return res.json(updatedProduct);


    } catch (error) {

      if (uploadedImages.length > 0) {
        await Promise.allSettled(
          uploadedImages.map((image) => cloudinary.uploader.destroy(image.public_id))
        );
      }

      console.log(error);

      return res.status(error.status || 500).json({
        message: error.message,
      });

    }
  }
);

router.delete("/:id", protect, admin, async (req, res) => {

  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }


    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {

      for (const img of product.images) {

        await cloudinary.uploader.destroy(
          img.public_id
        );

      }

    }


    await Product.findByIdAndDelete(req.params.id);


    res.json({
      success: true,
      message: "Product deleted"
    });


  } catch (error) {

    console.log("DELETE PRODUCT ERROR:", error);

    res.status(500).json({
      message: error.message
    });

  }

});
const postDeliveryStatuses = ["Delivered", "Return Requested", "Return Approved", "Return Picked Up", "Returned", "Refund Pending", "Refunded"];
const hasDeliveredPurchase = (userId, productId) => Order.exists({ userId, status: { $in: postDeliveryStatuses }, "products._id": productId });

router.get("/:id/review-eligibility", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("reviews.userId");
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.reviews.some((review) => review.userId === String(req.user._id))) return res.json({ eligible: false, reason: "You have already reviewed this product" });
    const verifiedPurchase = await hasDeliveredPurchase(req.user._id, product._id);
    return res.json({ eligible: Boolean(verifiedPurchase), reason: verifiedPurchase ? "" : "Reviews are available after your order is delivered" });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.post("/:id/review", protect, async (req, res) => {

  try {

    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {

      return res.status(404).json({
        message: "Product not found",
      });

    }

    const existingReview = product.reviews.find(
      (review) => review.userId === String(req.user._id)
    );
    if (existingReview) {
      return res.status(409).json({ message: "You have already reviewed this product" });
    }

    const verifiedPurchase = await hasDeliveredPurchase(req.user._id, product._id);
    if (!verifiedPurchase) return res.status(403).json({ message: "Only customers with a delivered order can review this product" });

    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim().slice(0, 1000);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
      return res.status(400).json({ message: "A rating from 1 to 5 and a comment are required" });
    }

    product.reviews.push({
      userId: String(req.user._id),
      name: req.user.name,
      rating,
      comment,
      verifiedPurchase: true,
      status: "pending",
    });

    refreshReviewSummary(product);

    await product.save();

    res.json({
      success: true,
      message: "Your verified review was submitted for approval",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

});
export default router;
