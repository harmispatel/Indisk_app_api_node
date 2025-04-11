const mongoose = require("mongoose");

const StaffListData = mongoose.model(
  "staffLists",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
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

    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    is_blocked: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = StaffListData;
