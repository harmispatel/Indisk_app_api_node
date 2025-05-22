const mongoose = require("mongoose");

const managerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "restaurant",
    required: true,
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },
  assigned_at: {
    type: Date,
    default: Date.now,
  },
});

const Manager = mongoose.model("manager", managerSchema);
module.exports = Manager;
