import { useCRMStore } from "@/store/useCRMStore";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Clock, AlertTriangle, TrendingUp, ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PAYMENT_CFG: Record<string, { label:string; bg:string; color:string; border:string; icon: React.ReactNode }> = {
  pending: { label:"Pending",  bg:"#F8FAFC", color:"#64748B", border:"#E8EDF3", icon:<Clock size={16} style={{color:"#94A3B8"}} /> },
  partial: { label:"Partial",  bg:"#FFFBEB", color:"#92400E", border:"#FDE68A", icon:<TrendingUp size={16} style={{color:"#B45309"}} /> },
  paid:    { label:"Paid",     bg:"#F0FDF4", color:"#15803D", border:"#BBF7D0", icon:<CheckCircle2 size={16} style={{color:"#22C55E"}} /> },
  overdue: { label:"Overdue",  bg:"#FFF5F5", color:"#B91C1C", border:"#FCA5A5", icon:<AlertTriangle size={16} style={{color:"#EF4444"}} /> },
};

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

const cv = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:0.07}} };
const iv = { hidden:{opacity:0,y:10}, visible:{opacity:1,y:0,transition:{duration:0.4,ease:[0,0,0.2,1]}} };

export default function ClientPayments() {
  const navigate      = useNavigate();
  const users         = useCRMStore((s) => s.users);
  const clients       = useCRMStore((s) => s.clients);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser   = users.find((u) => u.id === currentUserId);
  const currentClient = currentUser?.clientId ? clients.find((c) => c.id === currentUser.clientId) : undefined;
  const payments      = useCRMStore((s) => s.payments);
  const projects      = useCRMStore((s) => s.projects);

  if (!currentClient || currentUser?.role !== "client") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <CreditCard size={32} style={{ color:"#CBD5E1" }} className="mb-3" />
        <p className="text-sm" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>No client session found.</p>
      </div>
    );
  }

  const myPayments = payments.filter((p) => p.clientId === currentClient.id);
  const myProjects = projects.filter((p) => p.clientId === currentClient.id);

  const totalAmount  = myPayments.reduce((a, p) => a + p.amount, 0);
  const totalPaid    = myPayments.reduce((a, p) => a + p.paidAmount, 0);
  const totalPending = totalAmount - totalPaid;
  const hasOverdue   = myPayments.some((p) => p.status === "overdue");

  const getProjectTitle = (id: string) => myProjects.find((p) => p.id === id)?.title ?? "Project";

  return (
    <motion.div variants={cv} initial="hidden" animate="visible">

      <motion.div variants={iv} className="mb-7">
        <h1 className="text-2xl font-bold" style={{ fontFamily:"'Sora',sans-serif", color:"#0F172A", letterSpacing:"-0.02em" }}>
          Payments
        </h1>
        <p className="text-sm mt-1" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
          Complete payment history and balance for your account
        </p>
      </motion.div>

      {/* ── Summary cards ──────────────────────────────── */}
      <motion.div variants={iv} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        {[
          { label:"Total Project Value", value:fmt(totalAmount), accent:"#1E3A8A", sub:`${myPayments.length} invoice${myPayments.length!==1?"s":""}` },
          { label:"Amount Paid",         value:fmt(totalPaid),   accent:"#15803D", sub:`${totalAmount>0?Math.round(totalPaid/totalAmount*100):0}% of total` },
          { label:"Balance Due",         value:fmt(totalPending),accent:hasOverdue?"#B91C1C":"#B45309", sub:hasOverdue?"Payment overdue":"Outstanding" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5"
            style={{ border:"1px solid #E8EDF3", boxShadow:"0 1px 4px rgba(15,27,76,0.06)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>
              {s.label}
            </p>
            <p className="text-2xl font-bold" style={{ fontFamily:"'JetBrains Mono',monospace", color:s.accent, letterSpacing:"-0.02em" }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>{s.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Progress bar overall ───────────────────────── */}
      {totalAmount > 0 && (
        <motion.div variants={iv} className="bg-white rounded-2xl p-5 mb-7"
          style={{ border:"1px solid #E8EDF3" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>Payment Progress</p>
            <p className="text-sm font-bold" style={{ fontFamily:"'JetBrains Mono',monospace", color:"#1E3A8A" }}>
              {fmt(totalPaid)} / {fmt(totalAmount)}
            </p>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background:"#F1F5F9" }}>
            <motion.div className="h-full rounded-full"
              initial={{ width:0 }}
              animate={{ width:`${Math.min(100, Math.round(totalPaid/totalAmount*100))}%` }}
              transition={{ duration:0.8, ease:[0,0,0.2,1], delay:0.3 }}
              style={{ background:"linear-gradient(90deg,#15803D,#22C55E)" }} />
          </div>
        </motion.div>
      )}

      {/* ── Overdue alert ─────────────────────────────── */}
      {hasOverdue && (
        <motion.div variants={iv} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-6"
          style={{ background:"#FFF5F5", border:"1px solid #FCA5A5" }}>
          <AlertTriangle size={18} style={{ color:"#EF4444" }} className="flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color:"#B91C1C", fontFamily:"'DM Sans',sans-serif" }}>Payment Overdue</p>
            <p className="text-xs mt-0.5" style={{ color:"#DC2626", fontFamily:"'DM Sans',sans-serif" }}>
              One or more payments are overdue. Please contact your manager to arrange payment.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Payment history ───────────────────────────── */}
      <motion.div variants={iv} className="bg-white rounded-2xl overflow-hidden"
        style={{ border:"1px solid #E8EDF3", boxShadow:"0 1px 4px rgba(15,27,76,0.06)" }}>
        <div className="px-5 py-4" style={{ borderBottom:"1px solid #F1F5F9" }}>
          <h2 className="text-sm font-bold" style={{ color:"#0F172A", fontFamily:"'Sora',sans-serif" }}>Invoice History</h2>
        </div>

        {myPayments.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <CreditCard size={24} style={{ color:"#CBD5E1" }} className="mb-2" />
            <p className="text-sm font-medium" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>No invoices yet</p>
            <p className="text-xs mt-0.5" style={{ color:"#CBD5E1", fontFamily:"'DM Sans',sans-serif" }}>
              Payment invoices will appear here
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {myPayments.map((pay) => {
              const pcfg = PAYMENT_CFG[pay.status] ?? PAYMENT_CFG.pending;
              const projectTitle = getProjectTitle(pay.projectId);
              return (
                <div key={pay.id} className="rounded-2xl overflow-hidden"
                  style={{ background:pcfg.bg, border:`1px solid ${pcfg.border}` }}>
                  <div className="p-4 flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(255,255,255,0.7)", border:`1px solid ${pcfg.border}` }}>
                        {pcfg.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold capitalize" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>
                            {pay.type} Payment
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background:"rgba(255,255,255,0.8)", color:pcfg.color }}>{pcfg.label}</span>
                        </div>
                        <p className="text-xs mt-0.5 truncate" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
                          {projectTitle}
                        </p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
                            <Calendar size={11} /> Due: {pay.dueDate}
                          </span>
                          {pay.paidDate && (
                            <span className="flex items-center gap-1 text-xs" style={{ color:"#15803D" }}>
                              <CheckCircle2 size={11} /> Paid: {pay.paidDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right — amounts */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold" style={{ fontFamily:"'JetBrains Mono',monospace", color:"#0F172A" }}>
                        {fmt(pay.amount)}
                      </p>
                      {pay.paidAmount > 0 && pay.paidAmount < pay.amount && (
                        <p className="text-xs mt-1" style={{ color:"#15803D", fontFamily:"'JetBrains Mono',monospace" }}>
                          {fmt(pay.paidAmount)} paid
                        </p>
                      )}
                      {pay.status === "paid" && (
                        <p className="text-xs mt-1" style={{ color:"#22C55E", fontFamily:"'DM Sans',sans-serif" }}>
                          ✓ Received
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {pay.notes && (
                    <div className="px-4 pb-3">
                      <p className="text-xs italic" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>{pay.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Payment help */}
      <motion.div variants={iv} className="mt-6 flex items-center gap-3 px-4 py-3.5 rounded-2xl"
        style={{ background:"#EFF6FF", border:"1px solid #BFDBFE" }}>
        <CreditCard size={16} style={{ color:"#1E3A8A" }} />
        <p className="text-sm" style={{ color:"#1E3A8A", fontFamily:"'DM Sans',sans-serif" }}>
          To make a payment or discuss your invoice, contact your manager on WhatsApp or via the Support page.
        </p>
        <button onClick={() => navigate("/crm/client/support")}
          className="ml-auto flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color:"#1E3A8A" }}>
          Support <ArrowRight size={12} />
        </button>
      </motion.div>
    </motion.div>
  );
}
