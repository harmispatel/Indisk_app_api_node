const mongoose = require("mongoose");

const AuthData = mongoose.model(
  "Manager",
  new mongoose.Schema({
    name: String,
    username: String,
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid 10-digit phone number!`,
      },
      required: [true, "Phone number is required"],
    },
    email: String,
    password: String,
    profile_photo: String,
    is_blocked: String,
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = AuthData;
