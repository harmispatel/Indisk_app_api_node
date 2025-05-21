const Restaurant = require("../models/RestaurantCreate");
const UserAuth = require("../models/authLogin");
const ManagerAuth = require("../models/manager");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const config = require("../config/nodemailer");
const nodemailer = require("nodemailer");

const getRestaurant = async (req, res) => {
  try {
    const { owner_id } = req.body;

    const restaurants = await Restaurant.find({ owner_id: owner_id });

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
  try {
    const {
      owner_id,
      email,
      password,
      phone,
      name,
      address,
      status,
      description,
      location,
      cuisine_type,
    } = req.body;

    if (
      !owner_id ||
      !name ||
      !email ||
      !phone ||
      !req.file ||
      !address ||
      status === undefined
    ) {
      return res.status(400).json({
        message:
          "Missing required fields:owner_id, name, email, phone, image, address or status",
        success: false,
      });
    }

    const ownerExists = await UserAuth.findOne({ _id: owner_id });
    if (!ownerExists) {
      return res.status(400).json({
        message: "Owner not found!",
        success: false,
      });
    }

    const emailExists = await Restaurant.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        message: "Restaurant with this email already exists",
        success: false,
      });
    }

    const emailManagerExists = await ManagerAuth.findOne({ email });
    if (emailManagerExists) {
      return res.status(400).json({
        message: "Restaurant Manager with this email already exists",
        success: false,
      });
    }

    const phoneExists = await Restaurant.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({
        message: "Restaurant with this phone number already exists",
        success: false,
      });
    }

    const uniqueName = crypto.randomBytes(2).toString("hex");
    const fileName = `${uniqueName}${path.extname(req.file.originalname)}`;
    const uploadDir = path.join(__dirname, "../assets/restaurant");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    const newRestaurant = new Restaurant({
      owner_id,
      email,
      password,
      phone,
      name,
      address,
      image: `${process.env.FRONTEND_URL}/assets/restaurant/${fileName}` || "",
      status,
      description: description?.length > 0 ? description : null,
      location,
      cuisine_type,
    });

    await newRestaurant.save();

    const manager = new UserAuth({
      email,
      password,
      role: "manager",
    });
    await manager.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });

    const mailOptions = {
      from: config.emailUser,
      to: email,
      secure: false,
      subject: "Your Restaurant Login Credentials",
      html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9; color: #333;">
      <h2 style="color: #2c3e50; border-bottom: 2px solid #e2e2e2; padding-bottom: 10px;">🍽️ Welcome to Our Restaurant Platform!</h2>

      <p style="font-size: 15px; line-height: 1.6;">
        Hello,<br>
        Your restaurant has been successfully registered. Here are your account and restaurant details:
      </p>

      <h3 style="margin-top: 25px; color: #34495e;">🔐 Login Credentials</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 5px 0;"><strong>Email:</strong></td>
          <td>${email}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Password:</strong></td>
          <td>${password}</td>
        </tr>
      </table>

      <h3 style="margin-top: 25px; color: #34495e;">🏪 Restaurant Info</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 5px 0;"><strong>Name:</strong></td>
          <td>${name}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Address:</strong></td>
          <td>${address}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Location:</strong></td>
          <td>${location}</td>
        </tr>
      </table>

      ${
        fileName
          ? `
      <div style="margin: 20px 0;">
        <strong style="display: block; margin-bottom: 10px;">📷 Restaurant Image:</strong>
        <img src="cid:restaurantImage" alt="Restaurant Image" style="width: 100%; max-width: 500px; border-radius: 5px;">
      </div>
      `
          : ""
      }

      <p style="margin-top: 20px; font-size: 14px;">🔒 Please change your password after your first login for security reasons.</p>

      <p style="margin-top: 30px; font-size: 14px;">
        Cheers,<br>
        <strong>The Restaurant Platform Team</strong>
      </p>
    </div>
  `,
      attachments: fileName
        ? [
            {
              filename: "restaurant-image.png",
              path: `${process.env.FRONTEND_URL}/assets/restaurant/${fileName}`,
              cid: "restaurantImage",
            },
          ]
        : [],
    };

    transporter.sendMail(mailOptions, function (error) {
      if (error) {
        console.log(error);
      } else {
        console.log("Mail has been sent to your email");
      }
    });

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
  try {
    const {
      id,
      owner_id,
      email,
      password,
      phone,
      name,
      address,
      status,
      description,
      location,
      cuisine_type,
    } = req.body;

    if (
      !id ||
      !owner_id ||
      !email ||
      !phone ||
      !name ||
      !req.file ||
      !address ||
      status === undefined
    ) {
      return res.status(400).json({
        message:
          "Missing required fields:ID, owner_id, email, phone, name, image, address or status",
        success: false,
      });
    }

    const idExists = await Restaurant.findById(id);
    if (!idExists) {
      return res.status(400).json({
        message: "Restaurant not found!",
        success: false,
      });
    }

    const ownerExists = await UserAuth.findById(owner_id);
    if (!ownerExists) {
      return res.status(400).json({
        message: "Owner not found!",
        success: false,
      });
    }

    const duplicate = await Restaurant.findOne({
      _id: { $ne: id },
      $or: [{ email }, { phone }],
    });

    if (duplicate) {
      if (duplicate.email === email) {
        return res
          .status(409)
          .json({ success: false, message: "Email already in use" });
      }
      if (duplicate.phone === phone) {
        return res
          .status(409)
          .json({ success: false, message: "Contact already in use" });
      }
    }

    const duplicateManager = await ManagerAuth.findOne({
      _id: { $ne: id },
      $or: [{ email }],
    });

    if (duplicateManager) {
      if (duplicateManager.email === email) {
        return res.status(409).json({
          success: false,
          message: "Restaurant Manager with this email already exists",
        });
      }
    }

    if (idExists) {
      const oldFileName = path.basename(idExists.image || "");
      const oldFilePath = path.join(
        __dirname,
        "../assets/restaurant",
        oldFileName
      );

      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      const uniqueName = crypto.randomBytes(2).toString("hex");
      const ext = path.extname(req.file.originalname);
      const fileName = `${uniqueName}${ext}`;
      const uploadDir = path.join(__dirname, "../assets/restaurant");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      idExists.image = `${process.env.FRONTEND_URL}/assets/restaurant/${fileName}`;
    }

    idExists.owner_id = owner_id || idExists.owner_id;
    idExists.email = email || idExists.email;
    idExists.password = password || idExists.password;
    idExists.phone = phone || idExists.phone;
    idExists.name = name || idExists.name;
    idExists.address = address || idExists.address;
    idExists.status = status || idExists.status;
    idExists.description = description || idExists.description;
    idExists.location = location || idExists.location;
    idExists.cuisine_type = cuisine_type || idExists.cuisine_type;

    await idExists.save();

    let manager = await ManagerAuth.findOne({ email });

    if (manager) {
      manager.email = email || manager.email;
      manager.password = password || manager.password;
      manager.role = "manager";
      await manager.save();
    }

    res.status(200).json({
      message: "Restaurant updated successfully",
      success: true,
      data: idExists,
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
  try {
    const { id, owner_id } = req.body;

    if (!id || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "Both ID and user_id are required",
      });
    }

    const ownerExists = await UserAuth.findOne({ _id: owner_id });
    if (!ownerExists) {
      return res.status(400).json({
        message: "Owner not found!",
        success: false,
      });
    }

    const restaurant = await Restaurant.findOne({ _id: id, owner_id });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found for the given owner_id",
        success: false,
      });
    }

    if (restaurant.image) {
      const fileName = path.basename(restaurant.image);
      const filePath = path.join(__dirname, "../assets/restaurant", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Restaurant.findByIdAndDelete(id);

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

const getRestaurantDetails = async (req, res) => {
  try {
    const { owner_id, restaurant_id } = req.body;
    if (!owner_id || !restaurant_id) {
      return res.status(400).json({
        message: "Missing required fields:owner_id, restaurant_id",
        success: false,
      });
    }

    const ownerExists = await UserAuth.findOne({ _id: owner_id });
    if (!ownerExists) {
      return res.status(400).json({
        message: "Owner not found!",
        success: false,
      });
    }

    const restaurant = await Restaurant.findById(restaurant_id);
    if (!restaurant) {
      return res.status(400).json({
        message: "Restaurant not found!",
        success: false,
      });
    }

    // const categories = await Category.find({ restaurant_id });
    // const foods = await Food.find({ restaurant_id });
    // const staff = await Staff.find({ restaurant_id });
    // let manager = null;
    // if (restaurant.manager_id) {
    //   manager = await UserAuth.findById(restaurant.manager_id);
    // } else {
    //   manager = await UserAuth.findOne({ restaurant_id, role: "manager" });
    // }

    const categories = [
      { _id: "cat1", name: "Appetizers", restaurant_id },
      { _id: "cat2", name: "Main Course", restaurant_id },
    ];

    const foods = [
      {
        _id: "food1",
        name: "Garlic Bread",
        price: 5.99,
        category_id: "cat1",
        restaurant_id,
      },
      {
        _id: "food2",
        name: "Spaghetti Carbonara",
        price: 12.99,
        category_id: "cat2",
        restaurant_id,
      },
    ];

    const staff = [
      { _id: "staff1", name: "John Doe", role: "chef", restaurant_id },
      { _id: "staff2", name: "Jane Smith", role: "waiter", restaurant_id },
    ];

    const manager = {
      _id: "static_manager_id",
      name: "Alice Johnson",
      email: "alice@bistro.com",
      role: "manager",
    };

    const restaurantDetails = {
      ...restaurant.toObject(),
      categories,
      foods,
      staff,
      manager,
    };

    return res.status(200).json({
      message: "Restaurant details fetched successfully",
      success: true,
      data: restaurantDetails,
    });
  } catch (error) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to retrieve restaurant details",
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
  getRestaurantDetails,
};
