const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { scan, history } = require("../controllers/scanner.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.post("/scan", authenticate, asyncHandler(scan));
router.get("/history", authenticate, asyncHandler(history));

module.exports = router;