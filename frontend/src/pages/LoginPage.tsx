import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthLayout, { AuthField } from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { loginUser } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Check your email and password");
    } finally {
      setLoading(false);
    }
  }


  return (
    <AuthLayout title="Log in" subtitle="Your payments, scored and explained">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="sp-input" placeholder="you@example.com" />
        </AuthField>
        <AuthField label="Password">
          <PasswordInput value={password} onChange={setPassword} required  />
        </AuthField>

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ color: "var(--risk-high)", background: "var(--risk-high-soft)" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="sp-btn sp-btn-primary sp-btn-lg w-full mt-2">
          {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
          {loading ? "Logging in" : "Log in"}
        </button>
      </form>

      <p className="text-sm mt-6" style={{ color: "var(--text-secondary)" }}>
        Don't have an account? <Link to="/signup" style={{ color: "var(--accent)" }}>Sign up</Link>
      </p>
    </AuthLayout>
  );
}