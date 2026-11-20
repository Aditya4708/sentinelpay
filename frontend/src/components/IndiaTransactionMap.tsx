import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useInView } from "framer-motion";
import { INDIA_PATH, INDIA_VIEWBOX, CITY_POINTS } from "../constants/indiaMapData";
import RiskScore from "./RiskScore";

type Anchor = "start" | "end";

interface CityLabel {
  name: string;
  dx: number;
  anchor: Anchor;
}

// Which cities get a dot, and on which side the name is written.
const CITIES: CityLabel[] = [
  { name: "Chandigarh", dx: -8, anchor: "end" },
  { name: "Delhi", dx: 8, anchor: "start" },
  { name: "Jaipur", dx: -8, anchor: "end" },
  { name: "Lucknow", dx: 8, anchor: "start" },
  { name: "Ahmedabad", dx: -8, anchor: "end" },
  { name: "Bhopal", dx: -8, anchor: "end" },
  { name: "Kolkata", dx: 8, anchor: "start" },
  { name: "Guwahati", dx: 8, anchor: "start" },
  { name: "Mumbai", dx: -8, anchor: "end" },
  { name: "Pune", dx: 8, anchor: "start" },
  { name: "Hyderabad", dx: 8, anchor: "start" },
  { name: "Bengaluru", dx: -8, anchor: "end" },
  { name: "Chennai", dx: 8, anchor: "start" },
  { name: "Kochi", dx: -8, anchor: "end" },
];

// Payment routes drawn as arcs. Red routes carry a flagged payment.
const ROUTES: { from: string; to: string; flagged?: boolean }[] = [
  { from: "Mumbai", to: "Delhi" },
  { from: "Delhi", to: "Kolkata" },
  { from: "Ahmedabad", to: "Jaipur" },
  { from: "Delhi", to: "Lucknow", flagged: true },
  { from: "Lucknow", to: "Guwahati" },
  { from: "Kolkata", to: "Chennai" },
  { from: "Hyderabad", to: "Bengaluru", flagged: true },
  { from: "Mumbai", to: "Hyderabad" },
  { from: "Chennai", to: "Kochi" },
  { from: "Pune", to: "Bengaluru" },
];

interface FeedEvent {
  city: string;
  amount: number;
  flagged: boolean;
  note: string;
  score: number;
}

// Illustrative events. The numbers echo real simulator runs, but nothing here is live bank data.
const EVENTS: FeedEvent[] = [
  { city: "Pune", amount: 450, flagged: false, note: "Usual device, usual hours", score: 10.04 },
  { city: "Bengaluru", amount: 45000, flagged: true, note: "New device, 03:00, large amount", score: 100 },
  { city: "Delhi", amount: 1200, flagged: false, note: "Normal amount for this user", score: 8.6 },
  { city: "Mumbai", amount: 320, flagged: false, note: "Usual device, usual hours", score: 9.1 },
  { city: "Lucknow", amount: 15000, flagged: true, note: "New device, rapid payments", score: 95.5 },
  { city: "Chennai", amount: 780, flagged: false, note: "Known payee, usual location", score: 11.3 },
  { city: "Kolkata", amount: 450, flagged: true, note: "Payee flagged: look-alike address", score: 32.4 },
  { city: "Hyderabad", amount: 2100, flagged: false, note: "Normal amount for this user", score: 12.2 },
];

function arc(from: string, to: string): string {
  const [x1, y1] = CITY_POINTS[from];
  const [x2, y2] = CITY_POINTS[to];
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  return "M" + x1 + " " + y1 + " Q" + mx + " " + (my - dist * 0.22) + " " + x2 + " " + y2;
}

function Counter({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 0.8, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setValue(v) });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref}>
      {value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

const STATS = [
  { to: 50000, decimals: 0, label: "synthetic transactions generated" },
  { to: 7, decimals: 0, label: "fraud patterns modelled" },
  { to: 11, decimals: 0, label: "behavioural features per payment" },
  { to: 0.799, decimals: 3, label: "F1 score on held-out data" },
];

export default function IndiaTransactionMap() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2400);
    return () => clearInterval(id);
  }, []);

  const current = EVENTS[tick % EVENTS.length];
  const recent = [0, 1, 2, 3].map((i) => ({ ev: EVENTS[(tick - i + EVENTS.length * 10) % EVENTS.length], id: tick - i }));
  const [px, py] = CITY_POINTS[current.city];

  return (
    <section id="live-map" className="w-full py-24 px-4 sm:px-6 border-t scroll-mt-16" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="max-w-xl mb-12">
          <p className="sp-label mb-3 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--risk-safe)" }} />
            Simulated activity across India
          </p>
          <h2 className="font-medium mb-3" style={{ fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Every payment scored, wherever it starts
          </h2>
          <p className="text-base" style={{ color: "var(--text-secondary)", lineHeight: "24px" }}>
            SentinelPay scores each UPI payment against the sender's own behaviour and explains every flag. The map
            replays simulated payments to show what that looks like.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-stretch">
          <div className="sp-card p-4 sm:p-6">
            <svg viewBox={INDIA_VIEWBOX} className="w-full h-auto block max-h-[560px]" role="img" aria-label="Map of India with simulated UPI payment routes">
              <path d={INDIA_PATH} fill="var(--surface-raised)" stroke="var(--border-strong)" strokeWidth="0.8" />

              {ROUTES.map((r, i) => {
                const color = r.flagged ? "var(--risk-high)" : "var(--accent)";
                return (
                  <g key={r.from + r.to}>
                    <path id={"route-" + i} d={arc(r.from, r.to)} fill="none" stroke={color} strokeOpacity={r.flagged ? 0.5 : 0.25} strokeWidth="1" />
                    <circle r="2.6" fill={color}>
                      <animateMotion dur={4 + (i % 4) * 0.8 + "s"} begin={i * 0.5 + "s"} repeatCount="indefinite">
                        <mpath href={"#route-" + i} />
                      </animateMotion>
                    </circle>
                  </g>
                );
              })}

              {CITIES.map((c) => {
                const [x, y] = CITY_POINTS[c.name];
                const on = c.name === current.city;
                return (
                  <g key={c.name}>
                    <circle cx={x} cy={y} r="3" fill={on ? (current.flagged ? "var(--risk-high)" : "var(--risk-safe)") : "var(--text-muted)"} stroke="var(--surface)" strokeWidth="1.2" />
                    <text x={x + c.dx} y={y + 4} textAnchor={c.anchor} fontSize="12" fill={on ? "var(--text-primary)" : "var(--text-muted)"}>
                      {c.name}
                    </text>
                  </g>
                );
              })}

              <circle key={tick} cx={px} cy={py} r="4" fill="none" stroke={current.flagged ? "var(--risk-high)" : "var(--risk-safe)"} strokeWidth="1.5">
                <animate attributeName="r" from="4" to="28" dur="1.2s" fill="freeze" />
                <animate attributeName="opacity" from="0.9" to="0" dur="1.2s" fill="freeze" />
              </circle>
            </svg>

            <div className="flex items-center gap-6 mt-4">
              <span className="sp-label inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                Normal payment
              </span>
              <span className="sp-label inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--risk-high)" }} />
                Flagged payment
              </span>
            </div>
          </div>

          <div className="sp-card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 h-12 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-medium">Payment feed</p>
              <span className="sp-label">Simulated</span>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <AnimatePresence initial={false}>
                {recent.map(({ ev, id }, i) => (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: i === 0 ? 1 : 0.75, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="px-5 py-3 flex items-center gap-3 border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">
                        <span className="font-mono">{"₹" + ev.amount.toLocaleString("en-IN")}</span>{" "}
                        <span style={{ color: "var(--text-secondary)" }}>from {ev.city}</span>
                      </p>
                      <p className="sp-label truncate mt-0.5">{ev.note}</p>
                    </div>
                    <RiskScore score={ev.score} decimals={ev.score === 100 ? 0 : 1} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="sp-card p-5">
              <p className="font-mono font-medium mb-2" style={{ fontSize: 28, lineHeight: 1 }}>
                <Counter to={s.to} decimals={s.decimals} />
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.label.charAt(0).toUpperCase() + s.label.slice(1)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
