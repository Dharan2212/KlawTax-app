import { useState } from "react";
import { useCRMStore } from "@/store/useCRMStore";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import { TrendingUp, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react";

function fmtCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  paid:    { label: "Paid",    bg: "rgba(22,163,74,0.10)",  color: "#15803D", icon: <CheckCircle2 size={14} strokeWidth={2} /> },
  partial: { label: "Partial", bg: "rgba(217,119,6,0.10)",  color: "#B45309", icon: <Clock size={14} strokeWidth={2} /> },
  pending: { label: "Pending", bg: "rgba(100,116,139,0.10)",color: "#475569", icon: <Clock size={14} strokeWidth={2} /> },
  overdue: { label: "Overdue", bg: "rgba(220,38,38,0.10)",  color: "#DC2626", icon: <AlertCircle size={14} strokeWidth={2} /> },
};

export default function PaymentsPanel() {
  const payments = useCRMStore((s) => s.payments);
  const clients  = useCRMStore((s) => s.clients);
  const projects = useCRMStore((s) => s.projects);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const totalAmount  = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid    = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPending = payments.filter((p) => ["pending","overdue","partial"].includes(p.status)).reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const collectionPct = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  const getClientName   = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown";
  const getProjectTitle = (id: string) => projects.find((p) => p.id === id)?.title ?? "Unknown Project";

  const filtered = payments.filter((p) => {
    const client  = getClientName(p.clientId).toLowerCase();
    const project = getProjectTitle(p.projectId).toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || client.includes(q) || project.includes(q);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>Payments</h1>
        <p className="text-neutral-400 text-sm mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{payments.length} total payment records</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <TrendingUp size={16} strokeWidth={2} />,    label: "Total Billed", value: fmtCurrency(totalAmount),  accent: "#1E3A8A" },
          { icon: <CheckCircle2 size={16} strokeWidth={2} />,  label: "Collected",    value: fmtCurrency(totalPaid),    accent: "#15803D" },
          { icon: <Clock size={16} strokeWidth={2} />,         label: "Outstanding",  value: fmtCurrency(totalPending), accent: "#D97706" },
          { icon: <AlertCircle size={16} strokeWidth={2} />,   label: "Overdue",      value: fmtCurrency(totalOverdue), accent: "#DC2626" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.07em" }}>{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.accent}15`, color: s.accent }}>{s.icon}</div>
            </div>
            <p className="text-xl font-bold font-mono" style={{ color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Collection bar */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-neutral-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>Collection Rate</p>
          <p className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: collectionPct >= 80 ? "#15803D" : collectionPct >= 50 ? "#D97706" : "#DC2626" }}>{collectionPct}%</p>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${collectionPct}%`, background: collectionPct >= 80 ? "linear-gradient(90deg, #16A34A, #22C55E)" : collectionPct >= 50 ? "linear-gradient(90deg, #D97706, #F59E0B)" : "linear-gradient(90deg, #DC2626, #EF4444)" }} />
        </div>
        <p className="text-xs text-neutral-400 mt-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {fmtCurrency(totalPaid)} collected of {fmtCurrency(totalAmount)} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client or project…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm transition-all outline-none"
            style={{ background: "white", border: "1px solid #E8EDF3", fontFamily: "'DM Sans', sans-serif", color: "#1E293B" }}
            onFocus={(e) => (e.target.style.borderColor = "#1E3A8A")}
            onBlur={(e) => (e.target.style.borderColor = "#E8EDF3")}
          />
        </div>
        <div className="flex gap-2">
          {["all", "paid", "partial", "pending", "overdue"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{ background: filterStatus === s ? "#1E3A8A" : "white", color: filterStatus === s ? "white" : "#64748B", border: `1px solid ${filterStatus === s ? "#1E3A8A" : "#E8EDF3"}`, fontFamily: "'DM Sans', sans-serif" }}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Payment list */}
      {filtered.length === 0 ? (
        <p className="text-center text-neutral-400 py-12 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>No payments match your filter</p>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {filtered.map((payment) => {
            const sc  = STATUS_CFG[payment.status] ?? STATUS_CFG.pending;
            const pct = payment.amount > 0 ? Math.round((payment.paidAmount / payment.amount) * 100) : 0;
            return (
              <motion.div key={payment.id} variants={staggerItem}
                className="rounded-2xl p-5"
                style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>{sc.icon}</div>
                    <div>
                      <p className="font-bold text-neutral-900" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem" }}>{fmtCurrency(payment.amount)}</p>
                      <p className="text-xs text-neutral-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {payment.type === "advance" ? "Advance Payment" : payment.type === "balance" ? "Balance Payment" : "Full Payment"}
                        {payment.paidDate ? ` · Paid ${fmtDate(payment.paidDate)}` : ` · Due ${fmtDate(payment.dueDate)}`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                    style={{ background: sc.bg, color: sc.color, fontFamily: "'DM Sans', sans-serif" }}>{sc.label}</span>
                </div>

                <div className="flex items-center gap-2 mb-3 text-xs text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <span className="font-medium text-neutral-700 truncate">{getClientName(payment.clientId)}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="truncate">{getProjectTitle(payment.projectId)}</span>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "#F1F5F9" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: payment.status === "paid" ? "#22C55E" : payment.status === "overdue" ? "#EF4444" : "#F59E0B" }} />
                </div>
                <p className="text-[10px] text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {fmtCurrency(payment.paidAmount)} of {fmtCurrency(payment.amount)} paid ({pct}%)
                  {payment.notes ? ` · ${payment.notes}` : ""}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
