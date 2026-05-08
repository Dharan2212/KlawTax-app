import { useState } from "react";
import { useCRMStore, type CRMClient } from "@/store/useCRMStore";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import {
  Mail, Phone, FolderKanban, CreditCard, MessageSquare,
  ArrowLeft, Search, MapPin, Calendar,
} from "lucide-react";

function fmtCurrency(n: number) { return `₹${n.toLocaleString("en-IN")}`; }
function fmtDate(d: string) { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }

const CLIENT_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  active:    { label: "Active",    bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  pending:   { label: "Pending",   bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  completed: { label: "Completed", bg: "rgba(37,99,235,0.08)",   color: "#1E3A8A" },
};
const PROJ_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: "Pending",         bg: "rgba(100,116,139,0.10)", color: "#475569" },
  active:           { label: "In Progress",     bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  "waiting-client": { label: "Waiting — Client",bg: "rgba(124,58,237,0.10)", color: "#6D28D9" },
  review:           { label: "Under Review",    bg: "rgba(217,119,6,0.10)",  color: "#B45309" },
  completed:        { label: "Completed",       bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  rejected:         { label: "Rejected",        bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
};
const PAY_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  paid:    { label: "Paid",    bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  partial: { label: "Partial", bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  pending: { label: "Pending", bg: "rgba(100,116,139,0.10)", color: "#475569" },
  overdue: { label: "Overdue", bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
};
const CHANNEL_BADGE: Record<string, { bg: string; color: string }> = {
  whatsapp: { bg: "rgba(22,163,74,0.10)", color: "#15803D" },
  call:     { bg: "rgba(37,99,235,0.10)", color: "#1E3A8A" },
  email:    { bg: "rgba(124,58,237,0.10)",color: "#6D28D9" },
  note:     { bg: "rgba(100,116,139,0.10)",color: "#475569" },
};

type TabType = "projects" | "payments" | "communication";

function ClientDetailView({ client, onBack }: { client: CRMClient; onBack: () => void }) {
  const [tab, setTab] = useState<TabType>("projects");
  const [commMsg, setCommMsg] = useState("");
  const projects    = useCRMStore((s) => s.projects.filter((p) => p.clientId === client.id));
  const payments    = useCRMStore((s) => s.payments.filter((p) => p.clientId === client.id));
  const comms       = useCRMStore((s) => s.communicationLog.filter((c) => c.clientId === client.id));
  const users       = useCRMStore((s) => s.users);
  const addComm     = useCRMStore((s) => s.addCommunication);

  const getUserName = (id: string | null) => !id ? "Unassigned" : users.find((u) => u.id === id)?.name ?? "Unassigned";
  const sc = CLIENT_STATUS[client.status] ?? CLIENT_STATUS.pending;

  const totalPaid = payments.reduce((s, p) => s + p.paidAmount, 0);
  const totalAmt  = payments.reduce((s, p) => s + p.amount, 0);

  const TABS: { key: TabType; label: string; count: number }[] = [
    { key: "projects",      label: "Projects",      count: projects.length },
    { key: "payments",      label: "Payments",      count: payments.length },
    { key: "communication", label: "Comms",         count: comms.length },
  ];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
        style={{ color: "#1E3A8A" }}>
        <ArrowLeft size={13} strokeWidth={2.5} /> Back to Clients
      </button>

      {/* Client header card */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #1E3A8A, #6D28D9)", fontFamily: "'Sora', sans-serif" }}>
                {client.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>{client.name}</h2>
                <p className="text-xs text-neutral-400">{client.service}</p>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: sc.bg, color: sc.color, fontFamily: "'DM Sans', sans-serif" }}>{sc.label}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Mail size={12} strokeWidth={2} />, value: client.email },
            { icon: <Phone size={12} strokeWidth={2} />, value: client.phone },
            { icon: <MapPin size={12} strokeWidth={2} />, value: client.city },
            { icon: <Calendar size={12} strokeWidth={2} />, value: fmtDate(client.createdAt) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-neutral-500 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span className="flex-shrink-0 text-neutral-400">{item.icon}</span>
              <span className="truncate">{item.value}</span>
            </div>
          ))}
        </div>
        {payments.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #F1F5F9" }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-neutral-400">Revenue collected</p>
              <p className="text-xs font-bold font-mono" style={{ color: "#15803D" }}>{fmtCurrency(totalPaid)} / {fmtCurrency(totalAmt)}</p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
              <div className="h-full rounded-full" style={{ width: `${totalAmt > 0 ? Math.round((totalPaid / totalAmt) * 100) : 0}%`, background: "linear-gradient(90deg, #16A34A, #22C55E)" }} />
            </div>
          </div>
        )}
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold flex-1 justify-center transition-all"
            style={{ background: tab === t.key ? "white" : "transparent", color: tab === t.key ? "#1E3A8A" : "#64748B", boxShadow: tab === t.key ? "0 1px 4px rgba(15,27,76,0.08)" : "none", fontFamily: "'DM Sans', sans-serif" }}>
            {t.label}
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: tab === t.key ? "#EFF6FF" : "#E2E8F0", color: tab === t.key ? "#1E3A8A" : "#94A3B8" }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab: Projects */}
      {tab === "projects" && (
        <div className="space-y-3">
          {projects.length === 0 && <p className="text-sm text-neutral-400 text-center py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>No projects for this client</p>}
          {projects.map((p) => {
            const ps = PROJ_STATUS[p.status] ?? PROJ_STATUS.pending;
            return (
              <div key={p.id} className="rounded-xl p-4" style={{ background: "white", border: "1px solid #E8EDF3" }}>
                <div className="flex items-center justify-between mb-2 gap-3">
                  <p className="text-sm font-semibold text-neutral-900 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.title}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2.5">
                  <span>Assigned: {getUserName(p.assignedTo)}</span>
                  <span>Due: {p.deadline}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                  <div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: "linear-gradient(90deg,#1E3A8A,#3B82F6)" }} />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">{p.progress}% complete</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Payments */}
      {tab === "payments" && (
        <div className="space-y-3">
          {payments.length === 0 && <p className="text-sm text-neutral-400 text-center py-8">No payments for this client</p>}
          {payments.map((p) => {
            const ps = PAY_STATUS[p.status] ?? PAY_STATUS.pending;
            return (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "white", border: "1px solid #E8EDF3" }}>
                <div>
                  <p className="text-sm font-bold font-mono text-neutral-900">{fmtCurrency(p.amount)}</p>
                  <p className="text-xs text-neutral-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {p.type === "advance" ? "Advance" : p.type === "balance" ? "Balance" : "Full"} · {p.paidDate ?? p.dueDate}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Communication */}
      {tab === "communication" && (
        <div className="space-y-3">
          {comms.length > 0 && comms.map((c) => {
            const ch = CHANNEL_BADGE[c.channel] ?? CHANNEL_BADGE.note;
            return (
              <div key={c.id} className="p-4 rounded-xl" style={{ background: "white", border: "1px solid #E8EDF3" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: ch.bg, color: ch.color }}>{c.channel}</span>
                  <span className="text-xs font-medium text-neutral-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>{c.from}</span>
                  <span className="text-[10px] text-neutral-400 ml-auto">{c.date}</span>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{c.message}</p>
              </div>
            );
          })}
          {comms.length === 0 && <p className="text-sm text-neutral-400 text-center py-4">No communications yet</p>}
          {/* Add note */}
          <div className="rounded-xl p-4" style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <textarea value={commMsg} onChange={(e) => setCommMsg(e.target.value)} placeholder="Log a call, note, or message…" rows={3}
              className="w-full rounded-xl text-sm p-3 resize-none outline-none transition-all"
              style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", fontFamily: "'DM Sans', sans-serif", color: "#1E293B" }}
              onFocus={(e) => (e.target.style.borderColor = "#1E3A8A")}
              onBlur={(e) => (e.target.style.borderColor = "#E8EDF3")} />
            <button onClick={() => {
              if (!commMsg.trim()) return;
              addComm({ clientId: client.id, from: "Admin", fromType: "admin", channel: "note", message: commMsg.trim(), date: new Date().toISOString().split("T")[0] });
              setCommMsg("");
            }} className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: "#1E3A8A", fontFamily: "'DM Sans', sans-serif" }}>
              Log Note
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function ClientManagement() {
  const clients  = useCRMStore((s) => s.clients);
  const projects = useCRMStore((s) => s.projects);
  const [selected, setSelected] = useState<CRMClient | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  if (selected) return <ClientDetailView client={selected} onBack={() => setSelected(null)} />;

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.service.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
    const matchS = filterStatus === "all" || c.status === filterStatus;
    return matchQ && matchS;
  });

  const getProjectCount = (id: string) => projects.filter((p) => p.clientId === id).length;
  const getActiveCount  = (id: string) => projects.filter((p) => p.clientId === id && ["active","waiting-client","review"].includes(p.status)).length;

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>Client Management</h1>
          <p className="text-neutral-400 text-sm mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{clients.length} total clients · {clients.filter((c) => c.status === "active").length} active</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, service, or city…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm transition-all outline-none"
            style={{ background: "white", border: "1px solid #E8EDF3", fontFamily: "'DM Sans', sans-serif", color: "#1E293B" }}
            onFocus={(e) => (e.target.style.borderColor = "#1E3A8A")}
            onBlur={(e) => (e.target.style.borderColor = "#E8EDF3")} />
        </div>
        <div className="flex gap-2">
          {["all", "active", "pending", "completed"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{ background: filterStatus === s ? "#1E3A8A" : "white", color: filterStatus === s ? "white" : "#64748B", border: `1px solid ${filterStatus === s ? "#1E3A8A" : "#E8EDF3"}`, fontFamily: "'DM Sans', sans-serif" }}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-neutral-400 py-12 text-sm">No clients match your search</p>
      )}

      {/* Client list */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
        {filtered.map((client) => {
          const sc = CLIENT_STATUS[client.status] ?? CLIENT_STATUS.pending;
          const projCount   = getProjectCount(client.id);
          const activeCount = getActiveCount(client.id);
          return (
            <motion.button key={client.id} variants={staggerItem} onClick={() => setSelected(client)}
              className="w-full text-left rounded-2xl p-4 transition-all duration-200 group"
              style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(15,27,76,0.09)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(15,27,76,0.05)"; }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #1E3A8A, #6D28D9)", fontFamily: "'Sora', sans-serif" }}>
                  {client.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-neutral-900 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>{client.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">{client.service}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-neutral-400 flex-shrink-0">
                  <span className="flex items-center gap-1"><FolderKanban size={11} strokeWidth={2} />{projCount} projects{activeCount > 0 ? ` · ${activeCount} active` : ""}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} strokeWidth={2} />{client.city}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                <span className="flex items-center gap-1 text-xs text-neutral-400"><Mail size={11} strokeWidth={2} />{client.email}</span>
                <span className="flex items-center gap-1 text-xs text-neutral-400"><Phone size={11} strokeWidth={2} />{client.phone}</span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
