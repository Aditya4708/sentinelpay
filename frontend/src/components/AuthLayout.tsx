import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { Logo } from "./DashboardShell";
import { BandMarker, riskTone } from "./RiskScore";
import PaymentFlowBackground from "./PaymentFlowBackground";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const POINTS = [
  "Learns each user's normal behaviour",
  "Explains every score in plain words",
  "Sends risky payments to human review",
];

const SAMPLES = [
  { amount: "₹450", detail: "Usual device · 14:10", score: 10 },
  { amount: "₹45,000", detail: "New device · 03:00", score: 100 },
  { amount: "₹899", detail: "Known payee · 19:42", score: 12 },
];

function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 border-r relative overflow-hidden" style={{ background: "var(--bg-deep)", borderColor: "var(--border)" }}>
      <div className="absolute inset-0" style={{ maskImage: "linear-gradient(to bottom, transparent, #000 18%, #000 72%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 18%, #000 72%, transparent)" }}>
        <PaymentFlowBackground intensity="full" />
      </div>
      <Link to="/" aria-label="SentinelPay home" className="relative">
        <Logo />
      </Link>

      <div className="max-w-md relative">
        <h2 className="font-medium mb-4" style={{ fontSize: 40, lineHeight: 1.08, letterSpacing: "-0.02em" }}>
          Fraud detection that shows its reasoning
        </h2>
        <p className="text-base mb-10" style={{ color: "var(--text-secondary)", lineHeight: "24px" }}>
          UPI fraud scoring built on each account's own behaviour, with every score explained
        </p>

        <div className="sp-card overflow-hidden mb-8">
          <div className="flex items-center justify-between px-4 h-10 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="sp-label">Scored just now</span>
            <span className="sp-label font-mono">Risk</span>
          </div>
          {SAMPLES.map((s, i) => {
            const t = riskTone(s.score);
            return (
              <div key={s.amount} className="flex items-center gap-4 px-4 h-12" style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                <span className="font-mono text-sm w-20">{s.amount}</span>
                <span className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{s.detail}</span>
                <span className="font-mono text-sm w-8 text-right">{s.score}</span>
                <BandMarker band={t.band} />
              </div>
            );
          })}
        </div>

        <ul className="flex flex-col gap-2">
          {POINTS.map((p) => (
            <li key={p} className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--text-muted)" }} />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <p className="sp-label relative">Major project, Fr. Conceicao Rodrigues College of Engineering</p>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: "var(--bg)" }}>
      <BrandPanel />

      <div className="relative flex items-center justify-center px-4 py-24">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="absolute top-6 left-6 lg:hidden">
          <Link to="/">
            <Logo size={15} />
          </Link>
        </div>
        <div className="absolute top-6 left-6 hidden lg:block">
          <Link to="/" className="sp-btn sp-btn-ghost h-8 px-2">
            <ArrowLeft size={16} strokeWidth={1.5} />
            Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <h1 className="sp-title mb-2">{title}</h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm mb-2 block" style={{ color: "var(--text-secondary)" }}>{label}</span>
      {children}
    </label>
  );
}
