const prisma = require("../config/prisma");

async function evaluateRules(transactionData) {
  const rules = await prisma.fraudRule.findMany({ where: { isEnabled: true } });
  const triggered = [];
  let ruleScoreBoost = 0;

  for (const rule of rules) {
    const config = rule.config;
    let hit = false;

    switch (rule.type) {
      case "AMOUNT_THRESHOLD":
        if (config.maxAmount && transactionData.amount > config.maxAmount) hit = true;
        break;

      case "TIME_WINDOW":
        if (config.startHour !== undefined && config.endHour !== undefined) {
          const hour = transactionData.hourOfDay;
          if (config.startHour <= config.endHour) {
            hit = hour >= config.startHour && hour <= config.endHour;
          } else {
            hit = hour >= config.startHour || hour <= config.endHour;
          }
        }
        break;

      case "NEW_DEVICE":
        if (transactionData.deviceId !== transactionData.homeDeviceId) hit = true;
        break;

      case "VELOCITY_CHECK":
        if (config.maxTxnPerHour && transactionData.txnVelocity1h >= config.maxTxnPerHour) hit = true;
        break;

      case "MERCHANT_BLACKLIST":
        if (config.blacklistedCategories && config.blacklistedCategories.includes(transactionData.merchantCategory)) hit = true;
        break;

      default:
        break;
    }

    if (hit) {
      triggered.push(rule.type);
      ruleScoreBoost += rule.weight * 10;
    }
  }

  return { triggeredRules: triggered, ruleScoreBoost };
}

module.exports = { evaluateRules };