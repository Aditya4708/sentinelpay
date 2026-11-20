// Unit tests for the behavioural-baseline maths (no database, no network).
// Run with: node tests/baselineMath.test.js
const assert = require("assert");
const { computeBaseline, isClean, median, percentile } = require("../src/services/baselineMath");

const now = new Date("2026-10-10T12:00:00Z");
const day = 86400000;
const t = (o) => Object.assign(
  { amount: 500, deviceId: "dev-a", latitude: 19.07, longitude: 72.87, hourOfDay: 14,
    timestamp: new Date(now.getTime() - day), fraudFlag: { isFraudPredicted: false, reviewStatus: "PENDING" } }, o);

// helpers
assert.strictEqual(median([3, 1, 2]), 2);
assert.strictEqual(median([4, 1, 2, 3]), 2.5);
assert.strictEqual(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5), 1);
assert.strictEqual(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95), 10);

// 1. cold start below three normal transactions
let b = computeBaseline([t({}), t({})], now);
assert.strictEqual(b.source, "cold_start");
assert.strictEqual(b.cleanCount, 2);
assert.strictEqual(b.primaryDevice, null);

// 2. learned: median amount, devices, primary device
b = computeBaseline([t({ amount: 400 }), t({ amount: 500 }), t({ amount: 600, deviceId: "dev-b" }), t({ amount: 450 })], now);
assert.strictEqual(b.source, "learned");
assert.strictEqual(b.typicalAmount, 475);
assert.deepStrictEqual(b.knownDevices.sort(), ["dev-a", "dev-b"]);
assert.strictEqual(b.primaryDevice, "dev-a");
assert.strictEqual(b.activeHourStart, 7);

// 3. flagged transactions never teach the baseline
const flagged = t({ amount: 45000, deviceId: "dev-attacker", fraudFlag: { isFraudPredicted: true, reviewStatus: "PENDING" } });
b = computeBaseline([t({}), t({}), t({}), flagged], now);
assert.strictEqual(b.cleanCount, 3);
assert.ok(!b.knownDevices.includes("dev-attacker"));
assert.strictEqual(b.typicalAmount, 500);

// 4. analyst feedback: a false positive counts as normal, confirmed fraud does not
const fp = t({ deviceId: "dev-new-phone", fraudFlag: { isFraudPredicted: true, reviewStatus: "FALSE_POSITIVE" } });
const cf = t({ deviceId: "dev-bad", fraudFlag: { isFraudPredicted: false, reviewStatus: "CONFIRMED_FRAUD" } });
assert.strictEqual(isClean(fp), true);
assert.strictEqual(isClean(cf), false);
b = computeBaseline([t({}), t({}), t({}), fp, cf], now);
assert.ok(b.knownDevices.includes("dev-new-phone"));
assert.ok(!b.knownDevices.includes("dev-bad"));

// 5. active hours widen for night-time habits, but only with 10+ stored hours
const night = [];
for (let i = 0; i < 12; i++) night.push(t({ hourOfDay: i < 3 ? 2 : 14 }));
b = computeBaseline(night, now);
assert.strictEqual(b.activeHourStart, 1);
assert.strictEqual(b.activeHourEnd, 23);

const fewHours = [];
for (let i = 0; i < 12; i++) fewHours.push(t({ hourOfDay: i < 8 ? null : 2 }));
b = computeBaseline(fewHours, now);
assert.strictEqual(b.activeHourStart, 7);   // only 4 rows carry an hour, so nothing is learned

// 6. old rows without a stored hour do not distort the window
const oldRows = [];
for (let i = 0; i < 15; i++) oldRows.push(t({ hourOfDay: null, timestamp: new Date("2026-10-09T03:00:00Z") }));
b = computeBaseline(oldRows, now);
assert.strictEqual(b.activeHourStart, 7);

// 7. spend windows
b = computeBaseline([
  t({ amount: 100, timestamp: new Date(now - 2 * day) }),
  t({ amount: 200, timestamp: new Date(now - 10 * day) }),
  t({ amount: 300, timestamp: new Date(now - 40 * day) }),
], now);
assert.strictEqual(b.weeklySpend, 100);
assert.strictEqual(b.monthlySpend, 300);

console.log("baselineMath: all tests passed");
