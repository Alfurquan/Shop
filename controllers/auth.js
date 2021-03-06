const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const config = require("config");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: config.get("emailApiKey")
    }
  })
);

exports.getLogin = (req, res, next) => {
  console.log("token", req.csrfToken());
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    docTitle: "Login",
    errorMessage: message,
    csrfToken: req.csrfToken(),
    oldInput: { email: "", password: "" },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    docTitle: "Sign up",
    csrfToken: req.csrfToken(),
    errorMessage: message,
    oldInput: { email: "", name: "", password: "", confirmPassword: "" },
    validationErrors: []
  });
};

exports.postSignup = async (req, res, next) => {
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array()[0]);
    return res.status(422).render("auth/signup", {
      path: "/signup",
      docTitle: "Sign up",
      csrfToken: req.csrfToken(),
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        name: name,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = new User({
    name: name,
    password: hashedPassword,
    email: email,
    cart: { items: [] }
  });
  try {
    await newUser.save();
    res.redirect("/login");
    await transporter.sendMail({
      to: email,
      from: "shop@node.com",
      subject: "Sign up success!",
      html: "<h1>You successfully signed up!</h1>"
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("body", req.body);
  const errors = validationResult(req);
  console.log("errs", errors.array());
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      docTitle: "Login",
      csrfToken: req.csrfToken(),
      errorMessage: errors.array()[0].msg,
      oldInput: { email: email, password: password },
      validationErrors: errors.array()
    });
  }
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log("email");
      req.flash("error", "Invalid email or password!");
      return res.redirect("/login");
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("password");
      req.flash("error", "Invalid email or password!");
      return res.redirect("/login");
    }
    req.session.isLoggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      console.log("err", err);
    }
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    csrfToken: req.csrfToken(),
    docTitle: "Reset password",
    errorMessage: message
  });
};

exports.postReset = async (req, res, next) => {
  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      console.log("err", err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash("error", "No account for that email found!");
      return res.redirect("/reset");
    }
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000;
    await user.save();
    res.redirect("/");
    await transporter.sendMail({
      to: req.body.email,
      from: "shop@node.com",
      subject: "Password Reset",
      html: `
          <p>You requested a password reset</p>
          <p>Click this <a href="http://localhost:8000/reset/${token}">link</a> to reset the password</p>
      `
    });
  });
};

exports.getNewPassword = async (req, res, next) => {
  const token = req.params.token;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  });
  if (!user) {
    return res.redirect("/reset");
  }

  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/new-password", {
    path: "/new-password",
    docTitle: "New Password",
    errorMessage: message,
    passwordToken: token,
    csrfToken: req.csrfToken(),
    userId: user._id.toString()
  });
};

exports.postNewPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const token = req.body.passwordToken;
  console.log("new", newPassword);
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  });
  console.log("user", user);
  if (!newPassword) {
    req.flash("error", "Password cannot be empty!");
    res.redirect(req.get("referer"));
  }
  const password = await bcrypt.hash(newPassword, 12);
  user.password = password;
  user.resetToken = null;
  user.resetTokenExpiration = undefined;
  await user.save();
  res.redirect("/login");
};
