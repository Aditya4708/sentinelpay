import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { registerUser } from "../services/api";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", upiId: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await registerUser(form);
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      navigate("/dashboard");
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      setError(typeof apiError === "string" ? apiError : "Signup failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle = { color: "var(--text-secondary)" };

  return (
    <AuthLayout title="Create your account" subtitle="Start monitoring your UPI transactions in minutes">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={labelStyle}>Full Name</label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required style={inputStyle} placeholder="Aditya Nambiar" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required style={inputStyle} placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={labelStyle}>Phone</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} required style={inputStyle} placeholder="9800000000" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={labelStyle}>UPI ID</label>
          <input value={form.upiId} onChange={(e) => update("upiId", e.target.value)} required style={inputStyle} placeholder="yourname@okhdfcbank" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={labelStyle}>Password</label>
          <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required style={inputStyle} placeholder="At least 8 characters" />
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ color: "var(--risk-high)", background: "rgba(244, 63, 94, 0.1)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.7 : 1 }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="text-sm text-center mt-6" style={{ color: "var(--text-secondary)" }}>
        Already have an account? <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Log in</Link>
      </p>
    </AuthLayout>
  );
}