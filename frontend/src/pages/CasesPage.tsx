import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2, RotateCcw } from "lucide-react";
import DashboardShell, { PageHeader } from "../components/DashboardShell";
import RiskScore from "../components/RiskScore";
import api from "../services/api";

type ReviewStatus = "PENDING" | "CONFIRMED_FRAUD" | "FALSE_POSITIVE";
type Filter = ReviewStatus | "ALL";

interface CaseItem {
  id: string;
  riskScore: number;
  reviewStatus: ReviewStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  humanReadableSummary: string | null;
  topFactors: { factor: string; impact: number }[] | null;
  triggeredRules: string[] | null;
  createdAt: string;
  transaction: {
    id: string;
    txnRef: string;
    amount: number;
    type: string;
    upiApp: string;
    bank: string;
    deviceId: string;
    hourOfDay: number | null;
    receiverVpa: string | null;
    timestamp: string;
    status: string;
    sender: { id: string; name: string; email: string };
  };
}

interface Baseline {
  txnCount: number;
  medianTransactionAmount: number;
  normalTxnHourStart: number | null;
  normalTxnHourEnd: number | null;
  knownDeviceIds: string[] | null;
}

const TABS: { key: Filter; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED_FRAUD", label: "Confirmed fraud" },
  { key: "FALSE_POSITIVE", label: "False positive" },
  { key: "ALL", label: "All" },
];

const STATUS_STYLE: Record<ReviewStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "var(--risk-watch)" },
  CONFIRMED_FRAUD: { label: "Confirmed fraud", color: "var(--risk-high)" },
  FALSE_POSITIVE: { label: "False positive", color: "var(--risk-safe)" },
};

function StatusDot({ status }: { status: ReviewStatus }) {
  const st = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-2 text-sm whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
      {st.label}
    </span>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 text-sm py-1">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="min-w-0 break-all">{children}</span>
    </div>
  );
}

export default function CasesPage() {
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [counts, setCounts] = useState({ PENDING: 0, CONFIRMED_FRAUD: 0, FALSE_POSITIVE: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [baselines, setBaselines] = useState<Record<string, Baseline | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const auth = useCallback(
    () => ({ headers: { Authorization: "Bearer " + (localStorage.getItem("accessToken") || "") } }),
    []
  );

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .get("/cases", { ...auth(), params: { status: filter } })
      .then((res) => {
        setCases(res.data.cases);
        setCounts(res.data.counts);
      })
      .catch(() => setError("Could not load cases. Admin access is required"))
      .finally(() => setLoading(false));
  }, [filter, auth]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(c: CaseItem) {
    if (openId === c.id) {
      setOpenId(null);
      return;
    }
    setOpenId(c.id);
    if (!(c.id in baselines)) {
      api
        .get("/cases/" + c.id, auth())
        .then((res) => setBaselines((prev) => ({ ...prev, [c.id]: res.data.baseline })))
        .catch(() => setBaselines((prev) => ({ ...prev, [c.id]: null })));
    }
  }

  async function review(c: CaseItem, status: ReviewStatus) {
    setSavingId(c.id);
    setError("");
    try {
      await api.patch("/cases/" + c.id + "/review", { status, notes: notes[c.id] || "" }, auth());
      setOpenId(null);
      setBaselines({});
      setNotes((prev) => {
        const next = { ...prev };
        delete next[c.id];
        return next;
      });
      load();
    } catch (err) {
      setError("Could not save the review");
    } finally {
      setSavingId(null);
    }
  }

  function tabCount(key: Filter) {
    if (key === "ALL") return counts.PENDING + counts.CONFIRMED_FRAUD + counts.FALSE_POSITIVE;
    return counts[key];
  }

  function baselineText(c: CaseItem) {
    if (!(c.id in baselines)) return "Loading baseline";
    const b = baselines[c.id];
    if (!b) return "No learned baseline yet (fewer than 3 clean transactions), so defaults were used for scoring.";
    const known = (b.knownDeviceIds || []).length;
    const start = b.normalTxnHourStart === null ? 7 : b.normalTxnHourStart;
    const end = b.normalTxnHourEnd === null ? 23 : b.normalTxnHourEnd;
    return (
      "Learned from " + b.txnCount + " clean transactions. Typical amount ₹" +
      Math.round(b.medianTransactionAmount).toLocaleString("en-IN") +
      ", active " + String(start).padStart(2, "0") + ":00 to " + String(end).padStart(2, "0") + ":00, " + known + " known device" + (known === 1 ? "" : "s") + "."
    );
  }

  function deviceInfo(c: CaseItem) {
    const b = baselines[c.id];
    if (!b) return { id: c.transaction.deviceId, note: "" };
    const isKnown = (b.knownDeviceIds || []).includes(c.transaction.deviceId);
    return { id: c.transaction.deviceId, note: isKnown ? "Known device" : "Not seen before" };
  }

  return (
    <DashboardShell active="Cases">
      <PageHeader
        title="Case review"
        meta="A false positive teaches the system the behaviour was normal. Confirmed fraud never does"
      />

      <div role="tablist" className="inline-flex flex-wrap gap-0.5 p-0.5 rounded-lg border mb-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        {TABS.map((t) => {
          const on = filter === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setFilter(t.key);
                setOpenId(null);
              }}
              className="flex items-center gap-2 px-3 h-8 rounded-md text-sm"
              style={{
                background: on ? "var(--surface-raised)" : "transparent",
                boxShadow: on ? "var(--highlight)" : "none",
                color: on ? "var(--text-primary)" : "var(--text-secondary)",
                transition: "background-color 150ms var(--ease), color 150ms var(--ease)",
              }}
            >
              {t.label}
              <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{tabCount(t.key)}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "var(--risk-high-soft)", color: "var(--risk-high)" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading</p>
      ) : cases.length === 0 ? (
        <div className="sp-card p-10 text-center">
          <p style={{ color: "var(--text-secondary)" }}>No cases in this view. Flagged transactions from the simulator appear here for review</p>
        </div>
      ) : (
        <div className="sp-card overflow-hidden">
          {cases.map((c, i) => {
            const st = STATUS_STYLE[c.reviewStatus];
            const open = openId === c.id;
            const saving = savingId === c.id;
            const dev = deviceInfo(c);
            return (
              <div key={c.id} style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}>
                <button onClick={() => toggle(c)} aria-expanded={open} className="sp-row w-full text-left px-5 h-16 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">{c.transaction.txnRef}</p>
                    <p className="sp-label mt-1 truncate">
                      {c.transaction.sender.name} · {c.transaction.sender.email}
                    </p>
                  </div>
                  <span className="hidden md:inline-flex">
                    <StatusDot status={c.reviewStatus} />
                  </span>
                  <p className="font-mono text-sm w-24 text-right flex-shrink-0">{"₹"}{c.transaction.amount.toLocaleString("en-IN")}</p>
                  <span className="w-20 flex justify-end flex-shrink-0">
                    <RiskScore score={c.riskScore} />
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    color="var(--text-muted)"
                    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 160ms var(--ease)" }}
                  />
                </button>

                {open && (
                  <div className="px-5 pb-5" style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-5">
                      <div>
                        <p className="text-sm font-medium mb-3">Why it was flagged</p>
                        {c.humanReadableSummary && (
                          <p className="text-sm mb-4 pl-3 border-l-2" style={{ color: "var(--text-secondary)", borderColor: "var(--risk-high)" }}>
                            {c.humanReadableSummary}
                          </p>
                        )}
                        <div className="flex flex-col">
                          {(c.topFactors || []).map((f) => (
                            <div key={f.factor} className="flex items-center justify-between gap-3 text-sm min-h-9 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                              <span>{f.factor}</span>
                              <span className="font-mono text-xs" style={{ color: f.impact > 0 ? "var(--risk-high)" : "var(--risk-safe)" }}>
                                {f.impact > 0 ? "+" : ""}{f.impact}
                              </span>
                            </div>
                          ))}
                        </div>
                        {(c.triggeredRules || []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {(c.triggeredRules || []).map((r) => (
                              <span key={r} className="text-xs font-mono px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}>
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-3">Transaction and context</p>
                        <Detail label="Via">{c.transaction.upiApp} / {c.transaction.bank}</Detail>
                        <Detail label="Hour">
                          {c.transaction.hourOfDay === null ? (
                            <span style={{ color: "var(--text-muted)" }}>Not recorded</span>
                          ) : (
                            <span className="font-mono">{String(c.transaction.hourOfDay).padStart(2, "0")}:00</span>
                          )}
                        </Detail>
                        <Detail label="Device">
                          <span className="font-mono">{dev.id}</span>
                          {dev.note && <span className="ml-2" style={{ color: dev.note === "Known device" ? "var(--text-muted)" : "var(--risk-watch)" }}>{dev.note}</span>}
                        </Detail>
                        {c.transaction.receiverVpa && (
                          <Detail label="Paid to">
                            <span className="font-mono">{c.transaction.receiverVpa}</span>
                          </Detail>
                        )}
                        <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>{baselineText(c)}</p>
                      </div>
                    </div>

                    <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
                      {c.reviewStatus === "PENDING" ? (
                        <>
                          <textarea
                            value={notes[c.id] || ""}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            placeholder="Notes for the audit trail (optional)"
                            rows={2}
                            maxLength={500}
                            className="sp-input py-2 mb-3"
                            style={{ height: "auto" }}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => review(c, "CONFIRMED_FRAUD")} disabled={saving} className="sp-btn" style={{ background: "var(--risk-high)", color: "#fff" }}>
                              {saving && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
                              Confirm fraud
                            </button>
                            <button onClick={() => review(c, "FALSE_POSITIVE")} disabled={saving} className="sp-btn sp-btn-secondary">
                              Mark false positive
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                          <div>
                            <p className="text-sm font-medium" style={{ color: st.color }}>{st.label}</p>
                            {c.reviewNotes && <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{c.reviewNotes}</p>}
                            {c.reviewedAt && (
                              <p className="sp-label font-mono mt-1">
                                Reviewed {new Date(c.reviewedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                          <button onClick={() => review(c, "PENDING")} disabled={saving} className="sp-btn sp-btn-secondary">
                            <RotateCcw size={16} strokeWidth={1.5} />
                            Reopen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
