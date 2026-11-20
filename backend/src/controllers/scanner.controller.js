const { scanTarget, getHistory } = require("../services/scannerService");

async function scan(req, res) {
  const body = req.body || {};

  if (typeof body.input !== "string" || !body.input.trim()) {
    return res.status(400).json({ error: "input is required" });
  }
  if (body.input.length > 2000) {
    return res.status(400).json({ error: "input is too long" });
  }

  const intent = body.intent === "receive" ? "receive" : "pay";

  try {
    const result = await scanTarget({ input: body.input, intent, userId: req.user.userId });
    return res.json(result);
  } catch (err) {
    console.error("Scan error:", err.message);
    return res.status(500).json({ error: "Could not complete the scan." });
  }
}

async function history(req, res) {
  try {
    const scans = await getHistory(req.user.userId);
    return res.json({ scans });
  } catch (err) {
    console.error("Scan history error:", err.message);
    return res.status(500).json({ error: "Could not load scan history." });
  }
}

module.exports = { scan, history };