// Tunable data for the UPI scanner. Everything here is a plain list or number, so the
// heuristics can be reviewed and adjusted without touching the scoring logic.

// Common UPI handles. The list is not exhaustive: an unknown handle is only a mild
// signal, because new handles appear over time.
const KNOWN_HANDLES = [
  "ybl", "ibl", "axl", "okaxis", "okhdfcbank", "okicici", "oksbi", "paytm", "apl", "upi",
  "sbi", "icici", "hdfcbank", "axisbank", "pnb", "boi", "cnrb", "kotak", "barodampay",
  "ikwik", "freecharge", "airtel", "jupiteraxis", "fbl", "yesbank", "yesbankltd", "rbl",
  "idfcfirst", "indus", "aubank", "federal", "abfspay", "waicici", "wahdfcbank", "waaxis",
  "wasbi", "postbank", "unionbank", "ezetap", "pingpay", "slice", "fam",
];

// Names that scammers like to borrow. Matched after separators and leetspeak are removed.
const BRANDS = [
  "amazon", "flipkart", "paytm", "phonepe", "googlepay", "gpay", "bhim", "npci", "irctc",
  "hdfc", "icici", "axisbank", "statebank", "airtel", "myntra", "swiggy", "zomato",
  "aadhaar", "uidai", "incometax",
];

// Words that show up in refund, prize and customer-care scams.
const STRONG_KEYWORDS = [
  "refund", "cashback", "reward", "lottery", "prize", "kyc", "claim",
  "helpdesk", "customercare", "support",
];
const WEAK_KEYWORDS = ["offer", "bonus", "loan", "verify", "winner", "gift", "lucky"];

const LARGE_AMOUNT = 10000;

const POINTS = {
  unknownHandle: 10,
  strongKeywordFirst: 25,
  strongKeywordExtra: 10,
  keywordCap: 40,
  weakKeyword: 10,
  brandMention: 10,
  brandWithKeyword: 35,
  lookalike: 30,
  brandInNameOnly: 15,
  reportsOne: 20,
  reportsFew: 40,
  reportsMany: 60,
  platformFlaggedSome: 15,
  platformFlaggedMany: 30,
  platformMulePattern: 20,
  largeAmount: 10,
  receiveViaPayQr: 100,
};

const LEVELS = [
  { min: 75, level: "CRITICAL" },
  { min: 50, level: "HIGH" },
  { min: 25, level: "MEDIUM" },
  { min: 0, level: "LOW" },
];

module.exports = { KNOWN_HANDLES, BRANDS, STRONG_KEYWORDS, WEAK_KEYWORDS, LARGE_AMOUNT, POINTS, LEVELS };