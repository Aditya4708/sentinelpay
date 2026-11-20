import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
import RiskScore from "../components/RiskScore";
import api from "../services/api";

interface FraudFlag {
  riskScore: number;
  isFraudPredicted: boolean;
  humanReadableSummary: string | null;
  topFactors: { factor: string; impact: number }[];
}

interface Transaction {
  id: string;
  txnRef: string;
  type: string;
  amount: number;
  upiApp: string;
  bank: string;
  timestamp: string;
  fraudFlag: FraudFlag | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    api
      .get("/transactions/mine", { headers: { Authorization: "Bearer " + token } })
      .then((res) => {
        const flagged = res.data.transactions.filter((t: Transaction) => t.fraudFlag?.isFraudPredicted);
        setAlerts(flagged);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell active="Risk Alerts">
      <PageHeader
        title="Risk alerts"
        meta={loading ? "Transactions the fraud model flagged as suspicious" : `${alerts.length} flagged ${alerts.length === 1 ? "transaction" : "transactions"}`}
      />

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading</p>
      ) : alerts.length === 0 ? (
        <div className="sp-card p-10 text-center">
          <p style={{ color: "var(--text-secondary)" }}>
            No flagged transactions yet. Try the <Link to="/simulator" style={{ color: "var(--accent)" }}>simulator</Link> with a new device or an unusual hour to trigger one
          </p>
        </div>
      ) : (
        <div className="sp-card">
          {alerts.map((txn, i) => (
            <div key={txn.id} className="px-5 py-4 border-t first:border-t-0" style={{ borderColor: "var(--border)", borderTopWidth: i === 0 ? 0 : 1 }}>
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm truncate">{txn.txnRef}</p>
                  <p className="sp-label mt-1 font-mono">
                    {new Date(txn.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {txn.upiApp}
                  </p>
                </div>
                <p className="font-mono text-sm flex-shrink-0">{"₹"}{txn.amount.toLocaleString("en-IN")}</p>
                {txn.fraudFlag && <RiskScore score={txn.fraudFlag.riskScore} />}
              </div>
              {txn.fraudFlag?.humanReadableSummary && (
                <p className="text-sm mt-3 pl-3 border-l-2" style={{ color: "var(--text-secondary)", borderColor: "var(--risk-high)" }}>
                  {txn.fraudFlag.humanReadableSummary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
