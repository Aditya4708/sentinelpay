const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { getOverview } = require("../controllers/admin.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = Router();

router.get("/overview", authenticate, requireRole("ADMIN"), asyncHandler(getOverview));

module.exports = router;