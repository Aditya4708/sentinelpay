import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, CreditCard, Building2, Smartphone, Calendar, BadgeCheck, Pencil, Check, X, Loader2 } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import api, { updateProfile } from "../services/api";
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

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  outline: "none",
  fontFamily: "var(--font-mono)",
};

function EditableRow({
  icon: Icon, label, value, editable, editing, onChange, options,
}: {
  icon: any; label: string; value: string; editable: boolean; editing: boolean; onChange?: (v: string) => void; options?: string[];
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-soft)" }}>
        <Icon size={16} color="var(--accent)" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
        {editing && editable ? (
          options ? (
            <select value={value} onChange={(e) => onChange && onChange(e.target.value)} style={inputStyle}>
              <option value="">Select {label}</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input value={value} onChange={(e) => onChange && onChange(e.target.value)} style={inputStyle} />
          )
        ) : (
          <p className="font-mono text-sm break-all" style={{ color: "var(--text-primary)" }}>{value || "Not set"}</p>
        )}
      </div>
      {editing && !editable && (
        <span className="text-[10px] px-2 py-1 rounded-full flex-shrink-0" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
          locked
        </span>
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
    const token = localStorage.getItem("accessToken");
    api
      .get("/auth/me", { headers: { Authorization: "Bearer " + token } })
      .then((res) => {
        setUser(res.data.user);
        setForm({
          name: res.data.user.name,
          phone: res.data.user.phone,
          preferredBank: res.data.user.preferredBank || "",
          preferredApp: res.data.user.preferredApp || "",
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
      setError(err.response?.data?.error || "Failed to save changes.");
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-semibold text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
            Account Details
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            This is exactly what's stored in the database for your account
          </p>
        </div>
        {!editing && user && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
            <Pencil size={14} />
            Edit
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--risk-safe)" }}>
          Profile updated successfully.
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(244, 63, 94, 0.1)", color: "var(--risk-high)" }}>
          {error}
        </div>
      )}

      {!user ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : (
        <div className="max-w-2xl">
          <div className="rounded-2xl border p-4 sm:p-6" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
            <EditableRow icon={User} label="Full Name" value={form.name} editable editing={editing} onChange={(v) => setForm({ ...form, name: v })} />
            <EditableRow icon={Mail} label="Email" value={user.email} editable={false} editing={editing} />
            <EditableRow icon={Phone} label="Phone" value={form.phone} editable editing={editing} onChange={(v) => setForm({ ...form, phone: v })} />
            <EditableRow icon={CreditCard} label="UPI ID" value={user.upiId} editable={false} editing={editing} />
            <EditableRow icon={Building2} label="Preferred Bank" value={form.preferredBank} editable editing={editing} onChange={(v) => setForm({ ...form, preferredBank: v })} options={INDIAN_BANKS} />
            <EditableRow icon={Smartphone} label="Preferred UPI App" value={form.preferredApp} editable editing={editing} onChange={(v) => setForm({ ...form, preferredApp: v })} options={UPI_APPS} />
            <EditableRow icon={BadgeCheck} label="Account Role" value={user.role} editable={false} editing={editing} />
            <EditableRow icon={Calendar} label="Member Since" value={new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} editable={false} editing={editing} />
          </div>

          {editing && (
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={handleCancel} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
                <X size={14} />
                Cancel
              </button>
            </div>
          )}

          <p className="text-xs mt-4 text-center" style={{ color: "var(--text-secondary)" }}>
            User ID: {user?.id}
          </p>
        </div>
      )}
    </DashboardShell>
  );
}