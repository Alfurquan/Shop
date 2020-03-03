const Product = require("../models/product");
const { validationResult } = require("express-validator")

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    docTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price.trim();
  const description = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array()[0])
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: { title: title, imageUrl: imageUrl, price: price, description: description },
      errorMessage: errors.array()[0].msg
    });
  }
  const product = new Product({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    user: req.user._id
  });
  product
    .save()
    .then(result => {
      res.redirect("/admin/products");
    })
    .catch(err => {
      console.log("err", err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render("admin/edit-product", {
        docTitle: "Edit Product",
        path: "/admin/edit-product",
        product: product,
        editing: editMode,
        hasError: false,
        errorMessage: null
      });
    })
    .catch(err => {
      console.log("err", err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImageUrl = req.body.imageUrl;
  const updatedPrice = req.body.price.trim();
  const updatedDescription = req.body.description;
  Product.findById(prodId)
    .then(product => {
      if (product.user.toString() !== req.user._id.toString()) {
        return res.redirect("/")
      }
      product.title = updatedTitle;
      product.imageUrl = updatedImageUrl;
      product.price = updatedPrice;
      product.description = updatedDescription;
      return product.save().then(result => {
        // console.log("Product updated!");
        res.redirect("/admin/products");
      })
    })
    .catch(err => {
      console.log("err", err);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.deleteOne({ _id: prodId, user: req.user._id })
    .then(result => {
      res.redirect("/admin/products");
    })
    .catch(err => {
      console.log("err", err);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ user: req.user._id })
    .then(products => {
      res.render("admin/products", {
        prods: products,
        docTitle: "Admin Products",
        path: "/admin/products"
      });
    })
    .catch(err => {
      console.log("err", err);
    });
};
