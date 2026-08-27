import { motion } from "framer-motion";

interface CityDot {
  name: string;
  x: number;
  y: number;
  flagged?: boolean;
  delay: number;
}

const CITIES: CityDot[] = [
  { name: "Delhi", x: 46, y: 22, delay: 0 },
  { name: "Mumbai", x: 28, y: 58, delay: 0.4 },
  { name: "Bangalore", x: 40, y: 78, delay: 0.8, flagged: true },
  { name: "Chennai", x: 48, y: 82, delay: 1.2 },
  { name: "Kolkata", x: 68, y: 48, delay: 1.6 },
  { name: "Hyderabad", x: 44, y: 66, delay: 2.0 },
  { name: "Pune", x: 32, y: 62, delay: 2.4 },
  { name: "Jaipur", x: 38, y: 34, delay: 2.8 },
  { name: "Lucknow", x: 52, y: 32, delay: 3.2, flagged: true },
  { name: "Ahmedabad", x: 26, y: 44, delay: 3.6 },
];

export default function IndiaTransactionMap() {
  return (
    <section className="w-full py-24 px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          Live across India
        </div>
        <h2 className="font-display font-semibold text-3xl md:text-4xl mb-3" style={{ color: "var(--text-primary)" }}>
          Watching every transaction, everywhere
        </h2>
        <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          RiskLens monitors UPI activity across every major Indian city in real time,
          flagging anomalies the instant they happen.
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto rounded-3xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)", aspectRatio: "4 / 5", maxHeight: "520px" }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
          <path d="M45 5 L58 8 L62 18 L70 22 L72 32 L68 40 L72 48 L65 58 L60 68 L55 78 L50 90 L44 85 L40 75 L35 68 L28 60 L24 48 L20 38 L24 28 L30 20 L38 12 Z" fill="none" stroke="var(--text-secondary)" strokeWidth="0.5" />
        </svg>

        {CITIES.map((city) => (
          <div key={city.name} className="absolute" style={{ left: city.x + "%", top: city.y + "%" }}>
            <motion.div className="rounded-full" style={{ width: city.flagged ? "10px" : "8px", height: city.flagged ? "10px" : "8px", background: city.flagged ? "var(--risk-high)" : "var(--risk-safe)", transform: "translate(-50%, -50%)" }} animate={{ scale: [1, 1.6, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity, delay: city.delay, ease: "easeInOut" }} />
            <motion.div className="absolute rounded-full" style={{ width: "8px", height: "8px", top: 0, left: 0, background: city.flagged ? "var(--risk-high)" : "var(--risk-safe)", transform: "translate(-50%, -50%)" }} animate={{ scale: [1, 3.5], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: city.delay, ease: "easeOut" }} />
            <span className="absolute text-[10px] font-medium whitespace-nowrap" style={{ top: "12px", left: "50%", transform: "translateX(-50%)", color: "var(--text-secondary)" }}>
              {city.name}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--risk-safe)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Normal activity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--risk-high)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Flagged transaction</span>
        </div>
      </div>
    </section>
  );
}