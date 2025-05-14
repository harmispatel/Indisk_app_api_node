const mongoose = require("mongoose");

const AuthData = mongoose.model(
  "login",
  new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["Owner", "Manager", "Staff"],
      required: true,
    },
    phone: Number,
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = AuthData;
