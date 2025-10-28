const express = require("express");
const {createRoles, updateRole, getAllRoles, addBranch, getBranches, updateBranchStatus, editItemProfileStatus, AddItemProfileList, updateItemProfile, getAllItemProfiles, addGoldRate, getGoldRates, addDocument, getDocuments, updateDocumentStatus, addProductPurity, getAllProductPurities, updateProductPurity, deleteProductPurity, updateProductPurityStatus, addArea, getArea, updateArea, deleteArea, updateBranch, createEmployee, getAllEmployee, updateEmployee, deleteEmployee, addChargeProfile, getChargeProfiles, updateChargeProfile, changeChargeProfileStatus, updateBranchSchemes, getAssignBranch, updateAssignBranch } = require("../controller/MasterController");
const upload = require("../middleware/uploaddocument");
const router = express.Router();

router.post("/Master_Profile/add_Branch", addBranch);
router.get("/Master_Profile/get_Branches", getBranches);
router.post("/Master_Profile/update_Branch_Status", updateBranchStatus);
router.post("/Master_Profile/update_Branch", updateBranch);
router.post("/Master_Profile/updateBranchSchemes", updateBranchSchemes);

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

//  = = = = = Area = = = = =
router.post('/Master_Profile/add-area', addArea);
router.get('/Master_Profile/get-area', getArea);
router.put('/Master_Profile/update-area', updateArea);
router.post('/Master_Profile/delete-area', deleteArea);

//  = = = = = Employee Profile = = = = =
router.post("/Employee_Profile/add-employee", createEmployee);
router.get("/Employee_Profile/getAll-employees", getAllEmployee);
// router.get("/Employee_Profile/get-employee/:id", getEmployeeById);
router.put("/Employee_Profile/update-employee", updateEmployee);
router.post("/Employee_Profile/delete-employee", deleteEmployee);
router.patch("/Employee_Profile/assign-branch", updateAssignBranch);
router.get("/Employee_Profile/assign-branch/:id", getAssignBranch);


// = = = = = Roles  = = = = = 
router.post("/User-Management/add-roles", createRoles);
router.put("/User-Management/update-roles", updateRole);
router.get("/User-Management/getAll-roles", getAllRoles);


router.post("/ChargesProfile/add", addChargeProfile);
router.get("/GetChargesProfile/get", getChargeProfiles);
router.put("/updateChargesProfile", updateChargeProfile);

// ✅ Change only the status (isActive) of a charge profile
router.patch("/statusChangeChargesProfile", changeChargeProfileStatus);


module.exports = router;