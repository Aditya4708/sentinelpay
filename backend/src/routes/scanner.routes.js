const { Router } = require("express");
const { scan, history } = require("../controllers/scanner.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.post("/scan", authenticate, scan);
router.get("/history", authenticate, history);

module.exports = router;