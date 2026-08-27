const { Router } = require("express");
const { register, login, refresh, me, updateMe } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.get("/me", authenticate, me);
router.put("/me", authenticate, updateMe);

module.exports = router;