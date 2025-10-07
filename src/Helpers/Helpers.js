// controllers/cryptoController.js

const { encryptData, decryptData } = require("./cryptoHelper");


// 🔹 Encrypt any given text
exports.encryptPayload = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ message: "Missing 'data' in request body" });
    }

    const encrypted = encryptData(JSON.stringify(data));
    res.status(200).json({ encrypted });
  } catch (error) {
    console.error("❌ Encryption Error:", error);
    res.status(500).json({ message: "Encryption failed", error: error.message });
  }
};

// 🔹 Decrypt any given encrypted text
exports.decryptPayload = async (req, res) => {
  try {
    const { encryptedData } = req.body;

    if (!encryptedData) {
      return res.status(400).json({ message: "Missing 'encryptedData' in request body" });
    }

    const decrypted = decryptData(encryptedData);

    if (!decrypted) {
      return res.status(400).json({ message: "Invalid or corrupt encrypted data" });
    }

    res.status(200).json({ decrypted: JSON.parse(decrypted) });
  } catch (error) {
    console.error("❌ Decryption Error:", error);
    res.status(500).json({ message: "Decryption failed", error: error.message });
  }
};
