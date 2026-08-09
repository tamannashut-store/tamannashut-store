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

router.post("/", upload.array("images", 10), async (req, res) => {
  try {
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

    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      sizeStock: JSON.parse(req.body.sizeStock || "[]"),
      images,
    });

    await product.save();

    return res.status(201).json(product);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const products = await Product.find().skip(skip).limit(limit).lean();
    const total = await Product.countDocuments();

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
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


      product.name = req.body.name;
      product.price = req.body.price;
      product.description = req.body.description;
      product.category = req.body.category;

      product.sizeStock = JSON.parse(
        req.body.sizeStock || "[]"
      );


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

router.delete("/:id", async (req, res) => {

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
