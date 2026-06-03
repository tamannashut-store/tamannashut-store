import express from "express";
import Product from "../models/Product.js";
import upload from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const router = express.Router();
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

router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = "";

    if (req.file && req.file.buffer)  {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      } catch (err) {
        console.log("Cloudinary upload failed:", err.message);
        return res.status(500).json({
          message: "Image upload failed",
        });
      }
    }

    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      sizeStock: JSON.parse(req.body.sizeStock || "[]"),
      image: imageUrl,
    });

    await product.save();

    res.status(201).json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const products = await Product.find()
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    res.set("Cache-Control", "public, max-age=60");

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put(
  "/:id",
  upload.single("image"),
  async (req, res) => {

    try {

      const product = await Product.findById(
        req.params.id
      );

      if (!product) {

        return res.status(404).json({
          message: "Product not found",
        });
      }

      product.name = req.body.name;
      product.price = req.body.price;
      product.description = req.body.description;
      product.category = req.body.category;
      product.sizeStock = JSON.parse(
        req.body.sizeStock || "[]"
      );

      // IMAGE UPDATE

      if (req.file && req.file.buffer) {
        const result = await uploadToCloudinary(req.file.buffer);
        product.image = result.secure_url;
      }

      const updatedProduct =
        await product.save();

      res.json(updatedProduct);

    } catch (error) {

      console.log(error);

      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.delete("/:id", async (req, res) => {

  try {

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "Product deleted",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
});
router.post("/:id/review", async (req, res) => {

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

    product.reviews.push(
      req.body
    );

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