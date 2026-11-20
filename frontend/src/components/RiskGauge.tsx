import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import { riskTone, BAND_COLOR } from "./RiskScore";

export const EASE = [0.22, 1, 0.36, 1] as const;

export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 0.8, ease: EASE, onUpdate: (v) => setShown(v) });
    return () => c.stop();
  }, [value]);
  return <>{shown.toFixed(decimals)}</>;
}

/* ---------- Risk gauge: an instrument readout ---------- */

const CX = 120;
const CY = 112;
const R = 88;
const START = -120;
const SWEEP = 240;

function polar(angleDeg: number, r: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}
function arc(from: number, to: number, r: number) {
  const a1 = START + (SWEEP * from) / 100;
  const a2 = START + (SWEEP * to) / 100;
  const p1 = polar(a1, r);
  const p2 = polar(a2, r);
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${p2.x} ${p2.y}`;
}

export default function RiskGauge({ score, ready }: { score: number; ready: boolean }) {
  const tone = riskTone(score);
  const v = Math.max(0, Math.min(score, 100));
  const ticks = Array.from({ length: 21 }, (_, i) => i * 5);

  return (
    <svg viewBox="0 0 240 200" className="w-full max-w-[280px] mx-auto block" role="img" aria-label={`Risk score ${score.toFixed(1)}, ${tone.label}`}>
      {/* band zones */}
      <path d={arc(0, 25, R + 12)} fill="none" stroke={BAND_COLOR.safe} strokeWidth={2} opacity={0.6} />
      <path d={arc(25.8, 50, R + 12)} fill="none" stroke={BAND_COLOR.watch} strokeWidth={2} opacity={0.6} />
      <path d={arc(50.8, 100, R + 12)} fill="none" stroke={BAND_COLOR.high} strokeWidth={2} opacity={0.6} />

      {/* ticks */}
      {ticks.map((t) => {
        const major = t % 25 === 0;
        const a = START + (SWEEP * t) / 100;
        const p1 = polar(a, R - 10);
        const p2 = polar(a, R - (major ? 20 : 15));
        return <line key={t} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={major ? "var(--text-muted)" : "var(--border-strong)"} strokeWidth={1} />;
      })}
      {[0, 25, 50, 100].map((t) => {
        const p = polar(START + (SWEEP * t) / 100, R - 32);
        return (
          <text key={t} x={p.x} y={p.y + 4} textAnchor="middle" fontSize={10} fill="var(--text-muted)" style={{ fontFamily: "var(--font-mono)" }}>
            {t}
          </text>
        );
      })}

      {/* track and value */}
      <path d={arc(0, 100, R)} fill="none" stroke="var(--surface-raised)" strokeWidth={6} strokeLinecap="round" />
      {ready && v > 0 && (
        <motion.path
          d={arc(0, 100, R)}
          fill="none"
          stroke={tone.color}
          strokeWidth={6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          initial={{ strokeDashoffset: 1 }}
          animate={{ strokeDashoffset: 1 - v / 100 }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      )}

      <text x={CX} y={CY + 4} textAnchor="middle" fontSize={40} fontWeight={500} fill="var(--text-primary)" style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
        {ready ? <CountUp value={score} decimals={1} /> : "--"}
      </text>
      <text x={CX} y={CY + 28} textAnchor="middle" fontSize={12} fill="var(--text-muted)">
        out of 100
      </text>
    </svg>
  );
}

