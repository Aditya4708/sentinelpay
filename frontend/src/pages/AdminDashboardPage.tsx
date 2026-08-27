import { useEffect, useState } from "react";
import { Users, Receipt, ShieldAlert, TrendingUp } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

interface RecentTxn {
  id: string;
  txnRef: string;
  amount: number;
  bank: string;
  upiApp: string;
  timestamp: string;
  sender: { name: string; email: string };
  fraudFlag: { riskScore: number; isFraudPredicted: boolean } | null;
}

interface Overview {
  totalUsers: number;
  totalTransactions: number;
  flaggedCount: number;
  avgRiskScore: number;
  recentTransactions: RecentTxn[];
  bankBreakdown: { name: string; count: number }[];
  appBreakdown: { name: string; count: number }[];
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
        <Icon size={16} color={color} />
      </div>
      <p className="font-mono font-semibold text-2xl" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function BreakdownBar({ items, total }: { items: { name: string; count: number }[]; total: number }) {
  return (
    <div className="flex flex-col gap-3">
      {items.sort((a, b) => b.count - a.count).map((item) => (
        <div key={item.name}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.name}</span>
            <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{item.count}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
            <div className="h-full rounded-full" style={{ width: (total ? (item.count / total) * 100 : 0) + "%", background: "var(--accent)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    api
      .get("/admin/overview", { headers: { Authorization: "Bearer " + token } })
      .then((res) => setData(res.data))
      .catch(() => setError("Admin access required, or could not load overview."));
  }, []);

  const bankTotal = data?.bankBreakdown.reduce((s, b) => s + b.count, 0) || 0;
  const appTotal = data?.appBreakdown.reduce((s, a) => s + a.count, 0) || 0;

  return (
    <DashboardShell active="Dashboard">
      <h1 className="font-display font-semibold text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
        Admin Overview
      </h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-secondary)" }}>
        Fraud activity across every user on the platform
      </p>

      {error ? (
        <div className="p-8 rounded-2xl border text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p style={{ color: "var(--risk-high)" }}>{error}</p>
        </div>
      ) : !data ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Users} label="Total Users" value={String(data.totalUsers)} color="var(--accent)" />
            <StatCard icon={Receipt} label="Total Transactions" value={String(data.totalTransactions)} color="var(--accent)" />
            <StatCard icon={ShieldAlert} label="Flagged as Fraud" value={String(data.flaggedCount)} color="var(--risk-high)" />
            <StatCard icon={TrendingUp} label="Avg Risk Score" value={data.avgRiskScore.toFixed(1) + "%"} color="var(--risk-watch)" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>By Bank</p>
              <BreakdownBar items={data.bankBreakdown} total={bankTotal} />
            </div>
            <div className="p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>By UPI App</p>
              <BreakdownBar items={data.appBreakdown} total={appTotal} />
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-sm font-semibold px-5 pt-5 pb-3" style={{ color: "var(--text-primary)" }}>Recent Transactions (All Users)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: "var(--text-secondary)" }}>User</th>
                    <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: "var(--text-secondary)" }}>Amount</th>
                    <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: "var(--text-secondary)" }}>Bank / App</th>
                    <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: "var(--text-secondary)" }}>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((txn) => (
                    <tr key={txn.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--text-primary)" }}>{txn.sender?.name || "Unknown"}</td>
                      <td className="px-5 py-3 font-mono whitespace-nowrap" style={{ color: "var(--text-primary)" }}>{"\u20B9"}{txn.amount.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs" style={{ color: "var(--text-secondary)" }}>{txn.bank} / {txn.upiApp}</td>
                      <td className="px-5 py-3 whitespace-nowrap font-mono" style={{ color: txn.fraudFlag?.isFraudPredicted ? "var(--risk-high)" : "var(--risk-safe)" }}>
                        {txn.fraudFlag ? txn.fraudFlag.riskScore + "%" : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}