const { Router } = require("express");
const { listRules, createRule, toggleRule, deleteRule } = require("../controllers/rule.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), listRules);
router.post("/", authenticate, requireRole("ADMIN"), createRule);
router.patch("/:id/toggle", authenticate, requireRole("ADMIN"), toggleRule);
router.delete("/:id", authenticate, requireRole("ADMIN"), deleteRule);

module.exports = router;