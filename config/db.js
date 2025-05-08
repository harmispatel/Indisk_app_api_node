const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://harmistest:BKrrMrJBMO58Guo6@indiskappapi.m9csmkx.mongodb.net/?retryWrites=true&w=majority&appName=indiskAppAPI",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};

module.exports = connectDB;
