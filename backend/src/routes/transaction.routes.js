const { Router } = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { simulateTransaction, getMyTransactions } = require("../controllers/transaction.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.post("/simulate", authenticate, asyncHandler(simulateTransaction));
router.get("/mine", authenticate, asyncHandler(getMyTransactions));

module.exports = router;