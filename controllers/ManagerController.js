const ManagerAuth = require("../models/manager");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const getManager = async (req, res) => {
  try {
    const managers = await ManagerAuth.find();

    return res.status(200).json({
      success: true,
      message: "Manager list fetched successfully",
      data: managers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching managers",
      error: error.message,
    });
  }
};

const createManager = async (req, res) => {
  try {
    const { name, username, phone, email, password, is_blocked } = req.body;

    const profile_photo = req.file ? req.file.filename : null;

    if (
      !name?.trim() ||
      !username?.trim() ||
      !phone?.trim() ||
      !email?.trim() ||
      !password?.trim() ||
      !profile_photo ||
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

    const existingUser = await ManagerAuth.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newManager = new ManagerAuth({
      name: name.trim(),
      username: username.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      profile_photo: `${process.env.FRONTEND_URL}/assets/manager/${profile_photo}`,
      is_blocked,
    });

    await newManager.save();

    const managerData = newManager.toObject();
    // delete managerData.password;

    return res.status(201).json({
      success: true,
      message: "Manager created successfully",
      manager: managerData,
    });
  } catch (error) {
    console.error("Error creating manager:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateManager = async (req, res) => {
  try {
    const { id, name, username, phone, email, password, is_blocked } = req.body;

    const existingManager = await ManagerAuth.findById(id);
    if (!existingManager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    let profile_photo = existingManager.profile_photo;
    if (req.file) {
      const oldFileName = path.basename(existingManager.profile_photo || "");
      const oldFilePath = path.join(
        __dirname,
        "../assets/manager",
        oldFileName
      );

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      profile_photo = `${process.env.FRONTEND_URL}/assets/manager/${req.file.filename}`;
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

    const duplicate = await ManagerAuth.findOne({
      _id: { $ne: id },
      $or: [{ email }, { username }],
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Email or username already in use",
      });
    }

    let updatedPassword = existingManager.password;
    if (password && password.trim()) {
      updatedPassword = await bcrypt.hash(password.trim(), 10);
    }

    const updatedManager = await ManagerAuth.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: updatedPassword,
        profile_photo,
        is_blocked,
      },
      { new: true }
    );

    const managerData = updatedManager.toObject();

    return res.status(200).json({
      success: true,
      message: "Manager updated successfully",
      manager: managerData,
    });
  } catch (error) {
    console.error("Error updating manager:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteManager = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const manager = await ManagerAuth.findById(id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    if (manager.profile_photo) {
      const fileName = path.basename(manager.profile_photo);
      const filePath = path.join(__dirname, "../assets/manager", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await ManagerAuth.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Manager deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete manager!",
      error: error.message,
    });
  }
};

module.exports = { getManager, createManager, updateManager, deleteManager };
