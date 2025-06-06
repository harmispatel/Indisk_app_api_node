const mongoose = require("mongoose");

const CartItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodItem",
    required: true,
  },
  quantity: { type: Number, default: 1 },
});

const CartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
    unique: true,
  },
  items: [CartItemSchema],
});

module.exports = mongoose.model("Cart", CartSchema);
