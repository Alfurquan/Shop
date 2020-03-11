const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const config = require("config");
const mongoose = require("mongoose");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");
const session = require("express-session");
const multer = require("multer");
const mongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const User = require("./models/user");
// const upload = require("./util/multer");

// const MONGODBURI = "mongodb://localhost/shop";
const MONGODBURI = "mongodb://alfur:alfur123@ds241278.mlab.com:41278/shop";

if (!config.get("emailApiKey")) {
  console.log("FATAL ERROR: Email API Key is not defined");
  process.exit(1);
}

const store = new mongoDBStore({
  uri: MONGODBURI,
  collections: "sessions"
});

app.set("view engine", "ejs");
app.set("views", "views");

// app.use(
//   upload.fields([
//     {
//       name: "image",
//       maxCount: 1
//     },
//     {
//       name: "images",
//       maxCount: 3
//     }
//   ])
// );

// app.use(upload.single("categoryImage"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUninitializedValue: false,
    store: store
  })
);

// app.use(csrf());
app.use(flash());

app.use((req, res, next) => {
  // console.log("isloggedIn", req.session.isLoggedIn)
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.user = req.session.user;
  // res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      throw new Error(err);
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", csrf(), errorController.get500);
app.use("/403", csrf(), errorController.get403);
app.use(csrf(), errorController.get404);

app.use((error, req, res, next) => {
  console.log("500err", error);
  if (error instanceof multer.MulterError) {
    res.status(400).send("Please select upto 3 images");
  }
  res.redirect("/500");
});

mongoose
  .connect(MONGODBURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  // mongoose
  //   .connect("mongodb://alfur:alfur123@ds241278.mlab.com:41278/shop", {
  //     useNewUrlParser: true,
  //     useUnifiedTopology: true
  //   })
  .then(() => {
    console.log("Connected to mongoDB");
    // require("./util/seed")
  })
  .catch(err => {
    console.log("could not connect to mongoDB", err);
  });

app.listen(8000, () => {
  console.log(`Listening at 8000....`);
});
