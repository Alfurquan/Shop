const express = require("express");
const adminController = require("../controllers/admin");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../util/multer");
const { body } = require("express-validator");
const csrf = require("csurf");

const router = express.Router();

router.get(
  "/add-product",
  auth,
  isAdmin,
  csrf(),
  adminController.getAddProduct
);

router.get("/products", auth, isAdmin, csrf(), adminController.getProducts);

router.post(
  "/add-product",
  auth,
  isAdmin,
  upload.fields([
    {
      name: "image",
      maxCount: 1
    },
    {
      name: "images",
      maxCount: 3
    }
  ]),
  csrf(),
  [
    body("title", "Enter a valid title")
      .isLength({ min: 4 })
      .trim(),
    body("price", "Enter a valid price").isNumeric(),
    body("description", "Enter a valid description")
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  adminController.postAddProduct
);

router.get(
  "/edit-product/:productId",
  auth,
  isAdmin,
  csrf(),
  adminController.getEditProduct
);

router.post(
  "/edit-product",
  auth,
  isAdmin,
  upload.fields([
    {
      name: "image",
      maxCount: 1
    },
    {
      name: "images",
      maxCount: 3
    }
  ]),
  csrf(),
  [
    body("title", "Enter a valid title")
      .isLength({ min: 4 })
      .trim(),
    body("price", "Enter a valid price").isNumeric(),
    body("description", "Enter a valid description")
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  adminController.postEditProduct
);

router.post(
  "/delete-product",
  auth,
  isAdmin,
  csrf(),
  adminController.postDeleteProduct
);

router.get(
  "/add-category",
  auth,
  isAdmin,
  csrf(),
  adminController.getAddCategory
);

router.post(
  "/add-category",
  auth,
  isAdmin,
  upload.single("categoryImage"),
  csrf(),
  [
    body("title", "Enter a valid title")
      .isLength({ min: 4 })
      .trim()
  ],
  adminController.postAddCategory
);

module.exports = router;
