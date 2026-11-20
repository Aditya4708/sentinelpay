const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { listCases, getCase, reviewCase } = require("../controllers/case.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), asyncHandler(listCases));
router.get("/:id", authenticate, requireRole("ADMIN"), asyncHandler(getCase));
router.patch("/:id/review", authenticate, requireRole("ADMIN"), asyncHandler(reviewCase));

module.exports = router;