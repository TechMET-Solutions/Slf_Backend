const express = require("express");
const { addSchemeDetails, getAllSchemes, updateSchemeDetails, changeSchemeStatus, updateSchemeRoles, getExpiredSchemes, getActiveSchemes } = require("../controller/schemeController");

const SchemeRouter = express.Router();

SchemeRouter.post("/addScheme", addSchemeDetails);
SchemeRouter.get("/getAllSchemes", getAllSchemes);
SchemeRouter.get("/getExpiredSchemes", getExpiredSchemes);
SchemeRouter.put("/updateScheme", updateSchemeDetails);
SchemeRouter.get("/active", getActiveSchemes);

// ✅ Change scheme status
SchemeRouter.patch("/statusScheme", changeSchemeStatus);
SchemeRouter.patch("/updateSchemeRoles", updateSchemeRoles);
module.exports = SchemeRouter;
