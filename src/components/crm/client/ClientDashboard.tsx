import { useCRMStore } from "@/store/useCRMStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import {
  FolderKanban, Calendar, CheckCircle2, Clock, ArrowRight,
  FileText, Send, MessageCircle, TrendingUp, AlertCircle,
} from "lucide-react";

const isOverdue = (deadline: string, status: string) =>
  status !== "completed" && status !== "rejected" && new Date(deadline) < new Date();

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function daysLeft(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

const PROJECT_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: "Pending Start",      bg: "rgba(100,116,139,0.10)", color: "#475569" },
  active:           { label: "In Progress",         bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  "waiting-client": { label: "Action Required",     bg: "rgba(245,158,11,0.12)", color: "#B45309" },
  review:           { label: "Under Review",         bg: "rgba(124,58,237,0.10)", color: "#6D28D9" },
  completed:        { label: "Completed",            bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  rejected:         { label: "Rejected",             bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
      {children}
    </div>
  );
}

export default function ClientDashboard() {
  const navigate      = useNavigate();
  const users         = useCRMStore((s) => s.users);
  const clients       = useCRMStore((s) => s.clients);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const projects      = useCRMStore((s) => s.projects);
  const submissions   = useCRMStore((s) => s.clientSubmissions);
  const payments      = useCRMStore((s) => s.payments);

  const currentUser   = users.find((u) => u.id === currentUserId);
  const currentClient = currentUser?.clientId ? clients.find((c) => c.id === currentUser.clientId) : undefined;

  if (!currentClient || currentUser?.role !== "client") {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-neutral-400 text-sm">No client session. Switch to Client role.</p>
      </div>
    );
  }

  const myProjects     = projects.filter((p) => p.clientId === currentClient.id);
  const mySubmissions  = submissions.filter((s) => s.clientId === currentClient.id);
  const myPayments     = payments.filter((p) => p.clientId === currentClient.id);
  const pendingSubs    = mySubmissions.filter((s) => s.status === "pending");
  const pendingPayment = myPayments.find((p) => ["pending", "overdue"].includes(p.status));
  const hasActionRequired = myProjects.some((p) => p.status === "waiting-client");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">

      {/* Welcome */}
      <motion.div variants={itemVariants}>
        <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
          Welcome, {currentClient.name.split(" ")[0]}
        </h1>
        <p className="text-neutral-400 text-sm mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {currentClient.service}
        </p>
      </motion.div>

      {/* Action-required banner */}
      {hasActionRequired && (
        <motion.div variants={itemVariants}
          className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}
          onClick={() => navigate("/crm/client/submit")}>
          <AlertCircle size={16} strokeWidth={2} style={{ color: "#B45309", flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#92400E", fontFamily: "'DM Sans', sans-serif" }}>Action Required</p>
            <p className="text-xs" style={{ color: "#B45309" }}>Your team is waiting for documents. Submit your update now.</p>
          </div>
          <ArrowRight size={14} strokeWidth={2.5} style={{ color: "#B45309", flexShrink: 0 }} />
        </motion.div>
      )}

      {/* Stat pills */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <FolderKanban size={16} strokeWidth={2} />, label: "Projects",    value: myProjects.length,                                        accent: "#1E3A8A" },
          { icon: <FileText size={16} strokeWidth={2} />,    label: "Submissions", value: mySubmissions.length,                                     accent: "#6D28D9" },
          { icon: <Clock size={16} strokeWidth={2} />,       label: "Pending",     value: pendingSubs.length,                                       accent: "#D97706" },
          { icon: <CheckCircle2 size={16} strokeWidth={2} />,label: "Approved",    value: mySubmissions.filter((s) => s.status === "approved").length, accent: "#15803D" },
        ].map((s) => (
          <motion.div key={s.label} variants={itemVariants}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.accent}12`, color: s.accent }}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>{s.value}</p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Project cards */}
      <div className="space-y-3">
        {myProjects.length === 0 && (
          <Card className="p-10 text-center">
            <p className="text-neutral-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>No projects yet. Your team will create one after onboarding.</p>
          </Card>
        )}
        {myProjects.map((project) => {
          const overdue = isOverdue(project.deadline, project.status);
          const days    = daysLeft(project.deadline);
          const sc      = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.pending;
          return (
            <motion.div key={project.id} variants={itemVariants}>
              <Card className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-neutral-900 leading-snug" style={{ fontFamily: "'Sora', sans-serif" }}>{project.title}</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">{currentClient.service}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{ background: sc.bg, color: sc.color, fontFamily: "'DM Sans', sans-serif" }}>{sc.label}</span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wide">Progress</span>
                    <span className="text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: overdue ? "#DC2626" : "#1E3A8A" }}>{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${project.progress}%`, background: overdue ? "linear-gradient(90deg, #EF4444, #DC2626)" : "linear-gradient(90deg, #1E3A8A, #3B82F6)" }} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs"
                    style={{ color: overdue ? "#DC2626" : days <= 7 ? "#B45309" : "#64748B" }}>
                    <Calendar size={12} strokeWidth={2} />
                    {overdue ? `Overdue by ${Math.abs(days)}d` : `Deadline: ${fmtDate(project.deadline)}`}
                  </div>
                  <button onClick={() => navigate("/crm/client/project")}
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: "#1E3A8A" }}>
                    View details <ArrowRight size={11} strokeWidth={2.5} />
                  </button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom row */}
      <div className="grid sm:grid-cols-2 gap-5">

        {/* Quick actions */}
        <Card className="p-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Quick Actions</h3>
          <div className="space-y-2">
            <button onClick={() => navigate("/crm/client/project")}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-px text-left"
              style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(37,99,235,0.10)", color: "#1E3A8A" }}><TrendingUp size={14} strokeWidth={2} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>View Timeline</p>
                <p className="text-[10px] text-neutral-400">See all project updates</p>
              </div>
              <ArrowRight size={12} strokeWidth={2} style={{ color: "#94A3B8" }} />
            </button>
            <button onClick={() => navigate("/crm/client/submit")}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-px text-left"
              style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.10)", color: "#6D28D9" }}><Send size={14} strokeWidth={2} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>Submit Documents {pendingSubs.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#B45309" }}>{pendingSubs.length} pending</span>}</p>
                <p className="text-[10px] text-neutral-400">Send files and updates</p>
              </div>
              <ArrowRight size={12} strokeWidth={2} style={{ color: "#94A3B8" }} />
            </button>
            <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-px text-left"
              style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(22,163,74,0.10)", color: "#15803D" }}><MessageCircle size={14} strokeWidth={2} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>WhatsApp Support</p>
                <p className="text-[10px] text-neutral-400">Mon–Sat, 9 AM–7 PM</p>
              </div>
              <ArrowRight size={12} strokeWidth={2} style={{ color: "#94A3B8" }} />
            </a>
          </div>
        </Card>

        {/* Payment status */}
        <Card className="p-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Payment Status</h3>
          {myPayments.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-6">No payment records</p>
          ) : (
            <div className="space-y-2">
              {myPayments.map((pay) => {
                const pct = pay.amount > 0 ? Math.round((pay.paidAmount / pay.amount) * 100) : 0;
                const isOD = pay.status === "overdue";
                return (
                  <div key={pay.id} className="p-3 rounded-xl" style={{ background: isOD ? "#FFF5F5" : "#F8FAFC", border: `1px solid ${isOD ? "#FED7D7" : "#E8EDF3"}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-neutral-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        ₹{pay.amount.toLocaleString("en-IN")} — {pay.type === "advance" ? "Advance" : pay.type === "balance" ? "Balance" : "Full"}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: pay.status === "paid" ? "rgba(22,163,74,0.10)" : isOD ? "rgba(220,38,38,0.10)" : "rgba(217,119,6,0.10)", color: pay.status === "paid" ? "#15803D" : isOD ? "#DC2626" : "#B45309" }}>
                        {pay.status === "paid" ? "Paid" : isOD ? "Overdue" : pay.status === "partial" ? "Partial" : "Pending"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E8EDF3" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pay.status === "paid" ? "#22C55E" : isOD ? "#EF4444" : "#F59E0B" }} />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      ₹{pay.paidAmount.toLocaleString("en-IN")} paid · Due {fmtDate(pay.dueDate)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent submissions */}
      {mySubmissions.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <div className="flex items-center gap-2">
                <FileText size={14} strokeWidth={2} style={{ color: "#6D28D9" }} />
                <h3 className="text-sm font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Your Submissions</h3>
              </div>
              <button onClick={() => navigate("/crm/client/project")} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#1E3A8A" }}>
                View all <ArrowRight size={11} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {mySubmissions.slice().reverse().slice(0, 4).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl gap-3"
                  style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{sub.title ?? sub.description}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{sub.submittedAt}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: sub.status === "approved" ? "rgba(22,163,74,0.10)" : sub.status === "rejected" ? "rgba(220,38,38,0.10)" : "rgba(217,119,6,0.10)", color: sub.status === "approved" ? "#15803D" : sub.status === "rejected" ? "#DC2626" : "#B45309" }}>
                    {sub.status === "approved" ? "Approved" : sub.status === "rejected" ? "Rejected" : "Under Review"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
