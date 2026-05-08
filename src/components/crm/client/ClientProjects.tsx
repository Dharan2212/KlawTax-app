import { useNavigate } from "react-router-dom";
import { useCRMStore } from "@/store/useCRMStore";
import { motion } from "framer-motion";
import {
  FolderKanban, CalendarDays, TrendingUp,
  ArrowRight, AlertCircle, CheckCircle2, CircleDot,
} from "lucide-react";

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; stripe: string }> = {
  pending:         { label: "Pending Start",  bg: "#F1F5F9", color: "#64748B", stripe: "linear-gradient(90deg,#94A3B8,#CBD5E1)" },
  active:          { label: "In Progress",    bg: "#EFF6FF", color: "#1E3A8A", stripe: "linear-gradient(90deg,#1E3A8A,#3B82F6)" },
  "waiting-client":{ label: "Action Needed", bg: "#FEF3C7", color: "#92400E", stripe: "linear-gradient(90deg,#B45309,#F59E0B)" },
  review:          { label: "Under Review",   bg: "#EDE9FE", color: "#4C1D95", stripe: "linear-gradient(90deg,#4C1D95,#7C3AED)" },
  completed:       { label: "Completed",      bg: "#DCFCE7", color: "#15803D", stripe: "linear-gradient(90deg,#15803D,#22C55E)" },
  rejected:        { label: "Rejected",       bg: "#FEE2E2", color: "#B91C1C", stripe: "linear-gradient(90deg,#EF4444,#DC2626)" },
};

const daysLeft = (d: string) =>
  Math.ceil((new Date(d).getTime() - new Date().setHours(0,0,0,0)) / 86400000);

const cv = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:0.08}} };
const iv = { hidden:{opacity:0,y:12}, visible:{opacity:1,y:0,transition:{duration:0.4,ease:[0,0,0.2,1]}} };

export default function ClientProjects() {
  const navigate      = useNavigate();
  const users         = useCRMStore((s) => s.users);
  const clients       = useCRMStore((s) => s.clients);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser   = users.find((u) => u.id === currentUserId);
  const currentClient = currentUser?.clientId ? clients.find((c) => c.id === currentUser.clientId) : undefined;
  const projects      = useCRMStore((s) => s.projects);
  const allUsers      = useCRMStore((s) => s.users);

  if (!currentClient || currentUser?.role !== "client") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertCircle size={32} style={{ color: "#CBD5E1" }} className="mb-3" />
        <p className="text-sm" style={{ color: "#94A3B8", fontFamily: "'DM Sans', sans-serif" }}>
          No client session found.
        </p>
      </div>
    );
  }

  const myProjects = projects.filter((p) => p.clientId === currentClient.id);

  const getAssignedName = (id: string | null) =>
    id ? allUsers.find((u) => u.id === id)?.name ?? "Unassigned" : "Unassigned";

  return (
    <motion.div variants={cv} initial="hidden" animate="visible">
      <motion.div variants={iv} className="mb-7">
        <h1 className="text-2xl font-bold" style={{ fontFamily:"'Sora',sans-serif", color:"#0F172A", letterSpacing:"-0.02em" }}>
          My Projects
        </h1>
        <p className="text-sm mt-1" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
          {myProjects.length} project{myProjects.length !== 1 ? "s" : ""} registered under your account
        </p>
      </motion.div>

      {myProjects.length === 0 ? (
        <motion.div variants={iv}
          className="bg-white rounded-2xl flex flex-col items-center justify-center py-24 text-center"
          style={{ border:"1px solid #E8EDF3" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background:"#F1F5F9" }}>
            <FolderKanban size={26} style={{ color:"#94A3B8" }} />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ fontFamily:"'Sora',sans-serif", color:"#0F172A" }}>
            No Projects Yet
          </h3>
          <p className="text-sm" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>
            Your registered projects will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {myProjects.map((project) => {
            const cfg    = STATUS_CFG[project.status] ?? STATUS_CFG.pending;
            const days   = daysLeft(project.deadline);
            const assignedName = getAssignedName(project.assignedTo);
            const needsAction  = project.status === "waiting-client";

            return (
              <motion.button
                key={project.id}
                variants={iv}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate("/crm/client/project")}
                className="w-full text-left bg-white rounded-2xl overflow-hidden"
                style={{
                  border: needsAction ? "1px solid #FDE68A" : "1px solid #E8EDF3",
                  boxShadow: "0 1px 4px rgba(15,27,76,0.06)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(15,27,76,0.11)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(15,27,76,0.06)"; }}
              >
                {/* Top stripe */}
                <div className="h-1" style={{ background: cfg.stripe }} />

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      {needsAction && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertCircle size={13} style={{ color:"#B45309" }} />
                          <span className="text-xs font-bold" style={{ color:"#B45309", fontFamily:"'DM Sans',sans-serif" }}>
                            Action Required
                          </span>
                        </div>
                      )}
                      <h3 className="text-base font-bold leading-snug" style={{ fontFamily:"'Sora',sans-serif", color:"#0F172A" }}>
                        {project.title}
                      </h3>
                      <p className="text-sm mt-0.5" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
                        {project.serviceType}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background:cfg.bg, color:cfg.color, fontFamily:"'DM Sans',sans-serif" }}>
                        {cfg.label}
                      </span>
                      <ArrowRight size={16} style={{ color:"#CBD5E1" }} />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4 p-3.5 rounded-xl" style={{ background:"#F8FAFC" }}>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color:"#94A3B8" }}>Manager</p>
                      <p className="text-sm font-medium" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>
                        {assignedName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color:"#94A3B8" }}>Deadline</p>
                      <p className="text-sm font-medium flex items-center gap-1"
                        style={{ color: days < 0 ? "#B91C1C" : days <= 7 ? "#B45309" : "#0F172A", fontFamily:"'DM Sans',sans-serif" }}>
                        <CalendarDays size={12} />
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d left`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color:"#94A3B8" }}>Progress</p>
                      <p className="text-sm font-bold" style={{ fontFamily:"'JetBrains Mono',monospace", color:"#1E3A8A" }}>
                        {project.progress}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background:"#F1F5F9" }}>
                    <div className="h-full rounded-full" style={{
                      width:`${project.progress}%`,
                      background: project.status === "completed"
                        ? "linear-gradient(90deg,#15803D,#22C55E)"
                        : "linear-gradient(90deg,#1E3A8A,#3B82F6)",
                    }} />
                  </div>

                  {/* Stage indicators */}
                  <div className="flex items-center gap-4 mt-4">
                    {[
                      { icon: <CircleDot size={13} />,    label: "Started",   done: project.progress > 0 },
                      { icon: <TrendingUp size={13} />,   label: "In Work",   done: project.progress > 30 },
                      { icon: <CheckCircle2 size={13} />, label: "Delivered", done: project.status === "completed" },
                    ].map((st) => (
                      <div key={st.label} className="flex items-center gap-1.5">
                        <span style={{ color: st.done ? "#22C55E" : "#CBD5E1" }}>{st.icon}</span>
                        <span className="text-xs" style={{ color: st.done ? "#15803D" : "#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>
                          {st.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
