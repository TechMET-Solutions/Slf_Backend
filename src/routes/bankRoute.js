const express = require("express");
const { addBankDetails, updateBankDetails } = require("../controller/bankController");
const multer = require("multer");
const path = require("path");

const Bank_router = express.Router();

// Recreate multer storage config for route
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../ImagesFolders/customer_BankData"));
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});

const uploadCheque = multer({ storage });

// ✅ Route: handle multiple files
Bank_router.post(
    "/add",
    uploadCheque.array("cancelCheque"), // ✅ expect "cancelCheque"
    addBankDetails
);
Bank_router.put("/updateBankDetails", uploadCheque.single("cancelCheque"), updateBankDetails);

// Bank_router.put("/update", uploadCheque.array("cancelCheque"), updateBankDetails);

module.exports = Bank_router;
