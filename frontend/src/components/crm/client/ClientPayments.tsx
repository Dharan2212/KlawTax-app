/**
 * ClientPayments — Batch 5.3 (correct backend types: ClientPaymentSummary)
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchClientPayments, type ClientPaymentSummary } from "@/lib/crmApi";
import {
  fmtDate,
  fmtCurrency,
  INVOICE_STATUS_CFG,
  PAYMENT_STATUS_CFG,
} from "@/lib/crmUtils";
import { Loader2, AlertCircle, RefreshCw, CreditCard, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

// ── Display configs imported from @/lib/crmUtils ─────────────────────────────
// STATUS_CFG → INVOICE_STATUS_CFG  |  PAYMENT_STATUS_CFG → PAYMENT_STATUS_CFG
const STATUS_CFG = INVOICE_STATUS_CFG;

export default function ClientPayments() {
  const { user } = useAuth();
  const [data, setData]     = useState<ClientPaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchClientPayments();
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (!user) return null;

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={28} className="animate-spin text-blue-600" />
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load payment information.</p>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const invoices       = data?.invoices       ?? [];
  const recentPayments = data?.recentPayments ?? [];
  const totalInvoiced  = data?.totalInvoiced  ?? 0;
  const totalPaid      = data?.totalPaid      ?? 0;
  const totalDue       = data?.totalOutstanding ?? 0;

  const hasOverdue = invoices.some((i) => i.invoiceStatus === "overdue");

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: <TrendingUp size={16} />, label: "Total",    value: fmtCurrency(totalInvoiced), color: "#1E3A8A", bg: "#EFF6FF" },
          { icon: <CheckCircle2 size={16} />, label: "Paid",   value: fmtCurrency(totalPaid),     color: "#15803D", bg: "#DCFCE7" },
          { icon: <Clock size={16} />,       label: "Due",     value: fmtCurrency(totalDue),      color: totalDue > 0 ? "#B45309" : "#15803D", bg: totalDue > 0 ? "#FEF3C7" : "#DCFCE7" },
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
      {hasOverdue && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)" }}>
          <AlertCircle size={14} style={{ color: "#DC2626" }} />
          <p className="text-sm text-red-700">You have overdue invoices — please pay to avoid delays</p>
        </div>
      )}

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CreditCard size={32} className="text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm font-semibold">No invoices yet</p>
          <p className="text-neutral-400 text-xs mt-1">Your invoices will appear here once services are registered</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-neutral-900">Invoices</h2>
          {invoices.map((inv, idx) => {
            const sc = STATUS_CFG[inv.invoiceStatus] ?? STATUS_CFG.issued;
            return (
              <div key={inv.invoiceId ?? idx} className="rounded-2xl p-4"
                style={{ background: "white", border: `1px solid ${inv.invoiceStatus === "overdue" ? "#FED7D7" : "#E8EDF3"}` }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{inv.invoiceNumber}</p>
                    {inv.projectTitle && <p className="text-xs text-neutral-400 mt-0.5">{inv.projectTitle}</p>}
                    {inv.dueDate && <p className="text-xs text-neutral-400 mt-0.5">Due {fmtDate(inv.dueDate)}</p>}
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
          })}
        </div>
      )}

      {/* Recent payment history */}
      {recentPayments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-neutral-900">Payment History</h2>
          {recentPayments.map((pay, idx) => {
            const pc = PAYMENT_STATUS_CFG[pay.paymentStatus] ?? { label: pay.paymentStatus, color: "#64748B" };
            return (
              <div key={pay.paymentId ?? idx} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                <div>
                  <p className="text-xs font-semibold text-neutral-900">{pay.invoiceNumber}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{pay.paymentMethod.replace(/_/g, " ")}{pay.capturedAt ? ` · ${fmtDate(pay.capturedAt)}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#15803D" }}>{fmtCurrency(pay.amount)}</p>
                  <span className="text-[10px] font-semibold" style={{ color: pc.color }}>{pc.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
