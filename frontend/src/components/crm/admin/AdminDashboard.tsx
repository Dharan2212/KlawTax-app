/**
 * AdminDashboard — Batch 5.1
 *
 * Full live-data admin dashboard using the new AdminDashboardResponse shape.
 * All metrics come from /api/v1/dashboard/admin and its section endpoints.
 * No mock data. No hardcoded numbers.
 */

import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  fetchAdminDashboard,
  type AdminDashboardResponse,
} from "@/lib/crmApi";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import type { ReactNode } from "react";
import {
  Users, FolderKanban, CheckSquare, CreditCard,
  Calendar, Clock, AlertCircle, ArrowRight,
  Briefcase, TrendingUp, Zap,
  MessageSquare, UserCheck,
  FileCheck, Activity, BarChart2, Target, CheckCircle2,
  Loader2, RefreshCw, IndianRupee, AlertTriangle,
  PhoneCall, ShieldCheck, Package, Bell,
} from "lucide-react";

// ── Formatters ─────────────────────────────────────────────────

/** Convert paise (integer) → ₹ display */
function fmtPaise(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(1)}Cr`;
  if (rupees >= 100_000)    return `₹${(rupees / 100_000).toFixed(1)}L`;
  if (rupees >= 1_000)      return `₹${(rupees / 1_000).toFixed(1)}K`;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

function fmtPaiseExact(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Design tokens ──────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, { text: string; bg: string }> = {
  urgent:   { text: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  high:     { text: "#B45309", bg: "rgba(217,119,6,0.10)" },
  medium:   { text: "#1E3A8A", bg: "rgba(37,99,235,0.10)" },
  low:      { text: "#64748B", bg: "rgba(100,116,139,0.10)" },
};

const STATUS_CHIP: Record<string, { text: string; bg: string }> = {
  new:          { text: "#1E3A8A", bg: "rgba(37,99,235,0.10)" },
  contacted:    { text: "#0F766E", bg: "rgba(20,184,166,0.10)" },
  qualified:    { text: "#6D28D9", bg: "rgba(109,40,217,0.10)" },
  proposal_sent:{ text: "#B45309", bg: "rgba(217,119,6,0.10)" },
  converted:    { text: "#15803D", bg: "rgba(22,163,74,0.10)" },
  lost:         { text: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  in_progress:  { text: "#1E3A8A", bg: "rgba(37,99,235,0.10)" },
  pending:      { text: "#B45309", bg: "rgba(217,119,6,0.10)" },
  under_review: { text: "#0F766E", bg: "rgba(20,184,166,0.10)" },
  open:         { text: "#6D28D9", bg: "rgba(109,40,217,0.10)" },
  captured:     { text: "#15803D", bg: "rgba(22,163,74,0.10)" },
  failed:       { text: "#DC2626", bg: "rgba(220,38,38,0.10)" },
};

function chip(key: string) {
  return STATUS_CHIP[key] ?? { text: "#64748B", bg: "rgba(100,116,139,0.10)" };
}

// ── Layout primitives ──────────────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}
    >
      {children}
    </div>
  );
}

function CardHead({
  icon, title, badge, action,
}: {
  icon: ReactNode;
  title: string;
  badge?: string | number;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{ borderBottom: "1px solid #F1F5F9" }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h2
          className="text-sm font-bold text-neutral-900"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {title}
        </h2>
        {badge !== undefined && Number(badge) > 0 && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "#EFF6FF", color: "#1E3A8A" }}
          >
            {badge}
          </span>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: "#1E3A8A" }}
        >
          {action.label}<ArrowRight size={11} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <p
      className="text-sm text-neutral-400 text-center py-8"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {msg}
    </p>
  );
}

function Skeleton({ h = "h-32" }: { h?: string }) {
  return <div className={`rounded-2xl ${h} animate-pulse`} style={{ background: "#F1F5F9" }} />;
}

// ── KPI card ───────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, accent, alert, onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  alert?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      variants={staggerItem}
      onClick={onClick}
      className="rounded-2xl p-5 text-left w-full transition-all duration-200"
      style={{ background: "white", border: `1px solid ${alert ? "rgba(220,38,38,0.25)" : "#E8EDF3"}`, boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 6px 20px rgba(15,27,76,0.10)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 1px 4px rgba(15,27,76,0.05)"; }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15`, color: accent }}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-neutral-900 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>{value}</p>
      {sub && <p className="text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>}
    </motion.button>
  );
}

// ── Bar chart pill (mini horizontal bar) ────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

// ── Period picker ──────────────────────────────────────────────

const PERIODS = [
  { key: "today",   label: "Today" },
  { key: "week",    label: "7d" },
  { key: "month",   label: "30d" },
  { key: "quarter", label: "90d" },
  { key: "year",    label: "1yr" },
] as const;

type Period = typeof PERIODS[number]["key"];

// ── Main ───────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [dash, setDash]     = useState<AdminDashboardResponse | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(() => {
    // Only show once per day
    const key = `reminder_dismissed_${new Date().toDateString()}`;
    return sessionStorage.getItem(key) === '1';
  });

  // Tracks whether the initial load has completed.
  // Using a ref avoids adding it to callback deps and prevents stale closures.
  const hasLoaded = useRef(false);

  // loadData is intentionally stable (empty deps array).
  // It receives the period as an explicit argument — never closes over state.
  const loadData = useCallback(async (target: Period) => {
    if (hasLoaded.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(false);
    try {
      const data = await fetchAdminDashboard({ period: target, limit: 8 });
      setDash(data);
      hasLoaded.current = true;
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // stable — no closure over changing state

  // Runs on mount and whenever the selected period changes.
  useEffect(() => { loadData(period); }, [period, loadData]);

  // Period picker only updates state; the effect above drives the fetch.
  function handlePeriod(p: Period) {
    setPeriod(p);
  }

  // ── Error state ──────────────────────────────────────────────

  if (error && !dash) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load dashboard.</p>
        <button
          onClick={() => loadData(period)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // ── Loading skeleton ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-48 rounded-xl animate-pulse" style={{ background: "#F1F5F9" }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} h="h-28" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} h="h-20" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <Skeleton h="h-72" /><Skeleton h="h-72" />
        </div>
        <div className="grid lg:grid-cols-3 gap-5">
          <Skeleton h="h-60" /><Skeleton h="h-60" /><Skeleton h="h-60" />
        </div>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────

  const rev    = dash!.revenue;
  const od     = dash!.overdueProjects;
  const pa     = dash!.pendingApprovals;
  const leads  = dash!.leads;
  const wl     = dash!.workload;
  const act    = dash!.recentActivity;
  const cs     = dash!.clientStats   ?? { totalClients: 0, activeClients: 0, newClientsToday: 0, newClientsMonth: 0, activeEmployees: 0 };
  const fu     = dash!.followUpCounts ?? { overdue: 0, today: 0, upcoming: 0, total: 0 };

  const totalActive = wl.totalActiveProjects;
  const overdueCount = od.total;
  const stalledCount = od.stalledCount;
  const pendingCount = pa.total;
  const conversionRate = leads.conversionRate;

  // Pipeline stages
  const pipelineData = [
    { label: "New Leads",    value: leads.byStatus.new,       color: "#1E3A8A", bg: "#EFF6FF" },
    { label: "Contacted",    value: leads.byStatus.contacted,  color: "#0F766E", bg: "#CCFBF1" },
    { label: "Qualified",    value: leads.byStatus.qualified,  color: "#6D28D9", bg: "#EDE9FE" },
    { label: "Proposal",     value: leads.byStatus.proposalSent, color: "#B45309", bg: "#FEF3C7" },
    { label: "Onboarding",   value: leads.byStatus.onboarding, color: "#D97706", bg: "#FEF3C7" },
    { label: "Converted",    value: leads.byStatus.converted,  color: "#15803D", bg: "#DCFCE7" },
  ];

  const taskData = [
    { label: "To Do",      value: wl.tasksByStatus.todo,       color: "#64748B" },
    { label: "In Progress",value: wl.tasksByStatus.inProgress,  color: "#1E3A8A" },
    { label: "In Review",  value: wl.tasksByStatus.inReview,    color: "#0F766E" },
    { label: "Blocked",    value: wl.tasksByStatus.blocked,     color: "#DC2626" },
    { label: "Completed",  value: wl.tasksByStatus.completed,   color: "#15803D" },
  ];
  const maxTasks = Math.max(...taskData.map((t) => t.value), 1);

  // ── Render ───────────────────────────────────────────────────

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={15} style={{ color: "#1E3A8A" }} />
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Control Centre</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
            Admin Dashboard
          </h1>
          <p className="text-neutral-400 text-xs mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {dash && (
              <span className="ml-2 text-neutral-300">· snapshot {new Date(dash.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period picker */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid #E8EDF3" }}>
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePeriod(p.key)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background: period === p.key ? "#1E3A8A" : "white",
                  color:      period === p.key ? "white"   : "#64748B",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Alert pills */}
          {overdueCount > 0 && (
            <button
              onClick={() => navigate("/crm/admin/projects")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.20)" }}
            >
              <AlertCircle size={11} strokeWidth={2.5} />{overdueCount} overdue
            </button>
          )}
          {pendingCount > 0 && (
            <button
              onClick={() => navigate("/crm/admin/approvals")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(217,119,6,0.10)", color: "#B45309", border: "1px solid rgba(217,119,6,0.20)" }}
            >
              <CheckSquare size={11} strokeWidth={2.5} />{pendingCount} pending
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={() => loadData(period)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={`text-neutral-400 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── KPI Row 1 — Revenue & Projects ── */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<IndianRupee size={15} strokeWidth={2} />}
          label="Revenue (Period)"
          value={fmtPaise(rev.periodCollected)}
          sub={`${fmtPaise(rev.totalCollected)} all time`}
          accent="#15803D"
          onClick={() => navigate("/crm/admin/payments")}
        />
        <KpiCard
          icon={<FolderKanban size={15} strokeWidth={2} />}
          label="Active Projects"
          value={totalActive}
          sub={`${overdueCount} overdue · ${stalledCount} stalled`}
          accent="#6D28D9"
          alert={overdueCount > 0}
          onClick={() => navigate("/crm/admin/projects")}
        />
        <KpiCard
          icon={<CheckSquare size={15} strokeWidth={2} />}
          label="Pending Approvals"
          value={pendingCount}
          sub={`${pa.underReview} in review · ${pa.revisionRequested} revision`}
          accent="#D97706"
          alert={pendingCount > 0}
          onClick={() => navigate("/crm/admin/approvals")}
        />
        <KpiCard
          icon={<Users size={15} strokeWidth={2} />}
          label="Leads (Period)"
          value={leads.periodNew}
          sub={`${leads.todayNew} today · ${conversionRate}% conversion`}
          accent="#1E3A8A"
          onClick={() => navigate("/crm/admin/clients")}
        />
      </motion.div>

      {/* ── KPI Row 2 — secondary metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: <CreditCard size={14} />,
            label: "This Month",
            value: fmtPaise(rev.monthCollected),
            color: "#15803D", bg: "#DCFCE7",
          },
          {
            icon: <AlertTriangle size={14} />,
            label: "Outstanding",
            value: fmtPaise(rev.byStatus.outstanding),
            color: "#B45309", bg: "#FEF3C7",
          },
          {
            icon: <Briefcase size={14} />,
            label: "Unassigned",
            value: wl.totalUnassignedProjects,
            color: "#6D28D9", bg: "#EDE9FE",
          },
          {
            icon: <Target size={14} />,
            label: "Conversion Rate",
            value: `${conversionRate}%`,
            color: "#1E3A8A", bg: "#EFF6FF",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: m.bg, color: m.color }}>
              {m.icon}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-neutral-900 leading-none" style={{ fontFamily: "'Sora', sans-serif" }}>{m.value}</p>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPI Row 3 — Client Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: <Users size={13} />,        label: "Total Clients",   value: cs.totalClients,    color: "#1E3A8A", bg: "#EFF6FF" },
          { icon: <UserCheck size={13} />,    label: "Active Clients",  value: cs.activeClients,   color: "#15803D", bg: "#DCFCE7" },
          { icon: <ShieldCheck size={13} />,  label: "Active Employees",value: cs.activeEmployees, color: "#6D28D9", bg: "#EDE9FE" },
          { icon: <Clock size={13} />,        label: "New (Today)",     value: cs.newClientsToday, color: "#0F766E", bg: "#CCFBF1" },
          { icon: <TrendingUp size={13} />,   label: "New (30 Days)",   value: cs.newClientsMonth, color: "#D97706", bg: "#FEF3C7" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-3 flex items-center gap-2.5"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 3px rgba(15,27,76,0.04)" }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: m.bg, color: m.color }}>
              {m.icon}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-neutral-900 leading-none" style={{ fontFamily: "'Sora', sans-serif" }}>{m.value}</p>
              <p className="text-[9px] font-semibold text-neutral-500 uppercase tracking-wide mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPI Row 4 — Follow-up Counts ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            icon: <AlertCircle size={14} />,
            label: "Overdue Follow-ups",
            value: fu.overdue,
            color: "#DC2626", bg: "#FEF2F2",
            alert: fu.overdue > 0,
            path: "/crm/admin/followups",
          },
          {
            icon: <Clock size={14} />,
            label: "Follow-ups Today",
            value: fu.today,
            color: "#B45309", bg: "#FEF3C7",
            alert: false,
            path: "/crm/admin/followups?bucket=today",
          },
          {
            icon: <Calendar size={14} />,
            label: "Upcoming (7 Days)",
            value: fu.upcoming,
            color: "#1E3A8A", bg: "#EFF6FF",
            alert: false,
            path: "/crm/admin/followups?bucket=upcoming",
          },
        ].map((m) => (
          <button
            key={m.label}
            onClick={() => navigate(m.path)}
            className="rounded-xl p-3.5 text-left transition-all duration-150 flex items-center gap-3"
            style={{
              background: "white",
              border: `1px solid ${m.alert ? "rgba(220,38,38,0.25)" : "#E8EDF3"}`,
              boxShadow: m.alert ? "0 2px 8px rgba(220,38,38,0.08)" : "0 1px 3px rgba(15,27,76,0.04)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(15,27,76,0.10)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = m.alert ? "0 2px 8px rgba(220,38,38,0.08)" : "0 1px 3px rgba(15,27,76,0.04)"; }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: m.bg, color: m.color }}>
              {m.icon}
            </div>
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: m.color, fontFamily: "'Sora', sans-serif" }}>{m.value}</p>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Approval Queue",    icon: <CheckSquare size={14} />, path: "/crm/admin/approvals",              accent: "#D97706", badge: pendingCount },
          { label: "All Projects",      icon: <FolderKanban size={14} />, path: "/crm/admin/projects",              accent: "#6D28D9", badge: 0 },
          { label: "Follow-ups",        icon: <Bell size={14} />,         path: "/crm/admin/followups",             accent: "#DC2626", badge: fu.overdue + fu.today },
          { label: "Payments",          icon: <CreditCard size={14} />,   path: "/crm/admin/payments",              accent: "#15803D", badge: 0 },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 relative"
            style={{ background: `${a.accent}09`, border: `1px solid ${a.accent}20`, color: a.accent, fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.accent}14`; el.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.accent}09`; el.style.transform = "translateY(0)"; }}
          >
            {a.icon}{a.label}
            {a.badge > 0 && (
              <span className="ml-auto text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: a.accent, color: "white" }}>
                {a.badge > 99 ? "99+" : a.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Login Reminder Popup ── */}
      {!reminderDismissed && (fu.overdue > 0 || fu.today > 0) && (
        <div
          className="relative flex items-start gap-4 p-4 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(30,58,138,0.04) 0%, rgba(124,58,237,0.04) 100%)",
            border: "1px solid rgba(30,58,138,0.15)",
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,58,138,0.10)", color: "#1E3A8A" }}>
            <Bell size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
              You have follow-ups waiting
            </p>
            <p className="text-xs text-neutral-500 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {fu.overdue > 0 && <span className="font-semibold" style={{ color: "#DC2626" }}>{fu.overdue} overdue</span>}
              {fu.overdue > 0 && fu.today > 0 && " · "}
              {fu.today > 0 && <span>{fu.today} due today</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/crm/admin/followups")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "#1E3A8A", color: "white" }}
            >
              Review Now
            </button>
            <button
              onClick={() => {
                sessionStorage.setItem(`reminder_dismissed_${new Date().toDateString()}`, '1');
                setReminderDismissed(true);
              }}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-600 px-2 py-1.5 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Payment Metrics Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Fully Paid",
            value: rev.invoiceCounts.paid,
            amount: fmtPaise(rev.byStatus.paid),
            color: "#15803D", bg: "#DCFCE7",
            icon: <CheckCircle2 size={13} />,
          },
          {
            label: "Partially Paid",
            value: rev.invoiceCounts.partiallyPaid,
            amount: fmtPaise(rev.byStatus.partiallyPaid),
            color: "#0F766E", bg: "#CCFBF1",
            icon: <CreditCard size={13} />,
          },
          {
            label: "Pending / Overdue",
            value: rev.invoiceCounts.overdue + (rev.invoiceCounts.total - rev.invoiceCounts.paid - rev.invoiceCounts.partiallyPaid - rev.invoiceCounts.overdue - rev.invoiceCounts.draft - rev.invoiceCounts.cancelled),
            amount: fmtPaise(rev.byStatus.outstanding),
            color: "#DC2626", bg: "#FEF2F2",
            icon: <AlertTriangle size={13} />,
          },
        ].map((m) => (
          <button
            key={m.label}
            onClick={() => navigate("/crm/admin/payments")}
            className="rounded-xl p-4 text-left transition-all duration-150"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 3px rgba(15,27,76,0.04)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(15,27,76,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(15,27,76,0.04)"; }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: m.bg, color: m.color }}>{m.icon}</div>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.label}</p>
            </div>
            <p className="text-xl font-bold leading-none" style={{ color: m.color, fontFamily: "'Sora', sans-serif" }}>{m.value}</p>
            <p className="text-xs text-neutral-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.amount}</p>
          </button>
        ))}
      </div>

      {/* ── Work Status Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Pending Work",
            value: wl.tasksByStatus.todo,
            sub: `${wl.totalUnassignedProjects} unassigned`,
            color: "#64748B", bg: "#F1F5F9",
            icon: <Clock size={13} />,
          },
          {
            label: "In Progress",
            value: wl.tasksByStatus.inProgress,
            sub: `${wl.inReviewProjects} in review`,
            color: "#1E3A8A", bg: "#EFF6FF",
            icon: <Activity size={13} />,
          },
          {
            label: "Completed",
            value: wl.tasksByStatus.completed,
            sub: `${wl.totalActiveProjects} active projects`,
            color: "#15803D", bg: "#DCFCE7",
            icon: <CheckCircle2 size={13} />,
          },
        ].map((m) => (
          <button
            key={m.label}
            onClick={() => navigate("/crm/admin/projects")}
            className="rounded-xl p-4 text-left transition-all duration-150"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 3px rgba(15,27,76,0.04)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(15,27,76,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(15,27,76,0.04)"; }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: m.bg, color: m.color }}>{m.icon}</div>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.label}</p>
            </div>
            <p className="text-xl font-bold leading-none" style={{ color: m.color, fontFamily: "'Sora', sans-serif" }}>{m.value}</p>
            <p className="text-xs text-neutral-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.sub}</p>
          </button>
        ))}
      </div>

      {/* ── Main content row ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Overdue projects */}
        <Card>
          <CardHead
            icon={<AlertCircle size={14} strokeWidth={2} style={{ color: "#DC2626" }} />}
            title="Overdue Projects"
            badge={od.total}
            action={{ label: "View all", onClick: () => navigate("/crm/admin/projects") }}
          />
          <div className="p-4 space-y-2">
            {od.preview.length === 0 && <Empty msg="No overdue projects 🎉" />}
            {od.preview.map((p) => {
              const pColor = PRIORITY_COLORS[p.priority] ?? PRIORITY_COLORS.low;
              return (
                <div
                  key={p.projectId}
                  className="flex items-center justify-between p-3 rounded-xl gap-3"
                  style={{ background: "rgba(220,38,38,0.03)", border: "1px solid rgba(220,38,38,0.12)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{p.projectNumber}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 capitalize">{p.status.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: pColor.bg, color: pColor.text }}>
                      {p.priority}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
                      {p.daysOverdue}d overdue
                    </span>
                  </div>
                </div>
              );
            })}
            {/* Age buckets summary */}
            {od.total > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {od.ageBuckets.map((b) => (
                  <div key={b.label} className="text-center p-2 rounded-lg" style={{ background: "#FFF5F5" }}>
                    <p className="text-sm font-bold" style={{ color: "#DC2626", fontFamily: "'Sora', sans-serif" }}>{b.count}</p>
                    <p className="text-[9px] text-neutral-400 mt-0.5">{b.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Pending approvals */}
        <Card>
          <CardHead
            icon={<FileCheck size={14} strokeWidth={2} style={{ color: "#D97706" }} />}
            title="Pending Approvals"
            badge={pa.total}
            action={{ label: "Review all", onClick: () => navigate("/crm/admin/approvals") }}
          />
          <div className="p-4 space-y-2">
            {/* Summary pills */}
            <div className="flex gap-2 flex-wrap mb-3">
              {[
                { label: "Pending",  count: pa.pending,           color: "#B45309" },
                { label: "Review",   count: pa.underReview,       color: "#0F766E" },
                { label: "Revision", count: pa.revisionRequested, color: "#6D28D9" },
              ].map((s) => s.count > 0 && (
                <span key={s.label} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${s.color}15`, color: s.color }}>
                  {s.count} {s.label}
                </span>
              ))}
            </div>
            {pa.preview.length === 0 && <Empty msg="No pending approvals" />}
            {pa.preview.map((a) => {
              const pc = PRIORITY_COLORS[a.priority] ?? PRIORITY_COLORS.low;
              return (
                <div key={a.approvalId} className="flex items-center justify-between p-3 rounded-xl gap-3"
                  style={{ background: "#FFFBF2", border: "1px solid rgba(217,119,6,0.15)" }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate capitalize">
                      {a.approvalType.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{a.daysPending}d pending</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {a.resubmissionCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
                        Rev. #{a.resubmissionCount}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: pc.bg, color: pc.text }}>
                      {a.priority}
                    </span>
                  </div>
                </div>
              );
            })}
            {/* Overdue-by-age */}
            {(pa.overdueByAge.overOneDayCount > 0) && (
              <div className="mt-2 p-2.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <Clock size={12} style={{ color: "#DC2626", flexShrink: 0 }} />
                <p className="text-[10px] text-neutral-600">
                  <b style={{ color: "#DC2626" }}>{pa.overdueByAge.overSevenDayCount}</b> unreviewed for 7+ days
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Second content row ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Lead funnel */}
        <Card>
          <CardHead
            icon={<TrendingUp size={14} strokeWidth={2} style={{ color: "#1E3A8A" }} />}
            title="Lead Funnel"
            action={{ label: "View leads", onClick: () => navigate("/crm/admin/clients") }}
          />
          <div className="p-4 space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {[
                { label: "Total",    value: leads.total,   color: "#1E3A8A" },
                { label: "Active",   value: leads.active,  color: "#6D28D9" },
                { label: "Today",    value: leads.todayNew, color: "#15803D" },
              ].map((s) => (
                <div key={s.label} className="text-center p-2.5 rounded-xl" style={{ background: "#F8FAFC" }}>
                  <p className="text-lg font-bold" style={{ color: s.color, fontFamily: "'Sora', sans-serif" }}>{s.value}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {pipelineData.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-neutral-600">{s.label}</p>
                </div>
                <MiniBar value={s.value} max={leads.total || 1} color={s.color} />
              </div>
            ))}
            {leads.followUpOverdue > 0 && (
              <div className="mt-2 p-2.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <PhoneCall size={11} style={{ color: "#DC2626" }} />
                <p className="text-[10px] text-neutral-600">
                  <b style={{ color: "#DC2626" }}>{leads.followUpOverdue}</b> follow-ups overdue
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Employee workload */}
        <Card>
          <CardHead
            icon={<Briefcase size={14} strokeWidth={2} style={{ color: "#6D28D9" }} />}
            title="Team Workload"
          />
          <div className="p-4 space-y-2">
            {wl.employeeWorkload.length === 0 && <Empty msg="No employee data" />}
            {wl.employeeWorkload.slice(0, 6).map((e) => {
              const load = e.activeProjects;
              const loadColor = load >= 5 ? "#DC2626" : load >= 3 ? "#B45309" : "#15803D";
              return (
                <div key={e.employeeId} className="p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #1E3A8A, #6D28D9)", fontFamily: "'Sora', sans-serif" }}>
                      {e.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate">{e.name}</p>
                    </div>
                    {e.overdueTasks > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
                        {e.overdueTasks} overdue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-neutral-500 mb-1.5">
                    <span>{e.activeProjects} projects</span>
                    <span>{e.activeTasks} tasks</span>
                    {e.blockedTasks > 0 && <span style={{ color: "#DC2626" }}>{e.blockedTasks} blocked</span>}
                  </div>
                  <MiniBar value={load} max={Math.max(...wl.employeeWorkload.map((x) => x.activeProjects), 1)} color={loadColor} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Task distribution */}
        <Card>
          <CardHead
            icon={<CheckCircle2 size={14} strokeWidth={2} style={{ color: "#15803D" }} />}
            title="Task Distribution"
          />
          <div className="p-4">
            {/* Summary numbers */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: "Total Active",  value: wl.totalActiveProjects,     color: "#1E3A8A", bg: "#EFF6FF" },
                { label: "In Review",     value: wl.inReviewProjects,         color: "#0F766E", bg: "#CCFBF1" },
                { label: "Blocked Tasks", value: wl.totalBlockedTasks,        color: "#DC2626", bg: "#FEF2F2" },
                { label: "Waiting Client",value: wl.waitingClientProjects,    color: "#B45309", bg: "#FEF3C7" },
              ].map((s) => (
                <div key={s.label} className="p-2.5 rounded-xl text-center" style={{ background: s.bg }}>
                  <p className="text-lg font-bold" style={{ color: s.color, fontFamily: "'Sora', sans-serif" }}>{s.value}</p>
                  <p className="text-[9px] font-semibold mt-0.5" style={{ color: s.color }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Task status bars */}
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Tasks by Status</p>
            <div className="space-y-2">
              {taskData.map((t) => (
                <div key={t.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[10px] font-semibold text-neutral-600">{t.label}</p>
                    <p className="text-[10px] text-neutral-400">{t.value}</p>
                  </div>
                  <MiniBar value={t.value} max={maxTasks} color={t.color} />
                </div>
              ))}
            </div>

            {wl.totalOverdueTasks > 0 && (
              <div className="mt-3 p-2.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <AlertTriangle size={11} style={{ color: "#DC2626" }} />
                <p className="text-[10px] text-neutral-600"><b style={{ color: "#DC2626" }}>{wl.totalOverdueTasks}</b> overdue tasks across all projects</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Revenue detail ── */}
      <Card>
        <CardHead
          icon={<IndianRupee size={14} strokeWidth={2} style={{ color: "#15803D" }} />}
          title="Revenue Breakdown"
          action={{ label: "Payments", onClick: () => navigate("/crm/admin/payments") }}
        />
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Collected (All Time)", value: fmtPaise(rev.totalCollected),     color: "#15803D", bg: "#DCFCE7" },
              { label: "Outstanding",          value: fmtPaise(rev.byStatus.outstanding),color: "#B45309", bg: "#FEF3C7" },
              { label: "Overdue Balance",      value: fmtPaise(rev.byStatus.overdue),    color: "#DC2626", bg: "#FEF2F2" },
              { label: "Disputed",             value: fmtPaise(rev.byStatus.disputed),   color: "#6D28D9", bg: "#EDE9FE" },
              { label: "Invoices Total",       value: rev.invoiceCounts.total,           color: "#1E3A8A", bg: "#EFF6FF" },
            ].map((r) => (
              <div key={r.label} className="p-3 rounded-xl text-center" style={{ background: r.bg }}>
                <p className="text-lg font-bold" style={{ color: r.color, fontFamily: "'Sora', sans-serif" }}>{r.value}</p>
                <p className="text-[9px] font-semibold mt-0.5" style={{ color: r.color }}>{r.label}</p>
              </div>
            ))}
          </div>
          {/* Invoice status breakdown */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: "Paid",          count: rev.invoiceCounts.paid,          color: "#15803D" },
              { label: "Partial",       count: rev.invoiceCounts.partiallyPaid, color: "#0F766E" },
              { label: "Overdue",       count: rev.invoiceCounts.overdue,       color: "#DC2626" },
              { label: "Disputed",      count: rev.invoiceCounts.disputed,      color: "#6D28D9" },
              { label: "Draft",         count: rev.invoiceCounts.draft,         color: "#64748B" },
              { label: "Cancelled",     count: rev.invoiceCounts.cancelled,     color: "#94A3B8" },
            ].filter((s) => s.count > 0).map((s) => (
              <span key={s.label} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${s.color}12`, color: s.color }}>
                {s.count} {s.label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Recent activity ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent leads */}
        <Card>
          <CardHead
            icon={<UserCheck size={14} strokeWidth={2} style={{ color: "#1E3A8A" }} />}
            title="Recent Leads"
            action={{ label: "All leads", onClick: () => navigate("/crm/admin/clients") }}
          />
          <div className="px-4 pt-3 pb-2 space-y-0">
            {act.leads.length === 0 && <Empty msg="No recent leads" />}
            {act.leads.slice(0, 6).map((l) => {
              const c = chip(l.status);
              return (
                <div key={l.leadId} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: "1px solid #F8FAFC" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #6D28D9 100%)", fontFamily: "'Sora', sans-serif" }}>
                    {l.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-neutral-900 truncate">{l.fullName}</p>
                    <p className="text-[10px] text-neutral-400">{l.phone}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: c.bg, color: c.text }}>
                      {l.status}
                    </span>
                    <span className="text-[10px] text-neutral-300">{ageLabel(l.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent payments */}
        <Card>
          <CardHead
            icon={<CreditCard size={14} strokeWidth={2} style={{ color: "#15803D" }} />}
            title="Recent Payments"
            action={{ label: "All payments", onClick: () => navigate("/crm/admin/payments") }}
          />
          <div className="px-4 pt-3 pb-2 space-y-0">
            {act.payments.length === 0 && <Empty msg="No recent payments" />}
            {act.payments.slice(0, 6).map((p) => {
              const c = chip(p.status);
              return (
                <div key={p.paymentId} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: "1px solid #F8FAFC" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#DCFCE7", color: "#15803D" }}>
                    <CreditCard size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-neutral-900">{fmtPaiseExact(p.amountPaise)}</p>
                    <p className="text-[10px] text-neutral-400 capitalize">{p.method.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: c.bg, color: c.text }}>
                      {p.status}
                    </span>
                    <span className="text-[10px] text-neutral-300">{ageLabel(p.initiatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Recent support + project activity ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent projects */}
        <Card>
          <CardHead
            icon={<Activity size={14} strokeWidth={2} style={{ color: "#2563EB" }} />}
            title="Recent Project Activity"
            action={{ label: "All projects", onClick: () => navigate("/crm/admin/projects") }}
          />
          <div className="px-4 pt-3 pb-2 space-y-0">
            {act.projects.length === 0 && <Empty msg="No recent project activity" />}
            {act.projects.slice(0, 6).map((p) => {
              const c = chip(p.status);
              return (
                <div key={p.projectId} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: "1px solid #F8FAFC" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF", color: "#1E3A8A" }}>
                    <FolderKanban size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-neutral-900 truncate">{p.projectNumber}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: c.bg, color: c.text }}>
                      {p.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-neutral-300">{ageLabel(p.updatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent support tickets */}
        <Card>
          <CardHead
            icon={<MessageSquare size={14} strokeWidth={2} style={{ color: "#6D28D9" }} />}
            title="Recent Support Tickets"
          />
          <div className="px-4 pt-3 pb-2 space-y-0">
            {act.support.length === 0 && <Empty msg="No recent support tickets" />}
            {act.support.slice(0, 6).map((t) => {
              const pc = PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.low;
              return (
                <div key={t.ticketId} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: "1px solid #F8FAFC" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#EDE9FE", color: "#6D28D9" }}>
                    <MessageSquare size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-neutral-900 truncate">{t.subject}</p>
                    <p className="text-[10px] text-neutral-400">#{t.ticketNumber}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: pc.bg, color: pc.text }}>
                      {t.priority}
                    </span>
                    <span className="text-[10px] text-neutral-300">{ageLabel(t.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Overdue alert banner ── */}
      {overdueCount > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)" }}
        >
          <Zap size={16} strokeWidth={2} style={{ color: "#DC2626", flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#B91C1C", fontFamily: "'DM Sans', sans-serif" }}>
              {overdueCount} project{overdueCount !== 1 ? "s" : ""} are overdue · {stalledCount} stalled
            </p>
            <p className="text-xs mt-0.5 text-neutral-500">Review and update timelines to unblock delivery.</p>
          </div>
          <button
            onClick={() => navigate("/crm/admin/projects")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "#DC2626", color: "white" }}
          >
            View Now
          </button>
        </div>
      )}

    </motion.div>
  );
}
