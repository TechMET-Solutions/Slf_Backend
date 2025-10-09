const express = require("express");
const { addBranch, getBranches, updateBranchStatus, editItemProfileStatus, AddItemProfileList, updateItemProfile, getAllItemProfiles, addGoldRate, getGoldRates,  addDocument, getDocuments, updateDocumentStatus,addProductPurity, getAllProductPurities, updateProductPurity, deleteProductPurity, updateProductPurityStatus } = require("../controller/MasterController");
const upload = require("../middleware/uploaddocument");
const router = express.Router();

router.post("/Master_Profile/add_Branch", addBranch);
router.get("/Master_Profile/get_Branches", getBranches);
router.post("/Master_Profile/update_Branch_Status", updateBranchStatus);

router.post("/Master_Profile/add_Item", AddItemProfileList);
router.put("/Master_Profile/edit_Item_Status", editItemProfileStatus);
router.put("/Master_Profile/update_Item", updateItemProfile);
router.get("/Master_Profile/all_Item", getAllItemProfiles);
router.get("/Master_Profile/get_gold_rate_list", getGoldRates);
router.post("/Master_Profile/gold_rate", addGoldRate);


// // = = = = = Product Purity = = = = =
router.post('/Master_Profile/add-purity', addProductPurity);
router.get('/Master_Profile/get-purity', getAllProductPurities);
router.put('/Master_Profile/update-purity', updateProductPurity);
router.post('/Master_Profile/delete-purity', deleteProductPurity);
// router.delete('/Master_Profile/update-purity-status', updateProductPurityStatus);




router.post("/Master_Profile/add_Document", upload.single("file"), addDocument);
router.get("/Master_Profile/get_document", getDocuments);
router.post("/Master_Profile/update_document_status", updateDocumentStatus);
module.exports = router;