const prisma = require("../config/prisma");
const { computeBaseline, computeUserRiskScore } = require("./baselineMath");

const HISTORY_LIMIT = 200;

// Newest first. Each row carries the fields computeBaseline and computeUserRiskScore read.
async function loadHistory(userId) {
  return prisma.transaction.findMany({
    where: { senderId: userId },
    include: { fraudFlag: { select: { isFraudPredicted: true, reviewStatus: true, riskScore: true } } },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
}

// Number of transactions this user made in the last hour.
async function countRecentTransactions(userId, minutes) {
  const since = new Date(Date.now() - (minutes || 60) * 60 * 1000);
  return prisma.transaction.count({
    where: { senderId: userId, timestamp: { gte: since } },
  });
}

// Recomputes the user's current risk score and, once there is enough clean history,
// the stored behavioural profile. Pass `history` (newest first) when the caller already
// has it, to avoid loading it again.
async function refreshProfile(userId, history) {
  const rows = history || (await loadHistory(userId));

  await prisma.user.update({
    where: { id: userId },
    data: { currentRiskScore: computeUserRiskScore(rows) },
  });

  const b = computeBaseline(rows);
  if (b.source !== "learned") return null;

  const data = {
    avgTransactionAmount: b.meanAmount,
    medianTransactionAmount: b.typicalAmount,
    dailyTxnCount: b.dailyTxnCount,
    weeklySpend: b.weeklySpend,
    monthlySpend: b.monthlySpend,
    normalTxnHourStart: b.activeHourStart,
    normalTxnHourEnd: b.activeHourEnd,
    homeLat: b.homeLat,
    homeLon: b.homeLon,
    knownDeviceIds: b.knownDevices,
    txnCount: b.cleanCount,
    lastComputedAt: new Date(),
  };

  return prisma.behaviorProfile.upsert({
    where: { userId },
    update: data,
    create: Object.assign({ userId }, data),
  });
}

module.exports = { loadHistory, countRecentTransactions, refreshProfile, HISTORY_LIMIT };
