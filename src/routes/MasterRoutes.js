const express = require("express");
const { addBranch } = require("../controller/MasterController");
const router = express.Router();

router.post("Master_Profile/add_Branch", addBranch);

module.exports = router;