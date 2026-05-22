/**
 * ClientPayments — Batch 3 (live API)
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchClientPayments, type ApiInvoice } from "@/lib/crmApi";
import { Loader2, AlertCircle, RefreshCw, CreditCard, TrendingUp, Clock } from "lucide-react";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtCurrency(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  draft:   { label: "Draft",   bg: "rgba(100,116,139,0.10)", color: "#475569" },
  issued:  { label: "Issued",  bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  partial: { label: "Partial", bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  paid:    { label: "Paid",    bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  overdue: { label: "Overdue", bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
};

export default function ClientPayments() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchClientPayments();
      setInvoices(data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (!user) return null;
  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-blue-600" /></div>;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid   = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalDue    = invoices.reduce((s, i) => s + i.amountDue, 0);
  const overdueInvs = invoices.filter((i) => i.invoiceStatus === "overdue");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Payments</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={loadData} className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100" title="Refresh">
          <RefreshCw size={13} className="text-neutral-400" />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <TrendingUp size={16} />, label: "Total",   value: fmtCurrency(totalBilled), color: "#1E3A8A", bg: "#EFF6FF" },
          { icon: <CreditCard size={16} />, label: "Paid",    value: fmtCurrency(totalPaid),   color: "#15803D", bg: "#DCFCE7" },
          { icon: <Clock size={16} />,      label: "Due",     value: fmtCurrency(totalDue),    color: totalDue > 0 ? "#B45309" : "#15803D", bg: totalDue > 0 ? "#FEF3C7" : "#DCFCE7" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-base font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueInvs.length > 0 && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)" }}>
          <AlertCircle size={14} style={{ color: "#DC2626" }} />
          <p className="text-sm text-red-700">{overdueInvs.length} overdue invoice{overdueInvs.length !== 1 ? "s" : ""} — please pay to avoid delays</p>
        </div>
      )}

      {/* Invoice list */}
      <div className="space-y-3">
        {invoices.length === 0
          ? <p className="text-center text-neutral-400 text-sm py-10">No invoices yet</p>
          : invoices.map((inv) => {
              const sc = STATUS_CFG[inv.invoiceStatus] ?? STATUS_CFG.issued;
              return (
                <div key={inv._id} className="rounded-2xl p-4"
                  style={{ background: "white", border: `1px solid ${inv.invoiceStatus === "overdue" ? "#FED7D7" : "#E8EDF3"}` }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{inv.invoiceNumber}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{inv.title} · {fmtDate(inv.createdAt)}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase">Total</p>
                      <p className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#1E3A8A" }}>{fmtCurrency(inv.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase">Paid</p>
                      <p className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#15803D" }}>{fmtCurrency(inv.amountPaid)}</p>
                    </div>
                    {inv.amountDue > 0 && (
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase">Due</p>
                        <p className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#B45309" }}>{fmtCurrency(inv.amountDue)}</p>
                      </div>
                    )}
                    {inv.amountDue > 0 && (
                      <button className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "white" }}>
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
