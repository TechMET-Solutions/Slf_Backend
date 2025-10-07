const express = require("express");
const { encryptPayload, decryptPayload } = require("../Helpers/Helpers");
const router = express.Router();


// 🔹 Route to encrypt data
router.post("/encrypt", encryptPayload);

// 🔹 Route to decrypt data
router.post("/decrypt", decryptPayload);

module.exports = router; 