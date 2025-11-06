const express = require("express");
const { addLoanCharges,
    getLoanCharges,
    updateLoanCharges,
    deleteLoanCharges,
    getLoanChargesById, } = require("../controller/LoanChargesListControllers");
const router = express.Router();


// 🟢 Routes
router.post("/add", addLoanCharges);
router.get("/get", getLoanCharges);
router.get("/getById/:id", getLoanChargesById);

router.put("/update/:id", updateLoanCharges);
router.delete("/delete/:id", deleteLoanCharges);


module.exports = router;

