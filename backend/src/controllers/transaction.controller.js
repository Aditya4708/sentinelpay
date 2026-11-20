const axios = require("axios");
const prisma = require("../config/prisma");
const { evaluateRules } = require("../services/ruleEngine");
const { getBaseline, countRecentTransactions, refreshProfile } = require("../services/baseline");
const { scanTarget } = require("../services/scannerService");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8000";

const VALID_TYPES = [
  "P2P", "P2M", "QR_PAYMENT", "BILL_PAYMENT",
  "RECHARGE", "MERCHANT_PAYMENT", "REFUND", "SUBSCRIPTION",
];

const RULE_LABELS = {
  AMOUNT_THRESHOLD: "unusually high amount",
  TIME_WINDOW: "late-night activity",
  NEW_DEVICE: "unfamiliar device",
  VELOCITY_CHECK: "rapid transaction velocity",
  MERCHANT_BLACKLIST: "blacklisted merchant",
  IMPOSSIBLE_TRAVEL: "impossible travel",
};

function reasonFor(rule, receiver) {
  if (rule.indexOf("RECEIVER_") === 0 && receiver) {
    return "payee " + receiver.target + " rated " + receiver.riskLevel.toLowerCase() + " risk";
  }
  return RULE_LABELS[rule] || rule.toLowerCase().replace(/_/g, " ");
}

// The AI service explains what the model saw. Rules and the payee check can flag a
// transaction on their own, so the stored explanation has to say so too.
function buildSummary(prediction, triggeredRules, receiver) {
  const reasons = triggeredRules.map((r) => reasonFor(r, receiver));
  if (reasons.length === 0) return prediction.human_readable_summary;
  if (prediction.is_fraud_predicted) {
    return prediction.human_readable_summary + " Rules also triggered: " + reasons.join(", ") + ".";
  }
  return "Flagged by rules, not by the model: " + reasons.join(", ") + ".";
}

// A payee the scanner rates HIGH or CRITICAL adds a quarter of its scanner score to the
// transaction score (at most 25 points) and counts as a rule hit.
function receiverBoostFor(receiver) {
  if (!receiver || (receiver.riskLevel !== "HIGH" && receiver.riskLevel !== "CRITICAL")) return 0;
  return Math.round(receiver.riskScore / 4);
}

// JavaScript counts Sunday as 0, but the model was trained on Monday = 0.
function toModelWeekday(date) {
  return (date.getDay() + 6) % 7;
}

async function simulateTransaction(req, res) {
  const body = req.body || {};
  const { amount, type, merchantCategory, upiApp, bank, deviceId } = body;

  if (typeof amount !== "number" || !(amount > 0) || !type || !upiApp || !bank || !deviceId) {
    return res.status(400).json({
      error: "amount (a positive number), type, upiApp, bank and deviceId are required",
    });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: "type must be one of: " + VALID_TYPES.join(", ") });
  }
  if (
    body.hourOfDay !== undefined &&
    !(Number.isInteger(body.hourOfDay) && body.hourOfDay >= 0 && body.hourOfDay <= 23)
  ) {
    return res.status(400).json({ error: "hourOfDay must be an integer from 0 to 23" });
  }

  const userId = req.user.userId;
  const receiverVpa =
    typeof body.receiverVpa === "string" && body.receiverVpa.trim()
      ? body.receiverVpa.trim().toLowerCase().slice(0, 100)
      : null;

  try {
    // 1. What is normal for this user? Learned on the server from their own history,
    //    never taken from the request.
    const baseline = await getBaseline(userId);

    const now = new Date();
    const hour = body.hourOfDay !== undefined ? body.hourOfDay : now.getHours();
    const latitude = typeof body.latitude === "number" ? body.latitude : baseline.homeLat;
    const longitude = typeof body.longitude === "number" ? body.longitude : baseline.homeLon;

    // 2. Is this device known? With too little history we cannot tell, so we do not
    //    penalise it (trust on first use).
    let homeDeviceId;
    let deviceStatus;
    if (baseline.source === "cold_start") {
      homeDeviceId = deviceId;
      deviceStatus = "unassessed";
    } else if (baseline.knownDevices.includes(deviceId)) {
      homeDeviceId = deviceId;
      deviceStatus = "known";
    } else {
      homeDeviceId = baseline.primaryDevice;
      deviceStatus = "new";
    }

    // 3. Velocity: the simulator can set it as a what-if control; any other caller
    //    gets the real count of this user's transactions in the last hour.
    let velocity;
    let velocitySource;
    if (body.txnVelocity1h !== undefined && body.txnVelocity1h !== null) {
      velocity = Math.max(0, Math.round(Number(body.txnVelocity1h)) || 0);
      velocitySource = "simulated";
    } else {
      velocity = await countRecentTransactions(userId, 60);
      velocitySource = "observed";
    }

    // 3b. Who is being paid? Checked before anything is scored or saved, so a malformed
    //     address is rejected up front.
    let receiver = null;
    if (receiverVpa) {
      receiver = await scanTarget({ input: receiverVpa, intent: "pay", userId, log: false });
      if (!receiver.valid) {
        return res.status(400).json({ error: "receiverVpa: " + receiver.error });
      }
    }

    // 4. ML score from the AI service.
    const aiResponse = await axios.post(AI_SERVICE_URL + "/predict/", {
      amount,
      type,
      merchant_category: merchantCategory || "P2P",
      upi_app: upiApp,
      bank,
      hour_of_day: hour,
      day_of_week: toModelWeekday(now),
      latitude,
      longitude,
      device_id: deviceId,
      txn_velocity_1h: velocity,
      avg_amount: baseline.typicalAmount,
      home_device_id: homeDeviceId,
      home_lat: baseline.homeLat,
      home_lon: baseline.homeLon,
      active_hour_start: baseline.activeHourStart,
      active_hour_end: baseline.activeHourEnd,
    });
    const prediction = aiResponse.data;

    // 5. Admin-managed rules, combined with the ML score.
    const { triggeredRules, ruleScoreBoost } = await evaluateRules({
      amount,
      hourOfDay: hour,
      deviceId,
      homeDeviceId,
      txnVelocity1h: velocity,
      merchantCategory: merchantCategory || "P2P",
    });

    const receiverBoost = receiverBoostFor(receiver);
    const receiverRule = receiverBoost > 0 ? ["RECEIVER_" + receiver.riskLevel] : [];
    const allTriggered = triggeredRules.concat(receiverRule);

    const combinedRiskScore = Math.round(Math.min(100, prediction.risk_score + ruleScoreBoost + receiverBoost) * 100) / 100;
    const finalIsFraud = prediction.is_fraud_predicted || allTriggered.length > 0;
    const summary = buildSummary(prediction, allTriggered, receiver);

    // 6. Persist the transaction and the explanation.
    const txnRef = "SIM" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

    const transaction = await prisma.transaction.create({
      data: {
        txnRef,
        senderId: userId,
        type,
        amount,
        upiApp,
        bank,
        merchantCategory: merchantCategory || "P2P",
        receiverVpa,
        latitude,
        longitude,
        deviceId,
        hourOfDay: hour,
        status: finalIsFraud ? "UNDER_REVIEW" : "SUCCESS",
        timestamp: now,
      },
    });

    const fraudFlag = await prisma.fraudFlag.create({
      data: {
        transactionId: transaction.id,
        riskScore: combinedRiskScore,
        isFraudPredicted: finalIsFraud,
        modelUsed: prediction.model_used,
        modelConfidence: prediction.model_confidence,
        topFactors: prediction.top_factors,
        humanReadableSummary: summary,
        triggeredRules: allTriggered,
      },
    });

    // 7. Keep the stored behavioural profile current. A failure here must not
    //    fail the transaction itself.
    try {
      await refreshProfile(userId);
    } catch (profileErr) {
      console.error("Profile refresh failed:", profileErr.message);
    }

    return res.status(201).json({
      receiver: receiver
        ? { vpa: receiver.target, riskScore: receiver.riskScore, riskLevel: receiver.riskLevel, signals: receiver.signals, boost: receiverBoost }
        : null,
      transaction,
      fraudFlag,
      prediction: Object.assign({}, prediction, {
        risk_score: combinedRiskScore,
        is_fraud_predicted: finalIsFraud,
        triggered_rules: allTriggered,
        human_readable_summary: summary,
      }),
      baseline: {
        source: baseline.source,
        cleanTransactions: baseline.cleanCount,
        typicalAmount: Math.round(baseline.typicalAmount * 100) / 100,
        activeHours: [baseline.activeHourStart, baseline.activeHourEnd],
        deviceStatus,
        velocity,
        velocitySource,
      },
    });
  } catch (err) {
    console.error("Simulation error:", err.message);
    if (err.isAxiosError) {
      return res.status(502).json({ error: "The AI service could not be reached." });
    }
    return res.status(500).json({ error: "Could not process the transaction." });
  }
}

async function getMyTransactions(req, res) {
  const transactions = await prisma.transaction.findMany({
    where: { senderId: req.user.userId },
    include: { fraudFlag: true },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return res.json({ transactions });
}

module.exports = { simulateTransaction, getMyTransactions };