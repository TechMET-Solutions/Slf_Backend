// cryptoHelper.js
const CryptoJS = require("crypto-js");
require("dotenv").config();

const secretKey = process.env.SECRET_KEY;

// Encrypt
function encryptData(data) {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
}

// Decrypt
function decryptData(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encryptData, decryptData };
