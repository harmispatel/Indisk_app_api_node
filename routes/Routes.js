const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const {
  uploadManager,
  uploadStaff,
  uploadStaffs,
} = require("../middlewares/upload");

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

const {
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/RestaurantCreateController");

const {
  getStaffList,
  createStaffData,
  updateStaffData,
  deleteStaffData,
} = require("../controllers/StaffListController");

const {
  getFoodCategory,
  createFoodCategory,
  updateFoodCategory,
  deleteFoodCategory,
} = require("../controllers/FoodCategoryController");

const {
  getFood,
  createFood,
  deleteFood,
  updateFood,
} = require("../controllers/FoodItemController");

const {
  getFoodStock,
  createFoodStock,
  updateFoodStock,
  deleteFoodStock,
} = require("../controllers/FoodStockController");

const {
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require("../controllers/SubCategoryController");

router.get("/auth-user-list", getAuthUsers);
router.post("/login", upload.none(), loginUser);
router.post("/signup", upload.none(), registerUser);
router.post("/forgot-password", upload.none(), forgotPassword);
router.post("/reset-password", upload.none(), resetPassword);

router.get("/manager-list", getManager);
router.post(
  "/create-manager",
  uploadManager.single("profile_photo"),
  createManager
);
router.put(
  "/update-manager",
  uploadManager.single("profile_photo"),
  updateManager
);
router.delete("/delete-manager", upload.none(), deleteManager);

router.get("/staff-list", getStaff);
router.post("/create-staff", uploadStaff.single("profile_photo"), createStaff);
router.put("/update-staff", uploadStaff.single("profile_photo"), updateStaff);
router.delete("/delete-staff", upload.none(), deleteStaff);

router.post("/restaurant-list", upload.none(), getRestaurant);
router.post("/restaurant-create", upload.single("image"), createRestaurant);
router.put("/restaurant-update", upload.single("image"), updateRestaurant);
router.delete("/restaurant-delete", upload.none(), deleteRestaurant);

router.get("/staff/staff-list", getStaffList);
router.post(
  "/staff/staff-create",
  uploadStaffs.single("image"),
  createStaffData
);
router.put(
  "/staff/staff-update",
  uploadStaffs.single("image"),
  updateStaffData
);
router.delete("/staff/staff-delete", upload.none(), deleteStaffData);

router.get("/food-category-list", getFoodCategory);
router.post(
  "/create-food-category",
  upload.single("image_url"),
  createFoodCategory
);
router.put(
  "/update-food-category",
  upload.single("image_url"),
  updateFoodCategory
);
router.delete("/delete-food-category", upload.none(), deleteFoodCategory);

router.post("/get-food-list", upload.none(), getFood);
router.post("/create-food", upload.array("image_url", 5), createFood);
router.put("/update-food", upload.array("image_url", 5), updateFood);
router.delete("/delete-food", upload.none(), deleteFood);

router.post("/get-food-stock-list", upload.none(), getFoodStock);
router.post("/create-food-stock", upload.single("image"), createFoodStock);
router.put("/update-food-stock", upload.single("image"), updateFoodStock);
router.delete("/delete-food-stock", upload.none(), deleteFoodStock);

router.post("/get-sub-category", upload.none(), getSubCategory),
  router.post(
    "/create-sub-category",
    upload.single("image"),
    createSubCategory
  ),
  router.put("/update-sub-category", upload.single("image"), updateSubCategory),
  router.delete("/delete-sub-category", upload.none(), deleteSubCategory);

module.exports = router;
