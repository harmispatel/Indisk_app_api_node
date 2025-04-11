const StaffListData = require("../models/staffList");
const fs = require("fs");
const path = require("path");

const roleMap = {
  1: "Manager",
  2: "Waiter",
};

const getStaffList = async (req, res) => {
  try {
    const role = req.query.role; // get role from query ?role=1

    if (role && !roleMap[parseInt(role)]) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role not found.",
      });
    }

    const filter = role ? { role: parseInt(role) } : {};

    const staffList = await StaffListData.find(filter);

    const enrichedData = staffList.map((staff) => ({
      ...staff.toObject(),
      role_name: roleMap[staff.role] || "Unknown",
    }));

    let message = "Staff list fetched successfully";
    if (role === "1") {
      message = "Manager list fetched successfully";
    } else if (role === "2") {
      message = "Waiter list fetched successfully";
    }

    return res.status(200).json({
      success: true,
      message,
      data: enrichedData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching staff list",
      error: error.message,
    });
  }
};

const createStaffData = async (req, res) => {
  try {
    const { name, username, phone, email, password, is_blocked, role } =
      req.body;

    if (
      !name ||
      !username ||
      !phone ||
      !email ||
      !password ||
      !is_blocked ||
      role === undefined ||
      !req.file
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const parsedRole = parseInt(role);
    if (!roleMap[parsedRole]) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role not found.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const existingStaffNumber = await StaffListData.findOne({ phone });
    if (existingStaffNumber) {
      return res.status(400).json({
        message: "Staff with this contact already exists",
        success: false,
      });
    }

    const existingUser = await StaffListData.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists.",
      });
    }

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(req.file.originalname);
    const fileName = `${uniqueName}${ext}`;
    const uploadDir = path.join(__dirname, "../assets/uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const newStaff = new StaffListData({
      name,
      username,
      phone,
      email,
      password,
      image: `${process.env.FRONTEND_URL}/assets/uploads/${fileName}`,
      is_blocked,
      role: parsedRole,
    });

    await newStaff.save();

    return res.status(201).json({
      success: true,
      message: `${roleMap[parsedRole]} created successfully`,
      data: {
        ...newStaff.toObject(),
        role_name: roleMap[parsedRole],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating staff",
      error: error.message,
    });
  }
};

const updateStaffData = async (req, res) => {
  try {
    const { id, name, username, phone, email, password, is_blocked } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    const existingStaff = await StaffListData.findById(id);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    if (
      !name?.trim() ||
      !username?.trim() ||
      !phone?.trim() ||
      !email?.trim() ||
      typeof is_blocked === "undefined"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, username, phone, email, and is_blocked are required",
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

    const duplicate = await StaffListData.findOne({
      _id: { $ne: id },
      $or: [{ email }, { username }],
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Email or username already in use by another user",
      });
    }

    let image = existingStaff.image;
    if (req.file) {
      const oldImageFile = existingStaff.image
        ? path.join(
            __dirname,
            "../assets/uploads",
            path.basename(existingStaff.image)
          )
        : null;

      if (oldImageFile && fs.existsSync(oldImageFile)) {
        fs.unlinkSync(oldImageFile);
      }

      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(req.file.originalname);
      const fileName = `${uniqueName}${ext}`;
      const uploadDir = path.join(__dirname, "../assets/uploads");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      image = `${process.env.FRONTEND_URL}/assets/uploads/${fileName}`;
    }

    let updatedPassword = existingStaff.password;
    if (password && password.trim()) {
      // updatedPassword = await bcrypt.hash(password.trim(), 10); // Uncomment for hashing
      updatedPassword = password.trim();
    }

    const updatedStaff = await StaffListData.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        username: username.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: updatedPassword,
        image,
        is_blocked,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Staff data updated successfully",
      manager: updatedStaff.toObject(),
    });
  } catch (error) {
    console.error("Error updating staff data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteStaffData = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Please provide 'id' parameter.",
      });
    }

    const deletedStaff = await StaffListData.findById(id);

    if (!deletedStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found.",
      });
    }

    if (deletedStaff.image) {
      const fileName = path.basename(deletedStaff.image);
      const filePath = path.join(__dirname, "../assets/uploads", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await StaffListData.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Staff member deleted successfully.",
      data: deletedStaff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting staff member.",
      error: error.message,
    });
  }
};

module.exports = {
  getStaffList,
  createStaffData,
  updateStaffData,
  deleteStaffData,
};
