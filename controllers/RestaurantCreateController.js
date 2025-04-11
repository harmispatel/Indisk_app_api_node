const Restaurant = require("../models/RestaurantCreate");

const getRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurants = await Restaurant.find({ user_id: id });

    res.status(200).json({
      message: "Restaurants fetched successfully",
      success: true,
      data: restaurants,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve restaurants",
      success: false,
      error: err.message,
    });
  }
};

const createRestaurant = async (req, res) => {
  const { id } = req.params;
  const {
    restaurant_name,
    email,
    contact,
    description,
    tagLine,
    isActive,
    website_link,
  } = req.body;

  const logo = req.file ? req.file.filename : null;

  if (
    !restaurant_name ||
    !email ||
    !contact ||
    !logo ||
    isActive === undefined
  ) {
    return res.status(400).json({
      message: "Please provide restaurant_name, email, contact, logo, isActive",
      success: false,
    });
  }

  try {
    const emailExists = await Restaurant.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        message: "Restaurant with this email already exists",
        success: false,
      });
    }

    const contactExists = await Restaurant.findOne({ contact });
    if (contactExists) {
      return res.status(400).json({
        message: "Restaurant with this contact already exists",
        success: false,
      });
    }

    const newRestaurant = new Restaurant({
      restaurant_name,
      email,
      contact,
      logo: `${process.env.FRONTEND_URL}/uploads/${logo}`,
      description,
      tagLine,
      isActive,
      website_link,
      user_id: id,
    });

    await newRestaurant.save();

    res.status(201).json({
      message: "Restaurant created successfully",
      success: true,
      data: newRestaurant,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create restaurant",
      success: false,
      error: err.message,
    });
  }
};

const updateRestaurant = async (req, res) => {
  const { user_id } = req.params;

  const {
    id,
    restaurant_name,
    email,
    contact,
    description,
    tagLine,
    website_link,
    isActive,
  } = req.body;

  const logo = req.file
    ? `${process.env.FRONTEND_URL}/uploads/${req.file.filename}`
    : null;

  if (!id || !restaurant_name || !email || !contact || isActive === undefined) {
    return res.status(400).json({
      message: "Please provide id, restaurant_name, email, contact, isActive",
      success: false,
    });
  }

  try {
    const restaurant = await Restaurant.findOne({ user_id });
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found for this user",
        success: false,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (!/^\d{10}$/.test(contact)) {
      return res.status(400).json({
        success: false,
        message: "Contact number must be exactly 10 digits",
      });
    }

    const duplicate = await Restaurant.findOne({
      _id: { $ne: id },
      $or: [{ email }, { contact }],
    });

    if (duplicate) {
      if (duplicate.email === email) {
        return res
          .status(409)
          .json({ success: false, message: "Email already in use" });
      }
      if (duplicate.contact === contact) {
        return res
          .status(409)
          .json({ success: false, message: "Contact already in use" });
      }
    }

    restaurant.restaurant_name = restaurant_name;
    restaurant.email = email;
    restaurant.contact = contact;
    restaurant.logo = logo || restaurant.logo;
    restaurant.description = description || restaurant.description;
    restaurant.tagLine = tagLine || restaurant.tagLine;
    restaurant.website_link = website_link || restaurant.website_link;
    restaurant.isActive = isActive;

    await restaurant.save();

    // const existingRestaurant = await Restaurant.findOne({ email });
    // if (existingRestaurant) {
    //   return res.status(400).json({
    //     message: "Restaurant with this email already exists",
    //     success: false,
    //   });
    // }

    // const existingRestaurantNumber = await Restaurant.findOne({ contact });
    // if (existingRestaurantNumber) {
    //   return res.status(400).json({
    //     message: "Restaurant with this contact already exists",
    //     success: false,
    //   });
    // }

    res.status(200).json({
      message: "Restaurant updated successfully",
      success: true,
      data: {
        user_id: user_id,
        restaurant_name: restaurant.restaurant_name,
        email: restaurant.email,
        contact: restaurant.contact,
        logo: restaurant.logo,
        description: restaurant.description,
        tagLine: restaurant.tagLine,
        isActive: restaurant.isActive,
        website_link: restaurant.website_link,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update restaurant",
      success: false,
      error: err.message,
    });
  }
};

const deleteRestaurant = async (req, res) => {
  const { user_id } = req.params;

  try {
    const restaurant = await Restaurant.findOneAndDelete({ user_id });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found for this user",
        success: false,
      });
    }

    res.status(200).json({
      message: "Restaurant deleted successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete restaurant",
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
