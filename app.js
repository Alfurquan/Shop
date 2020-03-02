const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const User = require("./models/user");

const MONGODBURI = "mongodb://localhost/shop";

const store = new mongoDBStore({
  uri: MONGODBURI,
  collections: "sessions"
});

const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUninitializedValue: false,
    store: store
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      console.log("err", err);
    });
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

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
  })
  .catch(err => {
    console.log("could not connect to mongoDB", err);
  });

app.listen(8000, () => {
  console.log(`Listening at 8000....`);
});
