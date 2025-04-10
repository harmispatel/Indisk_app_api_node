const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const { uploadManager, uploadStaff } = require("../middlewares/upload");


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
router.post("/login", upload.none(), loginUser);
router.post("/signup", upload.none(), registerUser);
router.post("/forgot-password", upload.none(), forgotPassword);
router.post("/reset-password", upload.none(), resetPassword);

router.get("/manager-list", getManager);
router.post("/create-manager", uploadManager.single("profile_photo"), createManager);
router.put("/update-manager", uploadManager.single("profile_photo"),updateManager);
router.delete("/delete-manager",upload.none(), deleteManager);

router.get("/staff-list", getStaff);
router.post("/create-staff",uploadStaff.single("profile_photo"), createStaff);
router.put("/update-staff",uploadStaff.single("profile_photo"), updateStaff);
router.delete("/delete-staff",upload.none(), deleteStaff);

module.exports = router;
