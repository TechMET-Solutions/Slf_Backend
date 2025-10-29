const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📁 Storage configuration for ornament photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../ImagesFolders/ornaments");

    // Ensure the directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Sanitize and make filename unique
    const sanitizedOriginalName = file.originalname.replace(/\s+/g, "_");
    const uniqueName = `${Date.now()}_${sanitizedOriginalName}`;
    cb(null, uniqueName);
  },
});

// 🎯 Multer instance for single file (field name: Ornament_Photo)
const uploadOrnamentPhoto = multer({ storage }).single("Ornament_Photo");

module.exports = uploadOrnamentPhoto;
