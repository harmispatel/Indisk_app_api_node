const Table = require("../models/Table");
const mongoose = require("mongoose");
const Manager = require("../models/manager");
const OrderModel = require("../models/Order");
const StaffData = require("../models/staff");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

const getTables = async (req, res) => {
  try {
    const { manager_id, staff_id } = req.body;

    let resolvedManagerId = null;

    if (manager_id) {
      if (!mongoose.Types.ObjectId.isValid(manager_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager_id format",
        });
      }

      const manager = await Manager.findOne({ user_id: manager_id });
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager not found",
        });
      }
      resolvedManagerId = manager_id;
    } else if (staff_id) {
      if (!mongoose.Types.ObjectId.isValid(staff_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid staff_id format",
        });
      }

      const staff = await StaffData.findById(staff_id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: "Staff not found",
        });
      }
      resolvedManagerId = staff.manager_id;
    } else {
      return res.status(400).json({
        success: false,
        message: "Either manager_id or staff_id is required",
      });
    }

    const tables = await Table.find({ manager_id: resolvedManagerId });

    if (!tables.length) {
      return res.status(404).json({
        success: false,
        message: "No tables found for this manager",
      });
    }

    const enrichedTables = await Promise.all(
      tables.map(async (table) => {
        const activeOrder = await OrderModel.findOne({
          table_no: table.table_no,
          status: { $in: ["Pending", "Preparing"] },
        });

        return {
          ...table.toObject(),
          order_time: activeOrder
            ? dayjs(activeOrder.order_date).fromNow()
            : null,
          available: !activeOrder,
          ordered_items_count: activeOrder ? activeOrder.items.length : 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Table list fetched successfully",
      data: enrichedTables,
    });
  } catch (err) {
    console.error("Error fetching tables:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const createTable = async (req, res) => {
  try {
    const { table_no, manager_id } = req.body;

    if (!table_no || !manager_id)
      return res.status(400).json({
        success: false,
        message: "table_no and manager_id are required",
      });

    if (!mongoose.Types.ObjectId.isValid(manager_id))
      return res.status(400).json({
        success: false,
        message: "Invalid manager_id",
      });

    const manager = await Manager.findOne({ user_id: manager_id });
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    const exists = await Table.findOne({ table_no });
    if (exists)
      return res.status(409).json({
        success: false,
        message: "Table number already exists",
      });

    await new Table({ table_no, manager_id }).save();

    res.status(201).json({
      success: true,
      message: "Table created successfully",
    });
  } catch (err) {
    console.error("Error creating table:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const deleteTable = async (req, res) => {
  try {
    const { table_id } = req.body;

    if (!table_id || !mongoose.Types.ObjectId.isValid(table_id)) {
      return res.status(400).json({
        success: false,
        message: "Valid table_id is required",
      });
    }

    const table = await Table.findById(table_id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    await Table.findByIdAndDelete(table_id);

    return res.status(200).json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting table:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

module.exports = {
  getTables,
  createTable,
  deleteTable,
};
