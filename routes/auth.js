const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { check } = require("express-validator");
const User = require("../models/user");
const csrf = require("csurf");

router.get("/login", csrf(), authController.getLogin);

router.get("/signup", csrf(), authController.getSignup);

router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    check("password", "Password has to be valid")
      .isLength({ min: 5 })
      .trim()
  ],
  csrf(),
  authController.postLogin
);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(user => {
          if (user) {
            return Promise.reject(
              "Email exists already, please pick a different one!"
            );
          }
        });
      })
      .normalizeEmail(),
    check("name")
      .isLength({ min: 2 })
      .withMessage("Name must be atleast 2 characters")
      .trim(),
    check(
      "password",
      "Please enter a password with only numbers and text and atleast 5 characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    check("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords have to match!");
      }
      return true;
    })
  ],
  csrf(),
  authController.postSignup
);

router.post("/logout", csrf(), authController.postLogout);

router.get("/reset", csrf(), authController.getReset);

router.post("/reset", csrf(), authController.postReset);

router.get("/reset/:token", csrf(), authController.getNewPassword);

router.post("/newpassword", csrf(), authController.postNewPassword);

module.exports = router;
