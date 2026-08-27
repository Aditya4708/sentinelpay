import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Clock, ArrowUpRight } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

interface FraudFlag {
  riskScore: number;
  isFraudPredicted: boolean;
  humanReadableSummary: string | null;
}

interface Transaction {
  id: string;
  txnRef: string;
  type: string;
  amount: number;
  upiApp: string;
  bank: string;
  status: string;
  timestamp: string;
  fraudFlag: FraudFlag | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    api
      .get("/transactions/mine", { headers: { Authorization: "Bearer " + token } })
      .then((res) => setTransactions(res.data.transactions))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell active="Transactions">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-semibold text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
            Transaction History
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Every transaction you've simulated, with its risk score
          </p>
        </div>
        <Link to="/simulator" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
          New Simulation
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : transactions.length === 0 ? (
        <div className="p-10 rounded-2xl border text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            No transactions yet. <Link to="/simulator" style={{ color: "var(--accent)", fontWeight: 600 }}>Run a simulation</Link> to see one here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {transactions.map((txn) => (
            <div key={txn.id} className="p-4 sm:p-5 rounded-2xl border flex items-center gap-4" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: txn.fraudFlag?.isFraudPredicted ? "rgba(244, 63, 94, 0.12)" : "var(--accent-soft)" }}>
                {txn.fraudFlag?.isFraudPredicted ? <ShieldAlert size={18} color="var(--risk-high)" /> : <ShieldCheck size={18} color="var(--risk-safe)" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{txn.txnRef}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg)", color: "var(--text-secondary)" }}>{txn.type}</span>
                </div>
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                  <Clock size={12} />
                  {new Date(txn.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {" - "}{txn.upiApp} - {txn.bank}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-mono font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  {"\u20B9"}{txn.amount.toLocaleString("en-IN")}
                </p>
                {txn.fraudFlag && (
                  <p className="font-mono text-xs mt-1" style={{ color: txn.fraudFlag.isFraudPredicted ? "var(--risk-high)" : "var(--risk-safe)" }}>
                    {txn.fraudFlag.riskScore}% risk
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}