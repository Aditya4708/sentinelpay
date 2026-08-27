import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, LayoutDashboard, Receipt, ShieldAlert, Settings, LogOut, Menu, X, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import AmbientBackground from "./AmbientBackground";
import api from "../services/api";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Transactions", icon: Receipt, path: "/transactions" },
  { label: "Risk Alerts", icon: ShieldAlert, path: "/alerts" },
  { label: "Settings", icon: Settings, path: "/profile" },
];

const ADMIN_NAV_ITEMS = [
  { label: "Admin", icon: LayoutGrid, path: "/admin" },
  { label: "Rules", icon: Shield, path: "/admin/rules" },
];

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

  const navItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          onClick={onClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: item.label === active ? "var(--accent-soft)" : "transparent",
            color: item.label === active ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <item.icon size={18} />
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg)" }}>
      <AmbientBackground />

      <div className="relative z-10 flex">
        <aside className="hidden md:flex flex-col w-64 min-h-screen p-5 border-r flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 px-2 mb-8">
            <Shield size={20} color="var(--accent)" />
            <span className="font-display font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              SentinelPay
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            <NavLinks />
          </nav>
          <div className="mt-auto">
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full" style={{ color: "var(--text-secondary)" }}>
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </aside>

        <div className="flex md:hidden fixed top-4 left-4 right-4 z-30 items-center justify-between px-4 py-3 rounded-full border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2">
            <Shield size={18} color="var(--accent)" />
            <span className="font-display font-semibold text-sm" style={{ color: "var(--text-primary)" }}>SentinelPay</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setMobileNavOpen(!mobileNavOpen)} className="w-9 h-9 flex items-center justify-center rounded-full" aria-label="Toggle menu">
              {mobileNavOpen ? <X size={18} color="var(--text-primary)" /> : <Menu size={18} color="var(--text-primary)" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden fixed top-20 left-4 right-4 z-30 rounded-2xl border p-4 flex flex-col gap-1" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
            <NavLinks onClick={() => setMobileNavOpen(false)} />
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full mt-1 border-t pt-3" style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-8 pt-24 md:pt-8 min-w-0">
          <div className="hidden md:flex justify-end mb-4">
            <ThemeToggle />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}