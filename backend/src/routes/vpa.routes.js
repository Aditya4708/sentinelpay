const { Router } = require("express");
const { getReputation, reportVpa } = require("../controllers/vpa.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.get("/:vpa", authenticate, getReputation);
router.post("/report", authenticate, reportVpa);

module.exports = router;