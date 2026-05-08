import { useCRMStore } from "@/store/useCRMStore";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import { Download, Users, FolderKanban, CreditCard, CheckCircle2, TrendingUp, BarChart2 } from "lucide-react";
import { buildExportSnapshot } from "@/lib/crmWorkflow";

function fmtCurrency(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

function MetricRow({ label, value, color = "#0F172A" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
      <p className="text-sm text-neutral-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
      <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
    </div>
  );
}

export default function ReportsPanel() {
  const clients     = useCRMStore((s) => s.clients);
  const projects    = useCRMStore((s) => s.projects);
  const payments    = useCRMStore((s) => s.payments);
  const submissions = useCRMStore((s) => s.clientSubmissions);
  const tasks       = useCRMStore((s) => s.tasks);
  const rejectedLog = useCRMStore((s) => s.rejectedLog);

  const totalBilled    = payments.reduce((s, p) => s + p.amount, 0);
  const totalCollected = payments.reduce((s, p) => s + p.paidAmount, 0);
  const totalPending   = totalBilled - totalCollected;
  const collectionPct  = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
  const overdueAmt     = payments.filter((p) => p.status === "overdue").reduce((s, p) => s + (p.amount - p.paidAmount), 0);

  const handleExport = (type: "clients" | "projects" | "payments" | "full") => {
    let data: unknown;
    let filename: string;
    if (type === "full") {
      data = buildExportSnapshot({ clients, projects, payments, submissions, rejectedLog });
      filename = "crm-full-export.json";
    } else {
      const map = { clients, projects, payments };
      data = map[type];
      filename = `crm-${type}.json`;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exports = [
    { key: "clients"  as const, label: "Export Clients",  desc: `${clients.length} records`,     icon: <Users size={18} strokeWidth={2} />,        accent: "#1E3A8A" },
    { key: "projects" as const, label: "Export Projects", desc: `${projects.length} records`,    icon: <FolderKanban size={18} strokeWidth={2} />, accent: "#6D28D9" },
    { key: "payments" as const, label: "Export Payments", desc: `${payments.length} records`,    icon: <CreditCard size={18} strokeWidth={2} />,   accent: "#15803D" },
    { key: "full"     as const, label: "Full Snapshot",   desc: "All data + summary",             icon: <BarChart2 size={18} strokeWidth={2} />,    accent: "#D97706" },
  ];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>Reports</h1>
        <p className="text-neutral-400 text-sm mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Operational metrics and data exports</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Collection Rate", value: `${collectionPct}%`, accent: collectionPct >= 75 ? "#15803D" : collectionPct >= 50 ? "#D97706" : "#DC2626" },
          { label: "Projects Active", value: projects.filter((p) => ["active","waiting-client","review"].includes(p.status)).length, accent: "#1E3A8A" },
          { label: "Submissions Pending", value: submissions.filter((s) => s.status === "pending").length, accent: "#D97706" },
          { label: "Tasks Open", value: tasks.filter((t) => t.status !== "done").length, accent: "#6D28D9" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-5"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif", color: k.accent }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Operational summary */}
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
          <div className="flex items-center gap-2 mb-4" style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" }}>
            <TrendingUp size={14} strokeWidth={2} style={{ color: "#1E3A8A" }} />
            <h2 className="text-sm font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Operational Summary</h2>
          </div>
          <MetricRow label="Total Clients" value={clients.length} />
          <MetricRow label="Active Clients" value={clients.filter((c) => c.status === "active").length} color="#15803D" />
          <MetricRow label="Pending Onboarding" value={clients.filter((c) => c.status === "pending").length} color="#D97706" />
          <MetricRow label="Completed Clients" value={clients.filter((c) => c.status === "completed").length} color="#1E3A8A" />
          <MetricRow label="Total Projects" value={projects.length} />
          <MetricRow label="In Progress" value={projects.filter((p) => p.status === "active").length} color="#1E3A8A" />
          <MetricRow label="Under Review" value={projects.filter((p) => p.status === "review").length} color="#D97706" />
          <MetricRow label="Waiting — Client" value={projects.filter((p) => p.status === "waiting-client").length} color="#6D28D9" />
          <MetricRow label="Completed" value={projects.filter((p) => p.status === "completed").length} color="#15803D" />
          <MetricRow label="Total Tasks" value={tasks.length} />
          <MetricRow label="Tasks Done" value={tasks.filter((t) => t.status === "done").length} color="#15803D" />
          <MetricRow label="Rejection Log Entries" value={rejectedLog.length} color="#DC2626" />
        </div>

        {/* Revenue summary */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
            <div className="flex items-center gap-2 mb-4" style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" }}>
              <CreditCard size={14} strokeWidth={2} style={{ color: "#15803D" }} />
              <h2 className="text-sm font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Revenue Summary</h2>
            </div>
            <MetricRow label="Total Billed"   value={fmtCurrency(totalBilled)} />
            <MetricRow label="Collected"      value={fmtCurrency(totalCollected)} color="#15803D" />
            <MetricRow label="Outstanding"    value={fmtCurrency(totalPending)} color="#D97706" />
            <MetricRow label="Overdue Amount" value={fmtCurrency(overdueAmt)} color="#DC2626" />
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-neutral-400">Collection Rate</p>
                <p className="text-xs font-bold font-mono" style={{ color: collectionPct >= 75 ? "#15803D" : "#D97706" }}>{collectionPct}%</p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                <div className="h-full rounded-full" style={{ width: `${collectionPct}%`, background: collectionPct >= 75 ? "linear-gradient(90deg,#16A34A,#22C55E)" : "linear-gradient(90deg,#D97706,#F59E0B)" }} />
              </div>
            </div>
          </div>

          {/* Data integrity */}
          <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
            <div className="flex items-center gap-2 mb-3" style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: "12px" }}>
              <CheckCircle2 size={14} strokeWidth={2} style={{ color: "#15803D" }} />
              <h2 className="text-sm font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Data Integrity</h2>
            </div>
            <div className="space-y-2">
              {[
                "Single employee assigned per project",
                "Client submissions routed via approval queue",
                "Rejections logged with reason and reviewer",
                "Client timeline shows only approved updates",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={13} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" style={{ color: "#15803D" }} />
                  <p className="text-xs text-neutral-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export cards */}
      <div>
        <h2 className="text-sm font-bold text-neutral-700 mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>Data Exports</h2>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {exports.map((item) => (
            <motion.button key={item.key} variants={staggerItem} onClick={() => handleExport(item.key)}
              className="rounded-2xl p-5 text-left transition-all duration-200 group"
              style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(15,27,76,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = `${item.accent}40`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(15,27,76,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = "#E8EDF3"; }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.accent}12`, color: item.accent }}>{item.icon}</div>
                <Download size={15} strokeWidth={2} style={{ color: "#CBD5E1" }} className="group-hover:text-neutral-500 transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-0.5" style={{ fontFamily: "'Sora', sans-serif" }}>{item.label}</h3>
              <p className="text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.desc}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
