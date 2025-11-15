const express = require("express");
const { addCreditNote, getAllCreditNotes, getCreditNoteById } = require("../controller/CreditNoteController");
const router = express.Router();


router.post("/add-creditnote", addCreditNote);
router.get("/credit-notes", getAllCreditNotes);
router.get("/credit-note/:id", getCreditNoteById);
module.exports = router;
