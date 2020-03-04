const Product = require("../models/product");
const { validationResult } = require("express-validator")
const fileHelper = require("../util/file")

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    docTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: { title: title, price: price, description: description },
      errorMessage: "Attached file is not an image",
      validationErrors: []
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array()[0])
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: { title: title, imageUrl: imageUrl, price: price, description: description },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path;

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
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
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
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImageUrl = req.body.imageUrl;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;
  const image = req.file;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array()[0])
    return res.status(422).render("admin/edit-product", {
      docTitle: "Edit Product",
      path: "/admin/add-product",
      editing: true,
      hasError: true,
      product: { title: updatedTitle, price: updatedPrice, description: updatedDescription, id: prodId },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }


  Product.findById(prodId)
    .then(product => {
      if (product.user.toString() !== req.user._id.toString()) {
        return res.redirect("/")
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      if (image) {
        fileHelper.deleteFile(product.imageUrl)
        product.imageUrl = image.path
      }
      return product.save().then(result => {
        // console.log("Product updated!");
        res.redirect("/admin/products");
      })
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then(product => {
    if (!product) {
      return next(new Error("Product not found!"))
    }
    fileHelper.deleteFile(product.imageUrl)
    return Product.deleteOne({ _id: prodId, user: req.user._id })
  })
    .then(result => {
      res.redirect("/admin/products");
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
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
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)
    });
};
