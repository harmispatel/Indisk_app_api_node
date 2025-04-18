const StaffData = require("../models/staff");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const getStaff = async (req, res) => {
  try {
    const staffData = await StaffData.find();

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
    const { name, username, phone, email, password, is_blocked } = req.body;

    const profile_photo = req.file ? req.file.filename : null;

    if (
      !name?.trim() ||
      !username?.trim() ||
      !phone?.trim() ||
      !email?.trim() ||
      !password?.trim() ||
      is_blocked === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
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

    const existingUser = await StaffData.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = new StaffData({
      name: name.trim(),
      username: username.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      profile_photo: `${process.env.FRONTEND_URL}/uploads/staffs/${profile_photo}`,
      is_blocked,
    });

    await newStaff.save();

    const staffData = newStaff.toObject();
    // delete staffData.password;

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff: staffData,
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

    // const profile_photo = req.file
    //   ? `${process.env.FRONTEND_URL}/uploads/staffs/${req.file.filename}`
    //   : null;

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

      const oldFilePath = path.join(
        __dirname,
        "../uploads/staffs",
        oldFileName
      );
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      profile_photo = `${process.env.FRONTEND_URL}/uploads/staffs/${req.file.filename}`;
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
