const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
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
  gender: { type: String, enum: ["male", "female", "other"] },

  profile_picture: {
    type: String,
    default: null,
  },

  address: {
    type: String,
    default: null,
  },

  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "login",
    required: true,
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },

  created_at: {
    type: Date,
    default: Date.now,
  },

  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("StaffListData", StaffSchema);
