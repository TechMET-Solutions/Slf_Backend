const express = require("express");
const { addLoanApplication } = require("../controller/TransactionsController");
const uploadOrnamentPhoto = require("../middleware/uploadOrnamentPhoto");
const router = express.Router();


router.post("/goldloan/addLoan",uploadOrnamentPhoto, addLoanApplication);

module.exports = router;
