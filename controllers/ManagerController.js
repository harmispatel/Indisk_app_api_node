const UserAuth = require("../models/authLogin");

const getManager = async (req, res) => {
  try {
    const managers = await UserAuth.find({ role: "manager" });
    res.json({ success: true, message: "Managers fetched", data: managers });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error", error: err.message });
  }
};

const createStaffManager = async (req, res) => {
  try {
    const {
      manager_id,
      owner_id,
      username,
      email,
      password,
      phone,
      status,
      address,
    } = req.body;

    const emailExits = await UserAuth.findOne({ email });
    if (emailExits) {
      return res.json({
        success: false,
        message: "Email already exists",
        error: err.message,
      });
    }

    const phoneExits = await UserAuth.findOne({ phone });
    if (phoneExits) {
      return res.json({
        success: false,
        message: "Phone number already exists",
        error: err.message,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error", error: err.message });
  }
};

module.exports = { getManager, createStaffManager };
