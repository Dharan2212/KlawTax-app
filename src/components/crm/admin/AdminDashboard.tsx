/**
 * AdminDashboard — Batch 3 (live API)
 *
 * All KPI data, project lists, and approval counts come from the backend.
 * No mock store data is used for business metrics.
 */

import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  fetchAdminDashboard,
  fetchProjects,
  fetchUsers,
  fetchApprovals,
  type AdminDashboard as AdminDashboardData,
  type ApiProject,
  type ApiApproval,
  type ApiUser,
} from "@/lib/crmApi";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import type { ReactNode } from "react";
import {
  Users, FolderKanban, CheckSquare, CreditCard,
  Calendar, Clock, AlertCircle, ArrowRight,
  Briefcase, TrendingUp, Zap,
  MessageSquare,
  FileCheck, Activity, BarChart2, Target, CheckCircle2,
  Loader2, RefreshCw,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────

function fmtCurrency(n: number) { return `₹${n.toLocaleString("en-IN")}`; }
function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

// ── Status config ──────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:          { bg: "rgba(100,116,139,0.10)", color: "#475569" },
  onboarding:     { bg: "rgba(124,58,237,0.10)",  color: "#6D28D9" },
  active:         { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  in_progress:    { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  waiting_client: { bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  in_review:      { bg: "rgba(20,184,166,0.10)",  color: "#0F766E" },
  completed:      { bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  delivered:      { bg: "rgba(22,163,74,0.15)",   color: "#14532D" },
  cancelled:      { bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
  archived:       { bg: "rgba(100,116,139,0.10)", color: "#475569" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", onboarding: "Onboarding", active: "Active",
  in_progress: "In Progress", waiting_client: "Waiting — Client",
  in_review: "Under Review", completed: "Completed",
  delivered: "Delivered", cancelled: "Cancelled", archived: "Archived",
};

// ── Sub-components ─────────────────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, count, action }: {
  icon: ReactNode; title: string; count?: number;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1E3A8A" }}>{count}</span>
        )}
      </div>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#1E3A8A" }}>
          {action.label}<ArrowRight size={11} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function EmptyMini({ message }: { message: string }) {
  return <p className="text-sm text-neutral-400 text-center py-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>{message}</p>;
}

function KpiCard({ icon, label, value, sub, accent, badge, onClick }: {
  icon: ReactNode; label: string; value: string | number; sub: string;
  accent: string; badge?: { text: string; alert?: boolean }; onClick?: () => void;
}) {
  return (
    <motion.button
      variants={staggerItem}
      onClick={onClick}
      className="rounded-2xl p-5 text-left transition-all duration-200 w-full"
      style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 6px 20px rgba(15,27,76,0.10)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 1px 4px rgba(15,27,76,0.05)"; }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15`, color: accent }}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-neutral-900 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>{value}</p>
      {badge ? (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.alert ? "rgba(220,38,38,0.10)" : "rgba(22,163,74,0.10)", color: badge.alert ? "#DC2626" : "#15803D" }}>
          {badge.text}
        </span>
      ) : (
        <p className="text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>
      )}
    </motion.button>
  );
}

function SkeletonBlock({ h = "h-32" }: { h?: string }) {
  return <div className={`rounded-2xl ${h} animate-pulse`} style={{ background: "#F1F5F9" }} />;
}

// ── Main Component ─────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [dash, setDash]           = useState<AdminDashboardData | null>(null);
  const [projects, setProjects]   = useState<ApiProject[]>([]);
  const [employees, setEmployees] = useState<ApiUser[]>([]);
  const [approvals, setApprovals] = useState<ApiApproval[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [dashData, projData, usersData, appData] = await Promise.all([
        fetchAdminDashboard(),
        fetchProjects({ limit: 20 }),
        fetchUsers("employee"),
        fetchApprovals("pending"),
      ]);
      setDash(dashData);
      setProjects(projData.projects ?? []);
      setEmployees(usersData ?? []);
      setApprovals(appData.approvals ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Derived from live data ──────────────────────────────────

  const activeCount   = dash?.activeProjectCount   ?? 0;
  const overdueCount  = dash?.overdueProjectCount  ?? 0;
  const stalledCount  = dash?.stalledProjectCount  ?? 0;
  const pendingCount  = dash?.pendingApprovalsCount ?? approvals.length;
  const leadsToday    = dash?.newLeadsToday         ?? 0;
  const revenueMonth  = dash?.revenueThisMonth      ?? 0;
  const revenueLastMo = dash?.revenueLastMonth      ?? 0;

  const revenueGrowth = revenueLastMo > 0
    ? Math.round(((revenueMonth - revenueLastMo) / revenueLastMo) * 100)
    : 0;

  // Upcoming deadlines from fetched projects
  const upcomingDeadlines = projects
    .filter((p) => !["completed", "cancelled", "archived"].includes(p.projectStatus ?? ""))
    .filter((p) => p.expectedDeliveryDate)
    .sort((a, b) => new Date(a.expectedDeliveryDate!).getTime() - new Date(b.expectedDeliveryDate!).getTime())
    .slice(0, 6);

  const overdueProjects = dash?.overdueProjects ?? projects.filter((p) => p.isOverdue);

  // Pipeline funnel from projects
  const pipelineGroups = {
    draft:          projects.filter((p) => p.projectStatus === "draft").length,
    onboarding:     projects.filter((p) => p.projectStatus === "onboarding").length,
    active:         projects.filter((p) => ["active", "in_progress"].includes(p.projectStatus ?? "")).length,
    waiting_client: projects.filter((p) => p.projectStatus === "waiting_client").length,
    in_review:      projects.filter((p) => p.projectStatus === "in_review").length,
    completed:      projects.filter((p) => p.projectStatus === "completed").length,
  };

  // Workload per employee
  const workloadMap = employees.map((emp) => {
    const assigned = projects.filter((p) => {
      const ae = p.assignedEmployees ?? [];
      return ae.some((a) => a.userId === emp._id) && !["completed", "cancelled"].includes(p.projectStatus ?? "");
    });
    return { emp, count: assigned.length };
  });

  // Recent timeline from dashboard
  const recentTimeline = dash?.recentTimelineEntries ?? [];

  // ── Error state ─────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load dashboard data.</p>
        <button onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-48 rounded-xl animate-pulse" style={{ background: "#F1F5F9" }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} h="h-28" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} h="h-20" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <SkeletonBlock h="h-64" />
          <SkeletonBlock h="h-64" />
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={16} style={{ color: "#1E3A8A" }} />
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Control Centre</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
            Admin Dashboard
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {overdueCount > 0 && (
            <button onClick={() => navigate("/crm/admin/projects")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.20)" }}>
              <AlertCircle size={11} strokeWidth={2.5} />{overdueCount} overdue
            </button>
          )}
          {pendingCount > 0 && (
            <button onClick={() => navigate("/crm/admin/approvals")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(217,119,6,0.10)", color: "#B45309", border: "1px solid rgba(217,119,6,0.20)" }}>
              <CheckSquare size={11} strokeWidth={2.5} />{pendingCount} approvals pending
            </button>
          )}
          <button onClick={loadData}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100 transition-colors"
            title="Refresh">
            <RefreshCw size={13} className="text-neutral-400" />
          </button>
        </div>
      </div>

      {/* KPI Row 1 */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<FolderKanban size={16} strokeWidth={2} />} label="Active Projects" accent="#6D28D9"
          value={activeCount} sub="currently running"
          badge={overdueCount > 0 ? { text: `${overdueCount} overdue`, alert: true } : { text: "All on track" }}
          onClick={() => navigate("/crm/admin/projects")}
        />
        <KpiCard
          icon={<CheckSquare size={16} strokeWidth={2} />} label="Pending Approvals" accent="#D97706"
          value={pendingCount} sub="requires review"
          badge={pendingCount > 0 ? { text: "Needs action", alert: true } : { text: "Queue clear" }}
          onClick={() => navigate("/crm/admin/approvals")}
        />
        <KpiCard
          icon={<CreditCard size={16} strokeWidth={2} />} label="Revenue This Month" accent="#15803D"
          value={fmtCurrency(revenueMonth)} sub={revenueLastMo > 0 ? `vs ${fmtCurrency(revenueLastMo)} last month` : "this month"}
          badge={{ text: revenueGrowth >= 0 ? `+${revenueGrowth}% vs last month` : `${revenueGrowth}% vs last month`, alert: revenueGrowth < 0 }}
          onClick={() => navigate("/crm/admin/payments")}
        />
        <KpiCard
          icon={<Users size={16} strokeWidth={2} />} label="New Leads Today" accent="#1E3A8A"
          value={leadsToday} sub="from website"
          badge={{ text: leadsToday > 0 ? `${leadsToday} new today` : "No new leads" }}
          onClick={() => navigate("/crm/admin/clients")}
        />
      </motion.div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Target size={15} />, label: "Completed", value: pipelineGroups.completed, sub: "projects", color: "#15803D", bg: "#DCFCE7" },
          { icon: <Activity size={15} />, label: "Stalled", value: stalledCount, sub: "no activity", color: "#6D28D9", bg: "#EDE9FE" },
          { icon: <CheckCircle2 size={15} />, label: "Pending Approvals", value: pendingCount, sub: "queue", color: "#D97706", bg: "#FEF3C7" },
          { icon: <TrendingUp size={15} />, label: "Last Month Revenue", value: fmtCurrency(revenueLastMo), sub: "previous period", color: "#1E3A8A", bg: "#EFF6FF" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: m.bg, color: m.color }}>
              {m.icon}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-neutral-900 leading-none" style={{ fontFamily: "'Sora', sans-serif" }}>{m.value}</p>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.label}</p>
              <p className="text-[10px] text-neutral-400">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Review Queue",  icon: <CheckSquare size={14} />, path: "/crm/admin/approvals", accent: "#D97706", badge: pendingCount },
          { label: "All Projects",  icon: <FolderKanban size={14} />, path: "/crm/admin/projects", accent: "#6D28D9", badge: 0 },
          { label: "Client List",   icon: <Users size={14} />,        path: "/crm/admin/clients",  accent: "#1E3A8A", badge: 0 },
          { label: "Payments",      icon: <CreditCard size={14} />,   path: "/crm/admin/payments", accent: "#15803D", badge: 0 },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 relative"
            style={{ background: `${a.accent}09`, border: `1px solid ${a.accent}20`, color: a.accent, fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.accent}14`; el.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.accent}09`; el.style.transform = "translateY(0)"; }}>
            {a.icon}{a.label}
            {a.badge > 0 && <span className="ml-auto text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: a.accent, color: "white" }}>{a.badge}</span>}
          </button>
        ))}
      </div>

      {/* Main row */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Upcoming deadlines */}
        <Card>
          <CardHeader icon={<Calendar size={14} strokeWidth={2} style={{ color: "#1E3A8A" }} />} title="Project Deadlines"
            action={{ label: "View all", onClick: () => navigate("/crm/admin/projects") }} />
          <div className="p-4 space-y-2">
            {upcomingDeadlines.length === 0 && <EmptyMini message="No active projects with deadlines" />}
            {upcomingDeadlines.map((p) => {
              const days = daysUntil(p.expectedDeliveryDate!);
              const overdue = p.isOverdue || days < 0;
              const sc = STATUS_COLORS[p.projectStatus ?? ""] ?? STATUS_COLORS.draft;
              return (
                <button key={p._id} onClick={() => navigate(`/crm/admin/projects/${p._id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl gap-3 text-left transition-colors hover:bg-neutral-50"
                  style={{ background: overdue ? "#FFF5F5" : "#F8FAFC", border: `1px solid ${overdue ? "#FED7D7" : "#E8EDF3"}` }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{p.title || p.projectCode}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{p.projectCode}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={sc}>
                      {STATUS_LABELS[p.projectStatus ?? ""] ?? p.projectStatus}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: overdue ? "rgba(220,38,38,0.10)" : days <= 3 ? "rgba(217,119,6,0.10)" : "rgba(100,116,139,0.08)", color: overdue ? "#DC2626" : days <= 3 ? "#B45309" : "#64748B" }}>
                      {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Pending approvals */}
        <Card>
          <CardHeader icon={<FileCheck size={14} strokeWidth={2} style={{ color: "#D97706" }} />} title="Pending Approvals"
            count={approvals.length} action={{ label: "Review all", onClick: () => navigate("/crm/admin/approvals") }} />
          <div className="p-4 space-y-2">
            {approvals.length === 0 && <EmptyMini message="No pending approvals" />}
            {approvals.slice(0, 6).map((a) => (
              <div key={a._id} className="flex items-center justify-between p-3 rounded-xl gap-3"
                style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-900 truncate">Approval #{a._id.slice(-6).toUpperCase()}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Submitted {fmtDateShort(a.submittedAt)}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                  style={{ background: "rgba(217,119,6,0.10)", color: "#B45309" }}>
                  Pending Review
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Team workload */}
        <Card>
          <CardHeader icon={<Briefcase size={14} strokeWidth={2} style={{ color: "#6D28D9" }} />} title="Team Workload" />
          <div className="p-4 space-y-2">
            {workloadMap.length === 0 && <EmptyMini message="No employees found" />}
            {workloadMap.map(({ emp, count }) => {
              const name = `${emp.firstName} ${emp.lastName}`;
              const workloadColor = count >= 4 ? "#DC2626" : count >= 2 ? "#B45309" : "#15803D";
              return (
                <div key={emp._id} className="p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #1E3A8A, #6D28D9)", fontFamily: "'Sora', sans-serif" }}>
                      {emp.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate">{name}</p>
                      <p className="text-[10px] text-neutral-400">{count} active project{count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E8EDF3" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (count / 5) * 100)}%`, background: workloadColor }} />
                    </div>
                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: workloadColor }}>{count} active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent activity from timeline */}
        <Card>
          <CardHeader icon={<Activity size={14} strokeWidth={2} style={{ color: "#2563EB" }} />} title="Recent Activity" />
          <div className="px-4 pt-3 pb-2 space-y-0">
            {recentTimeline.length === 0 && <EmptyMini message="No recent activity" />}
            {recentTimeline.slice(0, 8).map((entry) => (
              <div key={entry._id} className="flex items-start gap-2.5 py-2.5" style={{ borderBottom: "1px solid #F8FAFC" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#EFF6FF", color: "#1E3A8A" }}>
                  <MessageSquare size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-neutral-700 leading-snug line-clamp-2">{entry.title}</p>
                  {entry.content && <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{entry.content}</p>}
                </div>
                <span className="text-[10px] text-neutral-400 flex-shrink-0 whitespace-nowrap">{ageLabel(entry.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pipeline funnel */}
      <Card>
        <CardHeader icon={<TrendingUp size={14} strokeWidth={2} style={{ color: "#1E3A8A" }} />} title="Project Pipeline"
          action={{ label: "View all", onClick: () => navigate("/crm/admin/projects") }} />
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {[
              { label: "Draft",           value: pipelineGroups.draft,          color: "#64748B", bg: "#F1F5F9" },
              { label: "Onboarding",      value: pipelineGroups.onboarding,     color: "#6D28D9", bg: "#F5F3FF" },
              { label: "In Progress",     value: pipelineGroups.active,         color: "#1E3A8A", bg: "#EFF6FF" },
              { label: "Waiting Client",  value: pipelineGroups.waiting_client, color: "#B45309", bg: "#FEF3C7" },
              { label: "Under Review",    value: pipelineGroups.in_review,      color: "#0F766E", bg: "#CCFBF1" },
              { label: "Completed",       value: pipelineGroups.completed,      color: "#15803D", bg: "#DCFCE7" },
            ].map((f) => (
              <div key={f.label} className="text-center p-3 rounded-xl" style={{ background: f.bg }}>
                <p className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif", color: f.color }}>{f.value}</p>
                <p className="text-[10px] font-semibold mt-1" style={{ color: f.color, fontFamily: "'DM Sans', sans-serif" }}>{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Overdue alert */}
      {overdueProjects.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)" }}>
          <Zap size={16} strokeWidth={2} style={{ color: "#DC2626", flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#B91C1C", fontFamily: "'DM Sans', sans-serif" }}>
              {overdueProjects.length} project(s) are overdue
            </p>
            <p className="text-xs mt-0.5 text-neutral-500">Review and update timelines immediately.</p>
          </div>
          <button onClick={() => navigate("/crm/admin/projects")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "#DC2626", color: "white" }}>
            View Now
          </button>
        </div>
      )}
    </motion.div>
  );
}
