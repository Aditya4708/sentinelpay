import { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  Receipt,
  ShieldAlert,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutGrid,
  ShieldQuestion,
  ClipboardCheck,
  ScanLine,
} from "lucide-react";
import ThemeToggle, { ModeToggle, PalettePicker } from "./ThemeToggle";
import PaymentFlowBackground from "./PaymentFlowBackground";
import api from "../services/api";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Transactions", icon: Receipt, path: "/transactions" },
  { label: "Risk Alerts", icon: ShieldAlert, path: "/alerts", text: "Risk alerts" },
  { label: "Scanner", icon: ScanLine, path: "/scanner" },
  { label: "Scam Shield", icon: ShieldQuestion, path: "/scam-shield", text: "Scam shield" },
  { label: "Settings", icon: Settings, path: "/profile" },
];

const ADMIN_NAV_ITEMS = [
  { label: "Admin", icon: LayoutGrid, path: "/admin", text: "Overview" },
  { label: "Rules", icon: Shield, path: "/admin/rules" },
  { label: "Cases", icon: ClipboardCheck, path: "/admin/cases" },
];

type NavItem = (typeof NAV_ITEMS)[number] | (typeof ADMIN_NAV_ITEMS)[number];

export function Logo({ size = 16 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <Shield size={size + 2} strokeWidth={1.75} color="var(--accent)" />
      <span className="font-medium" style={{ fontSize: size, color: "var(--text-primary)" }}>
        SentinelPay
      </span>
    </span>
  );
}

export default function DashboardShell({ active, children }: { active: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    api
      .get("/auth/me", { headers: { Authorization: "Bearer " + token } })
      .then((res) => setIsAdmin(res.data.user.role === "ADMIN"))
      .catch(() => {});
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/");
  }

  const NavRow = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const on = item.label === active;
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={onClick}
        aria-current={on ? "page" : undefined}
        className="sp-row flex items-center gap-3 px-3 h-9 rounded-lg text-sm"
        style={{
          background: on ? "var(--surface-raised)" : undefined,
          boxShadow: on ? "var(--highlight)" : undefined,
          color: on ? "var(--text-primary)" : "var(--text-secondary)",
          fontWeight: on ? 500 : 400,
        }}
      >
        <Icon size={16} strokeWidth={1.5} color={on ? "var(--accent)" : "var(--text-muted)"} />
        {"text" in item && item.text ? item.text : item.label}
      </Link>
    );
  };

  const Nav = ({ onClick }: { onClick?: () => void }) => (
    <>
      <div className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.label} item={item} onClick={onClick} />
        ))}
      </div>
      {isAdmin && (
        <>
          <p className="sp-label px-3 mt-6 mb-2">Admin</p>
          <div className="flex flex-col gap-0.5">
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavRow key={item.label} item={item} onClick={onClick} />
            ))}
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex">
        <aside
          className="hidden md:flex flex-col w-60 h-screen sticky top-0 px-3 py-4 border-r flex-shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--bg-deep)" }}
        >
          <div className="px-3 h-9 flex items-center mb-6">
            <Logo />
          </div>
          <nav className="flex flex-col">
            <Nav />
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <div className="px-3">
              <ThemeToggle />
            </div>
            <button onClick={handleLogout} className="sp-row flex items-center gap-3 px-3 h-9 rounded-lg text-sm w-full" style={{ color: "var(--text-secondary)" }}>
              <LogOut size={16} strokeWidth={1.5} color="var(--text-muted)" />
              Log out
            </button>
          </div>
        </aside>

        <header
          className="flex md:hidden fixed top-0 left-0 right-0 z-30 items-center justify-between px-4 h-14 border-b"
          style={{ background: "var(--bg-deep)", borderColor: "var(--border)" }}
        >
          <Logo size={15} />
          <div className="flex items-center gap-2">
            <ModeToggle />
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="sp-btn sp-btn-ghost w-9 px-0"
              aria-label="Toggle menu"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </header>

        {mobileNavOpen && (
          <div
            className="md:hidden fixed top-14 left-0 right-0 z-30 border-b p-3 flex flex-col"
            style={{ background: "var(--bg-deep)", borderColor: "var(--border)", boxShadow: "var(--shadow-soft)" }}
          >
            <Nav onClick={() => setMobileNavOpen(false)} />
            <div className="flex items-center justify-between px-3 mt-4">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Colourway</span>
              <PalettePicker />
            </div>
            <div className="border-t mt-3 pt-3" style={{ borderColor: "var(--border)" }}>
              <button onClick={handleLogout} className="sp-row flex items-center gap-3 px-3 h-9 rounded-lg text-sm w-full" style={{ color: "var(--text-secondary)" }}>
                <LogOut size={16} strokeWidth={1.5} color="var(--text-muted)" />
                Log out
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 pt-20 md:pt-8 pb-12 relative">
          <div
            className="absolute top-0 left-0 right-0 h-[360px]"
            style={{ maskImage: "linear-gradient(to bottom, #000 30%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, #000 30%, transparent)" }}
          >
            <PaymentFlowBackground intensity="subtle" />
          </div>
          <div className="max-w-[1440px] mx-auto relative">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, meta, actions }: { title: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
      <div className="min-w-0">
        <h1 className="sp-title">{title}</h1>
        {meta && (
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            {meta}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
