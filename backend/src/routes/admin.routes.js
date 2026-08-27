const { Router } = require("express");
const { getOverview } = require("../controllers/admin.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = Router();

router.get("/overview", authenticate, requireRole("ADMIN"), getOverview);

module.exports = router;