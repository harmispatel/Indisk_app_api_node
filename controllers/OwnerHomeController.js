const StaffData = require("../models/staff");
const Restaurant = require("../models/RestaurantCreate");
const ManagerAuth = require("../models/manager");
const UserAuth = require("../models/authLogin");
const Order = require("../models/ownerHome"); // 👈 make sure this is imported

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

    // 🥇 Get Best Seller Restaurants
    const bestSellers = await Order.aggregate([
      { $match: { owner_id: ownerExists._id } },
      {
        $group: {
          _id: "$restaurant_id",
          totalSales: { $sum: "$total_price" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalSales: -1 }, // highest total sales first
      },
      {
        $limit: 5, // top 5 restaurants
      },
      {
        $lookup: {
          from: "restaurants",
          localField: "_id",
          foreignField: "_id",
          as: "restaurant",
        },
      },
      {
        $unwind: "$restaurant",
      },
      {
        $project: {
          _id: 0,
          restaurant_id: "$_id",
          name: "$restaurant.name",
          location: "$restaurant.location",
          totalSales: 1,
          orderCount: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        staffCount,
        restaurantCount,
        managerCount,
      },
      best_sellers: bestSellers,
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
