const { Router } = require("express");
const { simulateTransaction, getMyTransactions } = require("../controllers/transaction.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.post("/simulate", authenticate, simulateTransaction);
router.get("/mine", authenticate, getMyTransactions);

module.exports = router;