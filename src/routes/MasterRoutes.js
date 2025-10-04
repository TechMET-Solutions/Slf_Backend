const express = require("express");
const { addBranch, getBranches } = require("../controller/MasterController");
const router = express.Router();

router.post("/Master_Profile/add_Branch", addBranch);
router.get("/Master_Profile/get_Branches",getBranches);
module.exports = router;