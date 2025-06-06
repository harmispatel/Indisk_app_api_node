const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    table_no: {
      type: Number,
      required: true,
      unique: true,
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "login",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
