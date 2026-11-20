const prisma = require("../config/prisma");
const { refreshProfile } = require("../services/baseline");

const REVIEW_STATUSES = ["PENDING", "CONFIRMED_FRAUD", "FALSE_POSITIVE"];

// What the transaction itself becomes once an analyst has made a decision.
const TRANSACTION_STATUS_FOR_REVIEW = {
  PENDING: "UNDER_REVIEW",
  CONFIRMED_FRAUD: "BLOCKED",
  FALSE_POSITIVE: "SUCCESS",
};

const caseInclude = {
  transaction: {
    select: {
      id: true,
      txnRef: true,
      amount: true,
      type: true,
      upiApp: true,
      bank: true,
      deviceId: true,
      hourOfDay: true,
      receiverVpa: true,
      timestamp: true,
      status: true,
      sender: { select: { id: true, name: true, email: true } },
    },
  },
};

async function listCases(req, res) {
  const requested = String(req.query.status || "PENDING").toUpperCase();
  if (requested !== "ALL" && !REVIEW_STATUSES.includes(requested)) {
    return res.status(400).json({ error: "status must be ALL or one of: " + REVIEW_STATUSES.join(", ") });
  }

  const where = { isFraudPredicted: true };
  if (requested !== "ALL") where.reviewStatus = requested;

  const [cases, grouped] = await Promise.all([
    prisma.fraudFlag.findMany({ where, include: caseInclude, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.fraudFlag.groupBy({
      by: ["reviewStatus"],
      where: { isFraudPredicted: true },
      _count: { _all: true },
    }),
  ]);

  const counts = { PENDING: 0, CONFIRMED_FRAUD: 0, FALSE_POSITIVE: 0 };
  grouped.forEach((g) => {
    counts[g.reviewStatus] = g._count._all;
  });

  return res.json({ counts, cases });
}

async function getCase(req, res) {
  const flag = await prisma.fraudFlag.findUnique({ where: { id: req.params.id }, include: caseInclude });
  if (!flag) return res.status(404).json({ error: "Case not found" });

  const baseline = await prisma.behaviorProfile.findUnique({ where: { userId: flag.transaction.sender.id } });
  return res.json({ case: flag, baseline });
}

async function reviewCase(req, res) {
  const { status, notes } = req.body || {};
  if (!REVIEW_STATUSES.includes(status)) {
    return res.status(400).json({ error: "status must be one of: " + REVIEW_STATUSES.join(", ") });
  }
  const cleanNotes = typeof notes === "string" ? notes.trim().slice(0, 500) : "";

  const existing = await prisma.fraudFlag.findUnique({
    where: { id: req.params.id },
    include: { transaction: { select: { id: true, senderId: true } } },
  });
  if (!existing) return res.status(404).json({ error: "Case not found" });

  const reset = status === "PENDING";

  // Both writes succeed together or not at all.
  const results = await prisma.$transaction([
    prisma.transaction.update({
      where: { id: existing.transaction.id },
      data: { status: TRANSACTION_STATUS_FOR_REVIEW[status] },
    }),
    prisma.fraudFlag.update({
      where: { id: existing.id },
      data: {
        reviewStatus: status,
        reviewedById: reset ? null : req.user.userId,
        reviewedAt: reset ? null : new Date(),
        reviewNotes: reset ? null : cleanNotes || null,
      },
      include: caseInclude,
    }),
  ]);

  // The decision changes what counts as normal behaviour for this user.
  try {
    await refreshProfile(existing.transaction.senderId);
  } catch (err) {
    console.error("Profile refresh failed:", err.message);
  }

  return res.json({ case: results[1] });
}

module.exports = { listCases, getCase, reviewCase };