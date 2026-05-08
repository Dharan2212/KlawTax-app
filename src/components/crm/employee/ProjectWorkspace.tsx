import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GroupedTimeline } from "@/components/crm/shared/TimelineItem";
import type { TimelineEntry as TLEntry } from "@/components/crm/shared/TimelineItem";
import { useCRMStore } from "@/store/useCRMStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CalendarDays, Send, Upload, Clock,
  ListTodo, Activity, Paperclip, AlertTriangle,
  CheckCircle2, CircleDot, User, Building2,
  ShieldCheck, MessageSquare,
} from "lucide-react";
import TaskPanel from "./TaskPanel";

// ─── Helpers ──────────────────────────────────────────────────
const daysUntil = (d: string) =>
  Math.ceil((new Date(d).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
const isOverdue = (d: string, s: string) => s !== "completed" && new Date(d) < new Date();

// ─── Status config ────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string; stripe: string }> = {
  pending: { label: "Not Started",  bg: "#F1F5F9", color: "#64748B", stripe: "linear-gradient(90deg, #94A3B8, #CBD5E1)" },
  active: { label: "In Progress",  bg: "#EFF6FF", color: "#1E3A8A", stripe: "linear-gradient(90deg, #1E3A8A, #3B82F6)" },
  review:      { label: "In Review",    bg: "#FEF3C7", color: "#92400E", stripe: "linear-gradient(90deg, #B45309, #F59E0B)" },
  "waiting-client": { label: "Waiting Client", color: "#7C3AED", bg: "#F5F3FF", stripe: "linear-gradient(90deg, #7C3AED, #A78BFA)" },
  rejected:    { label: "Rejected",      color: "#DC2626", bg: "#FEF2F2", stripe: "linear-gradient(90deg, #DC2626, #EF4444)" },
  completed:   { label: "Completed",    bg: "#DCFCE7", color: "#15803D", stripe: "linear-gradient(90deg, #15803D, #22C55E)" },
};

type TabKey = "tasks" | "updates" | "files";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "tasks",   label: "Tasks",   icon: <ListTodo size={15} /> },
  { key: "updates", label: "Updates", icon: <Activity size={15} /> },
  { key: "files",   label: "Files",   icon: <Paperclip size={15} /> },
];

// ─── Update card ─────────────────────────────────────────────
function UpdateCard({
  update,
}: {
  update: ReturnType<typeof useCRMStore.getState>["updates"][0];
}) {
  const users   = useCRMStore((s) => s.users);
  const clients = useCRMStore((s) => s.clients);
  const fromUser   = users.find((u) => u.id === update.from);
  const fromClient = clients.find((c) => c.id === update.from);
  const name = fromUser?.name ?? fromClient?.name ?? "System";

  const typeConfig = {
    employee: { bg: "#EFF6FF", color: "#1E3A8A", label: "You",    icon: <User size={12} /> },
    client:   { bg: "#EDE9FE", color: "#4C1D95", label: "Client", icon: <Building2 size={12} /> },
    admin:    { bg: "#FEF3C7", color: "#92400E", label: "Admin",  icon: <ShieldCheck size={12} /> },
  };
  const cfg = typeConfig[update.fromType] ?? typeConfig.admin;

  return (
    <div
      className="flex gap-3"
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.bg }}
        >
          <span style={{ color: cfg.color }}>{cfg.icon}</span>
        </div>
        <div className="w-px flex-1 mt-1" style={{ background: "#E8EDF3" }} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          <span className="text-xs font-medium text-neutral-700">{name}</span>
          <span className="text-xs text-neutral-400">· {update.date}</span>
        </div>
        <div
          className="rounded-xl p-3.5 text-sm text-neutral-700 leading-relaxed"
          style={{
            background: update.fromType === "employee" ? "#F0F7FF" : "#F8FAFC",
            border: `1px solid ${update.fromType === "employee" ? "#BFDBFE" : "#E8EDF3"}`,
          }}
        >
          {update.message}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("tasks");
  const [updateMsg, setUpdateMsg] = useState("");

  const users         = useCRMStore((s) => s.users);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser   = users.find((u) => u.id === currentUserId);
  const projects      = useCRMStore((s) => s.projects);
  const clients       = useCRMStore((s) => s.clients);
  const tasks         = useCRMStore((s) => s.tasks);
  const allUpdates    = useCRMStore((s) => s.updates);
  const addUpdate     = useCRMStore((s) => s.addUpdate);

  if (!currentUser || currentUser.role !== "employee") {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-neutral-400 text-sm">No employee session found.</p>
      </div>
    );
  }

  const project  = projects.find((p) => p.id === projectId);
  const client   = clients.find((c) => c.id === project?.clientId);
  const updates  = allUpdates.filter((u) => u.projectId === projectId);

  if (!project) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-32 text-center"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "#F1F5F9" }}
        >
          <AlertTriangle size={28} style={{ color: "#94A3B8" }} />
        </div>
        <h3 className="text-base font-bold text-neutral-900 mb-1">Project Not Found</h3>
        <p className="text-sm text-neutral-400 mb-4">This project may have been removed or reassigned.</p>
        <button
          onClick={() => navigate("/crm/employee/projects")}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-neutral-900"
          style={{ color: "#1E3A8A" }}
        >
          <ArrowLeft size={15} /> Back to My Projects
        </button>
      </motion.div>
    );
  }

  const overdue     = isOverdue(project.deadline, project.status);
  const days        = daysUntil(project.deadline);
  const cfg         = STATUS_CFG[project.status] ?? STATUS_CFG.pending;
  const myTasks     = tasks.filter((t) => t.projectId === project.id && t.assignedTo === currentUser.id);
  const doneCount   = myTasks.filter((t) => t.status === "done").length;
  const activeCount = myTasks.filter((t) => t.status === "active").length;

  const handleSendUpdate = () => {
    if (!updateMsg.trim()) return;
    addUpdate({
      projectId: project.id,
      from: currentUser.id,
      fromType: "employee",
      message: updateMsg.trim(),
      date: new Date().toISOString().split("T")[0],
    });
    setUpdateMsg("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">

      {/* ── Back nav ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-5">
        <button
          onClick={() => navigate("/crm/employee/projects")}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-neutral-900"
          style={{ color: "#64748B" }}
        >
          <ArrowLeft size={15} />
          My Projects
        </button>
      </motion.div>

      {/* ── Project Header Card ──────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl overflow-hidden mb-6"
        style={{
          border: overdue ? "1px solid #FCA5A5" : "1px solid #E8EDF3",
          boxShadow: "0 2px 8px rgba(15,27,76,0.08)",
        }}
      >
        {/* Colour stripe */}
        <div className="h-1.5" style={{ background: cfg.stripe }} />

        <div className="p-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-[10px] font-mono text-neutral-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  #{project.id.toUpperCase()}
                </span>
                {overdue && (
                  <span
                    className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#FEE2E2", color: "#B91C1C" }}
                  >
                    <AlertTriangle size={9} /> Overdue
                  </span>
                )}
              </div>
              <h1
                className="text-xl font-bold text-neutral-900 leading-snug"
                style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.01em" }}
              >
                {project.title}
              </h1>
              {client && (
                <p className="text-sm text-neutral-400 mt-1 flex items-center gap-1.5">
                  <Building2 size={13} />
                  {client.name}
                </p>
              )}
            </div>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>

          {/* Meta strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl mb-4" style={{ background: "#F8FAFC" }}>
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Deadline</p>
              <p
                className="text-sm font-semibold flex items-center gap-1"
                style={{ color: overdue ? "#B91C1C" : days <= 3 ? "#B45309" : "#0F172A" }}
              >
                <CalendarDays size={13} />
                {overdue
                  ? `${Math.abs(days)}d overdue`
                  : days === 0
                  ? "Today!"
                  : `${days}d left`}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Progress</p>
              <p
                className="text-sm font-bold"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#1E3A8A" }}
              >
                {project.progress}%
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Tasks</p>
              <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1">
                <CheckCircle2 size={13} style={{ color: "#22C55E" }} />
                {doneCount}/{myTasks.length}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Active</p>
              <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1">
                <CircleDot size={13} style={{ color: "#3B82F6" }} />
                {activeCount} in progress
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-400">Overall Progress</span>
              <span
                className="text-xs font-bold"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: overdue ? "#B91C1C" : "#1E3A8A",
                }}
              >
                {project.progress}%
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.8, ease: [0, 0, 0.2, 1], delay: 0.3 }}
                style={{
                  background: overdue
                    ? "linear-gradient(90deg, #EF4444, #DC2626)"
                    : "linear-gradient(90deg, #1E3A8A, #3B82F6)",
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-6">
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ background: "#F1F5F9" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold flex-1 transition-all duration-200"
              style={{
                background: activeTab === tab.key ? "#FFFFFF" : "transparent",
                color: activeTab === tab.key ? "#0F172A" : "#64748B",
                boxShadow: activeTab === tab.key ? "0 1px 4px rgba(15,27,76,0.08)" : "none",
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.key === "updates" && updates.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === tab.key ? "#EFF6FF" : "#E2E8F0",
                    color: activeTab === tab.key ? "#1E3A8A" : "#94A3B8",
                  }}
                >
                  {updates.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Tab Content ──────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >

          {/* TASKS */}
          {activeTab === "tasks" && (
            <div
              className="bg-white rounded-2xl p-5"
              style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}
            >
              <TaskPanel projectId={project.id} />
            </div>
          )}

          {/* UPDATES */}
          {activeTab === "updates" && (
            <div className="space-y-5">

              {/* Compose update */}
              <div
                className="bg-white rounded-2xl p-5"
                style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={15} style={{ color: "#1E3A8A" }} />
                  <h3 className="text-sm font-bold text-neutral-900">Add Progress Update</h3>
                </div>
                <textarea
                  value={updateMsg}
                  onChange={(e) => setUpdateMsg(e.target.value)}
                  placeholder="Describe progress, blockers, or next steps…"
                  rows={3}
                  className="w-full p-3.5 rounded-xl text-sm resize-none focus:outline-none transition-all"
                  style={{
                    border: "1.5px solid #E8EDF3",
                    color: "#0F172A",
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.6,
                    background: "#F8FAFC",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#BFDBFE";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.10)";
                    e.currentTarget.style.background = "#FFFFFF";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#E8EDF3";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#F8FAFC";
                  }}
                />
                <button
                  onClick={handleSendUpdate}
                  disabled={!updateMsg.trim()}
                  className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: updateMsg.trim()
                      ? "linear-gradient(90deg, #1E3A8A, #2563EB)"
                      : "#F1F5F9",
                    color: updateMsg.trim() ? "#FFFFFF" : "#94A3B8",
                    boxShadow: updateMsg.trim() ? "0 4px 14px rgba(30,58,138,0.25)" : "none",
                    cursor: updateMsg.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  <Send size={14} />
                  Post Update
                </button>
              </div>

              {/* Timeline */}
              {updates.length === 0 ? (
                <div
                  className="bg-white rounded-2xl flex flex-col items-center justify-center py-14 text-center"
                  style={{ border: "1px solid #E8EDF3" }}
                >
                  <Clock size={24} style={{ color: "#CBD5E1" }} className="mb-2" />
                  <p className="text-sm font-semibold text-neutral-500">No updates yet</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Post your first update above</p>
                </div>
              ) : (
                <div
                  className="bg-white rounded-2xl p-5"
                  style={{ border: "1px solid #E8EDF3" }}
                >
                  <h3 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Clock size={15} style={{ color: "#1E3A8A" }} />
                    Activity Timeline
                  </h3>
                  {(() => {
                    const tlEntries: TLEntry[] = [...updates].map((u) => ({
                      id: u.id,
                      date: u.date,
                      type: (u.fromType as TLEntry["type"]) || "system",
                      label: u.message,
                      actor: u.from || undefined,
                    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    return (
                      <GroupedTimeline
                        entries={tlEntries}
                        emptyMessage="No activity updates yet."
                      />
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* FILES */}
          {activeTab === "files" && (
            <div className="space-y-4">
              {/* Upload area */}
              <div
                className="bg-white rounded-2xl p-8 text-center"
                style={{
                  border: "2px dashed #CBD5E1",
                  boxShadow: "none",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "#3B82F6";
                  e.currentTarget.style.background = "#EFF6FF";
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "#F1F5F9" }}
                >
                  <Upload size={24} style={{ color: "#94A3B8" }} />
                </div>
                <p className="text-sm font-bold text-neutral-900 mb-1">Upload Work Files</p>
                <p className="text-xs text-neutral-400 mb-4">
                  PDF, DOC, JPG, PNG — max 10MB per file
                </p>
                <button
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(90deg, #1E3A8A, #2563EB)",
                    color: "#FFFFFF",
                    boxShadow: "0 4px 14px rgba(30,58,138,0.25)",
                  }}
                >
                  Select Files
                </button>
              </div>

              {/* Placeholder info */}
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
              >
                <Clock size={14} style={{ color: "#1E3A8A" }} />
                <p className="text-xs text-blue-800">
                  File management is coming in the next phase. Use WhatsApp to share documents for now.
                </p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
