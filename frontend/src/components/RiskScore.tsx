// The signature detail: every risk score is a mono figure next to a three-segment
// band marker (safe / watch / high) that shows where the score falls.

export type RiskBand = "safe" | "watch" | "high";

// Same bands as the scanner: below 25 safe, below 50 watch, else high.
export function riskBand(score: number): RiskBand {
  if (score >= 50) return "high";
  if (score >= 25) return "watch";
  return "safe";
}

export const BAND_LABEL: Record<RiskBand, string> = { safe: "Safe", watch: "Watch", high: "High risk" };
export const BAND_COLOR: Record<RiskBand, string> = {
  safe: "var(--risk-safe)",
  watch: "var(--risk-watch)",
  high: "var(--risk-high)",
};
export const BAND_SOFT: Record<RiskBand, string> = {
  safe: "var(--risk-safe-soft)",
  watch: "var(--risk-watch-soft)",
  high: "var(--risk-high-soft)",
};

export function riskTone(score: number) {
  const band = riskBand(score);
  return { band, color: BAND_COLOR[band], label: BAND_LABEL[band], bg: BAND_SOFT[band] };
}

const ORDER: RiskBand[] = ["safe", "watch", "high"];

export function BandMarker({ band, size = "sm" }: { band: RiskBand; size?: "sm" | "md" }) {
  const w = size === "md" ? 10 : 6;
  const h = size === "md" ? 12 : 10;
  return (
    <span aria-hidden className="inline-flex items-end" style={{ gap: 2 }}>
      {ORDER.map((b) => (
        <span
          key={b}
          style={{
            width: w,
            height: h,
            borderRadius: 2,
            background: b === band ? BAND_COLOR[b] : "var(--border-strong)",
          }}
        />
      ))}
    </span>
  );
}

export default function RiskScore({
  score,
  decimals = 0,
  suffix = "",
  showLabel = false,
}: {
  score: number;
  decimals?: number;
  suffix?: string;
  showLabel?: boolean;
}) {
  const band = riskBand(score);
  return (
    <span className="inline-flex items-center gap-2" title={BAND_LABEL[band]}>
      <span className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>
        {score.toFixed(decimals)}
        {suffix}
      </span>
      <BandMarker band={band} />
      {showLabel && (
        <span className="text-xs" style={{ color: BAND_COLOR[band] }}>
          {BAND_LABEL[band]}
        </span>
      )}
    </span>
  );
}
