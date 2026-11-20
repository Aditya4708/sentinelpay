const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { listRules, createRule, toggleRule, deleteRule } = require("../controllers/rule.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), asyncHandler(listRules));
router.post("/", authenticate, requireRole("ADMIN"), asyncHandler(createRule));
router.patch("/:id/toggle", authenticate, requireRole("ADMIN"), asyncHandler(toggleRule));
router.delete("/:id", authenticate, requireRole("ADMIN"), asyncHandler(deleteRule));

module.exports = router;