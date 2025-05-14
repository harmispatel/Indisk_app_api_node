const UserAuth = require("../models/authLogin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const StaffData = require("../models/staff");
const ManagerAuth = require("../models/manager");
const Restaurant = require("../models/RestaurantCreate");

const allowedRoles = ["owner", "Manager", "Staff"];

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

// const loginUser = async (req, res) => {
//   try {
//     const { email, password, role } = req.body;

//     if (!email || !password || !role) {
//       return res.status(400).json({
//         message: "Email, password, and role are required",
//         success: false,
//       });
//     }

//     const emailRegex = /\S+@\S+\.\S+/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({
//         message: "Invalid email format",
//         success: false,
//       });
//     }

//     let user = null;

//     switch (role) {
//       case "owner":
//         user = await UserAuth.findOne({ email });
//         break;
//       case "manager":
//         user = await ManagerAuth.findOne({ email });
//         break;
//       case "staff":
//         user = await UserAuth.findOne({ email });
//         break;
//       default:
//         return res.status(400).json({
//           message: "Invalid role. Allowed roles: owner, manager, staff",
//           success: false,
//         });
//     }

//     if (!user) {
//       return res.status(400).json({
//         message: "User not found",
//         success: false,
//       });
//     }

//     if (user.password !== password) {
//       return res.status(400).json({
//         message: "Invalid password",
//         success: false,
//       });
//     }

//     let additionalData = {};

//     if (role === "owner") {
//       const restaurants = await Restaurant.find({ owner_id: user._id });
//       additionalData = { restaurants };
//     }

//     if (role === "manager") {
//       const restaurant = await Restaurant.find({ email: email });
//       const staff = await StaffData.find({ manager_id: user._id });
//       additionalData = { restaurant, staff };
//     }

//     if (role === "staff") {
//       const restaurant = await Restaurant.findOne({ _id: user.restaurant_id });
//       const manager = await ManagerAuth.findOne({ _id: user._id });
//       additionalData = { restaurant, manager };
//     }

//     return res.status(200).json({
//       message: "Login successful",
//       success: true,
//       // data: {
//       //   user,
//       //   ...additionalData,
//       // },
//       data: user,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       message: "Server error",
//       success: false,
//     });
//   }
// };

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
