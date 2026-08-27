import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AmbientBackground from "./AmbientBackground";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "var(--bg)" }}>
      <AmbientBackground />
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-full border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <Shield size={16} color="var(--accent)" />
          <span className="font-display font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            SentinelPay
          </span>
        </Link>
      </div>

      <div
        className="w-full max-w-md p-8 rounded-3xl border relative z-10"
        style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-soft)" }}
      >
        <h1 className="font-display font-semibold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          {subtitle}
        </p>
        {children}
      </div>
    </div>
  );
}