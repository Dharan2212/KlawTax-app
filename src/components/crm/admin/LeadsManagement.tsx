/**
 * LeadsManagement — Batch 3 (smart table)
 * Full CRM leads table: search + status filter + priority + sort + pagination + quick pills
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import {
  AlertCircle, Loader2, RefreshCw, UserPlus,
  Phone, Mail, Calendar, ArrowRight, Filter,
  MoreHorizontal, CheckCircle2, Users,
} from "lucide-react";
import {
  fetchLeads, updateLeadStatus, convertLead, addLeadNote, exportLeads,
  type ApiLead, type LeadsQuery,
} from "@/lib/crmApi";
import { CRMFilterBar, PaginationBar, SortSelector, type PillFilter } from "@/components/crm/shared/CRMFilterBar";
import { ExportButton } from "@/components/crm/shared/ExportButton";

// ── Helpers ────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function relFollowUp(d?: string): { label: string; color: string; bg: string } {
  if (!d) return { label: "—", color: "#94A3B8", bg: "transparent" };
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, color: "#DC2626", bg: "rgba(220,38,38,0.08)" };
  if (diff === 0) return { label: "Today",     color: "#B45309", bg: "rgba(217,119,6,0.08)"  };
  if (diff === 1) return { label: "Tomorrow",  color: "#D97706", bg: "rgba(217,119,6,0.06)"  };
  return            { label: `In ${diff}d`,    color: "#64748B", bg: "rgba(100,116,139,0.06)" };
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  new:           { label: "New",           color: "#1E3A8A", bg: "rgba(37,99,235,0.10)"   },
  contacted:     { label: "Contacted",     color: "#0F766E", bg: "rgba(20,184,166,0.10)"  },
  qualified:     { label: "Qualified",     color: "#6D28D9", bg: "rgba(124,58,237,0.10)"  },
  proposal_sent: { label: "Proposal Sent", color: "#B45309", bg: "rgba(217,119,6,0.10)"   },
  onboarding:    { label: "Onboarding",    color: "#D97706", bg: "rgba(217,119,6,0.10)"   },
  won:           { label: "Won",           color: "#15803D", bg: "rgba(22,163,74,0.10)"   },
  lost:          { label: "Lost",          color: "#DC2626", bg: "rgba(220,38,38,0.10)"   },
  archived:      { label: "Archived",      color: "#64748B", bg: "rgba(100,116,139,0.10)" },
  converted:     { label: "Converted",     color: "#15803D", bg: "rgba(22,163,74,0.12)"   },
};

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "#DC2626" },
  high:   { label: "High",   color: "#B45309" },
  medium: { label: "Medium", color: "#2563EB" },
  low:    { label: "Low",    color: "#64748B" },
};

const STATUS_PILLS: PillFilter[] = [
  { key: "all",           label: "All Leads",      bg: "#1E3A8A", color: "white" },
  { key: "new",           label: "New",            bg: "#2563EB", color: "white" },
  { key: "contacted",     label: "Contacted",      bg: "#0F766E", color: "white" },
  { key: "qualified",     label: "Qualified",      bg: "#6D28D9", color: "white" },
  { key: "onboarding",    label: "Onboarding",     bg: "#D97706", color: "white" },
  { key: "won",           label: "Won",            bg: "#16A34A", color: "white" },
];

const SORT_OPTIONS = [
  { value: "createdAt",   label: "Date Created"  },
  { value: "updatedAt",   label: "Last Updated"  },
  { value: "followUpDate",label: "Follow-up Date"},
  { value: "priority",    label: "Priority"      },
  { value: "fullName",    label: "Name"          },
];

const PAGE_SIZE = 20;

// ── Inline action menu ─────────────────────────────────────────

function ActionMenu({ lead, onRefresh }: { lead: ApiLead; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleStatus = async (status: string) => {
    setBusy(true);
    try { await updateLeadStatus(lead._id, status); onRefresh(); }
    catch { /* ignore */ }
    finally { setBusy(false); setOpen(false); }
  };

  const handleConvert = async () => {
    if (!confirm("Convert this lead to a client?")) return;
    setBusy(true);
    try { await convertLead(lead._id); onRefresh(); }
    catch { /* ignore */ }
    finally { setBusy(false); setOpen(false); }
  };

  const nextStatuses = {
    new:           ["contacted"],
    contacted:     ["qualified", "proposal_sent"],
    qualified:     ["proposal_sent", "onboarding"],
    proposal_sent: ["onboarding", "won", "lost"],
    onboarding:    ["won"],
    won:           ["converted"],
  }[lead.status] ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
        style={{ color: "#94A3B8" }}
        disabled={busy}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 rounded-xl shadow-lg z-10 min-w-[160px]"
          style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 8px 24px rgba(15,27,76,0.12)" }}>
          {nextStatuses.map((s) => (
            <button key={s} onClick={() => handleStatus(s)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
              style={{ color: "#334155" }}>
              → Mark as {STATUS_CFG[s]?.label ?? s}
            </button>
          ))}
          {lead.status === "won" && (
            <button onClick={handleConvert}
              className="w-full text-left px-3 py-2 text-xs hover:bg-green-50 transition-colors border-t"
              style={{ color: "#15803D", borderColor: "#E8EDF3" }}>
              <CheckCircle2 size={10} className="inline mr-1" /> Convert to Client
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────

export default function LeadsManagement() {
  const navigate = useNavigate();

  const [leads, setLeads]         = useState<ApiLead[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusPill, setStatusPill] = useState("all");
  const [sortBy, setSortBy]       = useState("createdAt");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");
  const [page, setPage]           = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("");
  const [unassigned, setUnassigned] = useState(false);

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
      const q: LeadsQuery = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortOrder: sortDir,
      };
      if (debouncedSearch)         q.search = debouncedSearch;
      if (statusPill !== "all")    q.status = statusPill;
      if (priorityFilter)          q.priority = priorityFilter;
      if (unassigned)              q.unassigned = "true";
      const res = await fetchLeads(q);
      setLeads(res.leads ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusPill, sortBy, sortDir, priorityFilter, unassigned]);

  useEffect(() => { loadData(); }, [loadData]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const newCount  = leads.filter((l) => l.status === "new").length;
  const wonCount  = leads.filter((l) => l.status === "won").length;
  const qualCount = leads.filter((l) => l.status === "qualified").length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load leads.</p>
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
            Leads & Pipeline
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {total} total · {newCount} new · {qualCount} qualified · {wonCount} won
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            label="Export"
            onExport={() => exportLeads({
              search,
              status: statusPill !== "all" ? statusPill : undefined,
              priority: priorityFilter || undefined,
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 transition-colors"
            style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",     count: total,     color: "#1E3A8A", bg: "#EFF6FF" },
          { label: "New",       count: newCount,  color: "#2563EB", bg: "#DBEAFE" },
          { label: "Qualified", count: qualCount, color: "#6D28D9", bg: "#EDE9FE" },
          { label: "Won",       count: wonCount,  color: "#15803D", bg: "#DCFCE7" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="rounded-xl p-3 text-center"
            style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <p className="text-xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>{count}</p>
            <p className="text-[10px] mt-0.5 text-neutral-500 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <CRMFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, phone, email, service…"
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
              <label className="block text-xs font-semibold text-neutral-500 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                className="rounded-lg px-2.5 py-2 text-xs outline-none"
                style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155", minWidth: "120px" }}>
                <option value="">All priorities</option>
                {Object.entries(PRIORITY_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600 cursor-pointer">
              <input type="checkbox" checked={unassigned} onChange={(e) => { setUnassigned(e.target.checked); setPage(1); }}
                className="rounded" />
              Unassigned only
            </label>
          </div>
          <button
            onClick={() => { setPriorityFilter(""); setUnassigned(false); setSearch(""); setStatusPill("all"); setPage(1); }}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
            Clear all filters
          </button>
        </div>
      )}

      {/* Leads list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={32} className="text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">No leads found</p>
          <button onClick={() => { setSearch(""); setStatusPill("all"); setPriorityFilter(""); setPage(1); }}
            className="mt-3 text-xs text-blue-600 hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => {
            const sc  = STATUS_CFG[lead.status]  ?? STATUS_CFG.new;
            const fup = relFollowUp(lead.followUpDate);
            const pc  = lead.priority ? PRIORITY_CFG[lead.priority] : null;
            return (
              <div key={lead._id}
                className="flex items-start justify-between gap-3 p-4 rounded-2xl flex-wrap"
                style={{
                  background: "white",
                  border: "1px solid #E8EDF3",
                  boxShadow: "0 1px 4px rgba(15,27,76,0.04)",
                }}>
                {/* Left: identity */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: "#EFF6FF", color: "#1E3A8A" }}>
                    {lead.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate"
                      style={{ fontFamily: "'Sora', sans-serif" }}>
                      {lead.fullName}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {lead.phone && (
                        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                          <Phone size={9} />{lead.phone}
                        </span>
                      )}
                      {lead.email && (
                        <span className="flex items-center gap-1 text-[11px] text-neutral-400 truncate max-w-[140px]">
                          <Mail size={9} />{lead.email}
                        </span>
                      )}
                    </div>
                    {lead.serviceName && (
                      <p className="text-[11px] text-neutral-400 mt-0.5 truncate">📋 {lead.serviceName}</p>
                    )}
                  </div>
                </div>

                {/* Right: badges + actions */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {/* Status */}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                  {/* Priority */}
                  {pc && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(100,116,139,0.08)", color: pc.color }}>
                      {pc.label}
                    </span>
                  )}
                  {/* Follow-up */}
                  {lead.followUpDate && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: fup.bg, color: fup.color }}>
                      <Calendar size={9} /> {fup.label}
                    </span>
                  )}
                  {/* Action menu */}
                  <ActionMenu lead={lead} onRefresh={loadData} />
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
