import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Clock } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
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
      <h1 className="font-display font-semibold text-xl sm:text-2xl" style={{ color: "var(--text-primary)" }}>
        Risk Alerts
      </h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-secondary)" }}>
        Transactions flagged as suspicious by the fraud detection engine
      </p>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : alerts.length === 0 ? (
        <div className="p-10 rounded-2xl border text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            No flagged transactions yet. Try the <Link to="/simulator" style={{ color: "var(--accent)", fontWeight: 600 }}>simulator</Link> with a new device or unusual hour to trigger one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((txn) => (
            <div key={txn.id} className="p-4 sm:p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(244, 63, 94, 0.12)" }}>
                  <ShieldAlert size={18} color="var(--risk-high)" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium" style={{ color: "var(--text-primary)" }}>{txn.txnRef}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                    <Clock size={12} />
                    {new Date(txn.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className="font-mono font-semibold text-lg flex-shrink-0" style={{ color: "var(--risk-high)" }}>
                  {txn.fraudFlag?.riskScore}%
                </p>
              </div>
              {txn.fraudFlag?.humanReadableSummary && (
                <p className="text-sm px-3 py-2 rounded-xl" style={{ background: "var(--bg)", color: "var(--text-secondary)" }}>
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