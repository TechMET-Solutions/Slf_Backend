const express = require("express");
const { addBranch, getBranches, updateBranchStatus } = require("../controller/MasterController");
const router = express.Router();

router.post("/Master_Profile/add_Branch", addBranch);
router.get("/Master_Profile/get_Branches", getBranches);
router.post("/Master_Profile/update_Branch_Status", updateBranchStatus);
module.exports = router;