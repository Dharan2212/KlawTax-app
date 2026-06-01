/**
 * PaymentsPanel — Batch 3 (smart table)
 * Full search + status filter + sort + pagination
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import {
  AlertCircle, Loader2, RefreshCw, CreditCard,
  TrendingUp, Clock, IndianRupee, Filter,
} from "lucide-react";
import { fetchInvoices, exportPayments, type ApiInvoice, type InvoicesQuery } from "@/lib/crmApi";
import { CRMFilterBar, PaginationBar, SortSelector, type PillFilter } from "@/components/crm/shared/CRMFilterBar";
import { ExportButton } from "@/components/crm/shared/ExportButton";

// ── Helpers ────────────────────────────────────────────────────

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

const STATUS_PILLS: PillFilter[] = [
  { key: "all",      label: "All",      bg: "#1E3A8A", color: "white" },
  { key: "issued",   label: "Issued",   bg: "#2563EB", color: "white" },
  { key: "partial",  label: "Partial",  bg: "#B45309", color: "white" },
  { key: "paid",     label: "Paid",     bg: "#16A34A", color: "white" },
  { key: "overdue",  label: "Overdue",  bg: "#DC2626", color: "white" },
  { key: "disputed", label: "Disputed", bg: "#6D28D9", color: "white" },
];

const SORT_OPTIONS = [
  { value: "createdAt",    label: "Date Created" },
  { value: "dueDate",      label: "Due Date"     },
  { value: "totalAmount",  label: "Amount"       },
  { value: "invoiceStatus",label: "Status"       },
];

const PAGE_SIZE = 20;

// ── Main ───────────────────────────────────────────────────────

export default function PaymentsPanel() {
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const [search, setSearch]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusPill, setStatusPill]   = useState("all");
  const [sortBy, setSortBy]           = useState("createdAt");
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("desc");
  const [page, setPage]               = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const q: InvoicesQuery = {
        page,
        limit: PAGE_SIZE,
        sortOrder: sortDir,
      };
      if (debouncedSearch) q.search = debouncedSearch;
      if (statusPill !== "all") q.invoiceStatus = statusPill;
      if (dateFrom) q.dateFrom = dateFrom;
      if (dateTo)   q.dateTo   = dateTo;
      const res = await fetchInvoices(q);
      setInvoices(res.invoices ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusPill, sortDir, dateFrom, dateTo]);

  useEffect(() => { loadData(); }, [loadData]);

  const pages = Math.ceil(total / PAGE_SIZE);

  // Aggregate stats from current page data
  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid   = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalDue    = invoices.reduce((s, i) => s + i.amountDue, 0);
  const overdueCount = invoices.filter((i) => i.invoiceStatus === "overdue").length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load invoices.</p>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
            Payments & Invoices
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} invoices · {overdueCount} overdue on this page</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            label="Export"
            onExport={() => exportPayments({
              search,
              paymentStatus: statusPill !== "all" ? statusPill : undefined,
              dateFrom,
            })}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: showFilters ? "#EFF6FF" : "white",
              border: `1px solid ${showFilters ? "#BFDBFE" : "#E8EDF3"}`,
              color: showFilters ? "#1E3A8A" : "#64748B",
            }}>
            <Filter size={12} /> Filters
          </button>
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100"
            style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <TrendingUp size={16} />,   label: "Billed (page)",  value: fmtCurrency(totalBilled), color: "#1E3A8A", bg: "#EFF6FF" },
          { icon: <CreditCard size={16} />,   label: "Collected",       value: fmtCurrency(totalPaid),   color: "#15803D", bg: "#DCFCE7" },
          { icon: <Clock size={16} />,         label: "Pending",         value: fmtCurrency(totalDue),    color: "#B45309", bg: "#FEF3C7" },
          { icon: <AlertCircle size={16} />,   label: "Overdue (page)", value: overdueCount,             color: "#DC2626", bg: "#FEF2F2" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: m.bg, color: m.color }}>
              {m.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide truncate">{m.label}</p>
              <p className="text-base font-bold truncate"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: m.color }}>
                {m.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <CRMFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search invoice number, title…"
        pills={STATUS_PILLS}
        activePill={statusPill}
        onPillChange={(k) => { setStatusPill(k); setPage(1); }}
        rightSlot={
          <SortSelector
            value={sortBy}
            options={SORT_OPTIONS}
            dir={sortDir}
            onValueChange={(v) => { setSortBy(v); setPage(1); }}
            onDirChange={(d) => { setSortDir(d); setPage(1); }}
          />
        }
      />

      {/* Extended filters */}
      {showFilters && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">From date</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="rounded-lg px-2.5 py-2 text-xs outline-none"
                style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">To date</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="rounded-lg px-2.5 py-2 text-xs outline-none"
                style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155" }} />
            </div>
          </div>
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); setSearch(""); setStatusPill("all"); setPage(1); }}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
            Clear all filters
          </button>
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IndianRupee size={28} className="text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">No invoices found</p>
          <button onClick={() => { setSearch(""); setStatusPill("all"); setPage(1); }}
            className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const sc = INV_STATUS_CFG[inv.invoiceStatus] ?? INV_STATUS_CFG.issued;
            const isOverdue = inv.invoiceStatus === "overdue";
            return (
              <div key={inv._id}
                className="flex items-center justify-between p-4 rounded-2xl gap-3 flex-wrap"
                style={{
                  background: "white",
                  border: `1px solid ${isOverdue ? "#FED7D7" : "#E8EDF3"}`,
                  boxShadow: "0 1px 4px rgba(15,27,76,0.04)",
                }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-neutral-900 font-mono">{inv.invoiceNumber}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{inv.title} · {fmtDate(inv.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: "#1E3A8A" }}>
                      {fmtCurrency(inv.totalAmount)}
                    </p>
                    {inv.amountDue > 0 && (
                      <p className="text-xs" style={{ color: isOverdue ? "#DC2626" : "#B45309" }}>
                        Due: {fmtCurrency(inv.amountDue)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <PaginationBar page={page} pages={pages} total={total} limit={PAGE_SIZE}
          onPageChange={(p) => setPage(p)} loading={loading} />
      )}
    </motion.div>
  );
}
