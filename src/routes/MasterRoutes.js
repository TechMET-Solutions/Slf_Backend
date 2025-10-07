const express = require("express");
const { addBranch, getBranches, updateBranchStatus, editItemProfileStatus, AddItemProfileList, updateItemProfile, getAllItemProfiles } = require("../controller/MasterController");
const router = express.Router();

router.post("/Master_Profile/add_Branch", addBranch);
router.get("/Master_Profile/get_Branches", getBranches);
router.post("/Master_Profile/update_Branch_Status", updateBranchStatus);

router.post("/Master_Profile/add_Item", AddItemProfileList);
router.put("/Master_Profile/edit_Item_Status", editItemProfileStatus);
router.put("/Master_Profile/update_Item", updateItemProfile);
router.get("/Master_Profile/all_Item", getAllItemProfiles);

module.exports = router;