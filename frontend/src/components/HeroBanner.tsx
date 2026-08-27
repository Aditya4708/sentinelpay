import { useState } from "react";
import { Shield, Menu, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import AmbientBackground from "./AmbientBackground";

const NAV_LINKS = [
  { label: "Product", href: "#" },
  { label: "How it works", href: "#" },
  { label: "Docs", href: "#" },
];

const TRUSTED_WITH = ["SBI", "HDFC", "ICICI", "PhonePe", "GPay", "BHIM"];

export default function HeroBanner() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="w-full min-h-screen relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <AmbientBackground />

      <Navbar />
<div className="relative z-10 max-w-4xl mx-auto px-6 pt-32 md:pt-40 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-7 border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--accent)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--risk-safe)" }} />
          Continuous transaction monitoring
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-display font-bold leading-[1.05] text-5xl sm:text-6xl md:text-7xl mb-6" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Fraud detection<br />
          <span style={{
            background: "linear-gradient(90deg, var(--accent), var(--risk-safe))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            that explains itself
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-base md:text-lg max-w-xl mx-auto mb-10" style={{ color: "var(--text-secondary)" }}>
          RiskLens scores every UPI transaction in real time and tells you exactly why -
          no black box, just clear, explainable risk signals.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
          <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold" style={{ background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow-soft)" }}>
            Sign Up Free
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold border" style={{ color: "var(--text-primary)", borderColor: "var(--border)", background: "var(--surface)" }}>
            Log In
          </Link>
        </motion.div>

        <motion.a href="#how-it-works" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }} className="inline-block text-sm font-medium underline underline-offset-4" style={{ color: "var(--text-secondary)" }}>
          See how it works
        </motion.a>

        <div className="relative mt-20 mb-10 h-40 hidden md:block">
          <motion.div
            className="absolute left-0 top-0 flex items-center gap-3 px-4 py-3 rounded-2xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
              <ShieldCheck size={18} color="var(--risk-safe)" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Risk Score</p>
              <p className="font-mono font-semibold text-sm" style={{ color: "var(--risk-safe)" }}>4.2 - Safe</p>
            </div>
          </motion.div>

          <motion.div
            className="absolute right-0 top-8 flex items-center gap-3 px-4 py-3 rounded-2xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(244, 63, 94, 0.12)" }}>
              <Zap size={18} color="var(--risk-high)" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Top Factor</p>
              <p className="font-mono font-semibold text-sm" style={{ color: "var(--text-primary)" }}>New Device +0.11</p>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="pb-16">
          <p className="text-xs uppercase tracking-wide mb-5" style={{ color: "var(--text-secondary)" }}>
            Works with your bank and UPI app
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {TRUSTED_WITH.map((name) => (
              <span key={name} className="px-4 py-2 rounded-full text-sm font-medium border" style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}