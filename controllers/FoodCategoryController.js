const foodCategorySchema = require("../models/foodCategory");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const Restaurant = require("../models/RestaurantCreate");
const crypto = require("crypto");

const getFoodCategory = async (req, res) => {
  try {
    const { restaurant_id } = req.query;

    const existingRestaurant = await Restaurant.findById(restaurant_id);
    if (!existingRestaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        success: false,
      });
    }

    const foodCategoryData = await foodCategorySchema.find({ restaurant_id });
    res.status(200).json({
      message: "Food categories fetched successfully",
      success: true,
      data: foodCategoryData,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve food categories",
      success: false,
      error: err.message,
    });
  }
};

const createFoodCategory = async (req, res) => {
  try {
    const { name, description, restaurant_id, is_active } = req.body;

    if (!name || !restaurant_id || !req.file) {
      return res.status(400).json({
        message: "Please provide name, restaurant_id and image file",
        success: false,
      });
    }

    const uniqueName = crypto.randomBytes(2).toString("hex");
    const fileName = `${uniqueName}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../assets/category");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const newFoodCategory = new foodCategorySchema({
      name,
      description: description || null,
      restaurant_id,
      is_active,
      image_url: `${process.env.FRONTEND_URL}/assets/category/${fileName}`,
    });

    await newFoodCategory.save();

    res.status(201).json({
      message: "Food category created successfully",
      success: true,
      data: newFoodCategory,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create food category",
      success: false,
      error: err.message,
    });
  }
};

const updateFoodCategory = async (req, res) => {
  try {
    const { id, name, description, restaurant_id, is_active } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    if (!name && !restaurant_id && !description && !req.file) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
        success: false,
      });
    }

    const foodCategoryGet = await foodCategorySchema.findById(id);
    if (!foodCategoryGet) {
      return res.status(404).json({
        success: false,
        message: "Food category not found",
      });
    }

    if (name !== undefined) foodCategoryGet.name = name;
    if (description !== undefined) foodCategoryGet.description = description;
    if (restaurant_id !== undefined)
      foodCategoryGet.restaurant_id = restaurant_id;
    if (is_active) foodCategoryGet.is_active = is_active;

    if (req.file) {
      const oldFileName = path.basename(foodCategoryGet.image_url || "");
      const oldFilePath = path.join(
        __dirname,
        "../assets/category",
        oldFileName
      );

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      const uniqueName = crypto.randomBytes(2).toString("hex");
      const ext = path.extname(req.file.originalname);
      const fileName = `${uniqueName}${ext}`;
      const uploadDir = path.join(__dirname, "../assets/category");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      foodCategoryGet.image_url = `${process.env.FRONTEND_URL}/assets/category/${fileName}`;
    }

    await foodCategoryGet.save();

    res.status(200).json({
      message: "Food category updated successfully",
      success: true,
      data: foodCategoryGet,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update food category",
      success: false,
      error: err.message,
    });
  }
};

const deleteFoodCategory = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const foodCategory = await foodCategorySchema.findById(id);
    if (!foodCategory) {
      return res.status(404).json({
        message: "Food category not found",
        success: false,
      });
    }

    if (foodCategory.image_url) {
      const fileName = path.basename(foodCategory.image_url);
      const filePath = path.join(__dirname, "../assets/category", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await foodCategorySchema.findByIdAndDelete(id);

    res.status(200).json({
      message: "Food category deleted successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete food category",
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  getFoodCategory,
  createFoodCategory,
  updateFoodCategory,
  deleteFoodCategory,
};
