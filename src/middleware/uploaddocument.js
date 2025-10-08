const multer = require("multer");
const path = require("path");

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Save images in the document_proof_images folder
        cb(null, path.join(__dirname, "../ImagesFolders/document_proof_images"));
    },
    filename: function (req, file, cb) {
        // Sanitize original filename to remove spaces
        const sanitizedOriginalName = file.originalname.replace(/\s+/g, "_");

        // Create unique filename: timestamp_originalname
        const uniqueName = `${Date.now()}_${sanitizedOriginalName}`;

        cb(null, uniqueName);
    },
});

// Export multer instance
const upload = multer({ storage });

module.exports = upload;
