const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  food_item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const AuthData = mongoose.model(
  "login",
  new mongoose.Schema({
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["owner", "manager", "staff"],
      required: true,
    },
    username: { type: String },
    image: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    cart: [CartItemSchema],
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = AuthData;
