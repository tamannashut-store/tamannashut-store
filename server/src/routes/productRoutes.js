import express from "express";
import Product from "../models/Product.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", async (req, res) => {

  try {

    const products = await Product.find();

    res.json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
});

router.post(
  "/",
  upload.single("image"),

  async (req, res) => {

    try {

      const product = new Product({

        name: req.body.name,

        price: req.body.price,

        description: req.body.description,
        category: req.body.category,
        sizeStock: JSON.parse(
          req.body.sizeStock || "[]"
        ),

        image: req.file
          ? `import.meta.env.VITE_API_URL/uploads/${req.file.filename}`
          : "",

      });

      await product.save();

      res.status(201).json(product);

    } catch (error) {

      console.log(error);

      res.status(500).json({
        message: error.message,
      });

    }
  }
);

router.get("/:id", async (req, res) => {

  try {

    const product = await Product.findById(req.params.id);

    res.json(product);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

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

      if (req.file) {

        product.image =
          `import.meta.env.VITE_API_URL/uploads/${req.file.filename}`;
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
export default router;