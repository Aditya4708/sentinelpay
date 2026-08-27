import { useState, FormEvent } from "react";
import { Loader2, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { INDIAN_BANKS, UPI_APPS } from "../constants/indiaFinance";
import api from "../services/api";

interface PredictionResult {
  risk_score: number;
  is_fraud_predicted: boolean;
  model_confidence: number;
  top_factors: { factor: string; impact: number }[];
  human_readable_summary: string;
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
};

export default function SimulatorPage() {
  const [form, setForm] = useState({
    amount: 500,
    type: "P2P",
    upiApp: "PhonePe",
    bank: "HDFC Bank",
    hourOfDay: 14,
    deviceId: "dev-original123",
    homeDeviceId: "dev-original123",
    latitude: 19.0760,
    longitude: 72.8777,
    homeLat: 19.0760,
    homeLon: 72.8777,
    avgAmount: 800,
    velocity: 0,
  });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await api.post(
        "/transactions/simulate",
        {
          amount: form.amount,
          type: form.type,
          merchantCategory: "P2P",
          upiApp: form.upiApp,
          bank: form.bank,
          hourOfDay: form.hourOfDay,
          dayOfWeek: new Date().getDay(),
          latitude: form.latitude,
          longitude: form.longitude,
          deviceId: form.deviceId,
          txnVelocity1h: form.velocity,
          avgAmount: form.avgAmount,
          homeDeviceId: form.homeDeviceId,
          homeLat: form.homeLat,
          homeLon: form.homeLon,
          activeHourStart: 7,
          activeHourEnd: 23,
        },
        { headers: { Authorization: "Bearer " + token } }
      );
      setResult(res.data.prediction);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not process the transaction.");
    } finally {
      setLoading(false);
    }
  }

  function toggleDevice() {
    if (form.deviceId === form.homeDeviceId) {
      update("deviceId", "dev-" + Math.random().toString(36).slice(2, 14));
    } else {
      update("deviceId", form.homeDeviceId);
    }
  }

  return (
    <DashboardShell active="Risk Alerts">
      <h1 className="font-display font-semibold text-xl sm:text-2xl mb-2" style={{ color: "var(--text-primary)" }}>
        Transaction Simulator
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Test the fraud detection engine with a live transaction - see the risk score and explanation in real time.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="rounded-2xl border p-5 sm:p-6 flex flex-col gap-4" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Amount (INR)</label>
            <input type="number" value={form.amount} onChange={(e) => update("amount", Number(e.target.value))} style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>UPI App</label>
              <select value={form.upiApp} onChange={(e) => update("upiApp", e.target.value)} style={inputStyle}>
                {UPI_APPS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Bank</label>
              <select value={form.bank} onChange={(e) => update("bank", e.target.value)} style={inputStyle}>
                {INDIAN_BANKS.slice(0, 10).map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Hour of Day: {form.hourOfDay}:00
            </label>
            <input type="range" min="0" max="23" value={form.hourOfDay} onChange={(e) => update("hourOfDay", Number(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
              Transaction Velocity (last hour): {form.velocity}
            </label>
            <input type="range" min="0" max="10" value={form.velocity} onChange={(e) => update("velocity", Number(e.target.value))} className="w-full" />
          </div>

          <button type="button" onClick={toggleDevice} className="text-xs font-medium text-left underline underline-offset-2" style={{ color: "var(--accent)" }}>
            {form.deviceId === form.homeDeviceId ? "Simulate a new/unknown device" : "Using new device - click to reset to known device"}
          </button>

          <button type="submit" disabled={loading} className="mt-2 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.7 : 1 }}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Scoring..." : "Score This Transaction"}
          </button>

          {error && <p className="text-sm" style={{ color: "var(--risk-high)" }}>{error}</p>}
        </form>

        <div className="rounded-2xl border p-5 sm:p-6" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          {!result ? (
            <div className="h-full flex items-center justify-center text-center py-16">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Submit a transaction to see the risk score and explanation here.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-6">
                {result.is_fraud_predicted ? <ShieldAlert size={28} color="var(--risk-high)" /> : <ShieldCheck size={28} color="var(--risk-safe)" />}
                <div>
                  <p className="font-mono font-semibold text-2xl" style={{ color: result.is_fraud_predicted ? "var(--risk-high)" : "var(--risk-safe)" }}>
                    {result.risk_score}%
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {result.is_fraud_predicted ? "Flagged as suspicious" : "Looks safe"}
                  </p>
                </div>
              </div>

              <p className="text-sm mb-6 px-4 py-3 rounded-xl" style={{ background: "var(--accent-soft)", color: "var(--text-primary)" }}>
                {result.human_readable_summary}
              </p>

              <p className="text-xs font-medium mb-3" style={{ color: "var(--text-secondary)" }}>Top Contributing Factors</p>
              <div className="flex flex-col gap-2">
                {result.top_factors.map((f) => (
                  <div key={f.factor} className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: "var(--bg)" }}>
                    <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                      <Zap size={14} color="var(--accent)" />
                      {f.factor}
                    </span>
                    <span className="font-mono text-xs" style={{ color: f.impact > 0 ? "var(--risk-high)" : "var(--risk-safe)" }}>
                      {f.impact > 0 ? "+" : ""}{f.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}