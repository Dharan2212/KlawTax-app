import { useCRMStore } from "@/store/useCRMStore";
import { motion } from "framer-motion";
import {
  FileText, CheckCircle2, XCircle, Clock,
  Download, FileCheck, FolderOpen, Lock,
} from "lucide-react";

const SUB_CFG: Record<string, { label:string; bg:string; color:string; border:string; icon: React.ReactNode }> = {
  pending:  { label:"Under Review", bg:"#FFFBEB", color:"#92400E", border:"#FDE68A", icon:<Clock size={14} style={{color:"#B45309"}} /> },
  approved: { label:"Approved",     bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0", icon:<CheckCircle2 size={14} style={{color:"#22C55E"}} /> },
  rejected: { label:"Rejected",     bg:"#FFF5F5", color:"#B91C1C", border:"#FCA5A5", icon:<XCircle size={14} style={{color:"#EF4444"}} /> },
};

const cv = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:0.07}} };
const iv = { hidden:{opacity:0,y:10}, visible:{opacity:1,y:0,transition:{duration:0.4,ease:[0,0,0.2,1]}} };

export default function ClientDocuments() {
  const users         = useCRMStore((s) => s.users);
  const clients       = useCRMStore((s) => s.clients);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser   = users.find((u) => u.id === currentUserId);
  const currentClient = currentUser?.clientId ? clients.find((c) => c.id === currentUser.clientId) : undefined;
  const submissions   = useCRMStore((s) => s.clientSubmissions);
  const projects      = useCRMStore((s) => s.projects);

  if (!currentClient || currentUser?.role !== "client") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Lock size={32} style={{ color:"#CBD5E1" }} className="mb-3" />
        <p className="text-sm" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>No client session found.</p>
      </div>
    );
  }

  const mySubmissions = submissions.filter((s) => s.clientId === currentClient.id);
  const myProjects    = projects.filter((p) => p.clientId === currentClient.id);

  const approved = mySubmissions.filter((s) => s.status === "approved");
  const pending  = mySubmissions.filter((s) => s.status === "pending");
  const rejected = mySubmissions.filter((s) => s.status === "rejected");

  const getProjectTitle = (id: string) => myProjects.find((p) => p.id === id)?.title ?? "Project";

  // Simulated deliverable documents available when project progresses
  const deliverables = myProjects
    .filter((p) => p.progress >= 50)
    .map((p) => ({
      id: `del-${p.id}`,
      name: `${p.title} — Progress Report`,
      type: "Progress Report",
      project: p.title,
      available: true,
    }));

  const certificates = myProjects
    .filter((p) => p.status === "completed")
    .map((p) => ({
      id: `cert-${p.id}`,
      name: `${p.title} — Completion Certificate`,
      type: "Certificate",
      project: p.title,
      available: true,
    }));

  return (
    <motion.div variants={cv} initial="hidden" animate="visible">

      <motion.div variants={iv} className="mb-7">
        <h1 className="text-2xl font-bold" style={{ fontFamily:"'Sora',sans-serif", color:"#0F172A", letterSpacing:"-0.02em" }}>
          Documents
        </h1>
        <p className="text-sm mt-1" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
          All your submitted files and downloadable reports
        </p>
      </motion.div>

      {/* ── Summary badges ─────────────────────────────── */}
      <motion.div variants={iv} className="flex flex-wrap gap-3 mb-7">
        {[
          { label:"Approved",     count:approved.length, bg:"#DCFCE7", color:"#15803D" },
          { label:"Under Review", count:pending.length,  bg:"#FEF3C7", color:"#92400E" },
          { label:"Rejected",     count:rejected.length, bg:"#FEE2E2", color:"#B91C1C" },
          { label:"Total Submitted", count:mySubmissions.length, bg:"#EFF6FF", color:"#1E3A8A" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{ background:s.bg }}>
            <span className="text-lg font-bold" style={{ fontFamily:"'JetBrains Mono',monospace", color:s.color }}>{s.count}</span>
            <span className="text-xs font-semibold" style={{ color:s.color, fontFamily:"'DM Sans',sans-serif" }}>{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Deliverables (available for download) ──────── */}
      {(deliverables.length > 0 || certificates.length > 0) && (
        <motion.div variants={iv} className="bg-white rounded-2xl overflow-hidden mb-6"
          style={{ border:"1px solid #E8EDF3", boxShadow:"0 1px 4px rgba(15,27,76,0.05)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom:"1px solid #F1F5F9" }}>
            <Download size={15} style={{ color:"#1E3A8A" }} />
            <h2 className="text-sm font-bold" style={{ color:"#0F172A", fontFamily:"'Sora',sans-serif" }}>Available Downloads</h2>
          </div>
          <div className="p-4 space-y-2">
            {[...deliverables, ...certificates].map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3.5 rounded-xl"
                style={{ background:"#F0FDF4", border:"1px solid #BBF7D0" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background:"#DCFCE7" }}>
                    <FileCheck size={16} style={{ color:"#15803D" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>{doc.name}</p>
                    <p className="text-xs mt-0.5" style={{ color:"#64748B" }}>{doc.type} · {doc.project}</p>
                  </div>
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background:"#15803D", color:"#FFFFFF" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#166534")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#15803D")}
                >
                  <Download size={12} />
                  Download
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Submitted Documents ────────────────────────── */}
      <motion.div variants={iv} className="bg-white rounded-2xl overflow-hidden"
        style={{ border:"1px solid #E8EDF3", boxShadow:"0 1px 4px rgba(15,27,76,0.05)" }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom:"1px solid #F1F5F9" }}>
          <FolderOpen size={15} style={{ color:"#7C3AED" }} />
          <h2 className="text-sm font-bold" style={{ color:"#0F172A", fontFamily:"'Sora',sans-serif" }}>Submitted Documents</h2>
          {mySubmissions.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background:"#EDE9FE", color:"#7C3AED" }}>{mySubmissions.length}</span>
          )}
        </div>
        <div className="p-4">
          {mySubmissions.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <FileText size={24} style={{ color:"#CBD5E1" }} className="mb-2" />
              <p className="text-sm font-medium" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>No documents submitted</p>
              <p className="text-xs mt-1" style={{ color:"#CBD5E1", fontFamily:"'DM Sans',sans-serif" }}>
                Use "Submit Update" to send files to your team
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...mySubmissions].reverse().map((sub) => {
                const cfg = SUB_CFG[sub.status] ?? SUB_CFG.pending;
                const projTitle = getProjectTitle(sub.projectId);
                return (
                  <div key={sub.id} className="flex items-start justify-between gap-4 p-4 rounded-xl"
                    style={{ background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background:"rgba(255,255,255,0.7)" }}>
                        {cfg.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>
                          {sub.title}
                        </p>
                        <p className="text-xs mt-0.5 text-ellipsis overflow-hidden whitespace-nowrap max-w-xs"
                          style={{ color:"#64748B" }}>{sub.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs" style={{ color:"#94A3B8" }}>{sub.submittedAt}</span>
                          <span className="text-xs" style={{ color:"#94A3B8" }}>· {projTitle}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background:"rgba(255,255,255,0.7)", color:cfg.color }}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Info note */}
      <motion.div variants={iv} className="mt-5 px-4 py-3 rounded-xl"
        style={{ background:"#F8FAFC", border:"1px solid #E8EDF3" }}>
        <p className="text-xs" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>
          <span className="font-semibold" style={{ color:"#64748B" }}>Note:</span>{" "}
          Submitted documents are reviewed by your team. Approved files may appear as downloadable reports once processed.
          Rejected submissions include a reason from your manager.
        </p>
      </motion.div>
    </motion.div>
  );
}
