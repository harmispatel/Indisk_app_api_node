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

    return res.status(200).json({
      success: true,
      data: {
        staffCount,
        restaurantCount,
        managerCount,
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
