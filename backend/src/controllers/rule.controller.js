const prisma = require("../config/prisma");

async function listRules(req, res) {
  const rules = await prisma.fraudRule.findMany({ orderBy: { createdAt: "desc" } });
  return res.json({ rules });
}

async function createRule(req, res) {
  const { name, type, description, config, weight } = req.body;

  if (!name || !type || !config) {
    return res.status(400).json({ error: "name, type, and config are required" });
  }

  const rule = await prisma.fraudRule.create({
    data: { name, type, description, config, weight: weight ?? 1.0 },
  });

  return res.status(201).json({ rule });
}

async function toggleRule(req, res) {
  const { id } = req.params;
  const rule = await prisma.fraudRule.findUnique({ where: { id } });
  if (!rule) return res.status(404).json({ error: "Rule not found" });

  const updated = await prisma.fraudRule.update({
    where: { id },
    data: { isEnabled: !rule.isEnabled },
  });

  return res.json({ rule: updated });
}

async function deleteRule(req, res) {
  const { id } = req.params;
  await prisma.fraudRule.delete({ where: { id } }).catch(() => null);
  return res.json({ success: true });
}

module.exports = { listRules, createRule, toggleRule, deleteRule };