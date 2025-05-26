const mongoose = require("mongoose");

const FoodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    base_price: { type: Number, required: true },
    prices_by_quantity: [
      {
        quantity: { type: String },
        price: { type: Number },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodCategory",
      required: true,
    },
    is_available: { type: String, default: true },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "login",
      required: true,
    },
    unit: { type: String },
    total_qty: { type: Number, default: 1 },
    available_qty: { type: Number, default: 1 },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodItem", FoodItemSchema);
