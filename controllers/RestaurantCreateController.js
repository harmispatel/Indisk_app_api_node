const Restaurant = require("../models/RestaurantCreate");
const UserAuth = require("../models/authLogin");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const config = require("../config/nodemailer");
const nodemailer = require("nodemailer");

const getRestaurant = async (req, res) => {
  try {
    const { owner_id } = req.body;

    const restaurants = await Restaurant.find({ owner_id: owner_id });

    res.status(200).json({
      message: "Restaurants fetched successfully",
      success: true,
      data: restaurants,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve restaurants",
      success: false,
      error: err.message,
    });
  }
};

const createRestaurant = async (req, res) => {
  try {
    const {
      owner_id,
      email,
      password,
      phone,
      name,
      address,
      status,
      description,
      location,
      cuisine_type,
    } = req.body;

    if (
      !owner_id ||
      !name ||
      !email ||
      !phone ||
      !req.file ||
      !address ||
      status === undefined
    ) {
      return res.status(400).json({
        message:
          "Missing required fields:owner_id, name, email, phone, image, address or status",
        success: false,
      });
    }

    const ownerExists = await UserAuth.findOne({ _id: owner_id });
    if (!ownerExists) {
      return res.status(400).json({
        message: "Owner not found!",
        success: false,
      });
    }

    const emailExists = await Restaurant.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        message: "Restaurant with this email already exists",
        success: false,
      });
    }

    const phoneExists = await Restaurant.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({
        message: "Restaurant with this phone number already exists",
        success: false,
      });
    }

    const uniqueName = crypto.randomBytes(2).toString("hex");
    const fileName = `${uniqueName}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../assets/restaurant");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const newRestaurant = new Restaurant({
      owner_id,
      email,
      password,
      phone,
      name,
      address,
      image: `${process.env.FRONTEND_URL}/assets/restaurant/${fileName}` || "",
      status,
      description: description?.length > 0 ? description : null,
      location,
      cuisine_type,
    });

    await newRestaurant.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "Your Restaurant Login Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
          <h3>Welcome to Our Platform!</h3>
          <p>Your restaurant account has been successfully created. Below are your login credentials:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>We recommend changing your password after logging in for the first time.</p>
          <br />
          <p>Best regards,<br />The Team</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log("Mail has been sent to your email");
      }
    });

    res.status(201).json({
      message: "Restaurant created successfully",
      success: true,
      data: newRestaurant,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create restaurant",
      success: false,
      error: err.message,
    });
  }
};

const updateRestaurant = async (req, res) => {
  try {
    const {
      id,
      owner_id,
      email,
      password,
      phone,
      name,
      address,
      status,
      description,
      location,
      cuisine_type,
    } = req.body;

    if (
      !id ||
      !owner_id ||
      !email ||
      !phone ||
      !name ||
      !req.file ||
      !address ||
      status === undefined
    ) {
      return res.status(400).json({
        message:
          "Missing required fields:ID, owner_id, email, phone, name, image, address or status",
        success: false,
      });
    }

    const idExists = await Restaurant.findById(id);
    if (!idExists) {
      return res.status(400).json({
        message: "Restaurant not found!",
        success: false,
      });
    }

    const ownerExists = await UserAuth.findById(owner_id);
    if (!ownerExists) {
      return res.status(400).json({
        message: "Owner not found!",
        success: false,
      });
    }

    const duplicate = await Restaurant.findOne({
      _id: { $ne: id },
      $or: [{ email }, { phone }],
    });

    if (duplicate) {
      if (duplicate.email === email) {
        return res
          .status(409)
          .json({ success: false, message: "Email already in use" });
      }
      if (duplicate.phone === phone) {
        return res
          .status(409)
          .json({ success: false, message: "Contact already in use" });
      }
    }

    if (idExists) {
      const oldFileName = path.basename(idExists.image || "");
      const oldFilePath = path.join(
        __dirname,
        "../assets/subCategory",
        oldFileName
      );

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      const uniqueName = crypto.randomBytes(2).toString("hex");
      const ext = path.extname(req.file.originalname);
      const fileName = `${uniqueName}${ext}`;
      const uploadDir = path.join(__dirname, "../assets/restaurant");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      idExists.image = `${process.env.FRONTEND_URL}/assets/restaurant/${fileName}`;
    }

    idExists.owner_id = owner_id || idExists.owner_id;
    idExists.email = email || idExists.email;
    idExists.password = password || idExists.password;
    idExists.phone = phone || idExists.phone;
    idExists.name = name || idExists.name;
    idExists.address = address || idExists.address;
    idExists.status = status || idExists.status;
    idExists.description = description || idExists.description;
    idExists.location = location || idExists.location;
    idExists.cuisine_type = cuisine_type || idExists.cuisine_type;

    await idExists.save();

    res.status(200).json({
      message: "Restaurant updated successfully",
      success: true,
      data: idExists,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update restaurant",
      success: false,
      error: err.message,
    });
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    const { id, owner_id } = req.body;

    if (!id || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "Both ID and user_id are required",
      });
    }

    const ownerExists = await UserAuth.findOne({ _id: owner_id });
    if (!ownerExists) {
      return res.status(400).json({
        message: "Owner not found!",
        success: false,
      });
    }

    const restaurant = await Restaurant.findOne({ _id: id, owner_id });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found for the given owner_id",
        success: false,
      });
    }

    if (restaurant.image) {
      const fileName = path.basename(restaurant.image);
      const filePath = path.join(__dirname, "../assets/restaurant", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Restaurant.findByIdAndDelete(id);

    res.status(200).json({
      message: "Restaurant deleted successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete restaurant",
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
