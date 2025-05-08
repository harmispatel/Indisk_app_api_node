const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/managers");
const uploadDirStaff = path.join(__dirname, "../uploads/staffs");
const uploadRestaurantLogo = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageManager = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadManager = multer({ storage: storageManager });

if (!fs.existsSync(uploadDirStaff)) {
  fs.mkdirSync(uploadDirStaff, { recursive: true });
}

const storageStaff = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirStaff);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadStaff = multer({ storage: storageStaff });

if (!fs.existsSync(uploadRestaurantLogo)) {
  fs.mkdirSync(uploadRestaurantLogo, { recursive: true });
}

const storageRestaurant = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadRestaurantLogo);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// For Create Staff 1 or 2
const uploadRestaurant = multer({ storage: storageRestaurant });

const storage = multer.memoryStorage();

const uploadStaffs = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // if (
    //   file.mimetype === "image/jpeg" ||
    //   file.mimetype === "image/png" ||
    //   file.mimetype === "image/webp"
    // ) {
    //   cb(null, true);
    // } else {
    //   cb(new Error("Only image files (jpg, png, webp) are allowed!"));
    // }
    cb(null, true);
  },
});

module.exports = { uploadManager, uploadStaff, uploadRestaurant, uploadStaffs };
