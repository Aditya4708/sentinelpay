import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Upload, Loader2, ScanLine } from "lucide-react";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
import { BandMarker, RiskBand } from "../components/RiskScore";
import api from "../services/api";

type Intent = "pay" | "receive";

interface Signal {
  id: string;
  label: string;
  points: number;
  detail: string;
}

interface ScanResult {
  valid: boolean;
  inputType: string;
  error?: string;
  target?: string;
  payeeName?: string | null;
  amount?: number | null;
  riskScore: number | null;
  riskLevel: string;
  signals: Signal[];
  advice: string[];
  community?: { reportCount: number };
  platform?: { totalPayments: number; distinctSenders: number; flaggedPayments: number };
  disclaimer?: string;
}

interface HistoryItem {
  id: string;
  target: string;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
}

const LEVEL_STYLE: Record<string, { label: string; color: string; band: RiskBand | null }> = {
  LOW: { label: "Low risk", color: "var(--risk-safe)", band: "safe" },
  MEDIUM: { label: "Medium risk", color: "var(--risk-watch)", band: "watch" },
  HIGH: { label: "High risk", color: "var(--risk-high)", band: "high" },
  CRITICAL: { label: "Critical risk", color: "var(--risk-high)", band: "high" },
  INVALID: { label: "Not a valid address", color: "var(--text-secondary)", band: null },
};

const EXAMPLES = [
  { label: "Normal payee", value: "rahul.sharma@okhdfcbank" },
  { label: "Fake refund", value: "amazon-refund@okaxis" },
  { label: "Look-alike", value: "amaz0n.refund@ybl" },
  { label: "Shop QR", value: "upi://pay?pa=citymart@oksbi&pn=City%20Mart&am=250" },
];

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

// Reads a UPI QR from an image file, entirely in the browser.
function decodeQrImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h);
      const code = jsQR(pixels.data, w, h);
      URL.revokeObjectURL(url);
      resolve(code ? code.data : null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export default function ScannerPage() {
  const [input, setInput] = useState("");
  const [intent, setIntent] = useState<Intent>("pay");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const auth = useCallback(
    () => ({ headers: { Authorization: "Bearer " + (localStorage.getItem("accessToken") || "") } }),
    []
  );

  const loadHistory = useCallback(() => {
    api
      .get("/scanner/history", auth())
      .then((res) => setHistory(res.data.scans))
      .catch(() => setHistory([]));
  }, [auth]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function runScan(text: string) {
    if (!text.trim()) {
      setError("Enter a UPI ID or upload a QR image first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/scanner/scan", { input: text, intent }, auth());
      setResult(res.data);
      loadHistory();
    } catch (err) {
      setError("Could not complete the scan. Check that the backend is running");
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    const text = await decodeQrImage(file);
    if (!text) {
      setError("No QR code could be read from that image. Try a clearer or closer photo");
      return;
    }
    setInput(text);
    runScan(text);
  }

  const style = result ? LEVEL_STYLE[result.riskLevel] || LEVEL_STYLE.INVALID : null;

  return (
    <DashboardShell active="Scanner">
      <PageHeader title="UPI scanner" meta="Check a UPI ID or a payment QR before you pay. Every point of the score comes with a reason" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <div className="sp-card p-5">
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>What are you doing</p>
            <div role="radiogroup" className="grid grid-cols-2 gap-0.5 p-0.5 rounded-lg border mb-4" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
              {(["pay", "receive"] as Intent[]).map((k) => {
                const on = intent === k;
                return (
                  <button
                    key={k}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setIntent(k)}
                    className="h-8 rounded-md text-sm"
                    style={{
                      background: on ? "var(--surface-raised)" : "transparent",
                      boxShadow: on ? "var(--highlight)" : "none",
                      color: on ? "var(--text-primary)" : "var(--text-secondary)",
                      transition: "background-color 150ms var(--ease), color 150ms var(--ease)",
                    }}
                  >
                    {k === "pay" ? "Paying someone" : "Expecting money"}
                  </button>
                );
              })}
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="name@bank or upi://pay?..."
              rows={3}
              className="sp-input py-2 mb-3 font-mono"
              style={{ height: "auto" }}
            />

            <div className="flex flex-wrap gap-2">
              <button onClick={() => runScan(input)} disabled={loading} className="sp-btn sp-btn-primary">
                {loading ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin" /> : <ScanLine size={16} strokeWidth={1.5} />}
                {loading ? "Scanning" : "Scan"}
              </button>
              <button onClick={() => fileRef.current && fileRef.current.click()} disabled={loading} className="sp-btn sp-btn-secondary">
                <Upload size={16} strokeWidth={1.5} />
                Upload QR image
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files ? e.target.files[0] : undefined);
                  e.target.value = "";
                }}
              />
            </div>

            {error && (
              <p className="text-sm mt-3" style={{ color: "var(--risk-high)" }}>
                {error}
              </p>
            )}

            <p className="sp-label mt-6 mb-2">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => {
                    setInput(ex.value);
                    runScan(ex.value);
                  }}
                  className="sp-btn sp-btn-secondary h-8 px-3 text-xs"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="sp-card p-2">
              <p className="text-sm font-medium px-3 h-10 flex items-center">Recent scans</p>
              {history.slice(0, 5).map((h) => {
                const st = LEVEL_STYLE[h.riskLevel] || LEVEL_STYLE.INVALID;
                return (
                  <button key={h.id} onClick={() => setInput(h.target)} className="sp-row w-full flex items-center justify-between gap-3 text-left px-3 h-10 rounded-lg">
                    <span className="font-mono text-sm truncate">{h.target}</span>
                    <span className="inline-flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-sm">{h.riskScore}</span>
                      {st.band && <BandMarker band={st.band} />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="sp-card p-5 self-start">
          {!result || !style ? (
            <div className="flex items-center justify-center text-center py-24">
              <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
                Scan an address to see its risk level, the reasons behind it and what to do next
              </p>
            </div>
          ) : !result.valid ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium mb-2" style={{ color: style.color }}>{style.label}</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{result.error}</p>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <p className="font-mono text-sm break-all">{result.target}</p>
                  {(result.payeeName || result.amount) && (
                    <p className="sp-label mt-1">
                      {result.payeeName ? "Name on QR " + result.payeeName : ""}
                      {result.payeeName && result.amount ? " · " : ""}
                      {result.amount ? "₹" + result.amount.toLocaleString("en-IN") : ""}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-medium" style={{ fontSize: 32, lineHeight: 1 }}>
                    {result.riskScore}
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}> / 100</span>
                  </p>
                  <p className="inline-flex items-center gap-2 text-sm mt-2" style={{ color: style.color }}>
                    {style.band && <BandMarker band={style.band} />}
                    {style.label}
                  </p>
                </div>
              </div>

              {result.signals.length === 0 ? (
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>No warning signs found</p>
              ) : (
                <div className="flex flex-col mb-6 border-t" style={{ borderColor: "var(--border)" }}>
                  {result.signals.map((s) => (
                    <div key={s.id} className="py-3 border-b" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm">{s.label}</span>
                        <span className="font-mono text-xs flex-shrink-0" style={{ color: "var(--risk-high)" }}>+{s.points}</span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{s.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {result.advice.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium mb-2">What to do</p>
                  <ul className="flex flex-col gap-2">
                    {result.advice.map((a, i) => (
                      <li key={i} className="text-sm pl-3 border-l-2" style={{ borderColor: "var(--accent)", color: "var(--text-secondary)" }}>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.community && result.platform && (
                <p className="sp-label mb-2">
                  Reported by {plural(result.community.reportCount, "account")} · {plural(result.platform.totalPayments, "payment")} to it on this platform, {result.platform.flaggedPayments} flagged
                </p>
              )}
              {result.disclaimer && <p className="sp-label">{result.disclaimer}</p>}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
