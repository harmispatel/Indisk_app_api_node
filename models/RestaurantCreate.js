const mongoose = require("mongoose");
const moment = require("moment");

const restaurantSchema = new mongoose.Schema({
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  opening_hours: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    required: true,
  },
  description: {
    type: String,
  },
  location: {
    type: String,
  },
  cuisine_type: {
    type: String,
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

restaurantSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

const Restaurant = mongoose.model("restaurant", restaurantSchema);

module.exports = Restaurant;
