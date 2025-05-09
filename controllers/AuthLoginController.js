const UserAuth = require("../models/authLogin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const StaffListData = require("../models/staffList");

const getAuthUsers = async (req, res) => {
  try {
    const users = await UserAuth.find();
    res.status(200).json({
      message: "Login Users fetched successfully",
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching  users",
      success: false,
      error: error.message,
    });
  }
};

const registerUser = async (req, res) => {
  const { username, email, password, role, phone } = req.body;

  if (!email || !password) {
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

  try {
    const existingUser = await UserAuth.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email is already registered", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserAuth({
      username,
      email,
      // password: hashedPassword,
      password,
      role,
      phone,
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username or email and password are required",
        success: false,
      });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    let user;
    let userType = null;

    if (emailRegex.test(username)) {
      user = await UserAuth.findOne({ email: username });
      userType = "UserAuth";
      if (!user) {
        user = await StaffListData.findOne({ email: username });
        userType = "StaffListData";
      }
    } else {
      user = await UserAuth.findOne({ username: username });
      userType = "UserAuth";
      if (!user) {
        user = await StaffListData.findOne({ username: username });
        userType = "StaffListData";
      }
    }

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid username or email", success: false });
    }

    if (user.password !== password) {
      return res
        .status(400)
        .json({ message: "Invalid password", success: false });
    }

    res.status(200).json({
      message: "Login successful",
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", success: false });
  }
};

const sendResetEmail = async (email, resetUrl) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    html: `
        <h3>Password Reset Request</h3>
        <p>You have requested to reset your password. Please click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ message: "Email is required", success: false });
  }

  try {
    const user = await UserAuth.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User with this email does not exist",
        success: false,
      });
    }

    const secretKey = crypto.randomBytes(32).toString("hex");

    const resetToken = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "1h",
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // await sendResetEmail(email, resetUrl);

    res.status(200).json({
      message:
        "Password reset email sent successfully. Please check your inbox.",
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", success: false });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token required", success: false });
  }

  if (!newPassword) {
    return res
      .status(400)
      .json({ message: "New password required", success: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserAuth.findById(decoded.userId);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid token or user not found", success: false });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
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

module.exports = {
  getAuthUsers,
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
