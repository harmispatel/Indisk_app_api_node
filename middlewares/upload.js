const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/managers");
const uploadDirStaff = path.join(__dirname, "../uploads/staffs");

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

module.exports = { uploadManager, uploadStaff };
