import { useNavigate } from "react-router-dom";
import { GroupedTimeline } from "@/components/crm/shared/TimelineItem";
import type { TimelineEntry as TLEntry } from "@/components/crm/shared/TimelineItem";
import { useCRMStore } from "@/store/useCRMStore";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  User,
  ShieldCheck,
  Building2,
  AlertCircle,
  Send,
} from "lucide-react";

const STATUS_CFG: Record<
  string,
  { label: string; bg: string; color: string; stripe: string }
> = {
  pending: {
    label: "Pending Start",
    bg: "#F1F5F9",
    color: "#64748B",
    stripe: "linear-gradient(90deg,#94A3B8,#CBD5E1)",
  },
  active: {
    label: "In Progress",
    bg: "#EFF6FF",
    color: "#1E3A8A",
    stripe: "linear-gradient(90deg,#1E3A8A,#3B82F6)",
  },
  "waiting-client": {
    label: "Action Needed",
    bg: "#FEF3C7",
    color: "#92400E",
    stripe: "linear-gradient(90deg,#B45309,#F59E0B)",
  },
  review: {
    label: "Under Review",
    bg: "#EDE9FE",
    color: "#4C1D95",
    stripe: "linear-gradient(90deg,#4C1D95,#7C3AED)",
  },
  completed: {
    label: "Completed",
    bg: "#DCFCE7",
    color: "#15803D",
    stripe: "linear-gradient(90deg,#15803D,#22C55E)",
  },
  rejected: {
    label: "Rejected",
    bg: "#FEE2E2",
    color: "#B91C1C",
    stripe: "linear-gradient(90deg,#EF4444,#DC2626)",
  },
};

const PAYMENT_CFG: Record<string, { label: string; bg: string; color: string }> =
  {
    pending: { label: "Pending", bg: "#F1F5F9", color: "#64748B" },
    partial: { label: "Partial", bg: "#FEF3C7", color: "#92400E" },
    paid: { label: "Paid", bg: "#DCFCE7", color: "#15803D" },
    overdue: { label: "Overdue", bg: "#FEE2E2", color: "#B91C1C" },
  };

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

const iv: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const cv: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

export default function ClientProjectView() {
  const navigate = useNavigate();
  const users = useCRMStore((s) => s.users);
  const clients = useCRMStore((s) => s.clients);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser = users.find((u) => u.id === currentUserId);
  const currentClient = currentUser?.clientId
    ? clients.find((c) => c.id === currentUser.clientId)
    : undefined;
  const projects = useCRMStore((s) => s.projects);
  const updates = useCRMStore((s) => s.updates);
  const submissions = useCRMStore((s) => s.clientSubmissions);
  const payments = useCRMStore((s) => s.payments);

  if (!currentClient || currentUser?.role !== "client") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertCircle
          size={32}
          style={{ color: "#CBD5E1" }}
          className="mb-3"
        />
        <p
          className="text-sm"
          style={{ color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}
        >
          No client session found.
        </p>
      </div>
    );
  }

  const myProjects = projects.filter((p) => p.clientId === currentClient.id);

  if (myProjects.length === 0) {
    return (
      <motion.div
        variants={iv}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center py-32 text-center"
      >
        <FolderEmpty />
        <p
          className="text-sm mt-2"
          style={{ color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}
        >
          No projects found.
        </p>
        <button
          onClick={() => navigate("/crm/client")}
          className="mt-4 flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "#1E3A8A" }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </motion.div>
    );
  }

  const project = myProjects[0];
  const cfg = STATUS_CFG[project.status] ?? STATUS_CFG.pending;
  const assignedUser = users.find((u) => u.id === project.assignedTo);

  const visibleUpdates = updates.filter(
    (u) => u.projectId === project.id && u.visibleToClient
  );
  const mySubmissions = submissions.filter(
    (s) => s.clientId === currentClient.id && s.projectId === project.id
  );
  const myPayments = payments.filter(
    (p) => p.clientId === currentClient.id && p.projectId === project.id
  );

  return (
    <motion.div variants={cv} initial="hidden" animate="visible">
      {/* Back nav */}
      <motion.div variants={iv} className="mb-5">
        <button
          onClick={() => navigate("/crm/client")}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}
        >
          <ArrowLeft size={14} /> Dashboard
        </button>
      </motion.div>

      {/* Project Header */}
      <motion.div
        variants={iv}
        className="bg-white rounded-2xl overflow-hidden mb-6"
        style={{
          border: "1px solid #E8EDF3",
          boxShadow: "0 2px 8px rgba(15,27,76,0.08)",
        }}
      >
        <div className="h-1.5" style={{ background: cfg.stripe }} />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <span
                className="text-[10px] font-mono text-neutral-400"
                style={{ fontFamily: "'JetBrains Mono',monospace" }}
              >
                #{project.id.toUpperCase()}
              </span>
              <h1
                className="text-xl font-bold mt-1 leading-snug"
                style={{
                  fontFamily: "'Sora',sans-serif",
                  color: "#0F172A",
                  letterSpacing: "-0.01em",
                }}
              >
                {project.title}
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{ color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}
              >
                {project.serviceType}
              </p>
            </div>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
              style={{
                background: cfg.bg,
                color: cfg.color,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {cfg.label}
            </span>
          </div>

          {/* Meta grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl mb-5"
            style={{ background: "#F8FAFC" }}
          >
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: "#94A3B8" }}
              >
                Deadline
              </p>
              <p
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: "#0F172A", fontFamily: "'DM Sans',sans-serif" }}
              >
                <CalendarDays size={13} /> {project.deadline}
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: "#94A3B8" }}
              >
                Progress
              </p>
              <p
                className="text-sm font-bold"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  color: "#1E3A8A",
                }}
              >
                {project.progress}%
              </p>
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: "#94A3B8" }}
              >
                Manager
              </p>
              <p
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: "#0F172A", fontFamily: "'DM Sans',sans-serif" }}
              >
                <User size={13} /> {assignedUser?.name ?? "Assigned soon"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs"
                style={{ color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}
              >
                Overall Progress
              </span>
              <span
                className="text-xs font-bold"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  color: "#1E3A8A",
                }}
              >
                {project.progress}%
              </span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: "#F1F5F9" }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                style={{ background: "linear-gradient(90deg,#1E3A8A,#3B82F6)" }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <motion.div
          variants={iv}
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            border: "1px solid #E8EDF3",
            boxShadow: "0 1px 4px rgba(15,27,76,0.05)",
          }}
        >
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ borderBottom: "1px solid #F1F5F9" }}
          >
            <Clock size={15} style={{ color: "#1E3A8A" }} />
            <h2
              className="text-sm font-bold"
              style={{ color: "#0F172A", fontFamily: "'Sora',sans-serif" }}
            >
              Project Timeline
            </h2>
            {visibleUpdates.length > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "#EFF6FF", color: "#1E3A8A" }}
              >
                {visibleUpdates.length}
              </span>
            )}
          </div>
          <div className="p-5">
            {(() => {
              const tlEntries: TLEntry[] = [...visibleUpdates].reverse().map((u) => ({
                id: u.id,
                date: u.date,
                type: u.fromType as TLEntry["type"],
                label: u.message,
                actor: u.from || undefined,
              }));
              return (
                <GroupedTimeline
                  entries={tlEntries}
                  emptyMessage="Your team will post updates here once work begins."
                />
              );
            })()}
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Your Submissions */}
          <motion.div
            variants={iv}
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              border: "1px solid #E8EDF3",
              boxShadow: "0 1px 4px rgba(15,27,76,0.05)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #F1F5F9" }}
            >
              <div className="flex items-center gap-2">
                <FileText size={15} style={{ color: "#7C3AED" }} />
                <h2
                  className="text-sm font-bold"
                  style={{ color: "#0F172A", fontFamily: "'Sora',sans-serif" }}
                >
                  Your Submissions
                </h2>
              </div>
              <button
                onClick={() => navigate("/crm/client/submit")}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: "#7C3AED" }}
              >
                Add <Send size={11} />
              </button>
            </div>
            <div className="p-4">
              {mySubmissions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <FileText
                    size={20}
                    style={{ color: "#CBD5E1" }}
                    className="mb-2"
                  />
                  <p
                    className="text-xs"
                    style={{
                      color: "#94A3B8",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    No submissions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...mySubmissions].reverse().map((sub) => {
                    const isApproved = sub.status === "approved";
                    const isRejected = sub.status === "rejected";
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3.5 rounded-xl"
                        style={{
                          background: isApproved
                            ? "#F0FDF4"
                            : isRejected
                              ? "#FFF5F5"
                              : "#F8FAFC",
                          border: `1px solid ${
                            isApproved
                              ? "#BBF7D0"
                              : isRejected
                                ? "#FCA5A5"
                                : "#E8EDF3"
                          }`,
                        }}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          {isApproved ? (
                            <CheckCircle2
                              size={15}
                              style={{ color: "#22C55E" }}
                              className="mt-0.5 flex-shrink-0"
                            />
                          ) : isRejected ? (
                            <XCircle
                              size={15}
                              style={{ color: "#EF4444" }}
                              className="mt-0.5 flex-shrink-0"
                            />
                          ) : (
                            <Clock
                              size={15}
                              style={{ color: "#F59E0B" }}
                              className="mt-0.5 flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{
                                color: "#0F172A",
                                fontFamily: "'DM Sans',sans-serif",
                              }}
                            >
                              {sub.description}
                            </p>
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: "#94A3B8" }}
                            >
                              {sub.submittedAt}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                          style={{
                            background: isApproved
                              ? "#DCFCE7"
                              : isRejected
                                ? "#FEE2E2"
                                : "#FEF3C7",
                            color: isApproved
                              ? "#15803D"
                              : isRejected
                                ? "#B91C1C"
                                : "#92400E",
                          }}
                        >
                          {isApproved
                            ? "Approved"
                            : isRejected
                              ? "Rejected"
                              : "Reviewing"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Payment Summary */}
          {myPayments.length > 0 && (
            <motion.div
              variants={iv}
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid #E8EDF3",
                boxShadow: "0 1px 4px rgba(15,27,76,0.05)",
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid #F1F5F9" }}
              >
                <div className="flex items-center gap-2">
                  <CreditCard size={15} style={{ color: "#15803D" }} />
                  <h2
                    className="text-sm font-bold"
                    style={{ color: "#0F172A", fontFamily: "'Sora',sans-serif" }}
                  >
                    Payments
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/crm/client/payments")}
                  className="text-xs font-semibold"
                  style={{ color: "#15803D" }}
                >
                  View all →
                </button>
              </div>
              <div className="p-4 space-y-2">
                {myPayments.slice(0, 3).map((pay) => {
                  const pcfg = PAYMENT_CFG[pay.status] ?? PAYMENT_CFG.pending;
                  return (
                    <div
                      key={pay.id}
                      className="flex items-center justify-between p-3.5 rounded-xl"
                      style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}
                    >
                      <div>
                        <p
                          className="text-sm font-semibold capitalize"
                          style={{
                            color: "#0F172A",
                            fontFamily: "'DM Sans',sans-serif",
                          }}
                        >
                          {pay.type} payment
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                          Due: {pay.dueDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-sm font-bold"
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            color: "#0F172A",
                          }}
                        >
                          {fmt(pay.amount)}
                        </p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: pcfg.bg, color: pcfg.color }}
                        >
                          {pcfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FolderEmpty() {
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center"
      style={{ background: "#F1F5F9" }}
    > 
      <TrendingUp size={24} style={{ color: "#94A3B8" }} />
    </div>
  );
}