const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    docTitle: "Login",
    errorMessage: message
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
    errorMessage: message
  });
};

exports.postSignup = async (req, res, next) => {
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const user = await User.findOne({ email: email });
  if (user) {
    req.flash("error", "Email already exists!");
    return res.redirect("/signup");
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = new User({
    name: name,
    password: hashedPassword,
    email: email,
    cart: { items: [] }
  });
  await newUser.save();
  res.redirect("/login");
};

exports.postLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await User.findOne({ email: email });
  if (!user) {
    req.flash("error", "Invalid email or password!");
    return res.redirect("/login");
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    req.flash("error", "Invalid email or password!");
    return res.redirect("/login");
  }
  req.session.isLoggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      console.log("err", err);
    }
    res.redirect("/");
  });
};
