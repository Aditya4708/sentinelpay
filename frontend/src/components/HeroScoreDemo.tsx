import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RiskGauge, { EASE } from "./RiskGauge";
import { BandMarker, riskTone } from "./RiskScore";

interface Factor {
  label: string;
  impact: number;
}

interface Scenario {
  amount: string;
  title: string;
  meta: string;
  score: number;
  flagged: boolean;
  factors: Factor[];
  rules: string[];
}

// Values taken from real simulator runs on a trained account.
const SCENARIOS: Scenario[] = [
  {
    amount: "₹450",
    title: "To a known payee",
    meta: "PhonePe · 14:00 · usual device",
    score: 10.04,
    flagged: false,
    factors: [
      { label: "Normal transaction frequency", impact: -0.1263 },
      { label: "Normal amount for this user", impact: -0.0804 },
      { label: "Usual device", impact: -0.0723 },
    ],
    rules: [],
  },
  {
    amount: "₹45,000",
    title: "From a new device",
    meta: "PhonePe · 03:00 · never seen before",
    score: 100,
    flagged: true,
    factors: [
      { label: "New device", impact: 0.1768 },
      { label: "Unusual time of day", impact: 0.1409 },
      { label: "Unusually large amount", impact: 0.1154 },
    ],
    rules: ["TIME_WINDOW", "NEW_DEVICE"],
  },
];

const MAX_IMPACT = 0.18;

function ScoreView({ s }: { s: Scenario }) {
  const tone = riskTone(s.score);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-6 items-center"
    >
      <div>
        <RiskGauge score={s.score} ready />
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <p className="font-mono font-medium text-xl">{s.amount}</p>
          <span className="inline-flex items-center gap-2 text-sm" style={{ color: tone.color }}>
            <BandMarker band={tone.band} />
            {s.flagged ? "Flagged for review" : "Safe"}
          </span>
        </div>
        <p className="text-sm">{s.title}</p>
        <p className="sp-label font-mono mt-1 mb-5">{s.meta}</p>

        <div className="flex flex-col gap-3">
          {s.factors.map((f) => {
            const raises = f.impact > 0;
            return (
              <div key={f.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span style={{ color: "var(--text-secondary)" }}>{f.label}</span>
                  <span className="font-mono text-xs" style={{ color: raises ? "var(--risk-high)" : "var(--risk-safe)" }}>
                    {(raises ? "+" : "") + f.impact.toFixed(4)}
                  </span>
                </div>
                <div className="h-1 rounded-sm overflow-hidden" style={{ background: "var(--surface-raised)" }}>
                  <div
                    className="h-full"
                    style={{
                      width: Math.min(100, (Math.abs(f.impact) / MAX_IMPACT) * 100) + "%",
                      background: raises ? "var(--risk-high)" : "var(--risk-safe)",
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 min-h-[22px]">
          {s.rules.map((r) => (
            <span key={r} className="font-mono text-xs px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}>
              {r}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function HeroScoreDemo() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % SCENARIOS.length), 5200);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div className="w-full rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-soft)" }}>
      <div className="flex items-center justify-between gap-3 px-4 h-11 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-deep)" }}>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Scoring a payment</span>
        <div role="tablist" className="flex gap-0.5 p-0.5 rounded-md border" style={{ borderColor: "var(--border)" }}>
          {SCENARIOS.map((s, i) => {
            const on = i === idx;
            return (
              <button
                key={s.amount}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setIdx(i);
                  setPaused(true);
                }}
                className="font-mono text-xs px-2 h-6 rounded"
                style={{
                  background: on ? "var(--surface-raised)" : "transparent",
                  color: on ? "var(--text-primary)" : "var(--text-muted)",
                  transition: "background-color 150ms var(--ease), color 150ms var(--ease)",
                }}
              >
                {s.amount}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <ScoreView key={idx} s={SCENARIOS[idx]} />
        </AnimatePresence>
      </div>
    </div>
  );
}
