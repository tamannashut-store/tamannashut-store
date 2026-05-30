const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Routes working" });
});

module.exports = router;