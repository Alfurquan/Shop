const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true
        },
        subTotal: {
          type: Number,
          required: true
        },
        size: {
          type: String,
        }
      }
    ],
    totalAmount: {
      type: Number,
      default: 0,
      required: true
    }
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"]
  },
});

userSchema.methods.addToCart = function (product, size) {
  let cartProductIndex;
  if (size) {
    cartProductIndex = this.cart.items.findIndex(cp => {
      return (cp.productId.toString() === product._id.toString() && cp.size === size);
    });
  } else {
    cartProductIndex = this.cart.items.findIndex(cp => {
      return cp.productId.toString() === product._id.toString();
    });
  }

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];


  //Product found in cart just increment its quantity
  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
    updatedCartItems[cartProductIndex].subTotal += product.price
  }
  //Product not found in cart
  else {
    if (size) {
      updatedCartItems.push({
        productId: product._id,
        quantity: newQuantity,
        subTotal: product.price,
        size: size
      });
    } else {
      updatedCartItems.push({
        productId: product._id,
        quantity: newQuantity,
        subTotal: product.price,
      });
    }
  }

  let totalAmount = this.cart.totalAmount;
  totalAmount += product.price

  const updatedCart = {
    items: updatedCartItems,
    totalAmount: totalAmount
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeItemFromCart = function (product, size) {
  let cartProductIndex;
  if (size) {
    cartProductIndex = this.cart.items.findIndex(cp => {
      return (cp.productId.toString() === product._id.toString() && cp.size === size);
    });
  } else {
    cartProductIndex = this.cart.items.findIndex(cp => {
      return cp.productId.toString() === product._id.toString();
    });
  }

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];


  //Product found in cart just increment its quantity
  if (cartProductIndex >= 0) {
    if (this.cart.items[cartProductIndex].quantity === 1) {
      return this.removeFromCart(this.cart.items[cartProductIndex])
    }
    newQuantity = this.cart.items[cartProductIndex].quantity - 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
    updatedCartItems[cartProductIndex].subTotal -= product.price

  }
  //Product not found in cart
  else {
    return
  }

  let totalAmount = this.cart.totalAmount;
  totalAmount -= product.price

  const updatedCart = {
    items: updatedCartItems,
    totalAmount: totalAmount
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (cartItem) {
  let updatedCartItems;

  updatedCartItems = this.cart.items.filter(
    cp => cp._id.toString() !== cartItem._id.toString()
  );

  console.log("up", updatedCartItems)
  this.cart.items = updatedCartItems;
  this.cart.totalAmount -= cartItem.subTotal
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
