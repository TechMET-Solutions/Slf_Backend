const express = require("express");
const { addLoanApplication, getLoanApplications } = require("../controller/TransactionsController");
const uploadOrnamentPhoto = require("../middleware/uploadOrnamentPhoto");
const router = express.Router();


router.post("/goldloan/addLoan",uploadOrnamentPhoto, addLoanApplication);
router.get("/goldloan/all", getLoanApplications);
module.exports = router;
