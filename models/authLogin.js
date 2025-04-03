const mongoose = require("mongoose");

const AuthData = mongoose.model(
  "login",
  new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = AuthData;
