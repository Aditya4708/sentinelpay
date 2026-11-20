const prisma = require("../config/prisma");

async function getReputation(req, res) {
  const { vpa } = req.params;

  const record = await prisma.vpaReputation.findUnique({ where: { vpa } });

  return res.json({
    vpa,
    reportCount: record ? record.reportCount : 0,
  });
}

async function reportVpa(req, res) {
  const { vpa, label } = req.body;

  if (!vpa) {
    return res.status(400).json({ error: "vpa is required" });
  }

  const existing = await prisma.vpaReputation.findUnique({ where: { vpa } });

  const updated = existing
    ? await prisma.vpaReputation.update({
        where: { vpa },
        data: { reportCount: { increment: 1 }, lastLabel: label || existing.lastLabel },
      })
    : await prisma.vpaReputation.create({
        data: { vpa, reportCount: 1, lastLabel: label || null },
      });

  return res.status(201).json({ vpa: updated.vpa, reportCount: updated.reportCount });
}

module.exports = { getReputation, reportVpa };