const express = require("express");
const { addSchemeDetails, getAllSchemes, updateSchemeDetails, changeSchemeStatus, updateSchemeRoles } = require("../controller/schemeController");

const SchemeRouter = express.Router();

SchemeRouter.post("/addScheme", addSchemeDetails);
SchemeRouter.get("/getAllSchemes", getAllSchemes);
SchemeRouter.put("/updateScheme", updateSchemeDetails);

// ✅ Change scheme status
SchemeRouter.patch("/statusScheme", changeSchemeStatus);
SchemeRouter.patch("/updateSchemeRoles", updateSchemeRoles);
module.exports = SchemeRouter;
