// Pure functions - no database access, so they are easy to unit test.

const MIN_HISTORY = 3;
const MIN_HOURS_HISTORY = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULTS = {
  avgAmount: 800,
  activeHourStart: 7,
  activeHourEnd: 23,
  homeLat: 19.076,
  homeLon: 72.8777,
};

function sum(values) {
  return values.reduce((a, b) => a + b, 0);
}

function median(values) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Nearest-rank percentile.
function percentile(values, p) {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * s.length));
  return s[rank - 1];
}

// A transaction counts as normal behaviour if the system did not flag it, or an
// analyst later marked the flag as a false positive. Confirmed fraud never counts,
// so attackers cannot teach the baseline that their device or amounts are normal.
function isClean(txn) {
  const flag = txn.fraudFlag;
  if (!flag) return true;
  if (flag.reviewStatus === "CONFIRMED_FRAUD") return false;
  if (flag.reviewStatus === "FALSE_POSITIVE") return true;
  return !flag.isFraudPredicted;
}

// Older rows have no stored hour (their timestamp is the real clock time, not the
// simulated one), so they are ignored when learning active hours.
function hourOf(txn) {
  return Number.isInteger(txn.hourOfDay) ? txn.hourOfDay : null;
}

function computeBaseline(transactions, now) {
  const clock = now || new Date();
  const clean = transactions.filter(isClean);
  const cleanCount = clean.length;

  if (cleanCount < MIN_HISTORY) {
    return {
      source: "cold_start",
      cleanCount,
      typicalAmount: DEFAULTS.avgAmount,
      meanAmount: DEFAULTS.avgAmount,
      activeHourStart: DEFAULTS.activeHourStart,
      activeHourEnd: DEFAULTS.activeHourEnd,
      homeLat: DEFAULTS.homeLat,
      homeLon: DEFAULTS.homeLon,
      knownDevices: [],
      primaryDevice: null,
      dailyTxnCount: 0,
      weeklySpend: 0,
      monthlySpend: 0,
    };
  }

  const amounts = clean.map((t) => t.amount);
  const typicalAmount = Math.max(1, median(amounts));
  const meanAmount = sum(amounts) / amounts.length;

  // The active window may widen to cover night-time habits, but never shrinks below
  // 07:00-23:00, which keeps it inside the range the model was trained on.
  let activeHourStart = DEFAULTS.activeHourStart;
  const hours = clean.map(hourOf).filter((h) => h !== null);
  if (hours.length >= MIN_HOURS_HISTORY) {
    const lowHour = percentile(hours, 5);
    activeHourStart = Math.min(DEFAULTS.activeHourStart, Math.max(0, lowHour - 1));
  }

  const located = clean.filter((t) => typeof t.latitude === "number" && typeof t.longitude === "number");
  const homeLat = located.length ? median(located.map((t) => t.latitude)) : DEFAULTS.homeLat;
  const homeLon = located.length ? median(located.map((t) => t.longitude)) : DEFAULTS.homeLon;

  const deviceCounts = {};
  clean.forEach((t) => {
    deviceCounts[t.deviceId] = (deviceCounts[t.deviceId] || 0) + 1;
  });
  const knownDevices = Object.keys(deviceCounts);
  const primaryDevice = knownDevices.reduce(
    (best, d) => (deviceCounts[d] > deviceCounts[best] ? d : best),
    knownDevices[0]
  );

  const nowMs = clock.getTime();
  const within = (t, days) => nowMs - new Date(t.timestamp).getTime() <= days * DAY_MS;
  const lastWeek = clean.filter((t) => within(t, 7));
  const lastMonth = clean.filter((t) => within(t, 30));

  return {
    source: "learned",
    cleanCount,
    typicalAmount,
    meanAmount,
    activeHourStart,
    activeHourEnd: DEFAULTS.activeHourEnd,
    homeLat,
    homeLon,
    knownDevices,
    primaryDevice,
    dailyTxnCount: lastMonth.length / 30,
    weeklySpend: sum(lastWeek.map((t) => t.amount)),
    monthlySpend: sum(lastMonth.map((t) => t.amount)),
  };
}

const RISK_WINDOW = 10;

// The account's current risk score: a recency-weighted average of its last 10 scored
// transactions (newest weighs most). An analyst's decision overrides the model:
// confirmed fraud counts as 100 and a false positive as 0. Expects newest first.
function computeUserRiskScore(transactions) {
  const scored = (transactions || []).filter((t) => t.fraudFlag && typeof t.fraudFlag.riskScore === "number").slice(0, RISK_WINDOW);
  if (scored.length === 0) return 0;

  let weighted = 0;
  let weights = 0;
  scored.forEach((t, i) => {
    const flag = t.fraudFlag;
    let score = flag.riskScore;
    if (flag.reviewStatus === "CONFIRMED_FRAUD") score = 100;
    else if (flag.reviewStatus === "FALSE_POSITIVE") score = 0;
    const w = RISK_WINDOW - i;
    weighted += Math.max(0, Math.min(100, score)) * w;
    weights += w;
  });
  return Math.round((weighted / weights) * 10) / 10;
}

module.exports = { computeBaseline, computeUserRiskScore, isClean, median, percentile, DEFAULTS, MIN_HISTORY, MIN_HOURS_HISTORY, RISK_WINDOW };