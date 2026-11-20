import { useEffect, useState } from "react";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
import RiskScore from "../components/RiskScore";
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

function StatCard({ label, value, color = "var(--text-primary)" }: { label: string; value: string; color?: string }) {
  return (
    <div className="sp-card p-5">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</p>
      <p className="font-mono font-medium mt-3" style={{ fontSize: 28, lineHeight: 1, color }}>{value}</p>
    </div>
  );
}

function BreakdownList({ items, total }: { items: { name: string; count: number }[]; total: number }) {
  const sorted = [...items].sort((a, b) => b.count - a.count);
  return (
    <div className="flex flex-col gap-3">
      {sorted.map((item, i) => (
        <div key={item.name}>
          <div className="flex items-center justify-between mb-1.5 text-sm">
            <span>{item.name}</span>
            <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
              {item.count.toLocaleString("en-IN")}
              <span className="ml-2" style={{ color: "var(--text-muted)" }}>{total ? Math.round((item.count / total) * 100) : 0}%</span>
            </span>
          </div>
          <div className="h-1 rounded-sm overflow-hidden" style={{ background: "var(--surface-raised)" }}>
            <div className="h-full" style={{ width: (total ? (item.count / total) * 100 : 0) + "%", background: i === 0 ? "var(--accent)" : "var(--text-muted)" }} />
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
      .catch(() => setError("Admin access required, or the overview could not load"));
  }, []);

  const bankTotal = data?.bankBreakdown.reduce((s, b) => s + b.count, 0) || 0;
  const appTotal = data?.appBreakdown.reduce((s, a) => s + a.count, 0) || 0;

  return (
    <DashboardShell active="Admin">
      <PageHeader title="Platform overview" meta="Fraud activity across every user on the platform" />

      {error ? (
        <div className="sp-card p-8 text-center">
          <p style={{ color: "var(--risk-high)" }}>{error}</p>
        </div>
      ) : !data ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard label="Users" value={data.totalUsers.toLocaleString("en-IN")} />
            <StatCard label="Transactions" value={data.totalTransactions.toLocaleString("en-IN")} />
            <StatCard label="Flagged as fraud" value={data.flaggedCount.toLocaleString("en-IN")} color={data.flaggedCount > 0 ? "var(--risk-high)" : undefined} />
            <StatCard label="Average risk score" value={data.avgRiskScore.toFixed(1)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 sp-card overflow-hidden self-start">
              <p className="text-sm font-medium px-5 h-14 flex items-center">Recent transactions, all users</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="sp-label text-left border-t" style={{ borderColor: "var(--border)" }}>
                      <th className="font-normal px-5 h-9">User</th>
                      <th className="font-normal px-3 h-9 hidden xl:table-cell">Bank / app</th>
                      <th className="font-normal px-3 h-9 text-right">Amount</th>
                      <th className="font-normal px-5 h-9 text-right">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((txn) => (
                      <tr key={txn.id} className="sp-row border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="px-5 h-11 whitespace-nowrap">{txn.sender?.name || "Unknown"}</td>
                        <td className="px-3 h-11 whitespace-nowrap hidden xl:table-cell" style={{ color: "var(--text-secondary)" }}>{txn.bank} / {txn.upiApp}</td>
                        <td className="px-3 h-11 whitespace-nowrap text-right font-mono">{"₹"}{txn.amount.toLocaleString("en-IN")}</td>
                        <td className="px-5 h-11 whitespace-nowrap text-right">
                          {txn.fraudFlag ? <RiskScore score={txn.fraudFlag.riskScore} /> : <span style={{ color: "var(--text-muted)" }}>--</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="sp-card p-5">
                <p className="text-sm font-medium mb-4">By bank</p>
                <BreakdownList items={data.bankBreakdown} total={bankTotal} />
              </div>
              <div className="sp-card p-5">
                <p className="text-sm font-medium mb-4">By UPI app</p>
                <BreakdownList items={data.appBreakdown} total={appTotal} />
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
