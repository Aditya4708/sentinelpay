import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
import RiskScore from "../components/RiskScore";
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

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

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
      <PageHeader
        title="Transactions"
        meta="Every transaction you've simulated, with its risk score"
        actions={
          <Link to="/simulator" className="sp-btn sp-btn-primary">
            <Zap size={16} strokeWidth={1.5} />
            New simulation
          </Link>
        }
      />

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading</p>
      ) : transactions.length === 0 ? (
        <div className="sp-card p-10 text-center">
          <p style={{ color: "var(--text-secondary)" }}>
            No transactions yet. <Link to="/simulator" style={{ color: "var(--accent)" }}>Run a simulation</Link> to see one here
          </p>
        </div>
      ) : (
        <div className="sp-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="sp-label text-left">
                <th className="font-normal px-5 h-10">Reference</th>
                <th className="font-normal px-3 h-10 hidden lg:table-cell">Type</th>
                <th className="font-normal px-3 h-10 hidden md:table-cell">App / bank</th>
                <th className="font-normal px-3 h-10 hidden sm:table-cell">Time</th>
                <th className="font-normal px-3 h-10 text-right">Amount</th>
                <th className="font-normal px-5 h-10 text-right">Risk</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="sp-row border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 h-12 font-mono whitespace-nowrap">{txn.txnRef}</td>
                  <td className="px-3 h-12 whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--text-secondary)" }}>{txn.type}</td>
                  <td className="px-3 h-12 whitespace-nowrap hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>
                    {txn.upiApp} <span style={{ color: "var(--text-muted)" }}>/</span> {txn.bank}
                  </td>
                  <td className="px-3 h-12 whitespace-nowrap font-mono hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>{when(txn.timestamp)}</td>
                  <td className="px-3 h-12 whitespace-nowrap text-right font-mono">{"₹"}{txn.amount.toLocaleString("en-IN")}</td>
                  <td className="px-5 h-12 whitespace-nowrap text-right">
                    {txn.fraudFlag ? <RiskScore score={txn.fraudFlag.riskScore} /> : <span style={{ color: "var(--text-muted)" }}>Not scored</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
