const express = require("express");
const { addLoanApplication, getLoanApplications, cancelLoanApplication, getLoanRemark , getCustomerRemark, addLoanDocument, getLoanDocumentsByLoanId} = require("../controller/TransactionsController");
const uploadOrnamentPhoto = require("../middleware/uploadOrnamentPhoto");
const uploadLoanDocument = require("../middleware/uploadLoanDocument");
const router = express.Router();


router.post("/goldloan/addLoan",uploadOrnamentPhoto, addLoanApplication);
router.get("/goldloan/all", getLoanApplications);
router.put("/goldloan/cancel", cancelLoanApplication);
router.get('/goldloan/remark/:id', getLoanRemark);
router.get('/Customer/remark/:id', getCustomerRemark);
router.post("/goldloan/add-loan-document", uploadLoanDocument.single("document"), addLoanDocument);
router.get("/get-loan-documents/:loan_id", getLoanDocumentsByLoanId);
module.exports = router;
