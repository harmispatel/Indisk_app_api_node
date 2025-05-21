const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const {
  getAuthUsers,
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  editProfile,
} = require("../controllers/AuthLoginController");

const {
  getManager,
  createStaffManager,
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
  getRestaurantDetails,
} = require("../controllers/RestaurantCreateController");

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

const { getOwnerHome } = require("../controllers/OwnerHomeController");

router.get("/auth-user-list", getAuthUsers);
router.post("/login", upload.none(), loginUser);
router.post("/signup", upload.none(), registerUser);
router.post("/forgot-password", upload.none(), forgotPassword);
router.post("/reset-password", upload.none(), resetPassword);
router.post("/change-password", upload.none(), changePassword);
router.post("/get-profile", upload.none(), getProfile);
router.post("/edit-profile", upload.single("image"), editProfile);

router.post("/manager-list", upload.none(), getManager);
router.post(
  "/manager/create-staff",
  upload.single("image"),
  upload.none(),
  createStaffManager
);

router.post("/staff-list", upload.none(), getStaff);
router.post("/create-staff", upload.single("profile_picture"), createStaff);
router.put("/update-staff", upload.single("profile_picture"), updateStaff);
router.delete("/delete-staff", upload.none(), deleteStaff);

router.post("/restaurant-list", upload.none(), getRestaurant);
router.post("/restaurant-create", upload.single("image"), createRestaurant);
router.put("/restaurant-update", upload.single("image"), updateRestaurant);
router.delete("/restaurant-delete", upload.none(), deleteRestaurant);
router.post("/get-restaurant-details", upload.none(), getRestaurantDetails);

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

router.post("/get-owner-home", upload.none(), getOwnerHome);

module.exports = router;
