const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { getReputation, reportVpa } = require("../controllers/vpa.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.get("/:vpa", authenticate, asyncHandler(getReputation));
router.post("/report", authenticate, asyncHandler(reportVpa));

module.exports = router;