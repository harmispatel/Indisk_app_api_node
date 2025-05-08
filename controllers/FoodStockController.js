const foodStock = require("../models/FoodStock");
const Restaurant = require("../models/RestaurantCreate");
const UserAuth = require("../models/authLogin");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const getFoodStock = async (req, res) => {
  try {
    const { user_id, restaurant_id } = req.body;

    const getFoodStockData = await foodStock.find();

    return res.status(200).json({
      success: true,
      message: "Food stock items fetched successfully",
      data: getFoodStockData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching food stock items",
      error: error.message,
    });
  }
};

const createFoodStock = async (req, res) => {
  try {
    const { name, quantity, unit, expiryDate, created_by, restaurant_id } =
      req.body;
    if (
      !name ||
      !quantity ||
      !unit ||
      !expiryDate ||
      !created_by ||
      !restaurant_id
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, quantity, unit, expiryDate",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const existingUser = await UserAuth.findById(created_by);
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

    const uniqueId = crypto.randomBytes(2).toString("hex");
    const fileName = `${uniqueId}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../assets/foodStocks");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const newFoodStock = new foodStock({
      name,
      quantity,
      unit,
      expiryDate,
      restaurant_id,
      created_by,
      image: `${process.env.FRONTEND_URL}/assets/foodStocks/${fileName}`,
    });

    await newFoodStock.save();

    res.status(201).json({
      message: "Food stock created successfully",
      success: true,
      data: newFoodStock,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create food stock",
      error: error.message,
    });
  }
};

const updateFoodStock = async (req, res) => {
  try {
    const {
      food_id,
      name,
      quantity,
      unit,
      expiryDate,
      created_by,
      restaurant_id,
    } = req.body;
    if (
      !food_id ||
      !name ||
      !quantity ||
      !unit ||
      !expiryDate ||
      !created_by ||
      !restaurant_id
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: name, quantity, unit, expiryDate",
      });
    }

    const foodStockItem = await foodStock.findById(food_id);
    if (!foodStockItem) {
      return res.status(404).json({
        message: "Food stock not found",
        success: false,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const existingUser = await UserAuth.findById(created_by);
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

    if (req.file) {
      const uniqueId = crypto.randomBytes(2).toString("hex");
      const fileName = `${uniqueId}${path.extname(req.file.originalname)}`;
      const uploadDir = path.join(__dirname, "../assets/foodStocks");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      foodStockItem.image = `${process.env.FRONTEND_URL}/assets/foodStocks/${fileName}`;
    }

    foodStockItem.name = name;
    foodStockItem.quantity = quantity;
    foodStockItem.unit = unit;
    foodStockItem.expiryDate = expiryDate;
    foodStockItem.restaurant_id = restaurant_id;
    foodStockItem.created_by = created_by;

    await foodStockItem.save();

    return res.status(200).json({
      success: true,
      message: "Food stock updated successfully",
      data: foodStockItem,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update food stock",
      error: error.message,
    });
  }
};

const deleteFoodStock = async (req, res) => {
  try {
    const { id, user_id } = req.body;

    if (!id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Both ID and user_id are required",
      });
    }

    const foodStockData = await foodStock.findOne({
      _id: id,
      created_by: user_id,
    });

    if (!foodStockData) {
      return res.status(404).json({
        message: "Food stock not found for this given user_id",
        success: false,
      });
    }

    if (foodStockData.image) {
      const fileName = path.basename(foodStockData.image);
      const filePath = path.join(__dirname, "../assets/foodStocks", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await foodStock.findByIdAndDelete(id);

    res.status(200).json({
      message: "Food stock deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete food stock",
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  getFoodStock,
  createFoodStock,
  updateFoodStock,
  deleteFoodStock,
};
