const FoodCategorySchema = require("../models/foodCategory");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");
const Manager = require("../models/manager");
const StaffData = require("../models/staff");

const getFoodCategory = async (req, res) => {
  try {
    const { manager_id, staff_id } = req.body;

    let resolvedManagerId = null;

    if (manager_id) {
      if (!mongoose.Types.ObjectId.isValid(manager_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager_id format",
        });
      }

      const manager = await Manager.findOne({ user_id: manager_id });
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager not found",
        });
      }

      resolvedManagerId = manager_id;
    } else if (staff_id) {
      if (!mongoose.Types.ObjectId.isValid(staff_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff_id format",
        });
      }

      const staff = await StaffData.findById(staff_id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Staff not found",
        });
      }

      resolvedManagerId = staff.manager_id;
    } else {
      return res.status(400).json({
        success: false,
        message: "Either manager_id or staff_id is required",
      });
    }

    const categoryData = await FoodCategorySchema.find({
      manager_id: resolvedManagerId,
    });

    res.status(200).json({
      success: true,
      message: "Food categories fetched successfully",
      data: categoryData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve food categories",
      error: err.message,
    });
  }
};


const createFoodCategory = async (req, res) => {
  try {
    const { name, description, manager_id, is_active } = req.body;

    if (!name || !manager_id || !req.file) {
      return res.status(400).json({
        message: "Please provide name, manager_id and image file",
        success: false,
      });
    }
    const restaurant = await Manager.findOne({ user_id: manager_id });
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found for this manager_id",
        success: false,
      });
    }

    const restaurant_id = restaurant.restaurant_id;

    const uniqueName = crypto.randomBytes(2).toString("hex");
    const fileName = `${uniqueName}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../assets/category");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const newFoodCategory = new FoodCategorySchema({
      name,
      description: description || null,
      manager_id,
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
    const { id, name, description, manager_id, is_active } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    if (!name || !manager_id || !description || !req.file) {
      return res.status(400).json({
        message: "Please provide at least one field to update",
        success: false,
      });
    }

    const foodCategoryGet = await FoodCategorySchema.findById(id);
    if (!foodCategoryGet) {
      return res.status(404).json({
        success: false,
        message: "Food category not found",
      });
    }

    foodCategoryGet.name = name;
    foodCategoryGet.manager_id = manager_id;
    foodCategoryGet.description = description || null;
    foodCategoryGet.is_active = is_active;

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

    const foodCategory = await FoodCategorySchema.findById(id);
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

    await FoodCategorySchema.findByIdAndDelete(id);

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
