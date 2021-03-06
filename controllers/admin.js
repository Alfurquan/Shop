const Product = require("../models/product");
const Category = require("../models/category");
const { validationResult } = require("express-validator");
const _ = require("lodash");
const fileHelper = require("../util/file");

exports.getAddProduct = async (req, res, next) => {
  const categories = await Category.find().select("title");
  // console.log("cate", categories);
  // console.log("token", req.csrfToken());

  res.render("admin/edit-product", {
    docTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    csrfToken: req.csrfToken(),
    categories: categories,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = async (req, res, next) => {
  const categories = await Category.find().select("title");
  const title = req.body.title;
  console.log("files", req.files.image);
  const price = req.body.price;
  const description = req.body.description;
  const category = req.body.category;
  // console.log("res", req.body);
  // console.log("file", req.files.image[0].path);

  if (!req.files.image) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      categories: categories,
      csrfToken: req.csrfToken(),
      product: {
        title: title,
        price: price,
        category: category,
        description: description
      },
      errorMessage: "Attached main image file is not an image",
      validationErrors: []
    });
  }
  if (!category) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      categories: categories,
      csrfToken: req.csrfToken(),
      product: { title: title, price: price, description: description },
      errorMessage: "Please select a category",
      validationErrors: []
    });
  }

  if (!req.files.images) {
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      categories: categories,
      csrfToken: req.csrfToken(),
      product: {
        title: title,
        price: price,
        description: description,
        category: category
      },
      errorMessage: "Please select atleast one file for other images",
      validationErrors: []
    });
  }
  const errors = validationResult(req);
  console.log("error", errors);
  if (!errors.isEmpty()) {
    console.log(errors.array()[0]);
    return res.status(422).render("admin/edit-product", {
      docTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      categories: categories,
      csrfToken: req.csrfToken(),
      product: {
        title: title,
        price: price,
        category: category,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  const image = req.files.image[0];
  const images = req.files.images;

  const mainImageUrl = image.path;

  const product = new Product({
    title: title,
    mainImageUrl: mainImageUrl,
    price: price,
    category: category,
    description: description,
    user: req.user._id
  });
  _.forEach(images, image => {
    product.otherImages.push(image.path);
  });

  product
    .save()
    .then(result => {
      res.redirect("/admin/products");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = async (req, res, next) => {
  const categories = await Category.find().select("title");
  console.log("cat", categories);
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      console.log("prod", product);
      res.render("admin/edit-product", {
        docTitle: "Edit Product",
        path: "/admin/edit-product",
        product: product,
        editing: editMode,
        csrfToken: req.csrfToken(),
        categories: categories,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;
  const updatedCategory = req.body.category;
  // const image = req.files.image[0];
  // const images = req.files.images;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array()[0]);
    return res.status(422).render("admin/edit-product", {
      docTitle: "Edit Product",
      path: "/admin/add-product",
      editing: true,
      hasError: true,
      csrfToken: req.csrfToken(),
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
        id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      if (product.user.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      if (updatedCategory) {
        product.category = updatedCategory;
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDescription;
      if (req.files.image) {
        const image = req.files.image[0];
        fileHelper.deleteFile(product.mainImageUrl);
        product.mainImageUrl = image.path;
      }
      if (req.files.images) {
        const images = req.files.images;
        _.each(product.otherImages, img => {
          fileHelper.deleteFile(img);
        });
        product.otherImages = [];
        _.each(images, img => {
          product.otherImages.push(img.path);
        });
      }
      return product.save().then(result => {
        // console.log("Product updated!");
        res.redirect("/admin/products");
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return next(new Error("Product not found!"));
      }
      fileHelper.deleteFile(product.mainImageUrl);
      _.each(product.otherImages, img => {
        fileHelper.deleteFile(img);
      });
      return Product.deleteOne({ _id: prodId, user: req.user._id });
    })
    .then(result => {
      res.redirect("/admin/products");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ user: req.user._id })
    .then(products => {
      res.render("admin/products", {
        prods: products,
        docTitle: "Admin Products",
        path: "/admin/products",
        csrfToken: req.csrfToken()
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getAddCategory = (req, res, next) => {
  res.render("admin/add-category", {
    docTitle: "Add Categry",
    path: "/admin/add-category",
    editing: false,
    csrfToken: req.csrfToken(),
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddCategory = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  console.log("file", req.file);
  if (!image) {
    return res.status(422).render("admin/add-category", {
      docTitle: "Add Category",
      path: "/admin/add-category",
      editing: false,
      hasError: true,
      csrfToken: req.csrfToken(),
      category: {
        title: title
      },
      errorMessage: "Attached file is not an image",
      validationErrors: []
    });
  }
  const errors = validationResult(req);
  console.log("error", errors);
  if (!errors.isEmpty()) {
    console.log(errors.array()[0]);
    return res.status(422).render("admin/add-category", {
      docTitle: "Add Category",
      path: "/admin/add-category",
      editing: false,
      hasError: true,
      csrfToken: req.csrfToken(),
      category: {
        title: title
      },
      errorMessage: undefined,
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path;

  const category = new Category({
    title: title,
    imageUrl: imageUrl
  });
  category
    .save()
    .then(result => {
      res.redirect("/");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
