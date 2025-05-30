const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const routes = require("./routes/Routes");
const errorMiddleware = require("./middlewares/errorMiddleware");
const cors = require("cors");
const NodeCache = require("node-cache");
const path = require("path");
const OrderModel = require("./models/Order");

dotenv.config();

connectDB();

const app = express();

var corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cache = new NodeCache();

app.delete("/api/cache/clear", (req, res) => {
  cache.flushAll();
  res.status(200).json({ message: "Cache cleared successfully!" });
});

app.get("/api/viva/webhook", (req, res) => {
  res.status(200).send("Webhook endpoint is live");
});

app.get("/api/order-status/:orderCode", async (req, res) => {
  try {
    const { orderCode } = req.params;
    const order = await OrderModel.findOne({ viva_order_code: orderCode });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.json({
      success: true,
      payment_status: order.payment_status,
      order_status: order.status,
      order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use("/api", routes);
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
