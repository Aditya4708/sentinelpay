const prisma = require("../config/prisma");

async function getOverview(req, res) {
  const [totalUsers, totalTransactions, flaggedCount, recentTransactions] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.fraudFlag.count({ where: { isFraudPredicted: true } }),
    prisma.transaction.findMany({
      include: { fraudFlag: true, sender: { select: { name: true, email: true } } },
      orderBy: { timestamp: "desc" },
      take: 100,
    }),
  ]);

  const avgRiskResult = await prisma.fraudFlag.aggregate({
    _avg: { riskScore: true },
  });

  const bankBreakdown = await prisma.transaction.groupBy({
    by: ["bank"],
    _count: { bank: true },
  });

  const appBreakdown = await prisma.transaction.groupBy({
    by: ["upiApp"],
    _count: { upiApp: true },
  });

  return res.json({
    totalUsers,
    totalTransactions,
    flaggedCount,
    avgRiskScore: avgRiskResult._avg.riskScore || 0,
    recentTransactions,
    bankBreakdown: bankBreakdown.map((b) => ({ name: b.bank, count: b._count.bank })),
    appBreakdown: appBreakdown.map((a) => ({ name: a.upiApp, count: a._count.upiApp })),
  });
}

module.exports = { getOverview };