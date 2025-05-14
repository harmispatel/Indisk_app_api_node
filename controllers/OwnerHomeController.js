const StaffData = require("../models/staff");
const Restaurant = require("../models/RestaurantCreate");
const ManagerAuth = require("../models/manager");
const UserAuth = require("../models/authLogin");

const getOwnerHome = async (req, res) => {
  try {
    const { owner_id } = req.body;

    if (!owner_id) {
      return res.status(400).json({
        success: false,
        message: "owner_id is required",
      });
    }

    const ownerExists = await UserAuth.findOne({ _id: owner_id });
    if (!ownerExists) {
      return res.status(400).json({
        message: "Owner not found!",
        success: false,
      });
    }

    const staffCount = await StaffData.countDocuments();
    const restaurantCount = await Restaurant.countDocuments();
    const managerCount = await ManagerAuth.countDocuments();

    const bestSellers = [
      {
        restaurant_id: "1",
        image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/0f/f0/a6/tg-s-the-oriental-grill.jpg?w=600&h=-1&s=1",
        name: "Spicy Spoon",
        location: "New York, NY",
        cuisine_type: "Indian",
        orderCount: 150,
        totalSales: 3000,
      },
      {
        restaurant_id: "2",
        image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/0f/f0/a6/tg-s-the-oriental-grill.jpg?w=600&h=-1&s=1",
        name: "Bella Pasta",
        location: "San Francisco, CA",
        cuisine_type: "Italian",
        orderCount: 120,
        totalSales: 2750,
      },
      {
        restaurant_id: "3",
        image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/0f/f0/a6/tg-s-the-oriental-grill.jpg?w=600&h=-1&s=1",
        name: "Sushi Zen",
        location: "Los Angeles, CA",
        cuisine_type: "Japanese",
        orderCount: 100,
        totalSales: 2200,
      },
      {
        restaurant_id: "4",
        image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/0f/f0/a6/tg-s-the-oriental-grill.jpg?w=600&h=-1&s=1",
        name: "Taco Fiesta",
        location: "Austin, TX",
        cuisine_type: "Mexican",
        orderCount: 90,
        totalSales: 1900,
      },
      {
        restaurant_id: "5",
        image: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/0f/f0/a6/tg-s-the-oriental-grill.jpg?w=600&h=-1&s=1",
        name: "Burger Haven",
        location: "Chicago, IL",
        cuisine_type: "American",
        orderCount: 80,
        totalSales: 1600,
      },
    ];

    return res.status(200).json({
      success: true,
      data: {
        staffCount,
        restaurantCount,
        managerCount,
        best_sellers: bestSellers,
      },
    });
  } catch (error) {
    console.error("Error in getOwnerHome:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = { getOwnerHome };
