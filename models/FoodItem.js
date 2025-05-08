const mongoose = require("mongoose");

const FoodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String },
  available_qty: { type: Number, default: 0 },
  content_per_single_item: { type: String },
  cooking_time: { type: String },
  preparations: { type: [String], default: [] },
  min_stock_required: { type: Number, default: 0 },
  priority: { type: Number, default: 0 },
  preparations_time: { type: String },
  time_unit: { type: String },
  description: { type: String },
  image_url: {
    type: [String],
    required: true,
  },
  shifting_constant: { type: Number, default: 0 },

  food_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodCategory",
    required: true,
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "restaurant",
    required: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },

  base_price: { type: Number, required: true },
  prices_by_quantity: [
    {
      quantity: { type: String },
      price: { type: String },
      discount_price: { type: String },
    },
  ],

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("FoodItem", FoodItemSchema);
