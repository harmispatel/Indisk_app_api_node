const foodCategorySchema = require("../models/foodCategory");
const FoodItemSchema = require("../models/FoodItem");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
const Restaurant = require("../models/RestaurantCreate");
const UserAuth = require("../models/authLogin");

const getFood = async (req, res) => {
  try {
    const { food_category, user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "user_id is required",
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

    let filter = {};
    if (food_category) {
      const existingCategory = await foodCategorySchema.findById(food_category);
      if (!existingCategory) {
        return res.status(404).json({
          message: "Food category not found",
          success: false,
        });
      }
      filter.food_category = food_category;
    }

    const foodItems = await FoodItemSchema.find(filter).populate([
      { path: "food_category", select: "name" },
      { path: "restaurant_id", select: "name" },
      { path: "created_by", select: "name email" },
    ]);

    res.status(200).json({
      message: "Food list fetched successfully",
      success: true,
      data: foodItems.length ? foodItems : [],
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
      unit,
      available_qty,
      content_per_single_item,
      cooking_time,
      preparations,
      min_stock_required,
      priority,
      preparations_time,
      time_unit,
      shifting_constant,
      food_category,
      description,
      restaurant_id,
      created_by,
      base_price,
      prices_by_quantity,
    } = req.body;

    const requiredFields = {
      food_category,
      name,
      base_price,
      restaurant_id,
      created_by,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return res.status(400).json({
          message: `${key} is required`,
          success: false,
        });
      }
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

    if (isNaN(base_price)) {
      return res
        .status(400)
        .json({ message: "Base price must be a number", success: false });
    }

    if (available_qty && !Number.isInteger(Number(available_qty))) {
      return res.status(400).json({
        message: "Available quantity must be an integer",
        success: false,
      });
    }

    if (min_stock_required && !Number.isInteger(Number(min_stock_required))) {
      return res.status(400).json({
        message: "Minimum stock required must be an integer",
        success: false,
      });
    }

    const existingCategory = await foodCategorySchema.findById(food_category);
    if (!existingCategory) {
      return res.status(404).json({
        message: "Food category not found",
        success: false,
      });
    }

    const imageUrls = [];
    const uploadDir = path.join(__dirname, "../assets/food");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (req.files?.length > 0) {
      for (const file of req.files) {
        const uniqueId = crypto.randomBytes(2).toString("hex");
        const fileName = `${uniqueId}${path.extname(file.originalname)}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        imageUrls.push(`${process.env.FRONTEND_URL}/assets/food/${fileName}`);
      }
    } else {
      return res.status(400).json({
        message: "Please upload at least one image",
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

    const newFood = new FoodItemSchema({
      name,
      unit,
      available_qty,
      content_per_single_item,
      cooking_time,
      preparations,
      min_stock_required,
      priority,
      preparations_time,
      time_unit,
      shifting_constant,
      description,
      food_category,
      restaurant_id,
      created_by,
      base_price,
      prices_by_quantity: parseArray(prices_by_quantity),
      image_url: imageUrls,
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
      unit,
      available_qty,
      content_per_single_item,
      cooking_time,
      preparations,
      min_stock_required,
      priority,
      preparations_time,
      time_unit,
      shifting_constant,
      description,
      food_category,
      restaurant_id,
      created_by,
      base_price,
    } = req.body;

    if (!id || !created_by) {
      return res.status(400).json({
        message: "Food item ID and created_by (user ID) are required",
        success: false,
      });
    }

    const foodItem = await FoodItemSchema.findById(id);
    if (!foodItem) {
      return res.status(404).json({
        message: "Food item not found",
        success: false,
      });
    }

    const userExists = await UserAuth.findById(created_by);
    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const imageUrls = foodItem.image_url || [];
    const uploadDir = path.join(__dirname, "../assets/food");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (req.files?.length > 0) {
      for (const imgUrl of imageUrls) {
        const fileName = path.basename(imgUrl);
        const filePath = path.join(uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      imageUrls.length = 0;

      for (const file of req.files) {
        const uniqueId = crypto.randomBytes(2).toString("hex");
        const fileName = `${uniqueId}${path.extname(file.originalname)}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        imageUrls.push(`${process.env.FRONTEND_URL}/assets/food/${fileName}`);
      }
    }

    const parseArray = (val) => {
      try {
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch {
        return [];
      }
    };

    const updateData = {
      name,
      unit,
      available_qty,
      content_per_single_item,
      cooking_time,
      preparations,
      min_stock_required,
      priority,
      preparations_time,
      description,
      time_unit,
      shifting_constant,
      food_category,
      restaurant_id,
      base_price,
      prices_by_quantity: parseArray(req.body.prices_by_quantity),
      image_url: imageUrls,
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    await FoodItemSchema.findByIdAndUpdate(id, updateData, { new: true });

    res.status(200).json({
      message: "Food item updated successfully",
      success: true,
      data: updateData,
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
    const { id, user_id } = req.body;

    if (!id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Both ID and user_id are required",
      });
    }

    const foodData = await FoodItemSchema.findOne({
      _id: id,
      created_by: user_id,
    });

    if (!foodData) {
      return res.status(404).json({
        message: "Food not found for the given user_id",
        success: false,
      });
    }

    if (foodData.images && foodData.images.length > 0) {
      for (const imgUrl of foodData.images) {
        const fileName = path.basename(imgUrl);
        const filePath = path.join(__dirname, "../assets/food", fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
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
