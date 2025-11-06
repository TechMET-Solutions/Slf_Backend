const express = require("express");
const { addLoanCharges,
    getLoanCharges,
    updateLoanCharges,
    deleteLoanCharges, } = require("../controller/LoanChargesListControllers");
const router = express.Router();


// 🟢 Routes
router.post("/add", addLoanCharges);
router.get("/get", getLoanCharges);
router.put("/update/:id", updateLoanCharges);
router.delete("/delete/:id", deleteLoanCharges);

module.exports = router;

