const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserAuth",
    required: true,
  },
  table_no: {
    type: Number,
    required: true,
  },
  items: [
    {
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
    },
  ],
  payment_type: {
    type: String,
    enum: ["cash", "viva"],
    required: true,
  },
  payment_status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  status: {
    type: String,
    enum: ["Pending", "Preparing", "Completed", "Cancelled"],
    default: "Pending",
  },
  order_date: {
    type: Date,
    default: Date.now,
  },
  // total_amount: { type: Number, required: true },
  viva_order_code: {
    type: String,
  },
});

module.exports = mongoose.model("Order", OrderSchema);
