const StaffData = require("../models/staff");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const ManagerAuth = require("../models/manager");
const Restaurant = require("../models/RestaurantCreate");
const crypto = require("crypto");
const UserAuth = require("../models/authLogin");

const getStaff = async (req, res) => {
  try {
    const staffData = await StaffData.findOne(manager_id);

    return res.status(200).json({
      success: true,
      message: "Staff list fetched successfully",
      data: staffData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching staff list",
      error: error.message,
    });
  }
};

const createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      restaurant_id,
      manager_id,
      status,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !restaurant_id ||
      !manager_id
    ) {
      return res.status(400).json({
        message: "All fields required!",
        success: false,
      });
    }

    const managerFound = await ManagerAuth.findOne({ _id: manager_id });
    if (!managerFound) {
      return res.status(400).json({
        message: "Manager not found!",
        success: false,
      });
    }

    const restaurantFound = await Restaurant.findOne({ _id: restaurant_id });
    if (!restaurantFound) {
      return res.status(400).json({
        message: "Restaurant not found!",
        success: false,
      });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
        success: false,
      });
    }

    const emailManagerExists = await StaffData.findOne({ email });
    if (emailManagerExists) {
      return res.status(400).json({
        message: "Staff member with this email already exists",
        success: false,
      });
    }

    const phoneExists = await StaffData.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({
        message: "Staff member with this phone number already exists",
        success: false,
      });
    }

    const uniqueName = crypto.randomBytes(2).toString("hex");
    const fileName = `${uniqueName}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../assets/staff");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const newStaff = new StaffData({
      name,
      email,
      password,
      phone,
      address,
      profile_picture: `${process.env.FRONTEND_URL}/assets/staff/${fileName}`,
      restaurant_id,
      manager_id,
      status,
    });

    await newStaff.save();

    const staffPersonal = new UserAuth({
      email,
      password,
      role: "staff",
    });
    await staffPersonal.save();

    res.status(201).json({
      message: "Staff created successfully",
      success: true,
      data: newStaff,
    });
  } catch (error) {
    console.error("Error creating staff:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { id, name, username, phone, email, password, is_blocked } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is missing",
      });
    }

    const existingStaff = await StaffData.findById(id);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    let profile_photo = existingStaff.profile_photo;
    if (req.file) {
      const oldFileName = path.basename(existingStaff.profile_photo);

      const oldFilePath = path.join(__dirname, "../assets/staff", oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      profile_photo = `${process.env.FRONTEND_URL}/assets/staff/${req.file.filename}`;
    }

    if (
      !name?.trim() ||
      !username?.trim() ||
      !phone?.trim() ||
      !email?.trim() ||
      !profile_photo ||
      is_blocked === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    const duplicate = await StaffData.findOne({
      _id: { $ne: id },
      $or: [{ email }, { username }],
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Email or username already in use",
      });
    }

    let updatedPassword = existingStaff.password;
    if (password && password.trim()) {
      updatedPassword = await bcrypt.hash(password.trim(), 10);
    }

    const updatedStaff = await StaffData.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: updatedPassword,
        profile_photo: profile_photo,
        is_blocked,
      },
      { new: true }
    );

    const staffData = updatedStaff.toObject();
    // delete staffData.password;

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      manager: staffData,
    });
  } catch (error) {
    console.error("Error updating staff:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const staffData = await StaffData.findByIdAndDelete(id);

    if (!staffData) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete staff!",
      error: error.message,
    });
  }
};

module.exports = {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
};
