const mongoose = require("mongoose");

const foodStockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 0, required: true },
  unit: { type: String, default: "pcs", required: true },
  expiryDate: { type: Date, required: true },
  image: { type: String, required: true },
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
});

module.exports = mongoose.model("foodStock", foodStockSchema);
