const express = require("express");
const { registerBidder, updateBidder, viewBidder, getAllBidder } = require("../controller/AuctionController");
const bidderDoc = require("../middleware/bidderdocuments");

const router = express.Router();

router.post(
    "/register-bidder",
    bidderDoc.fields([
        { name: "aadharFile", maxCount: 1 },
        { name: "panFile", maxCount: 1 },
        { name: "bidder_photo", maxCount: 1 }
    ]),
    registerBidder
);
router.put(
    "/update-bidder/:id",
   bidderDoc.fields([
        { name: "aadharFile", maxCount: 1 },
        { name: "panFile", maxCount: 1 },
        { name: "bidder_photo", maxCount: 1 }
    ]),
    updateBidder
);

router.get("/view-bidder/:id", viewBidder);
router.get("/all-bidders", getAllBidder);

module.exports = router;
