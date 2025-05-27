const StaffData = require("../models/staff");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const UserAuth = require("../models/authLogin");
const mongoose = require("mongoose");
const config = require("../config/nodemailer");
const nodemailer = require("nodemailer");
require("dotenv").config();

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

    const sharedId = new mongoose.Types.ObjectId();

    const newStaff = new StaffData({
      _id: sharedId,
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
      _id: sharedId,
      email,
      password,
      role: "staff",
    });
    await staffPersonal.save();

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
      secure: false,
      subject: "Your Staff Account Login Credentials",
      html: `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9; color: #333;">
    <h2 style="color: #2c3e50; border-bottom: 2px solid #e2e2e2; padding-bottom: 10px;">👋 Welcome to the Team!</h2>

    <p style="font-size: 15px; line-height: 1.6;">
      Hello <strong>${name}</strong>,<br>
      You have been successfully added as a staff member to our platform. Please find your login credentials and profile details below.
    </p>

    <h3 style="margin-top: 25px; color: #34495e;">🔐 Login Credentials</h3>
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="padding: 5px 0;"><strong>Email:</strong></td>
        <td>${email}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Password:</strong></td>
        <td>${password}</td>
      </tr>
    </table>

    <h3 style="margin-top: 25px; color: #34495e;">👤 Staff Profile</h3>
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="padding: 5px 0;"><strong>Name:</strong></td>
        <td>${name}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Phone:</strong></td>
        <td>${phone}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Gender:</strong></td>
        <td>${gender}</td>
      </tr>
      ${
        address
          ? `
      <tr>
        <td style="padding: 5px 0;"><strong>Address:</strong></td>
        <td>${address}</td>
      </tr>`
          : ""
      }
    </table>

    ${
      fileName
        ? `
    <div style="margin: 20px 0;">
      <strong style="display: block; margin-bottom: 10px;">📸 Profile Picture:</strong>
      <img src="cid:profileImage" alt="Profile Image" style="width: 100%; max-width: 200px; border-radius: 5px;">
    </div>
    `
        : ""
    }

    <p style="margin-top: 20px; font-size: 14px;">🔒 For your security, please change your password after logging in for the first time.</p>

    <p style="margin-top: 30px; font-size: 14px;">
      Welcome aboard!<br>
      <strong>The Management Team</strong>
    </p>
  </div>
`,

      attachments: fileName
        ? [
            {
              filename: "profile-picture.png",
              path: `${process.env.FRONTEND_URL}/assets/staff/${fileName}`,
              cid: "profileImage",
            },
          ]
        : [],
    };

    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log("Mail has been sent to your email");
      }
    });

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

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }

    const existingStaff = await StaffData.findById(id);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const duplicate = await StaffData.findOne({
      _id: { $ne: id },
      phone: phone,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Phone already in use by another staff member",
      });
    }

    if (req.file) {
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

    existingStaff.name = name;
    existingStaff.phone = phone;
    existingStaff.gender = gender;
    existingStaff.address = address || null;
    existingStaff.status = status;
    existingStaff.manager_id = manager_id;

    await existingStaff.save();

    return res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: existingStaff,
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
