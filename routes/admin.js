const express = require("express");
const adminController = require("../controllers/admin");
const auth = require("../middleware/auth");
const { body } = require("express-validator")

const router = express.Router();

router.get("/add-product", auth, adminController.getAddProduct);

router.get("/products", auth, adminController.getProducts);

router.post(
    "/add-product", auth,
    [
        body("title", "Enter a valid title")
            .isLength({ min: 4 })
            .trim(),
        body("price", "Enter a valid price")
            .isNumeric(),
        body("description", "Enter a valid description")
            .isLength({ min: 5, max: 400 })
            .trim(),
    ],
    adminController.postAddProduct
);

router.get("/edit-product/:productId", auth, adminController.getEditProduct);

router.post(
    "/edit-product",
    auth,
    [
        body("title", "Enter a valid title")
            .isLength({ min: 4 })
            .trim(),
        body("price", "Enter a valid price")
            .isNumeric(),
        body("description", "Enter a valid description")
            .isLength({ min: 5, max: 400 })
            .trim(),
    ],
    adminController.postEditProduct);

router.post("/delete-product", auth, adminController.postDeleteProduct);

module.exports = router;
