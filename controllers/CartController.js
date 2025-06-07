const UserAuth = require("../models/authLogin");
const FoodItemSchema = require("../models/FoodItem");
const OrderModel = require("../models/Order");
const { createVivaOrder } = require("../utils/vivaWallet");
const Cart = require("../models/CartModel");

const getCart = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id is required" });
    }

    const user = await UserAuth.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const cart = await Cart.findOne({ user_id }).populate("items.product_id");
    if (!cart || cart.items.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "Cart is empty", cart: [] });
    }

    const cartDetails = cart.items.map((item) => {
      const food = item.product_id;
      return {
        food_item_id: food._id,
        image: food.image,
        product_name: food.name,
        price: food.base_price,
        quantity: item.quantity,
        total_price: food.base_price * item.quantity,
      };
    });

    const subtotal = cartDetails.reduce(
      (acc, item) => acc + item.total_price,
      0
    );
    const totalQuantity = cartDetails.reduce(
      (acc, item) => acc + item.quantity,
      0
    );
    const gstAmount = +(subtotal * 0.05).toFixed(2);
    const grandTotal = +(subtotal + gstAmount).toFixed(2);

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      cart: cartDetails,
      total_quantity: totalQuantity,
      subtotal,
      gst_5_percent: gstAmount,
      total_with_gst: grandTotal,
    });
  } catch (err) {
    console.error("Error in getCart:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const addToCart = async (req, res) => {
  try {
    let { user_id, product_id, quantity } = req.body;

    if (!user_id || !product_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: "user_id, product_id, and valid quantity are required",
      });
    }

    quantity = parseInt(quantity) || 1;
    if (quantity < 1) quantity = 1;

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

    let cart = await Cart.findOne({ user_id: user_id });

    if (!cart) {
      cart = new Cart({
        user_id: user_id,
        items: [{ product_id: product_id, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product_id.toString() === product_id
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product_id, quantity });
      }
    }

    await cart.save();

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

    const cart = await Cart.findOne({ user_id }).populate("items.product_id");

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found for user" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product_id._id.toString() === product_id
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    if (type === "increase") {
      cart.items[itemIndex].quantity += 1;
    } else if (type === "decrease") {
      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1;
      } else {
        cart.items.splice(itemIndex, 1);
      }
    }

    await cart.save();

    await cart.populate("items.product_id");

    const cartDetails = cart.items.map((item) => {
      const product = item.product_id;
      return {
        food_item_id: product._id,
        image: product.image,
        product_name: product.name,
        price: product.base_price,
        quantity: item.quantity,
        total_price: product.base_price * item.quantity,
      };
    });

    res.status(200).json({
      success: true,
      message: `Quantity ${type === "increase" ? "increased" : "decreased"}!`,
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

    const cart = await Cart.findOne({ user_id });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found for user" });
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => item.product_id.toString() !== product_id
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    await cart.save();

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
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const cart = await Cart.findOne({ user_id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found for this user",
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully!",
      cart: user_id.cart,
    });
  } catch (err) {
    console.error("Error in clearCart:", err);
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

    const cart = await Cart.findOne({ user_id }).populate("items.product_id");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const totalAmountRaw = cart.items.reduce((acc, item) => {
      const product = item.product_id;
      const price = product?.base_price || 0;
      return acc + price * item.quantity;
    }, 0);

    const items = cart.items.map((item) => ({
      food_item: item.product_id._id,
      quantity: item.quantity,
    }));

    let order;
    let isNewOrder = false;

    let activeOrder = await OrderModel.findOne({
      table_no,
      status: { $in: ["Pending", "Preparing"] },
    });

    if (activeOrder) {
      activeOrder.items = activeOrder.items.concat(items);
      activeOrder.total_amount += totalAmountRaw;
      await activeOrder.save();
      order = activeOrder;
    } else {
      const orderData = {
        user: user_id,
        table_no,
        items,
        payment_type: payment_type === "viva" ? "viva" : "cash",
        payment_status: "pending",
        status: "Pending",
        order_date: new Date(),
        total_amount: totalAmountRaw,
      };

      if (payment_type === "viva") {
        const totalAmount = Math.round(totalAmountRaw * 100);
        const description = "Restaurant Order";
        const reference = `ORDER-${Date.now()}`;

        const vivaOrder = await createVivaOrder(
          totalAmount,
          description,
          reference
        );

        order = await OrderModel.create({
          ...orderData,
          viva_order_code: vivaOrder.orderCode,
        });

        cart.items = [];
        await cart.save();

        return res.status(200).json({
          success: true,
          message: "Redirect to Viva Wallet for payment",
          checkoutUrl: vivaOrder.checkoutUrl,
          orderCode: vivaOrder.orderCode,
          orderId: order._id,
        });
      } else {
        order = await OrderModel.create(orderData);
        isNewOrder = true;
      }
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: isNewOrder
        ? "Order placed successfully"
        : "Order updated successfully",
      order,
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
