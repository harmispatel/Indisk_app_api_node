const express = require("express");
const router = express.Router();

const {
  getAuthUsers,
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/AuthLoginController");

const {
  getManager,
  createManager,
  updateManager,
  deleteManager,
} = require("../controllers/ManagerController");

const {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} = require("../controllers/StaffController");

router.get("/auth-user-list", getAuthUsers);
router.post("/login", loginUser);
router.post("/signup", registerUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/manager-list", getManager);
router.post("/create-manager", createManager);
router.put("/update-manager", updateManager);
router.delete("/delete-manager", deleteManager);

router.get("/staff-list", getStaff);
router.post("/create-staff", createStaff);
router.put("/update-staff", updateStaff);
router.delete("/delete-staff", deleteStaff);

module.exports = router;
