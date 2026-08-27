import { useState } from "react";
import { Shield, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { label: "Product", href: "#" },
  { label: "How it works", href: "#" },
  { label: "Docs", href: "#" },
  { label: "Pricing", href: "#" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 px-4">
      <nav
        className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3 rounded-full border"
        style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 pl-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
            <Shield size={16} color="var(--accent)" />
          </div>
          <span className="font-display font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            SentinelPay
          </span>
        </div>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium transition-colors" style={{ color: "var(--text-secondary)" }}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="px-4 py-2 rounded-full text-sm font-medium border" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
            Log In
          </Link>
          <Link to="/signup" className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--text-primary)", color: "var(--bg)" }}>
            Sign Up
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-9 h-9 flex items-center justify-center rounded-full" aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={18} color="var(--text-primary)" /> : <Menu size={18} color="var(--text-primary)" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="max-w-4xl mx-auto mt-2 rounded-3xl border p-4 flex flex-col gap-2" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="py-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {link.label}
            </a>
          ))}
          <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <Link to="/login" className="flex-1 text-center py-2.5 rounded-full text-sm font-semibold border" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
              Log In
            </Link>
            <Link to="/signup" className="flex-1 text-center py-2.5 rounded-full text-sm font-semibold" style={{ background: "var(--text-primary)", color: "var(--bg)" }}>
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}