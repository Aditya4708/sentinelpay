const prisma = require("../config/prisma");
const { computeBaseline } = require("./baselineMath");

const HISTORY_LIMIT = 200;

async function loadHistory(userId) {
  return prisma.transaction.findMany({
    where: { senderId: userId },
    include: { fraudFlag: { select: { isFraudPredicted: true, reviewStatus: true } } },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
}

async function getBaseline(userId) {
  const history = await loadHistory(userId);
  return computeBaseline(history);
}

// Number of transactions this user made in the last hour. Used only when the caller
// does not supply a velocity of its own.
async function countRecentTransactions(userId, minutes) {
  const since = new Date(Date.now() - (minutes || 60) * 60 * 1000);
  return prisma.transaction.count({
    where: { senderId: userId, timestamp: { gte: since } },
  });
}

// Persists the learned baseline so it can be shown to admins and audited.
async function refreshProfile(userId) {
  const history = await loadHistory(userId);
  const b = computeBaseline(history);
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

module.exports = { getBaseline, countRecentTransactions, refreshProfile };