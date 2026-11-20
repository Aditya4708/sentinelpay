const prisma = require("../config/prisma");
const { parseVpa } = require("../services/scannerCore");

// VPAs are stored trimmed and lowercased, the same form the scanner and transaction
// scoring look them up by, so a report always reaches the payee it names.
function normaliseVpa(raw) {
  const parsed = parseVpa(raw);
  return parsed.valid ? parsed.vpa : null;
}

async function getReputation(req, res) {
  const vpa = normaliseVpa(req.params.vpa);
  if (!vpa) {
    return res.status(400).json({ error: "This is not a valid UPI address" });
  }

  const record = await prisma.vpaReputation.findUnique({ where: { vpa } });

  return res.json({
    vpa,
    reportCount: record ? record.reportCount : 0,
  });
}

// Each account counts once per VPA. Reporting again only refreshes the label, so one
// account cannot push a payee into the high-risk band on its own.
async function reportVpa(req, res) {
  const body = req.body || {};
  const vpa = normaliseVpa(body.vpa);
  if (!vpa) {
    return res.status(400).json({ error: "vpa must be a valid UPI address, like name@bank" });
  }
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 100) : null;
  const userId = req.user.userId;

  const result = await prisma.$transaction(async (tx) => {
    const before = await tx.vpaReport.findUnique({ where: { vpa_userId: { vpa, userId } } });
    await tx.vpaReport.upsert({
      where: { vpa_userId: { vpa, userId } },
      update: label ? { label } : {},
      create: { vpa, userId, label },
    });
    const reportCount = await tx.vpaReport.count({ where: { vpa } });
    const reputation = await tx.vpaReputation.upsert({
      where: { vpa },
      update: label ? { reportCount, lastLabel: label } : { reportCount },
      create: { vpa, reportCount, lastLabel: label },
    });
    return { reputation, alreadyReported: !!before };
  });

  return res.status(result.alreadyReported ? 200 : 201).json({
    vpa: result.reputation.vpa,
    reportCount: result.reputation.reportCount,
    alreadyReported: result.alreadyReported,
  });
}

module.exports = { getReputation, reportVpa, normaliseVpa };
