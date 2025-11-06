const express = require("express");
const { addLoanApplication, getLoanApplications, cancelLoanApplication, getLoanRemark , getCustomerRemark, addLoanDocument, getLoanDocumentsByLoanId, getLoanApplicationById, updateLoanApplication, getAppraisalNote, approveLoanApplication, searchLoanApplications, } = require("../controller/TransactionsController");
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



router.get("/goldloan/getLoan/:id", getLoanApplicationById);
router.put("/goldloan/updateLoan/:id", uploadOrnamentPhoto, updateLoanApplication);


router.get("/goldloan/appraisal-note/:loan_id", getAppraisalNote);
router.put("/goldloan/approve-loan", approveLoanApplication);

router.get("/goldloan/search",searchLoanApplications );

module.exports = router;
