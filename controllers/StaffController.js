const StaffData = require("../models/staff");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const UserAuth = require("../models/authLogin");
const mongoose = require("mongoose");

const getStaff = async (req, res) => {
  try {
    const { manager_id } = req.body;

    if (!manager_id) {
      return res.status(400).json({
        success: false,
        message: "manager_id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(manager_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid manager_id format",
      });
    }

    const staffData = await StaffData.find({ manager_id });

    if (staffData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No staff found for the provided manager_id",
      });
    }

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
      gender,
      address,
      status,
      manager_id,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !gender ||
      !manager_id ||
      !status
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: name, email, password, restaurant_id, manager_id",
        success: false,
      });
    }

    const managerFound = await UserAuth.findById(manager_id);
    if (!managerFound) {
      return res
        .status(404)
        .json({ message: "Manager not found", success: false });
    }

    // const restaurantFound = await Restaurant.findById(restaurant_id);
    // if (!restaurantFound) {
    //   return res
    //     .status(404)
    //     .json({ message: "Restaurant not found", success: false });
    // }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
        success: false,
      });
    }

    const emailExists = await StaffData.findOne({ email });
    if (emailExists) {
      return res
        .status(400)
        .json({ message: "Email already in use", success: false });
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
      address: address?.length > 0 ? address : null,
      gender,
      profile_picture: `${process.env.FRONTEND_URL}/assets/staff/${fileName}`,
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
    const { id, name, phone, gender, address, status, manager_id } = req.body;

    if (!id || !name || !phone || !gender || !manager_id || !status) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    const existingStaff = await StaffData.findById(id);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
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
      $or: [{ phone }],
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Phone already in use",
      });
    }

    if (existingStaff) {
      const oldFileName = path.basename(existingStaff.profile_picture || "");
      const oldFilePath = path.join(__dirname, "../assets/staff", oldFileName);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      const uniqueName = crypto.randomBytes(2).toString("hex");
      const ext = path.extname(req.file.originalname);
      const fileName = `${uniqueName}${ext}`;
      const uploadDir = path.join(__dirname, "../assets/staff");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      existingStaff.profile_picture = `${process.env.FRONTEND_URL}/assets/staff/${fileName}`;
    }

    existingStaff.manager_id = manager_id || existingStaff.manager_id;
    existingStaff.name = name || existingStaff.name;
    existingStaff.phone = phone || existingStaff.phone;
    existingStaff.address = address || existingStaff.address;
    existingStaff.status = status || existingStaff.status;
    existingStaff.gender = gender || existingStaff.gender;

    await existingStaff.save();

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      manager: existingStaff,
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
