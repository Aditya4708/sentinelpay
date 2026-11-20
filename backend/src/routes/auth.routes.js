const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { register, login, refresh, me, updateMe } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.get("/me", authenticate, asyncHandler(me));
router.put("/me", authenticate, asyncHandler(updateMe));

module.exports = router;