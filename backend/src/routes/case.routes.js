const { Router } = require("express");
const { listCases, getCase, reviewCase } = require("../controllers/case.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), listCases);
router.get("/:id", authenticate, requireRole("ADMIN"), getCase);
router.patch("/:id/review", authenticate, requireRole("ADMIN"), reviewCase);

module.exports = router;