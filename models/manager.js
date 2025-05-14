const mongoose = require("mongoose");

const AuthData = mongoose.model(
  "Manager",
  new mongoose.Schema({
    name: String,
    username: String,
    phone: {
      type: String,
    },
    email: String,
    role: String,
    password: String,
    profile_photo: String,
    is_blocked: String,
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = AuthData;
