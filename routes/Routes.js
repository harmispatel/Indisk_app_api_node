const express = require("express");
const router = express.Router();

const {
  getAuthUsers,
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/AuthLoginController");
const {authenticateToken} = require("../middlewares/auth")

router.get("/auth-user-list", authenticateToken, getAuthUsers);
router.post("/login", loginUser);
router.post("/signup", registerUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
