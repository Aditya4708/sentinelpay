import { useState, useEffect } from "react";
import { ArrowDownLeft, CheckCircle2, XCircle, TriangleAlert } from "lucide-react";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
import api from "../services/api";

type Stage = "incoming" | "warning" | "avoided" | "lost";

const FAKE_REQUEST = {
  vpa: "cashback-refund@okaxis",
  label: "Amazon Refund Team",
  amount: 1499,
  message: "Refund initiated for your recent order. Tap to receive Rs. 1,499 instantly.",
};

const amount = "₹" + FAKE_REQUEST.amount.toLocaleString("en-IN");
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function CollectShieldPage() {
  const [stage, setStage] = useState<Stage>("incoming");
  const [reportCount, setReportCount] = useState<number>(0);
  const [reporting, setReporting] = useState(false);

  function token() {
    return localStorage.getItem("accessToken") || "";
  }

  function loadReputation() {
    api
      .get("/vpa/" + encodeURIComponent(FAKE_REQUEST.vpa), { headers: { Authorization: "Bearer " + token() } })
      .then((res) => setReportCount(res.data.reportCount))
      .catch(() => setReportCount(0));
  }

  useEffect(() => {
    loadReputation();
  }, []);

  function reset() {
    setStage("incoming");
    loadReputation();
  }

  async function handleReport() {
    setReporting(true);
    try {
      const res = await api.post(
        "/vpa/report",
        { vpa: FAKE_REQUEST.vpa, label: FAKE_REQUEST.label },
        { headers: { Authorization: "Bearer " + token() } }
      );
      setReportCount(res.data.reportCount);
    } catch (err) {
      // non-blocking - still proceed to the avoided state even if the report fails
    } finally {
      setReporting(false);
      setStage("avoided");
    }
  }

  return (
    <DashboardShell active="Scam Shield">
      <PageHeader title="Collect request shield" />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] gap-8 items-start">
        <div className="max-w-xl text-sm flex flex-col gap-4 order-2 lg:order-1" style={{ color: "var(--text-secondary)" }}>
          <p>
            India's most common everyday UPI scam doesn't look suspicious at all. It looks like a refund. This page
            simulates the exact pattern.
          </p>
          <p>
            Every Cancel here updates a real, shared VPA reputation count that every account on this platform sees.
          </p>
          <div className="sp-card p-4 mt-2">
            <p className="sp-label">Reports against this VPA</p>
            <p className="font-mono mt-2" style={{ color: "var(--text-primary)" }}>{FAKE_REQUEST.vpa}</p>
            <p className="font-mono font-medium mt-3" style={{ fontSize: 28, lineHeight: 1, color: reportCount > 0 ? "var(--risk-high)" : "var(--text-primary)" }}>
              {reportCount}
            </p>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          {stage === "incoming" && (
            <div className="sp-card p-6">
              <p className="sp-label mb-4">Incoming collect request</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--surface-raised)" }}>
                  <ArrowDownLeft size={18} strokeWidth={1.5} color="var(--text-secondary)" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{FAKE_REQUEST.label}</p>
                  <p className="sp-label font-mono truncate">{FAKE_REQUEST.vpa}</p>
                </div>
              </div>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{FAKE_REQUEST.message}</p>
              <p className="font-mono font-medium mb-6" style={{ fontSize: 32, lineHeight: 1 }}>{amount}</p>
              <button onClick={() => setStage("warning")} className="sp-btn sp-btn-primary sp-btn-lg w-full">
                Tap to receive refund
              </button>
              {reportCount > 0 && (
                <p className="text-xs mt-3 text-center" style={{ color: "var(--text-muted)" }}>
                  Already reported {plural(reportCount, "time")} by other accounts
                </p>
              )}
            </div>
          )}

          {stage === "warning" && (
            <div className="sp-card p-6" style={{ borderColor: "var(--risk-high)" }}>
              <div className="flex items-start gap-3 mb-4">
                <TriangleAlert size={20} strokeWidth={1.5} color="var(--risk-high)" className="mt-0.5 flex-shrink-0" />
                <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                  This is a payment request, not a refund
                </p>
              </div>

              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                Entering your UPI PIN here will send <span style={{ color: "var(--text-primary)" }}>{amount}</span> from your
                account to <span className="font-mono" style={{ color: "var(--text-primary)" }}>{FAKE_REQUEST.vpa}</span>. Refunds
                never ask for a PIN. The money arrives on its own.
              </p>

              <p className="text-sm mb-6 px-3 py-2 rounded-lg" style={{ background: "var(--risk-high-soft)", color: "var(--risk-high)" }}>
                Reported by {plural(reportCount, "other account")} on this platform
              </p>

              <div className="flex flex-col gap-2">
                <button onClick={handleReport} disabled={reporting} className="sp-btn sp-btn-primary sp-btn-lg w-full">
                  {reporting ? "Reporting" : "Cancel and report"}
                </button>
                <button onClick={() => setStage("lost")} className="sp-btn sp-btn-ghost sp-btn-lg w-full">
                  Proceed anyway
                </button>
              </div>
            </div>
          )}

          {stage === "avoided" && (
            <div className="sp-card p-6">
              <CheckCircle2 size={24} strokeWidth={1.5} color="var(--risk-safe)" className="mb-4" />
              <p className="text-base font-medium mb-2">You avoided a {amount} loss</p>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                This is the most common everyday UPI scam in India. The fix isn't a smarter fraud model. It's exactly
                this: a clear warning before the PIN is entered.
              </p>
              <p className="text-sm mb-6">
                This VPA now has <span className="font-mono">{plural(reportCount, "report")}</span>, visible to every account on the platform
              </p>
              <button onClick={reset} className="sp-btn sp-btn-secondary">Try again</button>
            </div>
          )}

          {stage === "lost" && (
            <div className="sp-card p-6">
              <XCircle size={24} strokeWidth={1.5} color="var(--risk-high)" className="mb-4" />
              <p className="text-base font-medium mb-2">{amount} sent to the scammer</p>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                This happens to real victims every day. No fraud-scoring model can catch it, because the account owner
                authorised the payment. The only fix is a warning like the one you just saw.
              </p>
              <button onClick={reset} className="sp-btn sp-btn-secondary">Try again</button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
