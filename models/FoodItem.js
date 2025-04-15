const mongoose = require("mongoose");

const FoodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  offerPrice: {
    type: Number,
    default: 0,
  },
  food_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodCategory",
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  stock: {
    type: Number,
    default: 0,
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
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  description: { type: String, default: null },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  is_veg: {
    type: Boolean,
    default: false,
  },
  is_spicy: {
    type: Boolean,
    default: false,
  },
  preparation_time: {
    type: String,
  },
  ingredients: {
    type: [String],
  },
  allergens: {
    type: [String],
  },
  tags: {
    type: [String],
  },
  rating: {
    type: Number,
    default: 0,
  },
  total_ratings: {
    type: Number,
    default: 0,
  },
  is_customizable: {
    type: Boolean,
    default: false,
  },
  addons: [
    {
      name: String,
      price: Number,
    },
  ],
});

module.exports = mongoose.model("FoodItem", FoodItemSchema);
