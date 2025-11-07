const express = require("express");
const { createRoles, updateRole, getAllRoles, addBranch, getBranches, updateBranchStatus, editItemProfileStatus, AddItemProfileList, updateItemProfile, getAllItemProfiles, addGoldRate, getGoldRates, addDocument, getDocuments, updateDocumentStatus, addProductPurity, getAllProductPurities, updateProductPurity, deleteProductPurity, updateProductPurityStatus, addArea, getArea, updateArea, deleteArea, updateBranch, createEmployee, getAllEmployee, updateEmployee, deleteEmployee, addChargeProfile, getChargeProfiles, updateChargeProfile, changeChargeProfileStatus, updateBranchSchemes, getAssignBranch, updateAssignBranch, getMemberLoginPeriod, updateMemberLoginPeriod, updateEmployeeStatus, saveRolePermissions, getRolePermissions, getRolesForSelect, updateDocument, updateSenderMobiles, updateOTPOverride, getBranchess, getAllDocumentProofs, getActiveChargeProfiles, getAllActiveEmployees, deleteChargeProfile, getAllProductPuritiesNoPagination, getLatestGoldRates, getLatestGoldRate, searchItems } = require("../controller/MasterController");
const upload = require("../middleware/uploaddocument");
const uploadEmployeeDoc = require("../middleware/uploademployedocument");
const { createDesignation, updateDesignation, getDesignation, deleteDesignation } = require("../controller/Designation");
const router = express.Router();

router.post("/Master_Profile/add_Branch", addBranch);
router.get("/Master_Profile/get_Branches", getBranches);
router.get("/Master_Profile/Branchess", getBranchess);
router.post("/Master_Profile/update_Branch_Status", updateBranchStatus);
router.post("/Master_Profile/update_Branch", updateBranch);
router.post("/Master_Profile/updateBranchSchemes", updateBranchSchemes);

router.post("/Master_Profile/add_Item", AddItemProfileList);
router.put("/Master_Profile/edit_Item_Status", editItemProfileStatus);
router.put("/Master_Profile/update_Item", updateItemProfile);
router.get("/Master_Profile/all_Item", getAllItemProfiles);
router.get("/Master_Profile/get_gold_rate_list", getGoldRates);
router.get("/Master_Profile/latest-gold-rate", getLatestGoldRate);
router.post("/Master_Profile/gold_rate", addGoldRate);
router.get('/Master_Profile/searchItems', searchItems);
// // = = = = = Product Purity = = = = =
router.post('/Master_Profile/add-purity', addProductPurity);
router.get('/Master_Profile/get-purity', getAllProductPurities);
router.get("/getall-purity", getAllProductPuritiesNoPagination);
router.put('/Master_Profile/update-purity', updateProductPurity);
router.post('/Master_Profile/delete-purity', deleteProductPurity);
// router.delete('/Master_Profile/update-purity-status', updateProductPurityStatus);

router.post("/Master_Profile/add_Document", upload.none(), addDocument);
router.get("/Master_Profile/get_document", getDocuments);
router.post("/Master_Profile/update_document_status", updateDocumentStatus);
router.get("/getAllDocumentProofs", getAllDocumentProofs);
router.post("/Master_Profile/update_document", upload.none(), updateDocument);
//  = = = = = Area = = = = =
router.post('/Master_Profile/add-area', addArea);
router.get('/Master_Profile/get-area', getArea);
router.put('/Master_Profile/update-area', updateArea);
router.post('/Master_Profile/delete-area', deleteArea);

//  = = = = = Employee Profile = = = = =
// router.post("/Employee_Profile/add-employee", createEmployee);

router.post("/Employee_Profile/add-employee", uploadEmployeeDoc.fields([
    { name: "emp_image", maxCount: 1 },
    { name: "emp_add_prof", maxCount: 1 },
    { name: "emp_id_prof", maxCount: 1 },

]), createEmployee);
router.get("/Employee_Profile/getAll-employees", getAllEmployee);
// router.get("/Employee_Profile/get-employee/:id", getEmployeeById);
router.put("/Employee_Profile/update-employee",
    uploadEmployeeDoc.fields([
        { name: "emp_image", maxCount: 1 },
        { name: "emp_add_prof", maxCount: 1 },
        { name: "emp_id_prof", maxCount: 1 },
    ]),
    updateEmployee
);
router.post("/updateEmployeeStatus", updateEmployeeStatus);

router.post("/Employee_Profile/delete-employee", deleteEmployee);
router.patch("/Employee_Profile/assign-branch", updateAssignBranch);
router.get("/Employee_Profile/assign-branch/:id", getAssignBranch);
router.get("/Employee_Profile/login-period", getMemberLoginPeriod);
router.put("/Employee_Profile/update-login-period", updateMemberLoginPeriod);
router.post("/Employee_Profile/updateSender", updateSenderMobiles);
router.post("/Employee_Profile/updateOTP", updateOTPOverride);
router.get("/getActiveEmployees", getAllActiveEmployees);


// = = = = = Designation  = = = = = 
router.post("/Employee_Profile/create-designation", createDesignation);
router.put("/Employee_Profile/update-designation/:id", updateDesignation);
router.get("/Employee_Profile/get-designation", getDesignation);
router.delete("/Employee_Profile/delete-designation/:id", deleteDesignation);


// = = = = = Roles  = = = = = 
router.post("/User-Management/add-roles", createRoles);
router.put("/User-Management/update-roles", updateRole);
router.get("/User-Management/getAll-roles", getAllRoles);
router.get("/User-Management/getAll-roles-options", getRolesForSelect);
router.post("/ChargesProfile/add", addChargeProfile);
router.get("/GetChargesProfile/get", getChargeProfiles);
router.delete("/charge-profile/delete", deleteChargeProfile);
router.get("/GetChargesProfile/Active", getActiveChargeProfiles);
router.put("/updateChargesProfile", updateChargeProfile);

// ✅ Change only the status (isActive) of a charge profile
router.patch("/statusChangeChargesProfile", changeChargeProfileStatus);


router.post("/save_Roles", saveRolePermissions);

// ✅ Get permissions by role_id
router.get("/Getrole/:role_id", getRolePermissions);


module.exports = router;