const mongoose = require("mongoose");

const AuthData = mongoose.model(
  "login",
  new mongoose.Schema({
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["owner", "manager", "staff"],
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = AuthData;
