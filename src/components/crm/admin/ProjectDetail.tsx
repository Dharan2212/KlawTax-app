import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCRMStore } from "@/store/useCRMStore";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import { GroupedTimeline } from "@/components/crm/shared/TimelineItem";
import type { TimelineEntry as TLEntry } from "@/components/crm/shared/TimelineItem";
import type { LucideIcon } from "lucide-react";

import {
  ArrowLeft, Calendar, User, CircleCheck, CircleDot, Circle,
  Upload, Check, X, Clock, AlertTriangle, Loader2,
  CheckCircle2, FileText, MessageSquare, CreditCard,
  ChevronDown, Send, Activity,
} from "lucide-react";

const isOverdue = (deadline: string, status: string) =>
  status !== "completed" && new Date(deadline) < new Date();

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

type ProjectStatus = "pending" | "active" | "waiting-client" | "review" | "completed" | "rejected";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: "Not Started",  color: "#64748B", bg: "rgba(100,116,139,0.10)" },
  "waiting-client": { label: "Waiting — Client", color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  rejected:    { label: "Rejected",     color: "#DC2626", bg: "rgba(220,38,38,0.10)"   },
  active:      { label: "In Progress",  color: "#2563EB", bg: "rgba(37,99,235,0.10)"  },
  review:      { label: "Under Review", color: "#D97706", bg: "rgba(217,119,6,0.10)"  },
  completed:   { label: "Completed",    color: "#16A34A", bg: "rgba(22,163,74,0.10)"  },
};

type TabType = "overview" | "tasks" | "submissions" | "updates";

const TABS: { key: TabType; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "tasks", label: "Tasks", icon: CircleDot },
  { key: "submissions", label: "Submissions", icon: FileText },
  { key: "updates", label: "Updates", icon: MessageSquare },
];

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState("");

  const project       = useCRMStore((s) => s.projects.find((p) => p.id === projectId));
  const client        = useCRMStore((s) => s.clients.find((c) => c.id === project?.clientId));
  const assignedUser  = useCRMStore((s) => s.users.find((u) => u.id === project?.assignedTo));
  const tasks         = useCRMStore((s) => s.tasks.filter((t) => t.projectId === projectId));
  const updates       = useCRMStore((s) => s.updates.filter((u) => u.projectId === projectId));
  const submissions   = useCRMStore((s) => s.clientSubmissions.filter((s) => s.projectId === projectId));
  const payments      = useCRMStore((s) => s.payments.filter((p) => p.projectId === projectId));
  const updateTaskStatus = useCRMStore((s) => s.updateTaskStatus);
  const approveSubmission = useCRMStore((s) => s.approveSubmission);
  const rejectSubmission  = useCRMStore((s) => s.rejectSubmission);
  const addUpdate         = useCRMStore((s) => s.addUpdate);
  const currentUserId     = useCRMStore((s) => s.currentUserId);

  if (!project) {
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="text-center py-20">
        <Circle size={40} strokeWidth={1.5} className="mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground font-medium">Project not found</p>
        <button onClick={() => navigate("/crm/admin/projects")}
          className="mt-3 text-sm text-primary hover:underline">
          ← Back to projects
        </button>
      </motion.div>
    );
  }

  const overdue       = isOverdue(project.deadline, project.status);
  const pendingSubs   = submissions.filter((s) => s.status === "pending");
  const doneTasks     = tasks.filter((t) => t.status === "done").length;
  const paidPayments  = payments.filter((p) => p.status === "paid");
  const totalPaid     = paidPayments.reduce((s, p) => s + p.amount, 0);
  const totalDue      = payments.reduce((s, p) => s + p.amount, 0);
  const cfg           = STATUS_CONFIG[project.status as ProjectStatus] ?? STATUS_CONFIG.pending;

  const handleSendUpdate = () => {
    if (!updateMessage.trim()) return;
    addUpdate({
      projectId: project.id,
      from: currentUserId || "u1",
      fromType: "admin",
      message: updateMessage.trim(),
      date: new Date().toISOString().split("T")[0],
      visibleToClient: true,
    });
    setUpdateMessage("");
  };

  // Build timeline entries for GroupedTimeline
  const timelineEntries: TLEntry[] = [
    {
      id: "deadline",
      date: project.deadline,
      type: "deadline" as const,
      label: "Project deadline",
      actor: undefined,
      isMilestone: true,
    },
    ...updates.slice().map((u) => ({
      id: u.id,
      date: u.date,
      type: u.fromType as TLEntry["type"],
      label: u.message,
      actor: u.from || undefined,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {/* Back link */}
      <button
        onClick={() => navigate("/crm/admin/projects")}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline mb-5 transition-opacity hover:opacity-80"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        Back to projects
      </button>

      {/* ── Project header card ── */}
      <div
        className="rounded-2xl p-6 mb-5"
        style={{
          background: "hsl(var(--color-white))",
          border: `1.5px solid ${overdue ? "rgba(239,68,68,0.30)" : "hsl(var(--color-neutral-200))"}`,
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">
                #{project.id}
              </span>
              {/* Status badge */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {project.status === "active" && <Loader2 size={11} strokeWidth={2.5} />}
                {project.status === "review"      && <Clock size={11} strokeWidth={2.5} />}
                {project.status === "completed"   && <CheckCircle2 size={11} strokeWidth={2.5} />}
                {project.status === "pending" && <Circle size={11} strokeWidth={2.5} />}
                {cfg.label}
              </span>
              {overdue && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(239,68,68,0.10)", color: "#DC2626" }}>
                  <AlertTriangle size={11} strokeWidth={2.5} /> Overdue
                </span>
              )}
              {pendingSubs.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(217,119,6,0.10)", color: "#D97706" }}>
                  {pendingSubs.length} awaiting review
                </span>
              )}
            </div>
            <h1 className="font-bold text-lg text-foreground leading-snug"
              style={{ fontFamily: "'Sora', sans-serif" }}>
              {project.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{client?.name || "Unknown client"}</p>
          </div>

          {/* Status selector */}
          <StatusSelector projectId={project.id} current={project.status as ProjectStatus} />
        </div>

        {/* Meta grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4"
          style={{ borderTop: "1px solid hsl(var(--color-neutral-100))" }}
        >
          <MetaCell label="Assigned To"   value={assignedUser?.name || "Unassigned"} icon={<User size={13} strokeWidth={2} />} />
          <MetaCell label="Deadline"      value={fmtDate(project.deadline)}         icon={<Calendar size={13} strokeWidth={2} />} danger={overdue} />
          <MetaCell label="Tasks"         value={`${doneTasks} / ${tasks.length} done`} icon={<CircleCheck size={13} strokeWidth={2} />} />
          <MetaCell label="Payments"      value={`${fmtCurrency(totalPaid)} / ${fmtCurrency(totalDue)}`} icon={<CreditCard size={13} strokeWidth={2} />} />
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Overall progress</span>
            <span className="text-xs font-mono font-semibold" style={{ color: "#2563EB" }}>{project.progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--color-neutral-100))" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${project.progress}%`,
                background: overdue
                  ? "linear-gradient(90deg, #DC2626, #EF4444)"
                  : project.status === "completed"
                    ? "linear-gradient(90deg, #16A34A, #22C55E)"
                    : "linear-gradient(90deg, #1E3A8A, #7C3AED)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex gap-0.5 p-1 rounded-xl mb-5"
        style={{ background: "hsl(var(--color-neutral-100))" }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const badgeCount =
            tab.key === "submissions" ? pendingSubs.length :
            tab.key === "tasks"       ? tasks.filter((t) => t.status !== "done").length : 0;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: isActive ? "hsl(var(--color-white))" : "transparent",
                color: isActive ? "hsl(var(--color-foreground))" : "hsl(var(--color-muted-foreground))",
                boxShadow: isActive ? "var(--shadow-sm)" : "none",
              }}
            >
              <Icon size={14} strokeWidth={2} />
              {tab.label}
              {badgeCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={{
                    background: tab.key === "submissions" ? "rgba(217,119,6,0.15)" : "rgba(37,99,235,0.10)",
                    color: tab.key === "submissions" ? "#D97706" : "#2563EB",
                  }}>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid gap-5">
              {/* Client + payment summary side by side */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Client card */}
                <SectionCard title="Client" icon={<User size={14} strokeWidth={2} />}>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground text-sm">{client?.name}</p>
                    <p className="text-xs text-muted-foreground">{client?.email}</p>
                    <p className="text-xs text-muted-foreground">{client?.phone}</p>
                    <ServiceBadge label={client?.service || ""} />
                  </div>
                </SectionCard>

                {/* Payment summary */}
                <SectionCard title="Payments" icon={<CreditCard size={14} strokeWidth={2} />}>
                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {payments.map((pay) => (
                        <div key={pay.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground capitalize">{pay.type} payment</p>
                            <p className="text-xs text-muted-foreground">{fmtDate(pay.dueDate || pay.paidDate || "")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-semibold text-foreground">{fmtCurrency(pay.amount)}</p>
                            <PaymentBadge status={pay.status} />
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 mt-2" style={{ borderTop: "1px solid hsl(var(--color-neutral-100))" }}>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Total collected</span>
                          <span className="text-sm font-mono font-bold" style={{ color: "#16A34A" }}>{fmtCurrency(totalPaid)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Activity timeline */}
              <SectionCard title="Activity Timeline" icon={<Activity size={14} strokeWidth={2} />}>
                <GroupedTimeline
                  entries={timelineEntries}
                  emptyMessage="No activity recorded yet."
                />
              </SectionCard>
            </div>
          )}

          {/* TASKS */}
          {activeTab === "tasks" && (
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <EmptyTabState icon={<CircleDot size={28} strokeWidth={1.5} />} message="No tasks assigned to this project" />
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      variants={staggerItem}
                      className="rounded-xl border flex items-center gap-3 p-4 transition-all"
                      style={{
                        background: task.status === "done" ? "hsl(var(--color-neutral-50))" : "hsl(var(--color-white))",
                        borderColor: "hsl(var(--color-neutral-200))",
                        opacity: task.status === "done" ? 0.7 : 1,
                      }}
                    >
                      {/* Status icon */}
                      {task.status === "done"        && <CircleCheck size={18} strokeWidth={2} style={{ color: "#16A34A", flexShrink: 0 }} />}
                      {task.status === "active" && <CircleDot   size={18} strokeWidth={2} style={{ color: "#2563EB", flexShrink: 0 }} />}
                      {task.status === "todo"        && <Circle      size={18} strokeWidth={2} className="text-muted-foreground flex-shrink-0" />}

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}
                          style={{ fontFamily: "'DM Sans', sans-serif" }}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <PriorityBadge priority={task.priority as "high" | "medium" | "low"} />
                        </div>
                      </div>

                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as typeof task.status)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        <option value="todo">To Do</option>
                        <option value="active">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* SUBMISSIONS */}
          {activeTab === "submissions" && (
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <EmptyTabState icon={<FileText size={28} strokeWidth={1.5} />} message="No submissions for this project" />
              ) : (
                <>
                  {/* Pending first */}
                  {pendingSubs.length > 0 && (
                    <div className="mb-4">
                      <SectionLabel label={`Pending Review (${pendingSubs.length})`} color="#D97706" />
                      <div className="space-y-3 mt-2">
                        {pendingSubs.map((sub) => (
                          <SubmissionCard
                            key={sub.id}
                            sub={sub}
                            rejectingId={rejectingId}
                            rejectReason={rejectReason}
                            setRejectReason={setRejectReason}
                            setRejectingId={setRejectingId}
                            approveSubmission={approveSubmission}
                            rejectSubmission={rejectSubmission}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolved */}
                  {submissions.filter((s) => s.status !== "pending").length > 0 && (
                    <div>
                      <SectionLabel label="Resolved" color="#64748B" />
                      <div className="space-y-2 mt-2">
                        {submissions.filter((s) => s.status !== "pending").map((sub) => (
                          <SubmissionCard
                            key={sub.id}
                            sub={sub}
                            rejectingId={null}
                            rejectReason=""
                            setRejectReason={() => {}}
                            setRejectingId={() => {}}
                            approveSubmission={() => {}}
                            rejectSubmission={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* UPDATES */}
          {activeTab === "updates" && (
            <div className="space-y-4">
              {/* Add update form */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "hsl(var(--color-white))",
                  border: "1px solid hsl(var(--color-neutral-200))",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Post Update
                </h3>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Add a project update or note..."
                  className="w-full p-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/25"
                  rows={3}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                />
                <button
                  onClick={handleSendUpdate}
                  disabled={!updateMessage.trim()}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: "hsl(var(--color-primary-700))",
                    color: "hsl(var(--color-white))",
                  }}
                >
                  <Send size={13} strokeWidth={2.5} /> Post Update
                </button>
              </div>

              {/* Update list */}
              {updates.length === 0 ? (
                <EmptyTabState icon={<MessageSquare size={28} strokeWidth={1.5} />} message="No updates yet for this project" />
              ) : (
                <div className="space-y-3">
                  {updates.slice().reverse().map((update) => {
                    return (
                      <UpdateEntry
                        key={update.id}
                        update={update}
                        name={update.from || "Unknown"}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function StatusSelector({ projectId, current }: { projectId: string; current: ProjectStatus }) {
  const updateProjectStatus = useCRMStore((s) => s.updateProjectStatus);
  const cfg = STATUS_CONFIG[current];
  return (
    <div className="relative flex-shrink-0">
      <select
        value={current}
        onChange={(e) => updateProjectStatus(projectId, e.target.value as typeof current)}
        className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
        style={{
          background: cfg.bg,
          color: cfg.color,
          borderColor: cfg.color + "40",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <option value="pending">Not Started</option>
        <option value="active">In Progress</option>
        <option value="review">Under Review</option>
        <option value="completed">Completed</option>
      </select>
      <ChevronDown size={12} strokeWidth={2.5} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: cfg.color }} />
    </div>
  );
}

function MetaCell({ label, value, icon, danger }: { label: string; value: string; icon: React.ReactNode; danger?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-medium flex items-center gap-1.5 ${danger ? "text-destructive" : "text-foreground"}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {icon} {value}
      </p>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "hsl(var(--color-white))",
        border: "1px solid hsl(var(--color-neutral-200))",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-2 mb-4"
        style={{ borderBottom: "1px solid hsl(var(--color-neutral-100))", paddingBottom: "12px" }}>
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ServiceBadge({ label }: { label: string }) {
  if (!label) return null;
  return (
    <span className="inline-flex text-xs px-2 py-0.5 rounded-full"
      style={{ background: "rgba(37,99,235,0.08)", color: "#2563EB", fontFamily: "'DM Sans', sans-serif" }}>
      {label}
    </span>
  );
}

function PaymentBadge({
  status,
}: {
  status: "paid" | "pending" | "partial" | "overdue";
}) {
  const map = {
    paid: {
      bg: "rgba(22,163,74,0.10)",
      color: "#16A34A",
      label: "Paid",
    },
    pending: {
      bg: "rgba(217,119,6,0.10)",
      color: "#D97706",
      label: "Pending",
    },
    partial: {
      bg: "rgba(245,158,11,0.10)",
      color: "#B45309",
      label: "Partial",
    },
    overdue: {
      bg: "rgba(239,68,68,0.10)",
      color: "#DC2626",
      label: "Overdue",
    },
  };

  const cfg = map[status];
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const map = {
    high:   { bg: "rgba(239,68,68,0.10)",   color: "#DC2626", label: "High"   },
    medium: { bg: "rgba(217,119,6,0.10)",   color: "#D97706", label: "Medium" },
    low:    { bg: "rgba(100,116,139,0.10)", color: "#64748B", label: "Low"    },
  };
  const cfg = map[priority];
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ background: cfg.bg, color: cfg.color, fontFamily: "'DM Sans', sans-serif" }}>
      {cfg.label} priority
    </span>
  );
}



function SubmissionCard({
  sub, rejectingId, rejectReason, setRejectReason, setRejectingId,
  approveSubmission, rejectSubmission,
}: {
  sub: {
  id: string;
  clientId: string;
  projectId: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  date?: string;
  submittedAt?: string;
};
  rejectingId: string | null;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  setRejectingId: (v: string | null) => void;
  approveSubmission: (id: string) => void;
  rejectSubmission: (id: string, reason: string) => void;
}) {
  const statusMap = {
    pending: { bg: "rgba(217,119,6,0.10)",   color: "#D97706", label: "Pending Review" },
    approved:       { bg: "rgba(22,163,74,0.10)",   color: "#16A34A", label: "Approved"       },
    rejected:       { bg: "rgba(239,68,68,0.10)",   color: "#DC2626", label: "Rejected"       },
  };
  const cfg = statusMap[sub.status as keyof typeof statusMap] ?? statusMap.pending;
  const isPending = sub.status === "pending";

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "hsl(var(--color-white))",
        border: `1px solid ${sub.status === "rejected" ? "rgba(239,68,68,0.20)" : "hsl(var(--color-neutral-200))"}`,
        opacity: sub.status === "rejected" ? 0.75 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono text-muted-foreground">#{sub.id.toUpperCase()}</span>
            <span className="text-xs text-muted-foreground">{sub.submittedAt || sub.date || ""}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          </div>
          <p className="text-sm text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>{sub.description}</p>
        </div>
      </div>

      {/* Actions for pending */}
      {isPending && (
        <>
          {rejectingId === sub.id ? (
            <div className="flex items-center gap-2 mt-3 pt-3"
              style={{ borderTop: "1px solid hsl(var(--color-neutral-100))" }}>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
              <button
                onClick={() => { rejectSubmission(sub.id, rejectReason || "No reason provided"); setRejectingId(null); setRejectReason(""); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "#DC2626", color: "white" }}
              >
                <Check size={13} strokeWidth={2.5} /> Confirm
              </button>
              <button
                onClick={() => { setRejectingId(null); setRejectReason(""); }}
                className="px-3 py-2 rounded-lg border border-border text-xs font-semibold transition-all hover:bg-muted"
              >Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-3 pt-3"
              style={{ borderTop: "1px solid hsl(var(--color-neutral-100))" }}>
              <button
                onClick={() => approveSubmission(sub.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(22,163,74,0.10)", color: "#16A34A" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(22,163,74,0.20)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(22,163,74,0.10)")}
              >
                <CheckCircle2 size={14} strokeWidth={2.5} /> Approve
              </button>
              <button
                onClick={() => setRejectingId(sub.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "rgba(239,68,68,0.10)", color: "#DC2626" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.18)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.10)")}
              >
                <X size={14} strokeWidth={2.5} /> Reject
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UpdateEntry({ update, name }: { update: { id: string; fromType: string; message: string; date: string; visibleToClient: boolean }; name: string }) {
  const typeMap: Record<string, { color: string; label: string }> = {
    admin:    { color: "#2563EB", label: "Admin"    },
    employee: { color: "#7C3AED", label: "Employee" },
    client:   { color: "#16A34A", label: "Client"   },
  };
  const cfg = typeMap[update.fromType] ?? { color: "#64748B", label: update.fromType };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "hsl(var(--color-white))",
        border: "1px solid hsl(var(--color-neutral-200))",
        borderLeft: `3px solid ${cfg.color}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded"
          style={{ background: cfg.color + "15", color: cfg.color, fontFamily: "'DM Sans', sans-serif" }}>
          {cfg.label}
        </span>
        <span className="text-xs text-muted-foreground">{name}</span>
        <span className="text-xs text-muted-foreground">· {update.date}</span>
        {!update.visibleToClient && (
          <span className="text-[10px] text-muted-foreground ml-auto">internal only</span>
        )}
      </div>
      <p className="text-sm text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>{update.message}</p>
    </div>
  );
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider mb-2"
      style={{ color, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em" }}>
      {label}
    </p>
  );
}

function EmptyTabState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="text-center py-14 rounded-2xl border border-dashed"
      style={{ borderColor: "hsl(var(--color-neutral-200))", background: "hsl(var(--color-neutral-50))" }}>
      <span className="text-muted-foreground opacity-30 flex justify-center mb-3">{icon}</span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
