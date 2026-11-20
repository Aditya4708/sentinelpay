import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
import RiskScore, { BandMarker, riskTone, BAND_COLOR, isOpenFlag } from "../components/RiskScore";
import RiskGauge, { CountUp, EASE } from "../components/RiskGauge";
import api, { fetchMe } from "../services/api";

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
  reviewStatus?: string;
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

const rise = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: Math.min(i, 5) * 0.05, ease: EASE },
});

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/* ---------- Page ---------- */

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    fetchMe()
      .then((data) => setUser(data.user))
      .catch(() => navigate("/login"));

    api
      .get("/transactions/mine", { headers: { Authorization: "Bearer " + token } })
      .then((res) => setTransactions(res.data.transactions))
      .finally(() => setLoadingTxns(false));
  }, [navigate]);

  const recent = transactions.slice(0, 5);
  const flaggedCount = transactions.filter((t) => isOpenFlag(t.fraudFlag)).length;
  const flagRate = transactions.length ? (flaggedCount / transactions.length) * 100 : 0;

  const chartData = transactions
    .slice(0, 10)
    .reverse()
    .map((t) => ({
      date: shortDate(t.timestamp),
      ref: t.txnRef,
      amount: t.amount,
      risk: t.fraudFlag?.riskScore ?? 0,
    }));

  const score = user ? user.currentRiskScore : 0;
  const tone = riskTone(score);

  const stats = [
    { label: "Transactions", value: <CountUp value={transactions.length} />, note: "All time", color: "var(--text-primary)" },
    {
      label: "Flagged as fraud",
      value: <CountUp value={flaggedCount} />,
      note: flaggedCount === 0 ? "Nothing flagged so far" : "Not cleared by an analyst",
      color: flaggedCount > 0 ? "var(--risk-high)" : "var(--text-primary)",
    },
    { label: "Flag rate", value: <><CountUp value={flagRate} />%</>, note: `${flaggedCount} of ${transactions.length} transactions`, color: "var(--text-primary)" },
  ];

  return (
    <DashboardShell active="Dashboard">
      <PageHeader
        title="Overview"
        meta={
          user ? (
            <>
              {user.name} <span style={{ color: "var(--text-muted)" }}>·</span> <span className="font-mono">{user.upiId}</span>
            </>
          ) : (
            "Loading account"
          )
        }
        actions={
          <>
            <Link to="/transactions" className="sp-btn sp-btn-secondary">
              All transactions
            </Link>
            <Link to="/simulator" className="sp-btn sp-btn-primary">
              <Zap size={16} strokeWidth={1.5} />
              Simulate transaction
            </Link>
          </>
        }
      />

      <motion.div {...rise(0)} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="sp-card p-5">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
            <p className="font-mono font-medium mt-3" style={{ fontSize: 28, lineHeight: 1, color: s.color }}>{s.value}</p>
            <p className="sp-label mt-3">{s.note}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <motion.div {...rise(1)} className="sp-card p-5 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Your risk score</p>
            <span className="inline-flex items-center gap-2 text-xs" style={{ color: tone.color }}>
              <BandMarker band={tone.band} />
              {user ? tone.label : ""}
            </span>
          </div>
          <div className="flex-1 flex items-center py-4">
            <RiskGauge score={score} ready={!!user} />
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Every score is explained, so you always know why a payment was flagged
          </p>
        </motion.div>

        <motion.div {...rise(2)} className="lg:col-span-2 sp-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">Risk score trend</p>
            <span className="sp-label">Last {chartData.length} transactions</span>
          </div>
          {chartData.length === 0 ? (
            <div className="h-[296px] flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                No data yet. <Link to="/simulator" style={{ color: "var(--accent)" }}>Run a simulation</Link> to see your trend
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={296}>
              <LineChart data={chartData} margin={{ top: 8, right: 48, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} dy={8} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <ReferenceLine y={25} stroke={BAND_COLOR.watch} strokeOpacity={0.4} strokeDasharray="3 4" label={{ value: "Watch", position: "right", fontSize: 11, fill: "var(--text-muted)" }} />
                <ReferenceLine y={50} stroke={BAND_COLOR.high} strokeOpacity={0.4} strokeDasharray="3 4" label={{ value: "High", position: "right", fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip
                  cursor={{ stroke: "var(--border-strong)" }}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
                  labelStyle={{ color: "var(--text-muted)" }}
                  formatter={(v: number, _n, p) => [`${v} · ${inr(p.payload.amount)}`, p.payload.ref]}
                />
                <Line type="monotoneX" dataKey="risk" stroke="var(--accent)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: "var(--accent)" }} animationDuration={600} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...rise(3)} className="lg:col-span-2 sp-card overflow-hidden">
          <div className="flex items-center justify-between px-5 h-14">
            <p className="text-sm font-medium">Recent activity</p>
            <Link to="/transactions" className="text-sm" style={{ color: "var(--accent)" }}>View all</Link>
          </div>

          {loadingTxns ? (
            <p className="px-5 pb-5 text-sm" style={{ color: "var(--text-secondary)" }}>Loading</p>
          ) : recent.length === 0 ? (
            <p className="px-5 pb-5 text-sm" style={{ color: "var(--text-secondary)" }}>
              No transactions yet. <Link to="/simulator" style={{ color: "var(--accent)" }}>Run your first simulation</Link>
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="sp-label text-left border-t" style={{ borderColor: "var(--border)" }}>
                  <th className="font-normal px-5 h-9">Reference</th>
                  <th className="font-normal px-3 h-9 hidden md:table-cell">App</th>
                  <th className="font-normal px-3 h-9 hidden sm:table-cell">Date</th>
                  <th className="font-normal px-3 h-9 text-right">Amount</th>
                  <th className="font-normal px-5 h-9 text-right">Risk</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((txn) => (
                  <tr key={txn.id} className="sp-row border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 h-11 font-mono truncate max-w-[180px]">{txn.txnRef}</td>
                    <td className="px-3 h-11 hidden md:table-cell whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{txn.upiApp}</td>
                    <td className="px-3 h-11 hidden sm:table-cell font-mono whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{shortDate(txn.timestamp)}</td>
                    <td className="px-3 h-11 text-right font-mono">{inr(txn.amount)}</td>
                    <td className="px-5 h-11 text-right">
                      {txn.fraudFlag ? <RiskScore score={txn.fraudFlag.riskScore} /> : <span style={{ color: "var(--text-muted)" }}>Not scored</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        <motion.div {...rise(4)} className="sp-card p-2 self-start">
          <p className="text-sm font-medium px-3 h-10 flex items-center">Quick actions</p>
          {[
            { to: "/simulator", label: "Run a simulation" },
            { to: "/transactions", label: "View all transactions" },
            { to: "/alerts", label: "Check risk alerts" },
          ].map((a) => (
            <Link key={a.to} to={a.to} className="sp-row flex items-center justify-between px-3 h-10 rounded-lg text-sm" style={{ color: "var(--text-secondary)" }}>
              {a.label}
              <ArrowRight size={16} strokeWidth={1.5} color="var(--text-muted)" />
            </Link>
          ))}
        </motion.div>
      </div>
    </DashboardShell>
  );
}
