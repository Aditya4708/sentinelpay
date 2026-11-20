import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle, { ModeToggle, PalettePicker } from "./ThemeToggle";
import { Logo } from "./DashboardShell";

interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

// "#id" links scroll to a section on the landing page; external links open in a new tab.
const NAV_LINKS: NavLink[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Live map", href: "#live-map" },
  { label: "API docs", href: "http://localhost:4000/api/docs", external: true },
  { label: "GitHub", href: "https://github.com/Aditya4708/sentinelpay", external: true },
];

function goTo(e: React.MouseEvent, link: NavLink, close: () => void) {
  close();
  if (link.external) return;
  e.preventDefault();
  const el = document.querySelector(link.href);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Logo />
        </a>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => goTo(e, link, () => {})}
              {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="text-sm nav-link"
              style={{ color: "var(--text-secondary)" }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login" className="text-sm nav-link" style={{ color: "var(--text-secondary)" }}>
            Log in
          </Link>
          <Link to="/signup" className="sp-btn sp-btn-primary">
            Sign up
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ModeToggle />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sp-btn sp-btn-ghost w-9 px-0" aria-label="Toggle menu" aria-expanded={mobileMenuOpen}>
            {mobileMenuOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t px-4 py-3 flex flex-col" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => goTo(e, link, () => setMobileMenuOpen(false))}
              {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="h-10 flex items-center text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center justify-between h-10">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Colourway</span>
            <PalettePicker />
          </div>
          <div className="flex gap-2 pt-3 mt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <Link to="/login" className="sp-btn sp-btn-secondary flex-1">
              Log in
            </Link>
            <Link to="/signup" className="sp-btn sp-btn-primary flex-1">
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
