// Pure functions - no database access, so they are easy to unit test.
const cfg = require("./scannerConfig");

const VPA_PATTERN = /^[a-z0-9][a-z0-9._-]{1,49}@[a-z][a-z0-9]{1,29}$/;
const LEET = { "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t" };

// Lowercase and drop separators so "cash-back" and "Cash.Back" both become "cashback".
function compact(text) {
  return String(text || "").toLowerCase().replace(/[\s._-]+/g, "");
}

// Same, but also undo common digit-for-letter swaps, so "amaz0n" becomes "amazon".
function leet(text) {
  return compact(text).replace(/[013457]/g, (ch) => LEET[ch] || ch);
}

function findMatches(text, words) {
  return words.filter((w) => text.includes(w));
}

function parseVpa(input) {
  const vpa = String(input || "").trim().toLowerCase();
  if (!VPA_PATTERN.test(vpa)) {
    return { valid: false, inputType: "VPA", error: "This is not a valid UPI address. It should look like name@bank." };
  }
  const parts = vpa.split("@");
  return { valid: true, inputType: "VPA", vpa, username: parts[0], handle: parts[1], payeeName: null, amount: null };
}

function parseQr(text) {
  if (!/^upi:\/\/pay\b/i.test(text)) {
    return { valid: false, inputType: "QR", error: "Only UPI payment links (upi://pay?...) can be checked." };
  }
  const queryStart = text.indexOf("?");
  const params = new URLSearchParams(queryStart === -1 ? "" : text.slice(queryStart + 1));
  const pa = params.get("pa");
  if (!pa) {
    return { valid: false, inputType: "QR", error: "This QR does not contain a payee address." };
  }
  const parsed = parseVpa(pa);
  if (!parsed.valid) {
    return { valid: false, inputType: "QR", error: "This QR contains an invalid payee address." };
  }
  const amount = parseFloat(params.get("am"));
  return Object.assign({}, parsed, {
    inputType: "QR",
    payeeName: params.get("pn") ? params.get("pn").trim() : null,
    amount: amount > 0 ? amount : null,
  });
}

// Accepts a UPI ID or the text of a UPI QR code (upi://pay?pa=...&pn=...).
function analyseInput(raw) {
  const text = String(raw || "").trim();
  if (!text) {
    return { valid: false, inputType: "VPA", error: "Enter a UPI ID, or paste the text of a UPI QR code." };
  }
  return /^upi:\/\//i.test(text) ? parseQr(text) : parseVpa(text);
}

// A payment counts against a payee only when something other than the payee check itself
// flagged it, so a payment flagged purely because the payee looked risky cannot raise the
// payee's own score. An analyst's decision always wins: confirmed fraud counts, a false
// positive does not.
function countsAsFlagged(flag) {
  if (!flag) return false;
  if (flag.reviewStatus === "CONFIRMED_FRAUD") return true;
  if (flag.reviewStatus === "FALSE_POSITIVE") return false;
  if (!flag.isFraudPredicted) return false;
  const rules = Array.isArray(flag.triggeredRules) ? flag.triggeredRules : [];
  const onlyPayeeRules = rules.length > 0 && rules.every((r) => String(r).startsWith("RECEIVER_"));
  return !onlyPayeeRules;
}

// Counts only - no identities - from payments that other users made to this address.
function summarisePlatformActivity(rows) {
  const senders = new Set();
  let flagged = 0;
  (rows || []).forEach((r) => {
    senders.add(r.senderId);
    if (countsAsFlagged(r.fraudFlag)) flagged += 1;
  });
  return { totalPayments: (rows || []).length, distinctSenders: senders.size, flaggedPayments: flagged };
}

function levelFor(score) {
  return cfg.LEVELS.find((l) => score >= l.min).level;
}

function adviceFor(level, intent, inputType) {
  const advice = [];
  if (level === "CRITICAL") {
    advice.push("Do not pay. If you were told this is a refund or that you will receive money, it is a scam.");
  } else if (level === "HIGH") {
    advice.push("Do not pay unless you can verify the payee through a channel you trust.");
  } else if (level === "MEDIUM") {
    advice.push("Proceed with caution and confirm the payee another way first.");
  } else {
    advice.push("No red flags found. This does not prove the payee is genuine.");
  }
  if (intent === "receive") {
    advice.push("Receiving money never needs your UPI PIN, a QR scan, or approving a request. If something asks for any of these, you are about to send money.");
  }
  return advice;
}

function scoreTarget(ctx) {
  const P = cfg.POINTS;
  const signals = [];
  const add = (id, label, points, detail) => {
    if (points > 0) signals.push({ id, label, points, detail });
  };

  const rawText = compact(ctx.username) + " " + compact(ctx.payeeName);
  const leetText = leet(ctx.username) + " " + leet(ctx.payeeName);

  // 1. Handle
  if (!cfg.KNOWN_HANDLES.includes(ctx.handle)) {
    add("unknown_handle", "Unfamiliar bank handle", P.unknownHandle, "@" + ctx.handle + " is not on our list of common UPI handles.");
  }

  // 2. Scam wording
  const strong = findMatches(leetText, cfg.STRONG_KEYWORDS);
  const weak = findMatches(leetText, cfg.WEAK_KEYWORDS);
  const keywordHit = strong.length > 0 || weak.length > 0;
  if (strong.length > 0) {
    const pts = Math.min(P.keywordCap, P.strongKeywordFirst + P.strongKeywordExtra * (strong.length - 1));
    add("scam_words", "Scam wording", pts, "Contains: " + strong.join(", ") + ". Genuine refunds are credited automatically and never ask you to approve anything.");
  } else if (weak.length > 0) {
    add("scam_words", "Promotional wording", P.weakKeyword, "Contains: " + weak.join(", ") + ".");
  }

  // 3. Brand names
  const brands = findMatches(leetText, cfg.BRANDS);
  if (brands.length > 0) {
    if (keywordHit) {
      add("brand_with_keyword", "Brand name combined with scam wording", P.brandWithKeyword, "Uses " + brands.join(", ") + " together with refund or support language, a common impersonation pattern.");
    } else {
      add("brand_mention", "Uses a well-known brand name", P.brandMention, "Mentions " + brands.join(", ") + ". Confirm this is the official merchant.");
    }
  }

  // 4. Look-alikes: the brand only appears once digit swaps are undone
  const lookalikes = brands.filter((b) => !rawText.includes(b));
  if (lookalikes.length > 0) {
    add("lookalike", "Look-alike spelling", P.lookalike, "Imitates " + lookalikes.join(", ") + " using swapped characters.");
  }

  // 5. QR name claims a brand the address does not mention
  if (ctx.payeeName) {
    const nameBrands = findMatches(leet(ctx.payeeName), cfg.BRANDS);
    const missing = nameBrands.filter((b) => !leet(ctx.username).includes(b));
    if (missing.length > 0) {
      add("name_mismatch", "Name and address do not match", P.brandInNameOnly, "The payee name claims " + missing.join(", ") + " but the address does not mention it.");
    }
  }

  // 6. Community reports
  const reports = ctx.reportCount || 0;
  if (reports >= 5) add("reports", "Reported by many users", P.reportsMany, reports + " accounts on this platform reported this address.");
  else if (reports >= 2) add("reports", "Reported by other users", P.reportsFew, reports + " accounts on this platform reported this address.");
  else if (reports === 1) add("reports", "Reported by another user", P.reportsOne, "1 account on this platform reported this address.");

  // 7. Platform behaviour
  const platform = ctx.platform || { totalPayments: 0, distinctSenders: 0, flaggedPayments: 0 };
  if (platform.flaggedPayments >= 3) add("platform_flagged", "Payments to this address keep getting flagged", P.platformFlaggedMany, platform.flaggedPayments + " of " + platform.totalPayments + " payments to it were flagged.");
  else if (platform.flaggedPayments >= 1) add("platform_flagged", "A payment to this address was flagged", P.platformFlaggedSome, platform.flaggedPayments + " of " + platform.totalPayments + " payments to it were flagged.");
  if (platform.distinctSenders >= 3 && platform.flaggedPayments >= 1) {
    add("mule_pattern", "Many different senders", P.platformMulePattern, "Paid by " + platform.distinctSenders + " different accounts, some flagged. This is how mule accounts collect money.");
  }

  // 8. QR specifics
  if (ctx.inputType === "QR" && ctx.amount && ctx.amount >= cfg.LARGE_AMOUNT) {
    add("large_amount", "Large pre-filled amount", P.largeAmount, "The QR asks for Rs " + ctx.amount.toLocaleString("en-IN") + ". Check it matches what you owe.");
  }
  if (ctx.inputType === "QR" && ctx.intent === "receive") {
    add("receive_via_pay_qr", "Scanning a pay QR to receive money", P.receiveViaPayQr, "A UPI payment QR can only send money. Nobody can pay you by having you scan one.");
  }

  const score = Math.min(100, signals.reduce((sum, s) => sum + s.points, 0));
  const level = levelFor(score);
  return { riskScore: score, riskLevel: level, signals, advice: adviceFor(level, ctx.intent, ctx.inputType) };
}

module.exports = { analyseInput, parseVpa, parseQr, scoreTarget, summarisePlatformActivity, levelFor, compact, leet };