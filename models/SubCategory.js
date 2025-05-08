const mongoose = require("mongoose");
const moment = require("moment");

const SubCategorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FoodCategory",
    required: true,
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "restaurant",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  image: {
    type: String,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  created_at: {
    type: String,
    default: function () {
      return moment().format("DD-MM-YYYY hh:mm A");
    },
  },
  updated_at: {
    type: Date,
    default: function () {
      return moment().format("DD-MM-YYYY hh:mm A");
    },
  },
});

SubCategorySchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const SubCategory = mongoose.model("SubCategory", SubCategorySchema);

module.exports = SubCategory;
