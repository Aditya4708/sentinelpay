const prisma = require("../config/prisma");
const { analyseInput, scoreTarget, summarisePlatformActivity } = require("./scannerCore");

const DISCLAIMER =
  "This is a risk estimate based on the address, community reports and activity on this platform. " +
  "It cannot confirm who owns a UPI ID.";

async function scanTarget(options) {
  const parsed = analyseInput(options.input);

  if (!parsed.valid) {
    return {
      valid: false,
      inputType: parsed.inputType,
      error: parsed.error,
      riskLevel: "INVALID",
      riskScore: null,
      signals: [],
      advice: [],
    };
  }

  const [reputation, rows] = await Promise.all([
    prisma.vpaReputation.findUnique({ where: { vpa: parsed.vpa } }),
    prisma.transaction.findMany({
      where: { receiverVpa: parsed.vpa },
      select: { senderId: true, fraudFlag: { select: { isFraudPredicted: true, reviewStatus: true, triggeredRules: true } } },
      take: 500,
    }),
  ]);

  const platform = summarisePlatformActivity(rows);
  const reportCount = reputation ? reputation.reportCount : 0;

  const result = scoreTarget({
    username: parsed.username,
    handle: parsed.handle,
    payeeName: parsed.payeeName,
    amount: parsed.amount,
    inputType: parsed.inputType,
    intent: options.intent,
    reportCount,
    platform,
  });

  // A failed log write must not hide the result from the user. Payee checks made while
  // scoring a transaction pass log: false, so they do not appear in the user's scan history.
  if (options.log !== false) {
    try {
      await prisma.scanLog.create({
        data: {
          userId: options.userId,
          target: parsed.vpa,
          inputType: parsed.inputType,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          signals: result.signals,
        },
      });
    } catch (err) {
      console.error("Scan log failed:", err.message);
    }
  }

  return Object.assign(
    {
      valid: true,
      inputType: parsed.inputType,
      target: parsed.vpa,
      payeeName: parsed.payeeName,
      amount: parsed.amount,
      community: { reportCount },
      platform,
      disclaimer: DISCLAIMER,
    },
    result
  );
}

async function getHistory(userId) {
  return prisma.scanLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

module.exports = { scanTarget, getHistory };