const Product = require("../models/product");
const Cart = require("../models/cart");

exports.getProducts = (req, res, next) => {
  Product.fetchAll(products => {
    res.render("shop/product-list", {
      prods: products,
      docTitle: "All Products",
      path: "/products"
    });
  });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId, product => {
    res.render("shop/product-detail", {
      docTitle: product.title,
      product: product,
      path: "/products"
    });
  });
};

exports.getIndex = (req, res, next) => {
  Product.fetchAll(products => {
    res.render("shop/index", {
      prods: products,
      docTitle: "Shop",
      path: "/"
    });
  });
};

exports.getCart = (req, res, next) => {
  Cart.getCart(cart => {
    Product.fetchAll(products => {
      const cartProducts = [];
      for (let product of products) {
        const cartProductData = cart.products.find(p => p.id === product.id);
        if (cartProductData) {
          cartProducts.push({ productData: product, qty: cartProductData.qty });
        }
      }
      res.render("shop/cart", {
        path: "/cart",
        docTitle: "Your cart",
        products: cartProducts
      });
    });
  });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId, product => {
    Cart.addProduct(prodId, product.price);
  });
  res.redirect("/cart");
};

exports.postDeleteCart = (req, res, next) => {
  const prodId = req.body.productId;
  console.log(prodId);
  Product.findById(prodId, product => {
    Cart.deleteProduct(prodId, product.price);
    res.redirect("/cart");
  });
};

exports.getOrders = (req, res, next) => {
  res.render("shop/orders", { path: "/orders", docTitle: "Your Orders" });
};

exports.getCheckout = (req, res, next) => {
  res.render("shop/cart", { path: "/checkout", docTitle: "Check out" });
};
