import { useState } from "react";
import { useCRMStore } from "@/store/useCRMStore";
import { motion } from "framer-motion";
import {
  MessageSquare, Phone, Mail, Clock,
  Send, CheckCircle2, User, ShieldCheck,
  Building2, HelpCircle, ChevronDown,
} from "lucide-react";

const cv = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:0.07}} };
const iv = { hidden:{opacity:0,y:10}, visible:{opacity:1,y:0,transition:{duration:0.4,ease:[0,0,0.2,1]}} };

const FAQ = [
  { q: "How long does Section 8 registration take?",    a: "Typically 15–21 working days from document submission." },
  { q: "What documents do I need to submit?",           a: "Director's Aadhaar, PAN, photo, and address proof. Your manager will provide a specific checklist." },
  { q: "When do I need to pay the balance?",            a: "The balance payment is due after your documents are approved and before final filing." },
  { q: "Can I track my application status?",            a: "Yes — your Project page shows real-time progress and all team updates." },
  { q: "What happens after the certificate is issued?", a: "Your manager will share the certificate and guide you on next steps like 12A and 80G applications." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border:"1px solid #E8EDF3" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left transition-colors"
        style={{ background: open ? "#F0F7FF" : "#FFFFFF" }}
      >
        <span className="text-sm font-semibold" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>{q}</span>
        <ChevronDown size={16} style={{ color:"#94A3B8", transform: open ? "rotate(180deg)" : "none", transition:"transform 0.2s", flexShrink:0 }} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0" style={{ background:"#F0F7FF", borderTop:"1px solid #DBEAFE" }}>
          <p className="text-sm leading-relaxed" style={{ color:"#334155", fontFamily:"'DM Sans',sans-serif" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function ClientSupport() {
  const [msgSent, setMsgSent] = useState(false);
  const [msg, setMsg] = useState("");

  const users         = useCRMStore((s) => s.users);
  const clients       = useCRMStore((s) => s.clients);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser   = users.find((u) => u.id === currentUserId);
  const currentClient = currentUser?.clientId ? clients.find((c) => c.id === currentUser.clientId) : undefined;
  const projects      = useCRMStore((s) => s.projects);
  const allUpdates    = useCRMStore((s) => s.updates);
  const addUpdate     = useCRMStore((s) => s.addUpdate);

  if (!currentClient || currentUser?.role !== "client") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <HelpCircle size={32} style={{ color:"#CBD5E1" }} className="mb-3" />
        <p className="text-sm" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>No client session found.</p>
      </div>
    );
  }

  const myProjects = projects.filter((p) => p.clientId === currentClient.id);
  const myUpdates  = allUpdates.filter((u) => myProjects.some((p) => p.id === u.projectId) && u.visibleToClient);

  const handleSend = () => {
    if (!msg.trim() || myProjects.length === 0) return;
    addUpdate({
      projectId: myProjects[0].id,
      from: currentUser!.id,
      fromType: "client",
      message: msg.trim(),
      date: new Date().toISOString().split("T")[0],
      visibleToClient: true,
    });
    setMsgSent(true);
    setMsg("");
  };

  return (
    <motion.div variants={cv} initial="hidden" animate="visible">

      <motion.div variants={iv} className="mb-7">
        <h1 className="text-2xl font-bold" style={{ fontFamily:"'Sora',sans-serif", color:"#0F172A", letterSpacing:"-0.02em" }}>
          Support
        </h1>
        <p className="text-sm mt-1" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
          Get help, view communication history, or ask your manager a question
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* ── Contact options ──────────────────────────── */}
        <motion.div variants={iv} className="space-y-3">
          <h2 className="text-sm font-bold mb-3" style={{ color:"#0F172A", fontFamily:"'Sora',sans-serif" }}>Contact Your Team</h2>
          {[
            {
              icon: <MessageSquare size={18} />,
              label: "WhatsApp",
              sub: "Fastest — usually responds within 2 hrs",
              href: "https://wa.me/918793949471?text=Hi%20KlawTax!%20I%20need%20help%20with%20my%20project.",
              accent: "#22C55E",
              bg: "#F0FDF4",
              border: "#BBF7D0",
              external: true,
            },
            {
              icon: <Phone size={18} />,
              label: "+91 87939 49471",
              sub: "Mon–Sat, 10 AM – 7 PM IST",
              href: "tel:+918793949471",
              accent: "#1E3A8A",
              bg: "#EFF6FF",
              border: "#BFDBFE",
              external: false,
            },
            {
              icon: <Mail size={18} />,
              label: "klawtaxindia@gmail.com",
              sub: "For detailed queries and document sharing",
              href: "mailto:klawtaxindia@gmail.com",
              accent: "#7C3AED",
              bg: "#EDE9FE",
              border: "#DDD6FE",
              external: false,
            },
          ].map((c) => (
            <a key={c.label} href={c.href} target={c.external ? "_blank" : undefined}
              rel={c.external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200"
              style={{ background:c.bg, border:`1px solid ${c.border}`, textDecoration:"none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.filter = "brightness(0.97)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.filter = "none")}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:"rgba(255,255,255,0.7)", border:`1px solid ${c.border}` }}>
                <span style={{ color:c.accent }}>{c.icon}</span>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color:"#0F172A", fontFamily:"'DM Sans',sans-serif" }}>{c.label}</p>
                <p className="text-xs mt-0.5" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>{c.sub}</p>
              </div>
            </a>
          ))}
        </motion.div>

        {/* ── Message your manager ─────────────────────── */}
        <motion.div variants={iv} className="bg-white rounded-2xl overflow-hidden"
          style={{ border:"1px solid #E8EDF3", boxShadow:"0 1px 4px rgba(15,27,76,0.05)" }}>
          <div className="px-5 py-4" style={{ borderBottom:"1px solid #F1F5F9" }}>
            <h2 className="text-sm font-bold" style={{ color:"#0F172A", fontFamily:"'Sora',sans-serif" }}>Send a Message</h2>
            <p className="text-xs mt-0.5" style={{ color:"#94A3B8", fontFamily:"'DM Sans',sans-serif" }}>
              Leave a note for your project manager
            </p>
          </div>

          {msgSent ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-6">
              <CheckCircle2 size={32} style={{ color:"#22C55E" }} className="mb-3" />
              <h3 className="text-base font-bold mb-1" style={{ color:"#0F172A", fontFamily:"'Sora',sans-serif" }}>Message Sent</h3>
              <p className="text-sm" style={{ color:"#64748B", fontFamily:"'DM Sans',sans-serif" }}>
                Your team will review and respond shortly.
              </p>
              <button onClick={() => setMsgSent(false)}
                className="mt-5 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background:"#EFF6FF", color:"#1E3A8A" }}>
                Send Another
              </button>
            </div>
          ) : (
            <div className="p-5">
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Write your message or question here…"
                rows={5}
                className="w-full p-3.5 rounded-xl text-sm resize-none focus:outline-none transition-all"
                style={{ border:"1.5px solid #E8EDF3", color:"#0F172A", fontFamily:"'DM Sans',sans-serif",
                  lineHeight:1.6, background:"#F8FAFC" }}
                onFocus={(e) => { e.currentTarget.style.borderColor="#BFDBFE"; e.currentTarget.style.background="#FFFFFF"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor="#E8EDF3"; e.currentTarget.style.background="#F8FAFC"; }}
              />
              <button onClick={handleSend} disabled={!msg.trim() || myProjects.length === 0}
                className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: msg.trim() && myProjects.length > 0 ? "linear-gradient(90deg,#1E3A8A,#2563EB)" : "#F1F5F9",
                  color: msg.trim() && myProjects.length > 0 ? "#FFFFFF" : "#94A3B8",
                  boxShadow: msg.trim() && myProjects.length > 0 ? "0 4px 14px rgba(30,58,138,0.25)" : "none",
                  cursor: msg.trim() && myProjects.length > 0 ? "pointer" : "not-allowed",
                  fontFamily:"'DM Sans',sans-serif",
                }}>
                <Send size={14} /> Send Message
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Communication history ─────────────────────── */}
      {myUpdates.length > 0 && (
        <motion.div variants={iv} className="bg-white rounded-2xl overflow-hidden mb-6"
          style={{ border:"1px solid #E8EDF3" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom:"1px solid #F1F5F9" }}>
            <Clock size={15} style={{ color:"#1E3A8A" }} />
            <h2 className="text-sm font-bold" style={{ color:"#0F172A", fontFamily:"'Sora',sans-serif" }}>
              Communication History
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background:"#EFF6FF", color:"#1E3A8A" }}>{myUpdates.length}</span>
          </div>
          <div className="p-5 space-y-3">
            {[...myUpdates].reverse().slice(0, 6).map((u) => {
              const isClient   = u.fromType === "client";
              const isAdmin    = u.fromType === "admin";
              const bg         = isClient ? "#F0F7FF" : isAdmin ? "#FFFBEB" : "#F8FAFC";
              const border     = isClient ? "#BFDBFE" : isAdmin ? "#FDE68A" : "#E8EDF3";
              const tagBg      = isClient ? "#EFF6FF" : isAdmin ? "#FEF3C7" : "#F1F5F9";
              const tagColor   = isClient ? "#1E3A8A"  : isAdmin ? "#92400E" : "#64748B";
              const TagIcon    = isClient ? User : isAdmin ? ShieldCheck : Building2;
              const tagLabel   = isClient ? "You" : isAdmin ? "Admin" : "Team";
              return (
                <div key={u.id} className="p-3.5 rounded-xl" style={{ background:bg, border:`1px solid ${border}` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background:tagBg }}>
                      <TagIcon size={11} style={{ color:tagColor }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color:tagColor }}>{tagLabel}</span>
                    <span className="text-xs" style={{ color:"#94A3B8" }}>· {u.date}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color:"#334155", fontFamily:"'DM Sans',sans-serif" }}>{u.message}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── FAQ ──────────────────────────────────────── */}
      <motion.div variants={iv}>
        <h2 className="text-sm font-bold mb-4" style={{ color:"#0F172A", fontFamily:"'Sora',sans-serif" }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQ.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </motion.div>
    </motion.div>
  );
}
