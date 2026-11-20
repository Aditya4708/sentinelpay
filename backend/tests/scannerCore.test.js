// Unit tests for the UPI scanner's scoring logic (no database, no network).
// Run with: node tests/scannerCore.test.js
const assert = require("assert");
const { analyseInput, scoreTarget, summarisePlatformActivity, levelFor, leet, compact } = require("../src/services/scannerCore");

function check(input, opts) {
  const p = analyseInput(input);
  assert.ok(p.valid, "expected a valid input: " + input);
  return scoreTarget(Object.assign({ username: p.username, handle: p.handle, payeeName: p.payeeName, amount: p.amount,
    inputType: p.inputType, intent: "pay", reportCount: 0, platform: null }, opts || {}));
}
const ids = (r) => r.signals.map((s) => s.id);

// --- parsing ---
assert.strictEqual(analyseInput("").valid, false);
assert.strictEqual(analyseInput("not a vpa").valid, false);
assert.strictEqual(analyseInput("abc@").valid, false);
assert.strictEqual(analyseInput("@ybl").valid, false);
assert.strictEqual(analyseInput("a b@ybl").valid, false);
assert.strictEqual(analyseInput("  Rahul.Sharma@OkHdfcBank ").vpa, "rahul.sharma@okhdfcbank");
assert.strictEqual(analyseInput("upi://refund?pa=x@ybl").valid, false);
assert.strictEqual(analyseInput("upi://pay?pn=Shop").valid, false);
assert.strictEqual(analyseInput("upi://pay?pa=bad address&pn=Shop").valid, false);

const qr = analyseInput("UPI://pay?pa=shopkeeper@oksbi&pn=City%20Mart&am=250.50&cu=INR");
assert.strictEqual(qr.valid, true);
assert.strictEqual(qr.inputType, "QR");
assert.strictEqual(qr.payeeName, "City Mart");
assert.strictEqual(qr.amount, 250.5);
assert.strictEqual(analyseInput("upi://pay?pa=shop@oksbi&am=-5").amount, null);

// --- text helpers ---
assert.strictEqual(compact("Cash-Back.Offer_1"), "cashbackoffer1");
assert.strictEqual(leet("Amaz0n"), "amazon");

// --- ordinary payees stay low ---
let r = check("rahul.sharma@okhdfcbank");
assert.strictEqual(r.riskLevel, "LOW"); assert.strictEqual(r.signals.length, 0);
r = check("9876543210@ybl");
assert.strictEqual(r.riskLevel, "LOW"); assert.strictEqual(r.signals.length, 0);
r = check("shop@unknownbank");
assert.strictEqual(r.riskScore, 10); assert.strictEqual(r.riskLevel, "LOW");
r = check("amazonpay@apl");
assert.deepStrictEqual(ids(r), ["brand_mention"]); assert.strictEqual(r.riskLevel, "LOW");

// --- scam patterns rise ---
r = check("cashback-refund@okaxis");
assert.strictEqual(r.riskScore, 35); assert.strictEqual(r.riskLevel, "MEDIUM");
r = check("amazon-refund@okaxis");
assert.strictEqual(r.riskScore, 60); assert.strictEqual(r.riskLevel, "HIGH");
assert.deepStrictEqual(ids(r), ["scam_words", "brand_with_keyword"]);
r = check("paytm-support@ybl");
assert.strictEqual(r.riskLevel, "HIGH");
r = check("amaz0n.refund@ybl");
assert.ok(ids(r).includes("lookalike")); assert.strictEqual(r.riskScore, 90); assert.strictEqual(r.riskLevel, "CRITICAL");
r = check("kyc.update.helpdesk@ybl");
assert.ok(r.riskScore >= 35);

// --- QR name checks ---
r = check("upi://pay?pa=9999999999@ybl&pn=Amazon%20Refund");
assert.ok(ids(r).includes("name_mismatch")); assert.strictEqual(r.riskLevel, "CRITICAL");
r = check("upi://pay?pa=citymart@oksbi&pn=City%20Mart&am=250");
assert.strictEqual(r.riskLevel, "LOW");
r = check("upi://pay?pa=citymart@oksbi&pn=City%20Mart&am=50000");
assert.deepStrictEqual(ids(r), ["large_amount"]);

// --- scanning a pay QR to receive money is always critical ---
r = check("upi://pay?pa=citymart@oksbi&pn=City%20Mart", { intent: "receive" });
assert.strictEqual(r.riskLevel, "CRITICAL"); assert.ok(ids(r).includes("receive_via_pay_qr"));
assert.ok(r.advice.length === 2);
r = check("citymart@oksbi", { intent: "receive" });               // a plain address only adds advice
assert.strictEqual(r.riskLevel, "LOW"); assert.ok(r.advice.length === 2);

// --- community reports ---
assert.strictEqual(check("friend@oksbi", { reportCount: 1 }).riskScore, 20);
assert.strictEqual(check("friend@oksbi", { reportCount: 3 }).riskScore, 40);
assert.strictEqual(check("friend@oksbi", { reportCount: 9 }).riskScore, 60);
r = check("cashback-refund@okaxis", { reportCount: 3 });
assert.strictEqual(r.riskScore, 75); assert.strictEqual(r.riskLevel, "CRITICAL");

// --- platform activity: what counts against a payee ---
const row = (sender, flag) => ({ senderId: sender, fraudFlag: flag });
const flaggedBy = (extra) => Object.assign({ isFraudPredicted: true, reviewStatus: "PENDING", triggeredRules: [] }, extra);

assert.strictEqual(summarisePlatformActivity([row("a", { isFraudPredicted: true })]).flaggedPayments, 1);   // older row shape
assert.strictEqual(summarisePlatformActivity([row("a", null)]).flaggedPayments, 0);
assert.strictEqual(summarisePlatformActivity([row("a", { isFraudPredicted: false })]).flaggedPayments, 0);
// a payment flagged only because of the payee must not count against the payee
assert.strictEqual(summarisePlatformActivity([row("a", flaggedBy({ triggeredRules: ["RECEIVER_CRITICAL"] }))]).flaggedPayments, 0);
assert.strictEqual(summarisePlatformActivity([row("a", flaggedBy({ triggeredRules: ["RECEIVER_HIGH"] }))]).flaggedPayments, 0);
// flagged for another reason as well: counts
assert.strictEqual(summarisePlatformActivity([row("a", flaggedBy({ triggeredRules: ["TIME_WINDOW", "RECEIVER_HIGH"] }))]).flaggedPayments, 1);
assert.strictEqual(summarisePlatformActivity([row("a", flaggedBy({ triggeredRules: ["NEW_DEVICE"] }))]).flaggedPayments, 1);
assert.strictEqual(summarisePlatformActivity([row("a", flaggedBy({ triggeredRules: [] }))]).flaggedPayments, 1);
assert.strictEqual(summarisePlatformActivity([row("a", flaggedBy({ triggeredRules: null }))]).flaggedPayments, 1);
// analyst decisions win
assert.strictEqual(summarisePlatformActivity([row("a", flaggedBy({ triggeredRules: ["RECEIVER_CRITICAL"], reviewStatus: "CONFIRMED_FRAUD" }))]).flaggedPayments, 1);
assert.strictEqual(summarisePlatformActivity([row("a", { isFraudPredicted: false, reviewStatus: "CONFIRMED_FRAUD", triggeredRules: [] })]).flaggedPayments, 1);
assert.strictEqual(summarisePlatformActivity([row("a", flaggedBy({ triggeredRules: ["NEW_DEVICE"], reviewStatus: "FALSE_POSITIVE" }))]).flaggedPayments, 0);
// totals and distinct senders
assert.deepStrictEqual(summarisePlatformActivity([]), { totalPayments: 0, distinctSenders: 0, flaggedPayments: 0 });
const mixed = summarisePlatformActivity([
  row("a", flaggedBy({ triggeredRules: ["NEW_DEVICE"] })), row("b", null), row("c", flaggedBy({ triggeredRules: ["TIME_WINDOW"] }))]);
assert.deepStrictEqual(mixed, { totalPayments: 3, distinctSenders: 3, flaggedPayments: 2 });
r = check("friend@oksbi", { platform: mixed });
assert.deepStrictEqual(ids(r), ["platform_flagged", "mule_pattern"]); assert.strictEqual(r.riskScore, 35);

// --- caps and levels ---
r = check("amaz0n.refund@unknownbank", { reportCount: 9, platform: { totalPayments: 9, distinctSenders: 5, flaggedPayments: 5 } });
assert.strictEqual(r.riskScore, 100);
assert.deepStrictEqual([0, 24, 25, 49, 50, 74, 75, 100].map(levelFor), ["LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH", "HIGH", "CRITICAL", "CRITICAL"]);

console.log("scannerCore: all tests passed");
