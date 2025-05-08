const SubCategory = require("../models/SubCategory");
const Restaurant = require("../models/RestaurantCreate");
const UserAuth = require("../models/authLogin");
const Category = require("../models/foodCategory");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const getSubCategory = async (req, res) => {
  try {
    const { user_id, restaurant_id, category_id } = req.body;

    if (!user_id || !restaurant_id || !category_id) {
      return res.status(400).json({
        message: "User ID, Restaurant ID, and Food Category ID are required",
        success: false,
      });
    }

    const existingUser = await UserAuth.findById(user_id);
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const existingRestaurant = await Restaurant.findById(restaurant_id);
    if (!existingRestaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        success: false,
      });
    }

    const existingCategory = await Category.findById(category_id);
    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }

    const subCategoryData = await SubCategory.find({
      restaurant_id: restaurant_id,
      category_id: category_id,
    });

    // if (subCategoryData.length === 0) {
    //   return res.status(404).json({
    //     message: "No subcategories found for this restaurant and category",
    //     success: false,
    //   });
    // }

    res.status(200).json({
      message: "Food categories fetched successfully",
      success: true,
      data: subCategoryData?.length > 0 ? subCategoryData : null,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve food categories",
      success: false,
      error: err.message,
    });
  }
};

const createSubCategory = async (req, res) => {
  try {
    const { user_id, category_id, restaurant_id, name, description, status } =
      req.body;

    if (
      !user_id ||
      !category_id ||
      !restaurant_id ||
      !name ||
      !status ||
      !req.file
    ) {
      return res.status(400).json({
        message:
          "User ID, Category ID, Restaurant ID, Name, Image, and Status are required",
        success: false,
      });
    }

    const existingUser = await UserAuth.findById(user_id);
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const existingRestaurant = await Restaurant.findById(restaurant_id);
    if (!existingRestaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        success: false,
      });
    }

    const existingCategory = await Category.findById(category_id);
    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }

    const uniqueName = crypto.randomBytes(2).toString("hex");
    const fileName = `${uniqueName}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../assets/subCategory");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const newSubCategory = new SubCategory({
      user_id,
      category_id,
      restaurant_id,
      name,
      description: description?.length > 0 ? description : null,
      image: `${process.env.FRONTEND_URL}/assets/subCategory/${fileName}` || "",
      status: status,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newSubCategory.save();

    res.status(201).json({
      message: "Subcategory created successfully",
      success: true,
      data: newSubCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create subcategory",
      success: false,
      error: error.message,
    });
  }
};

const updateSubCategory = async (req, res) => {
  try {
    const {
      id,
      user_id,
      category_id,
      restaurant_id,
      name,
      description,
      status,
    } = req.body;

    if (!id || !user_id || !category_id || !restaurant_id || !name || !status) {
      return res.status(400).json({
        message:
          "SubCategory ID, User ID, Category ID, Restaurant ID, Name, and Status are required",
        success: false,
      });
    }

    const existingUser = await UserAuth.findById(user_id);
    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const existingRestaurant = await Restaurant.findById(restaurant_id);
    if (!existingRestaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        success: false,
      });
    }

    const existingCategory = await Category.findById(category_id);
    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({
        message: "Subcategory not found",
        success: false,
      });
    }

    if (subCategory) {
      const oldFileName = path.basename(subCategory.image || "");
      const oldFilePath = path.join(
        __dirname,
        "../assets/subCategory",
        oldFileName
      );

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      const uniqueName = crypto.randomBytes(2).toString("hex");
      const ext = path.extname(req.file.originalname);
      const fileName = `${uniqueName}${ext}`;
      const uploadDir = path.join(__dirname, "../assets/subCategory");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      subCategory.image = `${process.env.FRONTEND_URL}/assets/subCategory/${fileName}`;
    }

    subCategory.user_id = user_id;
    subCategory.category_id = category_id;
    subCategory.restaurant_id = restaurant_id;
    subCategory.name = name;
    subCategory.description = description?.length > 0 ? description : null;
    subCategory.status = status;
    subCategory.updated_at = new Date();

    await subCategory.save();

    res.status(200).json({
      message: "Subcategory updated successfully",
      success: true,
      data: subCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update subcategory",
      success: false,
      error: error.message,
    });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    const { user_id, id, category_id, restaurant_id } = req.body;

    if (!user_id || !id || !category_id || !restaurant_id) {
      return res.status(400).json({
        message: "user_id, id, category_id, and restaurant_id are required",
        success: false,
      });
    }

    const deleted = await SubCategory.findOneAndDelete({
      _id: id,
      category_id: category_id,
      restaurant_id: restaurant_id,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Subcategory not found or already deleted",
        success: false,
      });
    }

    if (deleted.image) {
      const fileName = path.basename(deleted.image);
      const filePath = path.join(__dirname, "../assets/subCategory", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return res.status(200).json({
      message: "Subcategory deleted successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete subcategory",
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
};
