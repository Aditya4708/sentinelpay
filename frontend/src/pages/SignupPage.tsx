import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthLayout, { AuthField } from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
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
      setError(typeof apiError === "string" ? apiError : "Signup failed. Check your details");
    } finally {
      setLoading(false);
    }
  }


  return (
    <AuthLayout title="Create an account" subtitle="Start scoring your UPI transactions">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField label="Full name">
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required className="sp-input" placeholder="Aditya Nambiar" />
        </AuthField>
        <AuthField label="Email">
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required className="sp-input" placeholder="you@example.com" />
        </AuthField>
        <AuthField label="Phone">
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} required className="sp-input" placeholder="9800000000" />
        </AuthField>
        <AuthField label="UPI ID">
          <input value={form.upiId} onChange={(e) => update("upiId", e.target.value)} required className="sp-input font-mono" placeholder="yourname@okhdfcbank" />
        </AuthField>
        <AuthField label="Password">
          <PasswordInput value={form.password} onChange={(v) => update("password", v)} required placeholder="At least 8 characters" />
        </AuthField>

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ color: "var(--risk-high)", background: "var(--risk-high-soft)" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="sp-btn sp-btn-primary sp-btn-lg w-full mt-2">
          {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
          {loading ? "Creating account" : "Sign up"}
        </button>
      </form>

      <p className="text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
        Already have an account? <Link to="/login" style={{ color: "var(--accent)" }}>Log in</Link>
      </p>
    </AuthLayout>
  );
}