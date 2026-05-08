import { useCRMStore } from "@/store/useCRMStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import type { ReactNode } from "react";
import {
  Users, FolderKanban, CheckSquare, CreditCard,
  Calendar, Clock, AlertCircle, ArrowRight,
  Briefcase, TrendingUp, Zap,
  Phone, Mail, MessageCircle, MessageSquare,
} from "lucide-react";

const isOverdue = (deadline: string, status: string) =>
  status !== "completed" && status !== "rejected" && new Date(deadline) < new Date();

function fmtCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const CHANNEL_CFG: Record<string, { icon: ReactNode; color: string }> = {
  whatsapp: { icon: <MessageCircle size={12} strokeWidth={2} />, color: "#16A34A" },
  call:     { icon: <Phone size={12} strokeWidth={2} />,         color: "#2563EB" },
  email:    { icon: <Mail size={12} strokeWidth={2} />,          color: "#7C3AED" },
  note:     { icon: <MessageSquare size={12} strokeWidth={2} />, color: "#64748B" },
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:          { bg: "rgba(100,116,139,0.10)", color: "#475569" },
  active:           { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  "waiting-client": { bg: "rgba(124,58,237,0.10)",  color: "#6D28D9" },
  review:           { bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  completed:        { bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  rejected:         { bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", active: "In Progress", "waiting-client": "Waiting — Client",
  review: "Under Review", completed: "Completed", rejected: "Rejected",
};

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
        <button onClick={action.onClick}
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: "#1E3A8A" }}>
          {action.label}<ArrowRight size={11} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function EmptyMini({ message }: { message: string }) {
  return <p className="text-sm text-neutral-400 text-center py-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>{message}</p>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const clients          = useCRMStore((s) => s.clients);
  const projects         = useCRMStore((s) => s.projects);
  const submissions      = useCRMStore((s) => s.clientSubmissions);
  const payments         = useCRMStore((s) => s.payments);
  const users            = useCRMStore((s) => s.users);
  const communicationLog = useCRMStore((s) => s.communicationLog);
  const tasks            = useCRMStore((s) => s.tasks);

  const activeProjects   = projects.filter((p) => ["active", "waiting-client", "review"].includes(p.status));
  const pendingApprovals = submissions.filter((s) => s.status === "pending");
  const overdueProjects  = projects.filter((p) => isOverdue(p.deadline, p.status));
  const employees        = users.filter((u) => u.role === "employee");
  const totalCollected   = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPending     = payments.filter((p) => ["pending", "partial", "overdue"].includes(p.status))
                             .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  const overduePayments  = payments.filter((p) => p.status === "overdue");

  const getUserName   = (id: string | null) => !id ? "Unassigned" : users.find((u) => u.id === id)?.name ?? "Unassigned";
  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown";

  const stats = [
    { icon: <Users size={17} strokeWidth={2} />,        label: "Total Clients",       value: clients.length,           sub: `${clients.filter((c) => c.status === "active").length} active`,      accent: "#1E3A8A", subAlert: false, path: "/crm/admin/clients" },
    { icon: <FolderKanban size={17} strokeWidth={2} />, label: "Active Projects",     value: activeProjects.length,    sub: overdueProjects.length > 0 ? `${overdueProjects.length} overdue` : "all on track", accent: "#6D28D9", subAlert: overdueProjects.length > 0, path: "/crm/admin/projects" },
    { icon: <CheckSquare size={17} strokeWidth={2} />,  label: "Pending Approvals",   value: pendingApprovals.length,  sub: pendingApprovals.length > 0 ? "requires action" : "queue clear",     accent: "#D97706", subAlert: pendingApprovals.length > 0, path: "/crm/admin/approvals" },
    { icon: <CreditCard size={17} strokeWidth={2} />,   label: "Revenue Collected",   value: fmtCurrency(totalCollected), sub: `${fmtCurrency(totalPending)} pending`,                           accent: "#15803D", subAlert: false, path: "/crm/admin/payments" },
  ];

  const activityFeed = communicationLog
    .map((c) => ({ id: c.id, date: c.date, from: c.from, channel: c.channel as string, message: c.message, clientName: getClientName(c.clientId) }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
            Admin Dashboard
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {overdueProjects.length > 0 && (
            <button onClick={() => navigate("/crm/admin/projects")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.20)" }}>
              <AlertCircle size={11} strokeWidth={2.5} />{overdueProjects.length} overdue
            </button>
          )}
          {overduePayments.length > 0 && (
            <button onClick={() => navigate("/crm/admin/payments")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(217,119,6,0.10)", color: "#B45309", border: "1px solid rgba(217,119,6,0.20)" }}>
              <Clock size={11} strokeWidth={2.5} />{overduePayments.length} overdue payment{overduePayments.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.button key={s.label} variants={staggerItem} onClick={() => navigate(s.path)}
            className="rounded-2xl p-5 text-left transition-all duration-200 w-full"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(15,27,76,0.10)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(15,27,76,0.05)"; }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-neutral-500 uppercase" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.07em" }}>{s.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.accent}15`, color: s.accent }}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-neutral-900 mb-0.5" style={{ fontFamily: "'Sora', sans-serif" }}>{s.value}</p>
            <p className="text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: s.subAlert ? "#B45309" : "#94A3B8" }}>{s.sub}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Review Queue",  icon: <CheckSquare size={14} strokeWidth={2} />, path: "/crm/admin/approvals", accent: "#D97706", badge: pendingApprovals.length },
          { label: "All Projects",  icon: <FolderKanban size={14} strokeWidth={2} />,path: "/crm/admin/projects",  accent: "#6D28D9", badge: 0 },
          { label: "Manage Clients",icon: <Users size={14} strokeWidth={2} />,       path: "/crm/admin/clients",   accent: "#1E3A8A", badge: 0 },
          { label: "Payments",      icon: <CreditCard size={14} strokeWidth={2} />,  path: "/crm/admin/payments",  accent: "#15803D", badge: overduePayments.length },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 relative"
            style={{ background: `${a.accent}09`, border: `1px solid ${a.accent}20`, color: a.accent, fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${a.accent}14`; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${a.accent}09`; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
            {a.icon}{a.label}
            {a.badge > 0 ? <span className="ml-auto text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: a.accent, color: "white" }}>{a.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Main row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Deadlines */}
        <Card>
          <CardHeader icon={<Calendar size={14} strokeWidth={2} style={{ color: "#1E3A8A" }} />} title="Upcoming Deadlines" action={{ label: "View all", onClick: () => navigate("/crm/admin/projects") }} />
          <div className="p-4 space-y-2">
            {projects.filter((p) => !["completed", "rejected"].includes(p.status)).length === 0 && <EmptyMini message="No active projects" />}
            {projects.filter((p) => !["completed", "rejected"].includes(p.status))
              .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
              .slice(0, 5).map((p) => {
                const overdue = isOverdue(p.deadline, p.status);
                const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS.pending;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl gap-3"
                    style={{ background: overdue ? "#FFF5F5" : "#F8FAFC", border: `1px solid ${overdue ? "#FED7D7" : "#E8EDF3"}` }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-neutral-900 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-neutral-400 truncate">{getClientName(p.clientId)}</p>
                        <span className="text-[10px] text-neutral-300">·</span>
                        <p className="text-[10px] text-neutral-400 truncate">{getUserName(p.assignedTo)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={sc}>{STATUS_LABELS[p.status] ?? p.status}</span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: overdue ? "rgba(220,38,38,0.10)" : "rgba(217,119,6,0.10)", color: overdue ? "#DC2626" : "#B45309" }}>
                        {overdue ? <AlertCircle size={9} strokeWidth={2.5} /> : <Clock size={9} strokeWidth={2.5} />}
                        {fmtDate(p.deadline)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Submissions */}
        <Card>
          <CardHeader icon={<CheckSquare size={14} strokeWidth={2} style={{ color: "#D97706" }} />} title="Recent Submissions" count={pendingApprovals.length} action={{ label: "Review all", onClick: () => navigate("/crm/admin/approvals") }} />
          <div className="p-4 space-y-2">
            {submissions.length === 0 && <EmptyMini message="No submissions yet" />}
            {submissions.slice().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl gap-3"
                style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-900 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.title ?? s.description}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{getClientName(s.clientId)} · {fmtDateShort(s.submittedAt)}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                  style={{ background: s.status === "approved" ? "rgba(22,163,74,0.10)" : s.status === "rejected" ? "rgba(220,38,38,0.10)" : "rgba(217,119,6,0.10)", color: s.status === "approved" ? "#15803D" : s.status === "rejected" ? "#DC2626" : "#B45309", fontFamily: "'DM Sans', sans-serif" }}>
                  {s.status === "approved" ? "Approved" : s.status === "rejected" ? "Rejected" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Payments */}
        <Card>
          <CardHeader icon={<CreditCard size={14} strokeWidth={2} style={{ color: "#15803D" }} />} title="Payment Summary" action={{ label: "Manage", onClick: () => navigate("/crm/admin/payments") }} />
          <div className="p-4 space-y-2">
            {[
              { label: "Collected",    value: fmtCurrency(totalCollected),  bg: "rgba(22,163,74,0.07)",  border: "rgba(22,163,74,0.18)",  color: "#15803D" },
              { label: "Pending",      value: fmtCurrency(totalPending),    bg: "rgba(217,119,6,0.07)",  border: "rgba(217,119,6,0.18)",  color: "#B45309" },
              { label: "Overdue",      value: fmtCurrency(overduePayments.reduce((s, p) => s + (p.amount - p.paidAmount), 0)), bg: "rgba(220,38,38,0.07)", border: "rgba(220,38,38,0.18)", color: "#DC2626" },
              { label: "Total Billed", value: fmtCurrency(payments.reduce((s, p) => s + p.amount, 0)), bg: "rgba(37,99,235,0.07)", border: "rgba(37,99,235,0.18)", color: "#1E3A8A" },
            ].map(({ label, value, bg, border, color }) => (
              <div key={label} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: bg, border: `1px solid ${border}` }}>
                <p className="text-xs text-neutral-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
                <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader icon={<Briefcase size={14} strokeWidth={2} style={{ color: "#6D28D9" }} />} title="Team Overview" />
          <div className="p-4 space-y-2">
            {employees.length === 0 && <EmptyMini message="No employees yet" />}
            {employees.map((emp) => {
              const assigned = projects.filter((p) => p.assignedTo === emp.id && !["completed", "rejected"].includes(p.status));
              const completedCount = projects.filter((p) => p.assignedTo === emp.id && p.status === "completed").length;
              const empTasks = tasks.filter((t) => t.assignedTo === emp.id && t.status !== "done");
              return (
                <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #1E3A8A, #6D28D9)", fontFamily: "'Sora', sans-serif" }}>
                    {emp.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{emp.name}</p>
                    <p className="text-[10px] text-neutral-400">{assigned.length} active · {completedCount} done · {empTasks.length} tasks</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader icon={<TrendingUp size={14} strokeWidth={2} style={{ color: "#2563EB" }} />} title="Recent Activity" />
          <div className="p-4 space-y-0">
            {activityFeed.length === 0 && <EmptyMini message="No activity yet" />}
            {activityFeed.map((a) => {
              const ch = CHANNEL_CFG[a.channel] ?? CHANNEL_CFG.note;
              return (
                <div key={a.id} className="flex items-start gap-2.5 py-2.5" style={{ borderBottom: "1px solid #F8FAFC" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${ch.color}15`, color: ch.color }}>{ch.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-700 leading-snug line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{a.message}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{a.from} · {a.clientName} · {fmtDateShort(a.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Unassigned alert */}
      {projects.filter((p) => !p.assignedTo && p.status === "pending").length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)" }}>
          <Zap size={16} strokeWidth={2} style={{ color: "#D97706", flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#92400E", fontFamily: "'DM Sans', sans-serif" }}>
              {projects.filter((p) => !p.assignedTo && p.status === "pending").length} project(s) awaiting employee assignment
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
              {projects.filter((p) => !p.assignedTo && p.status === "pending").map((p) => p.title).join(" · ")}
            </p>
          </div>
          <button onClick={() => navigate("/crm/admin/projects")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: "#D97706", color: "white" }}>
            Assign Now
          </button>
        </div>
      )}
    </motion.div>
  );
}
