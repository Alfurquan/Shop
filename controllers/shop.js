const Product = require("../models/product");
const Category = require("../models/category");
const Order = require("../models/order");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const PDFDocument = require("pdfkit");

const ITEMS_PER_PAGE = 6;

exports.getProducts = async (req, res, next) => {
  const categories = await Category.find().select("title");
  const page = +req.query.page || 1;
  const sortOrder = req.query.sortBy;
  let totalItems;
  let products;
  let selectedCategory;
  // console.log("query", req.originalUrl);
  // console.log("qq", _.isEmpty(req.query));
  // console.log("sortOrder", sortOrder);
  // console.log("ispage", !req.query.page)
  let category = req.query.category || "";
  // console.log("selectedCategory", category)
  // console.log("selectedPage", page)
  // console.log("nextPage", page + 1)
  // console.log("prevPage", page - 1)
  // console.log(category);
  // If category is selected filter by selected category
  if (category) {
    selectedCategory = categories.find(c => c.title === category)._id;
    // console.log(selectedCategory);
  }

  try {
    if (selectedCategory && sortOrder) {
      totalItems = await Product.find({
        category: selectedCategory
      }).countDocuments();

      products = await Product.find({ category: selectedCategory })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .sort({ [sortOrder]: 1 });
    } else if (selectedCategory) {
      totalItems = await Product.find({
        category: selectedCategory
      }).countDocuments();

      products = await Product.find({ category: selectedCategory })
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .select("-otherImages");
    } else if (sortOrder) {
      totalItems = await Product.find().countDocuments();
      products = await Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .sort({ [sortOrder]: 1 });
    } else {
      totalItems = await Product.find().countDocuments();
      products = await Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .select("-otherImages");
    }

    // console.log("cond", (category !== '' || sortOrder !== undefined))
    res.render("shop/product-list", {
      prods: products,
      docTitle: "All Products",
      path: "/products",
      currentPage: page,
      categories: categories,
      url: req.originalUrl,
      csrfToken: req.csrfToken(),
      queryAdded: _.isEmpty(req.query),
      selectedSortOrder: sortOrder,
      isPageSelected: !req.query.page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      selectedCategory: category,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
  } catch (err) {
    console.log("err", err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.id;
  Product.findById(prodId)
    .then(product => {
      res.render("shop/product-detail", {
        product: product,
        docTitle: product.title,
        csrfToken: req.csrfToken(),
        path: "/products"
      });
    })
    .catch(err => {
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numOfProds => {
      totalItems = numOfProds;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render("shop/index", {
        prods: products,
        docTitle: "All Products",
        path: "/",
        currentPage: page,
        csrfToken: req.csrfToken(),
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      console.log("err", err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        docTitle: "Your cart",
        csrfToken: req.csrfToken(),
        products: products
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      res.redirect("/cart");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteCart = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect("/cart");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(item => {
        return {
          quantity: item.quantity,
          product: { ...item.productId._doc }
        };
      });
      const order = new Order({
        user: {
          name: req.user.name,
          userId: req.user._id
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch(err => {
      console.log("err", err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then(orders => {
      res.render("shop/orders", {
        path: "/orders",
        docTitle: "Your Orders",
        csrfToken: req.csrfToken(),
        orders: orders
      });
    })
    .catch(err => {
      console.log("err", err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error("Order not found!"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true
      });
      pdfDoc.text("------------------------------");
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.product.price * prod.quantity;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " X " +
              " RS " +
              prod.product.price
          );
      });
      pdfDoc.text("------------------------------");
      pdfDoc.fontSize(20).text("Total Amount : " + " RS " + totalPrice);
      pdfDoc.end();
    })
    .catch(err => {
      next(err);
    });
};

exports.getCheckout = (req, res, next) => {
  res.render("shop/cart", { path: "/checkout", docTitle: "Check out" });
};
