const express = require("express");
const shopController = require("../controllers/shop");
const auth = require("../middleware/auth");
const router = express.Router();
const csrf = require("csurf");

router.get("/", csrf(), shopController.getIndex);

router.get("/products", csrf(), shopController.getProducts);

router.get("/products/:id", csrf(), shopController.getProduct);

router.get("/cart", auth, csrf(), shopController.getCart);

router.post("/cart-delete-item", auth, csrf(), shopController.postDeleteCart);

router.post("/cart", auth, csrf(), shopController.postCart);

router.post("/create-order", auth, csrf(), shopController.postOrder);

router.get("/orders", auth, csrf(), shopController.getOrders);

router.get("/orders/:orderId", auth, csrf(), shopController.getInvoice);

// router.get("/checkout", shopController.getCheckout);

module.exports = router;
