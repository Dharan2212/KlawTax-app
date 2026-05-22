/**
 * PaymentsPanel — Batch 3 (live API)
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import { AlertCircle, Loader2, RefreshCw, CreditCard, TrendingUp, Clock } from "lucide-react";
import { fetchInvoices, type ApiInvoice } from "@/lib/crmApi";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtCurrency(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

const INV_STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: "Draft",     bg: "rgba(100,116,139,0.10)", color: "#475569" },
  issued:    { label: "Issued",    bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  partial:   { label: "Partial",   bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  paid:      { label: "Paid",      bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  overdue:   { label: "Overdue",   bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
  disputed:  { label: "Disputed",  bg: "rgba(124,58,237,0.10)",  color: "#6D28D9" },
  cancelled: { label: "Cancelled", bg: "rgba(100,116,139,0.10)", color: "#475569" },
  overpaid:  { label: "Overpaid",  bg: "rgba(20,184,166,0.10)",  color: "#0F766E" },
};

export default function PaymentsPanel() {
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchInvoices();
      setInvoices(res.invoices ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-blue-600" /></div>;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load invoices.</p>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const totalBilled  = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid    = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalDue     = invoices.reduce((s, i) => s + i.amountDue, 0);
  const overdueInvs  = invoices.filter((i) => i.invoiceStatus === "overdue");

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Payments & Invoices</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{invoices.length} invoices · {overdueInvs.length} overdue</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100"
          style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <TrendingUp size={16} />, label: "Total Billed",  value: fmtCurrency(totalBilled),  color: "#1E3A8A", bg: "#EFF6FF" },
          { icon: <CreditCard size={16} />, label: "Collected",     value: fmtCurrency(totalPaid),    color: "#15803D", bg: "#DCFCE7" },
          { icon: <Clock size={16} />,      label: "Pending",       value: fmtCurrency(totalDue),     color: "#B45309", bg: "#FEF3C7" },
          { icon: <AlertCircle size={16} />, label: "Overdue Count", value: overdueInvs.length,       color: "#DC2626", bg: "#FEF2F2" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: m.bg, color: m.color }}>
              {m.icon}
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide">{m.label}</p>
              <p className="text-base font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: m.color }}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div className="space-y-2">
        {invoices.length === 0
          ? <p className="text-center text-neutral-400 text-sm py-10">No invoices found</p>
          : invoices.map((inv) => {
              const sc = INV_STATUS_CFG[inv.invoiceStatus] ?? INV_STATUS_CFG.issued;
              return (
                <div key={inv._id} className="flex items-center justify-between p-4 rounded-2xl gap-3 flex-wrap"
                  style={{ background: "white", border: `1px solid ${inv.invoiceStatus === "overdue" ? "#FED7D7" : "#E8EDF3"}` }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{inv.title} · {fmtDate(inv.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#1E3A8A" }}>
                        {fmtCurrency(inv.totalAmount)}
                      </p>
                      {inv.amountDue > 0 && (
                        <p className="text-xs text-amber-600">Due: {fmtCurrency(inv.amountDue)}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })
        }
      </div>
    </motion.div>
  );
}
