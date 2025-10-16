const express = require("express");
const uploadDoc = require("../middleware/uploadcustdocument");
const { addCustomer, getCustomers } = require("../controller/MastercustDocument");
 // path must be correct


const Customer_router = express.Router();

Customer_router.post("/add", uploadDoc.fields([
    { name: "panFile", maxCount: 1 },
    { name: "aadharFile", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "Additional_UploadDocumentFile1", maxCount: 1 },
    { name: "Additional_UploadDocumentFile2", maxCount: 1 },
]), addCustomer);

Customer_router.get("/list", getCustomers);

module.exports = Customer_router;