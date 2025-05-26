const FoodCategorySchema = require("../models/foodCategory");
const FoodItemSchema = require("../models/FoodItem");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
const Restaurant = require("../models/RestaurantCreate");
const UserAuth = require("../models/authLogin");
const mongoose = require("mongoose");
const Manager = require("../models/manager");

const getFood = async (req, res) => {
  try {
    const { manager_id } = req.body;

    if (!manager_id) {
      return res.status(400).json({
        message: "manager_id is required",
        success: false,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(manager_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid manager_id format",
      });
    }

    const manager = await Manager.findOne({ user_id: manager_id });
    if (!manager) {
      return res.status(404).json({
        message: "Manager not found",
        success: false,
      });
    }

    const foodList = await FoodItemSchema.find({ created_by: manager_id })
      .populate("category", "name")
      .populate("created_by", "name")
      .sort({ created_at: -1 });

    res.status(200).json({
      message: "Food list fetched successfully",
      success: true,
      data: foodList,
    });
  } catch (err) {
    console.error("getFood error:", err);
    res.status(500).json({
      message: "Failed to retrieve food list",
      success: false,
      error: err.message,
    });
  }
};

const createFood = async (req, res) => {
  try {
    const {
      name,
      description,
      base_price,
      prices_by_quantity,
      category,
      is_available,
      created_by,
      unit,
      total_qty,
      available_qty,
    } = req.body;

    if (
      !name ||
      !base_price ||
      !category ||
      !is_available ||
      !created_by ||
      !unit ||
      !total_qty ||
      !available_qty ||
      !req.file
    ) {
      return res.status(400).json({
        message: "All fields required",
        success: false,
      });
    }

    const restaurant = await Manager.findOne({ user_id: created_by });
    if (!restaurant) {
      return res.status(404).json({
        message: "Manager not found!",
        success: false,
      });
    }

    if (isNaN(base_price)) {
      return res.status(400).json({
        message: "Base price must be a valid number",
        success: false,
      });
    }

    if (available_qty && !Number.isInteger(Number(available_qty))) {
      return res.status(400).json({
        message: "Available quantity must be an integer",
        success: false,
      });
    }

    if (total_qty && !Number.isInteger(Number(total_qty))) {
      return res.status(400).json({
        message: "Total quantity must be an integer",
        success: false,
      });
    }

    const parseArray = (val) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch (err) {
        return [];
      }
    };

    const parsedPrices = parseArray(prices_by_quantity);
    if (!Array.isArray(parsedPrices)) {
      return res.status(400).json({
        message: "Invalid prices_by_quantity format",
        success: false,
      });
    }

    for (const item of parsedPrices) {
      if (!item.quantity || isNaN(item.price)) {
        return res.status(400).json({
          message: "Each price entry must include valid quantity and price",
          success: false,
        });
      }
    }

    const existingCategory = await FoodCategorySchema.findById({
      _id: category,
    });
    if (!existingCategory) {
      return res
        .status(404)
        .json({ message: "Category not found", success: false });
    }

    const uniqueName = crypto.randomBytes(2).toString("hex");
    const fileName = `${uniqueName}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../assets/food");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const newFood = new FoodItemSchema({
      name,
      description,
      base_price,
      prices_by_quantity: parsedPrices,
      category,
      is_available: is_available ?? true,
      created_by,
      unit,
      total_qty: total_qty ?? 1,
      available_qty: available_qty ?? 1,
      image: `${process.env.FRONTEND_URL}/assets/food/${fileName}` || "",
    });

    await newFood.save();

    res.status(201).json({
      message: "Food item created successfully",
      success: true,
      data: newFood,
    });
  } catch (err) {
    console.error("Create Food Error:", err);
    res.status(500).json({
      message: "Failed to create food",
      success: false,
      error: err.message,
    });
  }
};

const updateFood = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      base_price,
      prices_by_quantity,
      category,
      is_available,
      created_by,
      unit,
      total_qty,
      available_qty,
    } = req.body;

    if (
      !id ||
      !name ||
      !base_price ||
      !category ||
      !is_available ||
      !created_by ||
      !unit ||
      !total_qty ||
      !available_qty ||
      !req.file
    ) {
      return res.status(400).json({
        message: "All fields required",
        success: false,
      });
    }

    const foodGet = await FoodItemSchema.findById(id);
    if (!foodGet) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    const restaurant = await Manager.findOne({ user_id: created_by });
    if (!restaurant) {
      return res.status(404).json({
        message: "Manager not found!",
        success: false,
      });
    }

    if (isNaN(base_price)) {
      return res.status(400).json({
        message: "Base price must be a valid number",
        success: false,
      });
    }

    if (available_qty && !Number.isInteger(Number(available_qty))) {
      return res.status(400).json({
        message: "Available quantity must be an integer",
        success: false,
      });
    }

    if (total_qty && !Number.isInteger(Number(total_qty))) {
      return res.status(400).json({
        message: "Total quantity must be an integer",
        success: false,
      });
    }

    const parseArray = (val) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch (err) {
        return [];
      }
    };

    const parsedPrices = parseArray(prices_by_quantity);
    if (!Array.isArray(parsedPrices)) {
      return res.status(400).json({
        message: "Invalid prices_by_quantity format",
        success: false,
      });
    }

    for (const item of parsedPrices) {
      if (!item.quantity || isNaN(item.price)) {
        return res.status(400).json({
          message: "Each price entry must include valid quantity and price",
          success: false,
        });
      }
    }

    const existingCategory = await FoodCategorySchema.findById({
      _id: category,
    });
    if (!existingCategory) {
      return res
        .status(404)
        .json({ message: "Category not found", success: false });
    }

    if (req.file) {
      const oldFileName = path.basename(foodGet.image || "");
      const oldFilePath = path.join(__dirname, "../assets/food", oldFileName);

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      const uniqueName = crypto.randomBytes(2).toString("hex");
      const ext = path.extname(req.file.originalname);
      const fileName = `${uniqueName}${ext}`;
      const uploadDir = path.join(__dirname, "../assets/food");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      foodGet.image = `${process.env.FRONTEND_URL}/assets/food/${fileName}`;
    }

    foodGet.name = name;
    foodGet.description = description;
    foodGet.base_price = base_price;
    foodGet.category = category;
    foodGet.is_available = is_available;
    foodGet.created_by = created_by;
    foodGet.unit = unit;
    foodGet.total_qty = total_qty;
    foodGet.available_qty = available_qty;
    foodGet.parsedPrices = parsedPrices;

    await foodGet.save();

    res.status(200).json({
      message: "Food item updated successfully",
      success: true,
      data: foodGet,
    });
  } catch (err) {
    console.error("Update Food Error:", err);
    res.status(500).json({
      message: "Failed to update food item",
      success: false,
      error: err.message,
    });
  }
};

const deleteFood = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required!",
      });
    }

    const foodData = await FoodItemSchema.findById(id);

    if (!foodData) {
      return res.status(404).json({
        message: "Food not found for the given ID",
        success: false,
      });
    }

    if (foodData.image) {
      const fileName = path.basename(foodData.image);
      const filePath = path.join(__dirname, "../assets/food", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await FoodItemSchema.findByIdAndDelete(id);

    res.status(200).json({
      message: "Food deleted successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete food",
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  getFood,
  createFood,
  updateFood,
  deleteFood,
};
