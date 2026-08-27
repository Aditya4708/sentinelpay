const axios = require("axios");
const prisma = require("../config/prisma");
const { evaluateRules } = require("../services/ruleEngine");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8000";

async function simulateTransaction(req, res) {
  const {
    amount, type, merchantCategory, upiApp, bank,
    hourOfDay, dayOfWeek, latitude, longitude, deviceId,
    txnVelocity1h, avgAmount, homeDeviceId, homeLat, homeLon,
    activeHourStart, activeHourEnd,
  } = req.body;

  if (amount === undefined || !type || !upiApp || !bank || !deviceId) {
    return res.status(400).json({ error: "Missing required transaction fields" });
  }

  try {
    const aiResponse = await axios.post(AI_SERVICE_URL + "/predict/", {
      amount,
      type,
      merchant_category: merchantCategory || "P2P",
      upi_app: upiApp,
      bank,
      hour_of_day: hourOfDay,
      day_of_week: dayOfWeek,
      latitude,
      longitude,
      device_id: deviceId,
      txn_velocity_1h: txnVelocity1h || 0,
      avg_amount: avgAmount,
      home_device_id: homeDeviceId,
      home_lat: homeLat,
      home_lon: homeLon,
      active_hour_start: activeHourStart || 7,
      active_hour_end: activeHourEnd || 23,
    });

    const prediction = aiResponse.data;

    const { triggeredRules, ruleScoreBoost } = await evaluateRules({
      amount,
      hourOfDay,
      deviceId,
      homeDeviceId,
      txnVelocity1h: txnVelocity1h || 0,
      merchantCategory: merchantCategory || "P2P",
    });

    const combinedRiskScore = Math.min(100, prediction.risk_score + ruleScoreBoost);
    const finalIsFraud = prediction.is_fraud_predicted || triggeredRules.length > 0;

    const txnRef = "SIM" + Date.now().toString(36).toUpperCase();

    const transaction = await prisma.transaction.create({
      data: {
        txnRef,
        senderId: req.user.userId,
        type,
        amount,
        upiApp,
        bank,
        merchantCategory: merchantCategory || "P2P",
        latitude,
        longitude,
        deviceId,
        status: finalIsFraud ? "UNDER_REVIEW" : "SUCCESS",
        timestamp: new Date(),
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
        humanReadableSummary: prediction.human_readable_summary,
        triggeredRules: triggeredRules,
      },
    });

    return res.status(201).json({
      transaction,
      fraudFlag,
      prediction: {
        ...prediction,
        risk_score: combinedRiskScore,
        is_fraud_predicted: finalIsFraud,
        triggered_rules: triggeredRules,
      },
    });
  } catch (err) {
    console.error("Simulation error:", err.message);
    return res.status(502).json({ error: "Could not reach the AI service or save the transaction." });
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