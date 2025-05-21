const UserAuth = require("../models/authLogin");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const config = require("../config/nodemailer");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const allowedRoles = ["owner", "manager", "staff"];

const getAuthUsers = async (req, res) => {
  try {
    const users = await UserAuth.find();

    const groupedUsers = {};
    allowedRoles.forEach((role) => {
      groupedUsers[role] = users.filter((user) => user.role === role);
    });

    res.status(200).json({
      message: "Login Users fetched successfully",
      success: true,
      data: groupedUsers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users",
      success: false,
      error: error.message,
    });
  }
};

const registerUser = async (req, res) => {
  try {
    let { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Invalid email format", success: false });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles are: ${allowedRoles.join(", ")}`,
        success: false,
      });
    }

    const existingUser = await UserAuth.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email is already registered", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserAuth({
      email,
      // password: hashedPassword,
      password,
      role,
    });

    await newUser.save();

    res.status(201).json([
      {
        message: "User registered successfully",
        success: true,
        data: newUser,
      },
    ]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password, and role are required",
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

    const user = await UserAuth.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Invalid email",
        success: false,
      });
    }

    if (user.password !== password) {
      return res.status(400).json({
        message: "Invalid password",
        success: false,
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        message: "Unauthorized role access",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Login successful",
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

const sendResetEmail = async (email, token) => {
  try {
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
      subject: "Reset Your Password",
      html: `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333;">
      <h2 style="color: #1a73e8;">Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to continue:</p>
      <p>
        <a href="http://192.168.1.87:3000/reset-password/${token}" 
           style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
      </p>
      <p>If you didn’t request a password reset, you can safely ignore this email.</p>
      <p>Thanks,<br>The Support Team</p>
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
  } catch (error) {
    res.status(400).send({
      success: false,
      msg: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required", success: false });
    }

    const user = await UserAuth.findOne({ email });
    if (user) {
      const randomString = randomstring.generate();
      const data = await UserAuth.updateOne(
        { email: email },
        { $set: { token: randomString } }
      );
      sendResetEmail(user.email, randomString);
      return res.status(200).json({
        message:
          "Password reset email sent successfully. Please check your inbox.",
        success: true,
      });
    } else {
      return res.status(400).json({
        message: "User with this email does not exist",
        success: false,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", success: false });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Token required", success: false });
    }

    if (!newPassword) {
      return res
        .status(400)
        .json({ message: "New password required", success: false });
    }
    const user = await UserAuth.findOne({ token });

    if (!user) {
      return res
        .status(200)
        .json({ message: "Invalid or expired token", success: false });
    }

    user.token = "";
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = password;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", success: false });
  }
};

const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Email, current password, and new password are required",
        success: false,
      });
    }

    const user = await UserAuth.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (user.password !== currentPassword) {
      return res.status(401).json({
        message: "Current password is incorrect",
        success: false,
      });
    }

    // const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required", success: false });
    }

    const user = await UserAuth.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ message: "Server error", success: false });
  }
};

const editProfile = async (req, res) => {
  try {
    const { email, username, gender } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required", success: false });
    }

    const user = await UserAuth.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (username) user.username = username;
    if (gender) user.gender = gender;

   if (req.file) {
      const oldFileName = path.basename(user.image || "");
      const oldFilePath = path.join(__dirname, "../assets/profile", oldFileName);

      if (user.image && fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      const uniqueName = crypto.randomBytes(2).toString("hex");
      const ext = path.extname(req.file.originalname);
      const fileName = `${uniqueName}${ext}`;
      const uploadDir = path.join(__dirname, "../assets/profile");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      user.image = `${process.env.FRONTEND_URL}/assets/profile/${fileName}`;
    }

    if (!user.image) {
      user.image = "https://cdn3.iconfinder.com/data/icons/avatars-collection/256/22-512.png";
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Edit Profile Error:", err);
    res.status(500).json({ message: "Server error", success: false });
  }
};

module.exports = {
  getAuthUsers,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  editProfile,
};
