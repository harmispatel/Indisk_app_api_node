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

    const existingUser = await UserAuth.findOne({ _id: user_id });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (!food_category) {
      return res
        .status(400)
        .json({ message: "Please provide food category", success: false });
    }

    const existingCategory = await foodCategorySchema.findOne({
      _id: food_category,
    });

    if (!existingCategory) {
      return res.status(404).json({
        message: "Food category not found",
        success: false,
      });
    }

    const foodItems = await FoodItemSchema.find({ food_category });
    res.status(200).json({
      message: "Food list fetched successfully",
      success: true,
      data: foodItems.length ? foodItems : null,
    });
  } catch (err) {
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
      food_category,
      name,
      price,
      offerPrice,
      quantity,
      stock,
      restaurant_id,
      created_by,
      description,
      status,
      is_veg,
      is_spicy,
      preparation_time,
      ingredients,
      allergens,
      tags,
      rating,
      total_ratings,
      is_customizable,
      addons,
    } = req.body;

    const requiredFields = {
      food_category,
      name,
      price,
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

    if (isNaN(price)) {
      return res
        .status(400)
        .json({ message: "Price must be a number", success: false });
    }

    if (offerPrice && isNaN(offerPrice)) {
      return res
        .status(400)
        .json({ message: "Offer price must be a number", success: false });
    }

    if (quantity && !Number.isInteger(Number(quantity))) {
      return res
        .status(400)
        .json({ message: "Quantity must be an integer", success: false });
    }

    if (stock && !Number.isInteger(Number(stock))) {
      return res
        .status(400)
        .json({ message: "Stock must be an integer", success: false });
    }

    if (rating && (isNaN(rating) || rating < 0 || rating > 5)) {
      return res
        .status(400)
        .json({ message: "Rating must be between 0 and 5", success: false });
    }

    if (total_ratings && !Number.isInteger(Number(total_ratings))) {
      return res
        .status(400)
        .json({ message: "Total ratings must be an integer", success: false });
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
      food_category,
      name,
      price,
      offerPrice: offerPrice || 0,
      quantity: quantity || 1,
      stock: stock || 0,
      restaurant_id,
      created_by,
      description,
      status: status || "active",
      is_veg: is_veg === "true" || is_veg === true,
      is_spicy: is_spicy === "true" || is_spicy === true,
      preparation_time,
      ingredients: parseArray(ingredients),
      allergens: parseArray(allergens),
      tags: parseArray(tags),
      rating: rating || 0,
      total_ratings: total_ratings || 0,
      is_customizable: is_customizable === "true" || is_customizable === true,
      addons: parseArray(addons),
      images: imageUrls,
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
  deleteFood,
};
