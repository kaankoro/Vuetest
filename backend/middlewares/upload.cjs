const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${file.originalname}-${Math.floor(
        Math.random() * 1000000
      )}`
    );
  },
});

const upload = multer({ storage });

module.exports = upload;
