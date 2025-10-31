const express = require("express");
const { addLoanApplication, getLoanApplications, cancelLoanApplication, getLoanRemark , getCustomerRemark} = require("../controller/TransactionsController");
const uploadOrnamentPhoto = require("../middleware/uploadOrnamentPhoto");
const router = express.Router();


router.post("/goldloan/addLoan",uploadOrnamentPhoto, addLoanApplication);
router.get("/goldloan/all", getLoanApplications);
router.put("/goldloan/cancel", cancelLoanApplication);
router.get('/goldloan/remark/:id', getLoanRemark);
router.get('/Customer/remark/:id', getCustomerRemark);

module.exports = router;
