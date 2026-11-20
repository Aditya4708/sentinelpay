import { useState, FormEvent } from "react";
import { Loader2, History } from "lucide-react";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
import { BandMarker, riskTone } from "../components/RiskScore";
import { INDIAN_BANKS, UPI_APPS } from "../constants/indiaFinance";
import api from "../services/api";

const KNOWN_DEVICE = "dev-original123";

interface Prediction {
  risk_score: number;
  is_fraud_predicted: boolean;
  model_confidence: number;
  top_factors: { factor: string; impact: number }[];
  human_readable_summary: string;
  triggered_rules: string[];
}

interface BaselineInfo {
  source: string;
  cleanTransactions: number;
  typicalAmount: number;
  activeHours: number[];
  deviceStatus: string;
  velocity: number;
  velocitySource: string;
}

interface ReceiverInfo {
  vpa: string;
  riskScore: number;
  riskLevel: string;
  signals: { id: string; label: string; points: number }[];
  boost: number;
}

interface ScoreResponse {
  prediction: Prediction;
  baseline: BaselineInfo;
  receiver: ReceiverInfo | null;
}

const SCENARIOS = [
  {
    name: "Normal Transaction",
    realWorldContext: "A typical everyday UPI payment, the baseline against which fraud is measured.",
    values: { amount: 450, hourOfDay: 14, velocity: 0, newDevice: false },
  },
  {
    name: "Mule Account Pattern",
    realWorldContext: "A widely reported UPI fraud type: money moved rapidly through a freshly compromised or recruited account before it can be traced. One fraud-intelligence vendor reported 520,559 misused UPI addresses in March 2026 alone.",
    values: { amount: 15000, hourOfDay: 12, velocity: 6, newDevice: true },
  },
  {
    name: "Account Takeover (Night)",
    realWorldContext: "A scammer who obtained OTP/credentials via phishing or SIM swap logs in from their own device and drains the account at an hour the real owner would never transact.",
    values: { amount: 45000, hourOfDay: 3, velocity: 1, newDevice: true },
  },
  {
    name: "Compromised Device, Different City",
    realWorldContext: "Credentials used from a device and location far from the victim's normal pattern, a strong signal of unauthorized access rather than the account owner's own activity.",
    values: { amount: 28000, hourOfDay: 22, velocity: 2, newDevice: true },
  },
];

const PAYEE_EXAMPLES = [
  { label: "Normal payee", value: "rahul.sharma@okhdfcbank" },
  { label: "Fake refund payee", value: "amaz0n.refund@ybl" },
];

const DEVICE_STYLE: Record<string, { label: string; color: string }> = {
  known: { label: "Known device", color: "var(--risk-safe)" },
  new: { label: "New device", color: "var(--risk-high)" },
  unassessed: { label: "Not judged yet", color: "var(--risk-watch)" },
};

const LEVEL_COLOR: Record<string, string> = {
  LOW: "var(--risk-safe)",
  MEDIUM: "var(--risk-watch)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-high)",
};

const hh = (h: number) => String(h).padStart(2, "0") + ":00";

function Field({ label, value, children }: { label: string; value?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
        {label}
        {value !== undefined && <span className="font-mono" style={{ color: "var(--text-primary)" }}>{value}</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-9 py-2 border-b last:border-b-0 text-sm" style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export default function SimulatorPage() {
  const [form, setForm] = useState({
    amount: 450,
    upiApp: "PhonePe",
    bank: "HDFC Bank",
    hourOfDay: 14,
    deviceId: KNOWN_DEVICE,
    velocity: 0,
    receiverVpa: "",
  });
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function authHeaders() {
    return { headers: { Authorization: "Bearer " + (localStorage.getItem("accessToken") || "") } };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);

    const payload: Record<string, string | number> = {
      amount: form.amount,
      type: "P2P",
      merchantCategory: "P2P",
      upiApp: form.upiApp,
      bank: form.bank,
      hourOfDay: form.hourOfDay,
      deviceId: form.deviceId,
      txnVelocity1h: form.velocity,
    };
    if (form.receiverVpa.trim()) payload.receiverVpa = form.receiverVpa.trim();

    try {
      const res = await api.post("/transactions/simulate", payload, authHeaders());
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not process the transaction");
    } finally {
      setLoading(false);
    }
  }

  // Records a few ordinary transactions so a new account has a baseline to be judged against.
  async function buildHistory() {
    setSeeding(true);
    setError("");
    setNotice("");
    setResult(null);
    try {
      for (const amount of [420, 450, 480, 450]) {
        await api.post(
          "/transactions/simulate",
          { amount, type: "P2P", merchantCategory: "P2P", upiApp: "PhonePe", bank: "HDFC Bank", hourOfDay: 14, deviceId: KNOWN_DEVICE, txnVelocity1h: 0 },
          authHeaders()
        );
      }
      setNotice("Recorded 4 ordinary transactions. This account now has a learned baseline, so unusual devices, amounts and hours will stand out.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not build the history");
    } finally {
      setSeeding(false);
    }
  }

  function toggleDevice() {
    if (form.deviceId === KNOWN_DEVICE) {
      update("deviceId", "dev-" + Math.random().toString(36).slice(2, 14));
    } else {
      update("deviceId", KNOWN_DEVICE);
    }
  }

  function applyScenario(scenario: typeof SCENARIOS[0]) {
    setForm((prev) => ({
      ...prev,
      amount: scenario.values.amount,
      hourOfDay: scenario.values.hourOfDay,
      velocity: scenario.values.velocity,
      deviceId: scenario.values.newDevice ? "dev-" + Math.random().toString(36).slice(2, 14) : KNOWN_DEVICE,
    }));
    setActiveScenario(scenario.name);
    setResult(null);
    setNotice("");
  }

  const prediction = result ? result.prediction : null;
  const baseline = result ? result.baseline : null;
  const receiver = result ? result.receiver : null;
  const deviceStyle = baseline ? DEVICE_STYLE[baseline.deviceStatus] || DEVICE_STYLE.unassessed : null;
  const tone = prediction ? riskTone(prediction.risk_score) : null;

  return (
    <DashboardShell active="Transactions">
      <PageHeader
        title="Transaction simulator"
        meta="Score a live transaction and see the reasons behind it and what the system has learned about this account"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4">
        <div className="flex flex-col gap-4">
          <div className="sp-card p-2">
            <p className="text-sm font-medium px-3 h-10 flex items-center">Real-world scenarios</p>
            {SCENARIOS.map((s) => {
              const on = activeScenario === s.name;
              return (
                <button
                  key={s.name}
                  onClick={() => applyScenario(s)}
                  aria-pressed={on}
                  className="sp-row w-full text-left px-3 py-3 rounded-lg"
                  style={{ background: on ? "var(--surface-raised)" : undefined, boxShadow: on ? "var(--highlight)" : undefined }}
                >
                  <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)", fontWeight: on ? 500 : 400 }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: on ? "var(--accent)" : "var(--border-strong)" }} />
                    {s.name}
                  </span>
                  <span className="block text-sm mt-1 pl-3.5" style={{ color: "var(--text-secondary)" }}>{s.realWorldContext}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="sp-card p-5 flex flex-col gap-4">
            <Field label="Amount (₹)">
              <input type="number" value={form.amount} onChange={(e) => update("amount", Number(e.target.value))} className="sp-input font-mono" />
            </Field>

            <div>
              <Field label="Pay to (UPI ID, optional)">
                <input value={form.receiverVpa} onChange={(e) => update("receiverVpa", e.target.value)} placeholder="name@bank" className="sp-input font-mono" />
              </Field>
              <div className="flex flex-wrap gap-2 mt-2">
                {PAYEE_EXAMPLES.map((p) => (
                  <button key={p.label} type="button" onClick={() => update("receiverVpa", p.value)} className="sp-btn sp-btn-secondary h-7 px-2.5 text-xs">
                    {p.label}
                  </button>
                ))}
                {form.receiverVpa && (
                  <button type="button" onClick={() => update("receiverVpa", "")} className="sp-btn sp-btn-ghost h-7 px-2.5 text-xs">
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="UPI app">
                <select value={form.upiApp} onChange={(e) => update("upiApp", e.target.value)} className="sp-input">
                  {UPI_APPS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Bank">
                <select value={form.bank} onChange={(e) => update("bank", e.target.value)} className="sp-input">
                  {INDIAN_BANKS.slice(0, 10).map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Hour of day" value={hh(form.hourOfDay)}>
              <input type="range" min="0" max="23" value={form.hourOfDay} onChange={(e) => update("hourOfDay", Number(e.target.value))} className="w-full" style={{ accentColor: "var(--accent)" }} />
            </Field>

            <Field label="Transactions in the last hour" value={form.velocity}>
              <input type="range" min="0" max="10" value={form.velocity} onChange={(e) => update("velocity", Number(e.target.value))} className="w-full" style={{ accentColor: "var(--accent)" }} />
            </Field>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span style={{ color: "var(--text-secondary)" }}>
                Device <span className="font-mono ml-1" style={{ color: form.deviceId === KNOWN_DEVICE ? "var(--text-primary)" : "var(--risk-watch)" }}>{form.deviceId === KNOWN_DEVICE ? "usual" : "new"}</span>
              </span>
              <button type="button" onClick={toggleDevice} className="sp-btn sp-btn-ghost h-8 px-3 text-sm">
                {form.deviceId === KNOWN_DEVICE ? "Use a new device" : "Switch back to usual"}
              </button>
            </div>

            <button type="submit" disabled={loading || seeding} className="sp-btn sp-btn-primary sp-btn-lg w-full">
              {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
              {loading ? "Scoring" : "Score this transaction"}
            </button>

            {notice && <p className="text-sm" style={{ color: "var(--risk-safe)" }}>{notice}</p>}
            {error && <p className="text-sm" style={{ color: "var(--risk-high)" }}>{error}</p>}

            <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <button type="button" onClick={buildHistory} disabled={loading || seeding} className="sp-btn sp-btn-secondary">
                {seeding ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin" /> : <History size={16} strokeWidth={1.5} />}
                {seeding ? "Recording" : "Build a normal history first"}
              </button>
              <p className="sp-label mt-2">
                For new accounts. The system learns what is normal from each account's first few clean transactions. Until then it uses defaults and does not judge the device.
              </p>
            </div>
          </form>
        </div>

        <div className="sp-card p-6 self-start lg:sticky lg:top-8">
          {!prediction || !baseline || !deviceStyle ? (
            <div className="flex items-center justify-center text-center py-24">
              <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
                Pick a scenario or fill in the form, then score it to see the risk and its explanation here
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <p className="sp-label mb-2">Risk score</p>
                  <p className="font-mono font-medium" style={{ fontSize: 48, lineHeight: 1 }}>
                    {prediction.risk_score}
                    <span className="text-base" style={{ color: "var(--text-muted)" }}> / 100</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-2 text-sm" style={{ color: tone ? tone.color : undefined }}>
                    {tone && <BandMarker band={tone.band} size="md" />}
                    {prediction.is_fraud_predicted ? "Flagged for review" : "Looks safe"}
                  </span>
                  <p className="sp-label font-mono mt-2">Confidence {(prediction.model_confidence <= 1 ? prediction.model_confidence * 100 : prediction.model_confidence).toFixed(0)}%</p>
                </div>
              </div>

              <p className="text-sm mb-6 pl-3 border-l-2" style={{ color: "var(--text-secondary)", borderColor: tone ? tone.color : "var(--border)" }}>
                {prediction.human_readable_summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-2">Top contributing factors</p>
                  <div className="flex flex-col border-t" style={{ borderColor: "var(--border)" }}>
                    {prediction.top_factors.map((f) => (
                      <div key={f.factor} className="flex items-center justify-between gap-3 min-h-9 py-2 border-b text-sm" style={{ borderColor: "var(--border)" }}>
                        <span>{f.factor}</span>
                        <span className="font-mono text-xs" style={{ color: f.impact > 0 ? "var(--risk-high)" : "var(--risk-safe)" }}>
                          {f.impact > 0 ? "+" : ""}{f.impact}
                        </span>
                      </div>
                    ))}
                  </div>

                  {prediction.triggered_rules.length > 0 && (
                    <div className="mt-4">
                      <p className="sp-label mb-2">Rules triggered</p>
                      <div className="flex flex-wrap gap-1.5">
                        {prediction.triggered_rules.map((r) => (
                          <span key={r} className="text-xs font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">What the system knows about this account</p>
                  <div className="border-t" style={{ borderColor: "var(--border)" }}>
                    <Row label="Device">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: deviceStyle.color }} />
                        {deviceStyle.label}
                      </span>
                    </Row>
                    <Row label="Baseline">
                      {baseline.source === "learned"
                        ? "Learned from " + baseline.cleanTransactions + " clean"
                        : "Cold start, " + baseline.cleanTransactions + " of 3 clean"}
                    </Row>
                    <Row label="Typical amount">
                      <span className="font-mono">{"₹"}{Math.round(baseline.typicalAmount).toLocaleString("en-IN")}</span>
                    </Row>
                    <Row label="Active hours">
                      <span className="font-mono">{hh(baseline.activeHours[0])} to {hh(baseline.activeHours[1])}</span>
                    </Row>
                    <Row label="Last hour">
                      <span className="font-mono">{baseline.velocity}</span> <span style={{ color: "var(--text-muted)" }}>{baseline.velocitySource}</span>
                    </Row>
                  </div>
                </div>
              </div>

              {receiver && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">Payee check</p>
                  <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm truncate">{receiver.vpa}</span>
                      <span className="text-sm flex-shrink-0 inline-flex items-center gap-2" style={{ color: LEVEL_COLOR[receiver.riskLevel] || "var(--text-secondary)" }}>
                        <span className="font-mono" style={{ color: "var(--text-primary)" }}>{receiver.riskScore}</span>
                        {receiver.riskLevel.charAt(0) + receiver.riskLevel.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {receiver.signals.length > 0 && (
                      <ul className="mt-2 text-sm flex flex-col gap-1" style={{ color: "var(--text-secondary)" }}>
                        {receiver.signals.map((s) => (
                          <li key={s.id}>
                            <span className="font-mono text-xs mr-2" style={{ color: "var(--risk-high)" }}>+{s.points}</span>
                            {s.label}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="sp-label mt-2" style={{ color: receiver.boost > 0 ? "var(--risk-high)" : undefined }}>
                      {receiver.boost > 0 ? "Added " + receiver.boost + " points to this transaction's score" : "Did not change this transaction's score"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
