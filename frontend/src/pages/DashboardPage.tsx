import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, ArrowUpRight, Zap, Receipt } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  upiId: string;
  currentRiskScore: number;
  role: string;
}

interface FraudFlag {
  riskScore: number;
  isFraudPredicted: boolean;
}

interface Transaction {
  id: string;
  txnRef: string;
  type: string;
  amount: number;
  upiApp: string;
  timestamp: string;
  fraudFlag: FraudFlag | null;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    api
      .get("/auth/me", { headers: { Authorization: "Bearer " + token } })
      .then((res) => setUser(res.data.user))
      .catch(() => navigate("/login"));

    api
      .get("/transactions/mine", { headers: { Authorization: "Bearer " + token } })
      .then((res) => setTransactions(res.data.transactions))
      .finally(() => setLoadingTxns(false));
  }, [navigate]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const recent = transactions.slice(0, 5);
  const flaggedCount = transactions.filter((t) => t.fraudFlag?.isFraudPredicted).length;

  const chartData = transactions
    .slice(0, 10)
    .reverse()
    .map((t, i) => ({
      name: "Txn " + (i + 1),
      risk: t.fraudFlag?.riskScore ?? 0,
    }));

  return (
    <DashboardShell active="Dashboard">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-semibold text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
            Welcome, {firstName}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Here's your transaction risk overview
          </p>
        </div>
        <Link to="/simulator" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
          <Zap size={14} />
          Simulate Transaction
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Current Risk Score</p>
          <p className="font-mono font-semibold text-2xl" style={{ color: "var(--risk-safe)" }}>
            {user ? user.currentRiskScore.toFixed(1) : "--"}
          </p>
        </div>
        <div className="p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Total Transactions</p>
          <p className="font-mono font-semibold text-2xl" style={{ color: "var(--text-primary)" }}>
            {transactions.length}
          </p>
        </div>
        <div className="p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Flagged</p>
          <p className="font-mono font-semibold text-2xl" style={{ color: flaggedCount > 0 ? "var(--risk-high)" : "var(--risk-safe)" }}>
            {flaggedCount}
          </p>
        </div>
        <div className="p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>UPI ID</p>
          <p className="font-mono font-semibold text-sm break-all" style={{ color: "var(--text-primary)" }}>
            {user ? user.upiId : "--"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Risk Score Trend</p>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No data yet. <Link to="/simulator" style={{ color: "var(--accent)", fontWeight: 600 }}>Run a simulation</Link> to see your trend.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="risk" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="p-5 rounded-2xl border flex flex-col gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Quick Actions</p>
          <Link to="/simulator" className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
            Run a simulation
            <ArrowUpRight size={14} />
          </Link>
          <Link to="/transactions" className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
            View all transactions
            <ArrowUpRight size={14} />
          </Link>
          <Link to="/alerts" className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
            Check risk alerts
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Activity</p>
          <Link to="/transactions" className="text-xs font-medium" style={{ color: "var(--accent)" }}>View all</Link>
        </div>

        {loadingTxns ? (
          <p className="px-5 pb-5 text-sm" style={{ color: "var(--text-secondary)" }}>Loading...</p>
        ) : recent.length === 0 ? (
          <div className="px-5 pb-6">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No transactions yet. <Link to="/simulator" style={{ color: "var(--accent)", fontWeight: 600 }}>Run your first simulation</Link>.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {recent.map((txn) => (
              <div key={txn.id} className="flex items-center gap-3 px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: txn.fraudFlag?.isFraudPredicted ? "rgba(244, 63, 94, 0.12)" : "var(--accent-soft)" }}>
                  {txn.fraudFlag?.isFraudPredicted ? <ShieldAlert size={14} color="var(--risk-high)" /> : <ShieldCheck size={14} color="var(--risk-safe)" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate" style={{ color: "var(--text-primary)" }}>{txn.txnRef}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{txn.upiApp} - {new Date(txn.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
                <p className="font-mono text-sm flex-shrink-0" style={{ color: "var(--text-primary)" }}>{"\u20B9"}{txn.amount.toLocaleString("en-IN")}</p>
                {txn.fraudFlag && (
                  <p className="font-mono text-xs flex-shrink-0 w-14 text-right" style={{ color: txn.fraudFlag.isFraudPredicted ? "var(--risk-high)" : "var(--risk-safe)" }}>
                    {txn.fraudFlag.riskScore}%
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}