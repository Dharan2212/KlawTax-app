import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCRMStore } from "@/store/useCRMStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Upload, ArrowLeft, CheckCircle2,
  AlertCircle, Clock, FileText, XCircle,
} from "lucide-react";

const iv = { hidden:{opacity:0,y:10}, visible:{opacity:1,y:0,transition:{duration:0.4,ease:[0,0,0.2,1]}} };
const cv = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:0.07}} };

export default function ClientSubmission() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const users         = useCRMStore((s) => s.users);
  const clients       = useCRMStore((s) => s.clients);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser   = users.find((u) => u.id === currentUserId);
  const currentClient = currentUser?.clientId ? clients.find((c) => c.id === currentUser.clientId) : undefined;
  const projects      = useCRMStore((s) => s.projects.filter((p) => p.clientId === currentClient?.id));
  const submissions   = useCRMStore((s) => s.clientSubmissions.filter((s) => s.clientId === currentClient?.id));
  const addClientSubmission = useCRMStore((s) => s.addClientSubmission);

  if (!currentClient || currentUser?.role !== "client") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertCircle size={32} style={{ color:"#CBD5E1" }} className="mb-3" />
        <p className="text-sm" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>No client session found.</p>
      </div>
    );
  }

  const project = projects[0];

  const handleSubmit = () => {
    if (!message.trim() || !project) return;
    addClientSubmission({
      clientId: currentClient.id,
      projectId: project.id,
      title: "Document Submission",
      description: message.trim(),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div variants={iv} initial="hidden" animate="visible"
        className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-white rounded-3xl p-12 max-w-md mx-auto"
          style={{ border:"1px solid #BBF7D0", boxShadow:"0 4px 24px rgba(21,128,61,0.10)" }}>
          <motion.div
            initial={{ scale:0 }}
            animate={{ scale:1 }}
            transition={{ type:"spring", stiffness:200, damping:15, delay:0.1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background:"#DCFCE7" }}>
            <CheckCircle2 size={32} style={{ color:"#15803D" }} />
          </motion.div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily:"'Sora',sans-serif", color:"#0F172A" }}>
            Submission Sent!
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
            Your update has been sent to your team for review. It will appear in the project timeline once approved.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => { setSubmitted(false); setMessage(""); }}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background:"linear-gradient(90deg,#1E3A8A,#2563EB)", color:"#FFFFFF",
                boxShadow:"0 4px 14px rgba(30,58,138,0.25)", fontFamily:"'DM Sans',sans-serif" }}>
              Submit Another
            </button>
            <button onClick={() => navigate("/crm/client/project")}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background:"#F1F5F9", color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
              View Project
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={cv} initial="hidden" animate="visible">

      <motion.div variants={iv} className="mb-5">
        <button onClick={() => navigate("/crm/client")} className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
          <ArrowLeft size={14} /> Dashboard
        </button>
      </motion.div>

      <motion.div variants={iv} className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily:"'Sora',sans-serif", color:"#0F172A", letterSpacing:"-0.02em" }}>
          Submit Update
        </h1>
        <p className="text-sm mt-1" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
          Send documents or a message to your team
        </p>
      </motion.div>

      {/* Info banner */}
      <motion.div variants={iv} className="flex items-start gap-3 px-4 py-4 rounded-2xl mb-6"
        style={{ background:"#EFF6FF", border:"1px solid #BFDBFE" }}>
        <AlertCircle size={16} style={{ color:"#1E3A8A", flexShrink:0, marginTop:"1px" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color:"#1E3A8A", fontFamily:"'DM Sans',sans-serif" }}>
            Submissions are reviewed
          </p>
          <p className="text-xs mt-0.5" style={{ color:"#3B82F6", fontFamily:"'DM Sans',sans-serif" }}>
            All updates go through an approval process before appearing in your timeline.
          </p>
        </div>
      </motion.div>

      {/* Project context */}
      {project && (
        <motion.div variants={iv} className="flex items-center gap-3 p-4 rounded-2xl mb-6"
          style={{ background:"#F8FAFC", border:"1px solid #E8EDF3" }}>
          <FileText size={16} style={{ color:"#64748B" }} />
          <div>
            <p className="text-xs" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>Submitting for</p>
            <p className="text-sm font-semibold" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>{project.title}</p>
          </div>
        </motion.div>
      )}

      {!project && (
        <motion.div variants={iv} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-6"
          style={{ background:"#FEF3C7", border:"1px solid #FDE68A" }}>
          <AlertCircle size={16} style={{ color:"#B45309" }} />
          <p className="text-sm" style={{ color:"#92400E", fontFamily:"'DM Sans',sans-serif" }}>No active project found. Contact your manager.</p>
        </motion.div>
      )}

      {/* Message area */}
      <motion.div variants={iv} className="bg-white rounded-2xl p-5 mb-5"
        style={{ border:"1px solid #E8EDF3", boxShadow:"0 1px 4px rgba(15,27,76,0.05)" }}>
        <label className="block text-sm font-semibold mb-3" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>
          Message / Update
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe what you're submitting, any questions, or progress updates for your team…"
          rows={5}
          className="w-full p-3.5 rounded-xl text-sm resize-none focus:outline-none transition-all"
          style={{ border:"1.5px solid #E8EDF3", color:"#0F172A", fontFamily:"'DM Sans',sans-serif",
            lineHeight:1.6, background:"#F8FAFC" }}
          onFocus={(e) => { e.currentTarget.style.borderColor="#BFDBFE"; e.currentTarget.style.background="#FFFFFF"; e.currentTarget.style.boxShadow="0 0 0 3px rgba(59,130,246,0.10)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor="#E8EDF3"; e.currentTarget.style.background="#F8FAFC"; e.currentTarget.style.boxShadow="none"; }}
        />
        <p className="text-right text-xs mt-1.5" style={{ color: message.length > 0 ? "#64748B" : "#CBD5E1", fontFamily:"'DM Sans',sans-serif" }}>
          {message.length} characters
        </p>
      </motion.div>

      {/* File upload area */}
      <motion.div variants={iv} className="bg-white rounded-2xl p-5 mb-6"
        style={{ border:"1px solid #E8EDF3" }}>
        <label className="block text-sm font-semibold mb-3" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>
          Attachments <span className="text-xs font-normal" style={{ color:"#94A3B8" }}>(optional)</span>
        </label>
        <div
          className="flex flex-col items-center py-8 px-6 rounded-xl text-center cursor-pointer transition-all"
          style={{ border:"2px dashed #CBD5E1", background:"#F8FAFC" }}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor="#3B82F6"; e.currentTarget.style.background="#EFF6FF"; }}
          onDragLeave={(e) => { e.currentTarget.style.borderColor="#CBD5E1"; e.currentTarget.style.background="#F8FAFC"; }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background:"#F1F5F9" }}>
            <Upload size={20} style={{ color:"#94A3B8" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>
            Drop files here or browse
          </p>
          <p className="text-xs mb-3" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>
            PDF, JPG, PNG — max 5MB each
          </p>
          <button className="px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background:"#EFF6FF", color:"#1E3A8A", border:"1px solid #BFDBFE" }}>
            Select Files
          </button>
        </div>
        <p className="text-xs mt-3" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>
          You can also share files directly on WhatsApp for faster processing.
        </p>
      </motion.div>

      {/* Submit */}
      <motion.div variants={iv}>
        <button onClick={handleSubmit} disabled={!message.trim() || !project}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all duration-200"
          style={{
            background: message.trim() && project ? "linear-gradient(90deg,#1E3A8A,#2563EB)" : "#F1F5F9",
            color: message.trim() && project ? "#FFFFFF" : "#94A3B8",
            boxShadow: message.trim() && project ? "0 4px 16px rgba(30,58,138,0.28)" : "none",
            cursor: message.trim() && project ? "pointer" : "not-allowed",
            fontFamily:"'DM Sans',sans-serif",
          }}>
          <Send size={16} />
          Submit for Review
        </button>
        <p className="text-center text-xs mt-2" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>
          Your team will be notified immediately
        </p>
      </motion.div>

      {/* Past submissions */}
      {submissions.length > 0 && (
        <motion.div variants={iv} className="mt-8 bg-white rounded-2xl overflow-hidden"
          style={{ border:"1px solid #E8EDF3" }}>
          <div className="px-5 py-4" style={{ borderBottom:"1px solid #F1F5F9" }}>
            <h3 className="text-sm font-bold" style={{ color:"#0F172A", fontFamily:"'Sora',sans-serif" }}>
              Previous Submissions
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {[...submissions].reverse().slice(0, 5).map((sub) => {
              const isApproved = sub.status === "approved";
              const isRejected = sub.status === "rejected";
              return (
                <div key={sub.id} className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: isApproved ? "#F0FDF4" : isRejected ? "#FFF5F5" : "#F8FAFC",
                    border:`1px solid ${isApproved ? "#BBF7D0" : isRejected ? "#FCA5A5" : "#E8EDF3"}` }}>
                  {isApproved ? <CheckCircle2 size={15} style={{ color:"#22C55E", flexShrink:0 }} />
                    : isRejected ? <XCircle size={15} style={{ color:"#EF4444", flexShrink:0 }} />
                    : <Clock size={15} style={{ color:"#F59E0B", flexShrink:0 }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>
                      {sub.description}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color:"#94A3B8" }}>{sub.submittedAt}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: isApproved ? "#DCFCE7" : isRejected ? "#FEE2E2" : "#FEF3C7",
                      color: isApproved ? "#15803D" : isRejected ? "#B91C1C" : "#92400E" }}>
                    {isApproved ? "Approved" : isRejected ? "Rejected" : "Reviewing"}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
