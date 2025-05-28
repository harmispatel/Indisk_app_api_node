const UserAuth = require("../models/authLogin");
const FoodItemSchema = require("../models/FoodItem");
const OrderModel = require("../models/Order");
const { createVivaOrder } = require("../utils/vivaWallet");

const order_date = new Date();

const formatOrderDate = (date) => {
  const padZero = (num) => String(num).padStart(2, "0");

  const day = padZero(date.getDate());
  const month = padZero(date.getMonth() + 1);
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = padZero(date.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${day}-${month}-${year} ${padZero(hours)}:${minutes} ${ampm}`;
};

const formattedOrderDate = formatOrderDate(order_date);

const getCart = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id)
      return res
        .status(400)
        .json({ success: false, message: "user_id required" });

    const user = await UserAuth.findById(user_id).populate("cart.food_item");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const cartDetails = user.cart
      .map((item) => {
        const food = item.food_item;
        if (!food) return null;

        return {
          food_item_id: food._id,
          image: food.image,
          product_name: food.name,
          price: food.base_price,
          quantity: item.quantity,
          total_price: food.base_price * item.quantity,
        };
      })
      .filter(Boolean);

    const totalPrice = cartDetails.reduce(
      (acc, item) => acc + item.total_price,
      0
    );

    const totalQuantity = cartDetails.reduce(
      (acc, item) => acc + item.quantity,
      0
    );

    const gstAmount = +(totalPrice * 0.05).toFixed(2);
    const grandTotal = +(totalPrice + gstAmount).toFixed(2);

    res.status(200).json({
      success: true,
      message: "Cart list fetched successfully",
      cart: cartDetails,
      total_quantity: totalQuantity,
      subtotal: totalPrice,
      gst_5_percent: gstAmount,
      total_with_gst: grandTotal,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: "user_id and product_id are required",
      });
    }

    const user = await UserAuth.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const food = await FoodItemSchema.findById(product_id);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: `Food item ${product_id} not found`,
      });
    }

    const index = user.cart.findIndex(
      (ci) => ci.food_item.toString() === product_id
    );
    if (index > -1) {
      user.cart[index].quantity += 1;
    } else {
      user.cart.push({ food_item: product_id, quantity: 1 });
    }

    await user.save();
    await user.populate("cart.food_item");

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully!",
    });
  } catch (err) {
    console.error("Error in addToCart:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { user_id, product_id, type } = req.body;

    if (!user_id || !product_id || !["increase", "decrease"].includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "user_id, product_id and valid type ('increase' or 'decrease') are required",
      });
    }

    const user = await UserAuth.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const item = user.cart.find((ci) => ci.food_item.toString() === product_id);

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    if (type === "increase") {
      item.quantity += 1;
    } else if (type === "decrease") {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        // Remove item from cart if quantity would become 0
        user.cart = user.cart.filter(
          (ci) => ci.food_item.toString() !== product_id
        );
      }
    }

    await user.save();
    await user.populate("cart.food_item");

    const cartDetails = user.cart.map((item) => {
      const food = item.food_item;
      return {
        food_item_id: food._id,
        image: food.image,
        product_name: food.name,
        price: food.base_price,
        quantity: item.quantity,
        total_price: food.base_price * item.quantity,
      };
    });

    res.status(200).json({
      success: true,
      message: `Quantity ${type === "increase" ? "increased" : "decreased"}!`,
      cart: cartDetails,
      total_cart_price: cartDetails.reduce(
        (acc, item) => acc + item.total_price,
        0
      ),
      total_quantity: cartDetails.reduce((acc, item) => acc + item.quantity, 0),
    });
  } catch (err) {
    console.error("Error in updateQuantity:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: "user_id and product_id are required",
      });
    }

    const user = await UserAuth.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.cart = user.cart.filter(
      (item) => item.food_item.toString() !== product_id
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully!",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id required" });
    }

    const user = await UserAuth.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.cart = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully!",
      cart: user.cart,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const placeOrder = async (req, res) => {
  try {
    const { user_id, table_no, payment_type } = req.body;

    if (!user_id || !table_no || !payment_type) {
      return res.status(400).json({
        success: false,
        message: "user_id, table_no, and payment_type are required",
      });
    }

    const user = await UserAuth.findById(user_id).populate("cart.food_item");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const totalAmountOver = user.cart.reduce((acc, item) => {
      return acc + item.food_item.price * item.quantity;
    }, 0);

    const items = user.cart.map((item) => ({
      food_item: item.food_item._id,
      quantity: item.quantity,
    }));

    const isViva = payment_type === "viva";
    const orderData = {
      user: user_id,
      table_no,
      items,
      payment_type: isViva ? "viva" : "cash",
      payment_status: "pending",
      status: "Pending",
      order_date: formattedOrderDate,
      total_amount: totalAmountOver,
    };

    const totalAmount = Math.round(totalAmountOver * 100);
    const description = "Restaurant Order";
    const reference = `ORDER-${Date.now()}`;

    if (payment_type === "viva") {
      const vivaOrder = await createVivaOrder(
        totalAmount,
        description,
        reference
      );

      const newOrder = await OrderModel.create({
        user: user_id,
        table_no,
        payment_type: "viva",
        payment_status: "pending",
        status: "Pending",
        order_date: formattedOrderDate,
        total_amount: totalAmount,
        viva_order_code: vivaOrder.orderCode,
      });

      return res.status(200).json({
        success: true,
        message: "Redirect to Viva Wallet for payment",
        checkoutUrl: vivaOrder.checkoutUrl,
        orderCode: vivaOrder.orderCode,
        orderId: newOrder._id,
      });
    }

    const newOrder = await OrderModel.create(orderData);

    user.cart = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (err) {
    console.error("placeOrder error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  placeOrder,
};
