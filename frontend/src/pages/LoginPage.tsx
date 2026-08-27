import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
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
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
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

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your RiskLens dashboard">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} placeholder="********" />
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
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <p className="text-sm text-center mt-6" style={{ color: "var(--text-secondary)" }}>
        Don't have an account? <Link to="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign up</Link>
      </p>
    </AuthLayout>
  );
}