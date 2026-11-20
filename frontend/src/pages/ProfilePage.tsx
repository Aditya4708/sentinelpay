import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Check, Loader2, Lock } from "lucide-react";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
import { fetchMe, updateProfile } from "../services/api";
import { INDIAN_BANKS, UPI_APPS } from "../constants/indiaFinance";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  upiId: string;
  preferredBank: string | null;
  preferredApp: string | null;
  currentRiskScore: number;
  createdAt: string;
}

function EditableRow({
  label,
  value,
  editable,
  editing,
  onChange,
  options,
  mono = false,
}: {
  label: string;
  value: string;
  editable: boolean;
  editing: boolean;
  onChange?: (v: string) => void;
  options?: string[];
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2 sm:gap-6 px-5 py-3 min-h-[56px] border-t first:border-t-0" style={{ borderColor: "var(--border)" }}>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</p>
      {editing && editable ? (
        options ? (
          <select value={value} onChange={(e) => onChange && onChange(e.target.value)} className="sp-input">
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input value={value} onChange={(e) => onChange && onChange(e.target.value)} className="sp-input" />
        )
      ) : (
        <p className={"text-sm break-all flex items-center gap-2 " + (mono ? "font-mono" : "")} style={{ color: value ? "var(--text-primary)" : "var(--text-muted)" }}>
          {value || "Not set"}
          {editing && !editable && <Lock size={14} strokeWidth={1.5} color="var(--text-muted)" aria-label="Locked" />}
        </p>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", preferredBank: "", preferredApp: "" });

  function loadUser() {
    fetchMe()
      .then((data) => {
        setUser(data.user);
        setForm({
          name: data.user.name,
          phone: data.user.phone,
          preferredBank: data.user.preferredBank || "",
          preferredApp: data.user.preferredApp || "",
        });
      })
      .catch(() => navigate("/login"));
  }

  useEffect(() => {
    loadUser();
  }, [navigate]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("accessToken") || "";
      const data = await updateProfile(form, token);
      setUser(data.user);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (user) {
      setForm({
        name: user.name,
        phone: user.phone,
        preferredBank: user.preferredBank || "",
        preferredApp: user.preferredApp || "",
      });
    }
    setEditing(false);
    setError("");
  }

  return (
    <DashboardShell active="Settings">
      <PageHeader
        title="Account"
        meta="Exactly what's stored for your account"
        actions={
          !user ? null : editing ? (
            <>
              <button onClick={handleCancel} disabled={saving} className="sp-btn sp-btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="sp-btn sp-btn-primary">
                {saving ? <Loader2 size={16} strokeWidth={1.5} className="animate-spin" /> : <Check size={16} strokeWidth={1.5} />}
                {saving ? "Saving" : "Save changes"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="sp-btn sp-btn-secondary">
              <Pencil size={16} strokeWidth={1.5} />
              Edit
            </button>
          )
        }
      />

      {success && (
        <p className="mb-4 px-4 py-3 rounded-lg text-sm max-w-3xl" style={{ background: "var(--risk-safe-soft)", color: "var(--risk-safe)" }}>
          Profile updated
        </p>
      )}
      {error && (
        <p className="mb-4 px-4 py-3 rounded-lg text-sm max-w-3xl" style={{ background: "var(--risk-high-soft)", color: "var(--risk-high)" }}>
          {error}
        </p>
      )}

      {!user ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading</p>
      ) : (
        <div className="max-w-3xl">
          <div className="sp-card">
            <EditableRow label="Full name" value={form.name} editable editing={editing} onChange={(v) => setForm({ ...form, name: v })} />
            <EditableRow label="Email" value={user.email} editable={false} editing={editing} />
            <EditableRow label="Phone" value={form.phone} editable editing={editing} onChange={(v) => setForm({ ...form, phone: v })} mono />
            <EditableRow label="UPI ID" value={user.upiId} editable={false} editing={editing} mono />
            <EditableRow label="Preferred bank" value={form.preferredBank} editable editing={editing} onChange={(v) => setForm({ ...form, preferredBank: v })} options={INDIAN_BANKS} />
            <EditableRow label="Preferred UPI app" value={form.preferredApp} editable editing={editing} onChange={(v) => setForm({ ...form, preferredApp: v })} options={UPI_APPS} />
            <EditableRow label="Account role" value={user.role} editable={false} editing={editing} />
            <EditableRow label="Member since" value={new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} editable={false} editing={editing} />
          </div>

          <p className="sp-label font-mono mt-4">User ID {user.id}</p>
        </div>
      )}
    </DashboardShell>
  );
}
