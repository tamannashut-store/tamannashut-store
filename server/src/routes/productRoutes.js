import express from "express";
import Product from "../models/Product.js";
import upload from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { admin, protect } from "../middleware/authMiddleware.js";
import InventoryLog from "../models/InventoryLog.js";

const router = express.Router();
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
  const syncedSizeStock = normalizedVariants.map((variant) => ({ size: variant.size, stock: variant.stock }));

  return {
    name, price, mrp, baseSku, description, category, color, fabric, ageGroup,
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

router.post("/", protect, admin, upload.array("images", 10), async (req, res) => {
  try {
    const fields = parseProductFields(req.body);
    let images = [];

    if (req.files && req.files.length > 0) {

      try {

        const uploadPromises = req.files.map(
          (file) => uploadToCloudinary(file.buffer)
        );

        const results = await Promise.all(uploadPromises);

        images = results.map((result) => ({
          url: result.secure_url,
          public_id: result.public_id,
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

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const search = String(req.query.search || "").trim().slice(0, 100);
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
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
      filter.sizeStock = { $elemMatch: { size, stock: { $gt: 0 } } };
    } else if (req.query.inStock === "true") {
      filter.sizeStock = { $elemMatch: { stock: { $gt: 0 } } };
    }

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

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total,
      pageSize: limit,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
    const products = await Product.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
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

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

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
  upload.array("images", 10),
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
          return original;
        });
      }

      if (req.files?.length) {
        const results = await Promise.all(
          req.files.map((file) => uploadToCloudinary(file.buffer))
        );
        uploadedImages = results.map((result) => ({
          url: result.secure_url,
          public_id: result.public_id,
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
      if (nextImages.length > 10) {
        const imageError = new Error("Maximum 10 images allowed");
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
    });

    product.averageRating =
      product.reviews.reduce(
        (acc, review) =>
          acc + review.rating,
        0
      ) /
      product.reviews.length;

    await product.save();

    res.json({
      success: true,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

});
export default router;
