import { useEffect, useState, FormEvent } from "react";
import { Shield, Trash2, Plus, Loader2 } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

interface Rule {
  id: string;
  name: string;
  type: string;
  description: string | null;
  config: any;
  isEnabled: boolean;
  weight: number;
}

const RULE_TYPES = [
  { value: "AMOUNT_THRESHOLD", label: "Amount Threshold" },
  { value: "TIME_WINDOW", label: "Time Window" },
  { value: "NEW_DEVICE", label: "New Device" },
  { value: "VELOCITY_CHECK", label: "Velocity Check" },
  { value: "MERCHANT_BLACKLIST", label: "Merchant Blacklist" },
];

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

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative inline-flex items-center rounded-full transition-colors flex-shrink-0"
      style={{ width: "42px", height: "24px", background: checked ? "var(--accent)" : "var(--border)" }}
    >
      <span
        className="inline-block rounded-full bg-white transition-transform"
        style={{ width: "18px", height: "18px", transform: checked ? "translateX(21px)" : "translateX(3px)" }}
      />
    </button>
  );
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", type: "AMOUNT_THRESHOLD", description: "", weight: 1.0,
    maxAmount: 50000, startHour: 0, endHour: 5, maxTxnPerHour: 3,
  });

  function token() {
    return localStorage.getItem("accessToken") || "";
  }

  function loadRules() {
    setLoading(true);
    api
      .get("/rules", { headers: { Authorization: "Bearer " + token() } })
      .then((res) => setRules(res.data.rules))
      .catch(() => setError("Could not load rules. Admin access required."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRules();
  }, []);

  function buildConfig() {
    switch (form.type) {
      case "AMOUNT_THRESHOLD":
        return { maxAmount: Number(form.maxAmount) };
      case "TIME_WINDOW":
        return { startHour: Number(form.startHour), endHour: Number(form.endHour) };
      case "VELOCITY_CHECK":
        return { maxTxnPerHour: Number(form.maxTxnPerHour) };
      default:
        return {};
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(
        "/rules",
        { name: form.name, type: form.type, description: form.description, weight: Number(form.weight), config: buildConfig() },
        { headers: { Authorization: "Bearer " + token() } }
      );
      setForm({ ...form, name: "", description: "" });
      setShowForm(false);
      loadRules();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create rule.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    await api.patch("/rules/" + id + "/toggle", {}, { headers: { Authorization: "Bearer " + token() } });
    loadRules();
  }

  async function handleDelete(id: string) {
    await api.delete("/rules/" + id, { headers: { Authorization: "Bearer " + token() } });
    loadRules();
  }

  return (
    <DashboardShell active="Dashboard">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-semibold text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
            Fraud Rules
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Toggle rules on or off without redeploying - they combine with the ML risk score
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
          <Plus size={14} />
          New Rule
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(244, 63, 94, 0.1)", color: "var(--risk-high)" }}>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border p-5 mb-6 flex flex-col gap-4" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Rule Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} placeholder="e.g. Very High Value" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Rule Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                {RULE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inputStyle} placeholder="What does this rule catch?" />
          </div>

          {form.type === "AMOUNT_THRESHOLD" && (
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Max Amount (INR)</label>
              <input type="number" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: Number(e.target.value) })} style={inputStyle} />
            </div>
          )}

          {form.type === "TIME_WINDOW" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Start Hour (0-23)</label>
                <input type="number" min="0" max="23" value={form.startHour} onChange={(e) => setForm({ ...form, startHour: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>End Hour (0-23)</label>
                <input type="number" min="0" max="23" value={form.endHour} onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })} style={inputStyle} />
              </div>
            </div>
          )}

          {form.type === "VELOCITY_CHECK" && (
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Max Transactions Per Hour</label>
              <input type="number" value={form.maxTxnPerHour} onChange={(e) => setForm({ ...form, maxTxnPerHour: Number(e.target.value) })} style={inputStyle} />
            </div>
          )}

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Weight (contribution strength)</label>
            <input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} style={inputStyle} />
          </div>

          <button type="submit" disabled={saving} className="py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "var(--accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Creating..." : "Create Rule"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 sm:p-5 rounded-2xl border flex items-center gap-4" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)", opacity: rule.isEnabled ? 1 : 0.6 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-soft)" }}>
                <Shield size={18} color="var(--accent)" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{rule.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{rule.description || rule.type}</p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded-full flex-shrink-0" style={{ background: "var(--bg)", color: "var(--text-secondary)" }}>
                weight {rule.weight}
              </span>
              <Toggle checked={rule.isEnabled} onChange={() => handleToggle(rule.id)} />
              <button onClick={() => handleDelete(rule.id)} className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0" style={{ color: "var(--risk-high)" }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}