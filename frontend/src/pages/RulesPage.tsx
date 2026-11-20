import { useEffect, useState, FormEvent } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
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
  { value: "AMOUNT_THRESHOLD", label: "Amount threshold" },
  { value: "TIME_WINDOW", label: "Time window" },
  { value: "NEW_DEVICE", label: "New device" },
  { value: "VELOCITY_CHECK", label: "Velocity check" },
  { value: "MERCHANT_BLACKLIST", label: "Merchant blacklist" },
];

const typeLabel = (t: string) => RULE_TYPES.find((r) => r.value === t)?.label || t;

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative inline-flex items-center rounded-full flex-shrink-0"
      style={{
        width: 36,
        height: 20,
        background: checked ? "var(--accent)" : "var(--surface-raised)",
        border: "1px solid " + (checked ? "transparent" : "var(--border-strong)"),
        transition: "background-color 150ms var(--ease)",
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          width: 14,
          height: 14,
          background: checked ? "var(--accent-ink)" : "var(--text-muted)",
          transform: checked ? "translateX(18px)" : "translateX(2px)",
          transition: "transform 150ms var(--ease), background-color 150ms var(--ease)",
        }}
      />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm mb-2 block" style={{ color: "var(--text-secondary)" }}>{label}</span>
      {children}
    </label>
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
      .catch(() => setError("Could not load rules. Admin access required"))
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
      setError(err.response?.data?.error || "Could not create the rule");
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

  const enabled = rules.filter((r) => r.isEnabled).length;

  return (
    <DashboardShell active="Rules">
      <PageHeader
        title="Fraud rules"
        meta="Turn rules on or off without redeploying. They combine with the model's risk score"
        actions={
          <button onClick={() => setShowForm(!showForm)} className={"sp-btn " + (showForm ? "sp-btn-secondary" : "sp-btn-primary")}>
            {!showForm && <Plus size={16} strokeWidth={1.5} />}
            {showForm ? "Close" : "New rule"}
          </button>
        }
      />

      {error && (
        <p className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "var(--risk-high-soft)", color: "var(--risk-high)" }}>
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="sp-card p-5 mb-6 flex flex-col gap-4 max-w-3xl">
          <p className="text-sm font-medium">New rule</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="sp-input" placeholder="Very high value" />
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="sp-input">
                {RULE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sp-input" placeholder="What does this rule catch" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.type === "AMOUNT_THRESHOLD" && (
              <Field label="Max amount (₹)">
                <input type="number" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: Number(e.target.value) })} className="sp-input font-mono" />
              </Field>
            )}
            {form.type === "TIME_WINDOW" && (
              <>
                <Field label="Start hour (0–23)">
                  <input type="number" min="0" max="23" value={form.startHour} onChange={(e) => setForm({ ...form, startHour: Number(e.target.value) })} className="sp-input font-mono" />
                </Field>
                <Field label="End hour (0–23)">
                  <input type="number" min="0" max="23" value={form.endHour} onChange={(e) => setForm({ ...form, endHour: Number(e.target.value) })} className="sp-input font-mono" />
                </Field>
              </>
            )}
            {form.type === "VELOCITY_CHECK" && (
              <Field label="Max transactions per hour">
                <input type="number" value={form.maxTxnPerHour} onChange={(e) => setForm({ ...form, maxTxnPerHour: Number(e.target.value) })} className="sp-input font-mono" />
              </Field>
            )}
            <Field label="Weight">
              <input type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} className="sp-input font-mono" />
            </Field>
          </div>

          <div>
            <button type="submit" disabled={saving} className="sp-btn sp-btn-primary">
              {saving && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
              {saving ? "Creating" : "Create rule"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading</p>
      ) : (
        <div className="sp-card overflow-x-auto">
          <div className="flex items-center justify-between px-5 h-12">
            <p className="text-sm font-medium">Rules</p>
            <p className="sp-label font-mono">{enabled} of {rules.length} on</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="sp-label text-left border-t" style={{ borderColor: "var(--border)" }}>
                <th className="font-normal px-5 h-9">Rule</th>
                <th className="font-normal px-3 h-9 hidden md:table-cell">Type</th>
                <th className="font-normal px-3 h-9 text-right">Weight</th>
                <th className="font-normal px-3 h-9">On</th>
                <th className="h-9 w-12" />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="sp-row border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-3">
                    <p style={{ color: rule.isEnabled ? "var(--text-primary)" : "var(--text-muted)" }}>{rule.name}</p>
                    {rule.description && <p className="sp-label mt-1">{rule.description}</p>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>{typeLabel(rule.type)}</td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: "var(--text-secondary)" }}>{rule.weight.toFixed(1)}</td>
                  <td className="px-3 py-3">
                    <Toggle checked={rule.isEnabled} onChange={() => handleToggle(rule.id)} label={"Toggle " + rule.name} />
                  </td>
                  <td className="pr-3 py-3 text-right">
                    <button onClick={() => handleDelete(rule.id)} className="sp-btn sp-btn-ghost w-8 h-8 px-0" aria-label={"Delete " + rule.name}>
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
