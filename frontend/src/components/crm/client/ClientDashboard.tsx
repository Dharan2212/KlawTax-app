/**
 * ClientDashboard — Batch 5.3 (live API, correct backend types)
 *
 * Uses useAuth() for identity. Uses fetchClientDashboard() for all data.
 * All types aligned with backend clientDashboardService response shapes.
 */

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  fetchClientDashboard,
  fetchClientPayments,
  type ClientDashboardSnapshot,
  type ClientPaymentSummary,
  type ClientProjectSummary,
  type ClientInvoiceSummary,
  type ClientTimelineEntry,
} from "@/lib/crmApi";
import {
  fmtDate,
  fmtCurrency,
  ageLabel,
  CLIENT_PROJECT_STATUS_CFG,
} from "@/lib/crmUtils";
import {
  FolderKanban, Calendar, CheckCircle2, Clock, ArrowRight,
  FileText, Send, MessageCircle, AlertCircle,
  CreditCard, Activity, Bell, Shield, ChevronRight,
  Loader2, RefreshCw,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────

// ── Status config (imported from crmUtils — see @/lib/crmUtils) ───────────
// Aliased locally so call sites need no other changes.
const PROJECT_STATUS = CLIENT_PROJECT_STATUS_CFG;

// ── Sub-components ─────────────────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, action }: {
  icon: ReactNode; title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>{title}</h2>
      </div>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#1E3A8A" }}>
          {action.label}<ChevronRight size={12} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function EmptyMini({ message }: { message: string }) {
  return <p className="text-sm text-neutral-400 text-center py-6">{message}</p>;
}

// ── Progress step helper ───────────────────────────────────────

function getProgressSteps(status: string): { step: number; label: string } {
  const map: Record<string, { step: number; label: string }> = {
    draft:          { step: 0, label: "Getting Started" },
    onboarding:     { step: 1, label: "Onboarding" },
    active:         { step: 2, label: "In Progress" },
    in_progress:    { step: 2, label: "In Progress" },
    waiting_client: { step: 3, label: "Awaiting Your Input" },
    in_review:      { step: 4, label: "Under Review" },
    completed:      { step: 5, label: "Completed" },
    delivered:      { step: 5, label: "Delivered" },
  };
  return map[status] ?? { step: 1, label: "In Progress" };
}

// ── Main Component ─────────────────────────────────────────────

export default function ClientDashboard() {
  const navigate   = useNavigate();
  const { user, role } = useAuth();

  const [dash, setDash]         = useState<ClientDashboardSnapshot | null>(null);
  const [payments, setPayments] = useState<ClientPaymentSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [dashData, payData] = await Promise.all([
        fetchClientDashboard(),
        fetchClientPayments(),
      ]);
      setDash(dashData);
      setPayments(payData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Auth guard ────────────────────────────────────────────────

  if (!user || role !== "client") {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-neutral-400 text-sm">Client session required.</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load your dashboard. Please try again.</p>
        <button onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────

  const totals         = dash?.totals;
  const activeProjects: ClientProjectSummary[] = dash?.activeProjects ?? [];
  const recentTimeline: ClientTimelineEntry[]  = dash?.recentTimeline  ?? [];
  const pendingInvoices: ClientInvoiceSummary[] = dash?.pendingInvoices ?? [];

  const mainProject = activeProjects[0] ?? null;
  const hasActionRequired = activeProjects.some((p) => p.projectStatus === "waiting_client");

  // Calculate total due from pending invoices
  const totalDue = payments?.totalOutstanding ?? pendingInvoices.reduce((s, i) => s + i.amountDue, 0);

  const progressInfo = mainProject ? getProgressSteps(mainProject.projectStatus) : null;

  // Payment display invoices — prefer full payment summary, fallback to pending invoices
  const displayInvoices = payments?.invoices ?? pendingInvoices.map((i) => ({
    invoiceId:     i.invoiceId,
    invoiceNumber: i.invoiceNumber,
    invoiceStatus: i.invoiceStatus,
    totalAmount:   i.totalAmount,
    amountPaid:    i.amountPaid,
    amountDue:     i.amountDue,
    dueDate:       i.dueDate,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Client Portal</p>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
            Welcome, {user.firstName}
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActionRequired && (
            <button onClick={() => navigate("/crm/client/project")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse"
              style={{ background: "rgba(245,158,11,0.12)", color: "#B45309", border: "1px solid rgba(245,158,11,0.25)" }}>
              <Bell size={11} strokeWidth={2.5} /> Action Required
            </button>
          )}
          <button onClick={loadData}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100 transition-colors"
            title="Refresh">
            <RefreshCw size={13} className="text-neutral-400" />
          </button>
        </div>
      </div>

      {/* Action required banner */}
      {hasActionRequired && (
        <button onClick={() => navigate("/crm/client/project")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:shadow-md"
          style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: "1px solid #FDE68A" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FDE68A" }}>
            <AlertCircle size={18} style={{ color: "#B45309" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: "#92400E" }}>Documents Required</p>
            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>
              Our team is waiting for your documents to proceed.
            </p>
          </div>
          <ArrowRight size={16} style={{ color: "#B45309" }} />
        </button>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: <FolderKanban size={16} />, label: "Active",    value: totals?.activeProjects    ?? activeProjects.length, color: "#1E3A8A", bg: "#EFF6FF" },
          { icon: <CheckCircle2 size={16} />, label: "Completed", value: totals?.completedProjects ?? 0,                     color: "#15803D", bg: "#DCFCE7" },
          { icon: <CreditCard size={16} />,   label: "Due",       value: totalDue > 0 ? fmtCurrency(totalDue) : "₹0",       color: "#D97706", bg: "#FEF3C7" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 flex flex-col items-center gap-2"
            style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>{s.value}</p>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main project progress */}
      {mainProject && progressInfo && (
        <Card>
          <SectionHeader
            icon={<Shield size={14} strokeWidth={2} style={{ color: "#1E3A8A" }} />}
            title="Your Active Project"
            action={{ label: "View details", onClick: () => navigate("/crm/client/project") }}
          />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {mainProject.title || mainProject.primaryServiceSlug?.replace(/-/g, " ")}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">{mainProject.projectCode}</p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                style={PROJECT_STATUS[mainProject.projectStatus] ?? PROJECT_STATUS.active}>
                {PROJECT_STATUS[mainProject.projectStatus]?.label ?? mainProject.projectStatus}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-700">{progressInfo.label}</span>
                <span className="text-xs text-neutral-400">Step {progressInfo.step} of 5</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((progressInfo.step / 5) * 100)}%`, background: "linear-gradient(90deg, #1E3A8A, #3B82F6)" }} />
              </div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
              {["Started", "Docs", "Processing", "Review", "Done"].map((step, i) => {
                const done   = progressInfo.step > i;
                const active = progressInfo.step === i;
                return (
                  <div key={step} className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: done ? "#1E3A8A" : active ? "#EFF6FF" : "#F1F5F9", color: done ? "white" : active ? "#1E3A8A" : "#94A3B8", border: active ? "2px solid #1E3A8A" : "none" }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className="text-[9px] text-center text-neutral-400 leading-tight">{step}</p>
                  </div>
                );
              })}
            </div>

            {mainProject.expectedDeliveryDate && (
              <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                <Calendar size={12} />
                <span>Expected delivery: {fmtDate(mainProject.expectedDeliveryDate)}</span>
                {mainProject.isOverdue && <span className="text-red-500 font-semibold">(Overdue)</span>}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Two-column row */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Recent updates */}
        <Card>
          <SectionHeader
            icon={<Activity size={14} strokeWidth={2} style={{ color: "#2563EB" }} />}
            title="Recent Updates"
          />
          <div className="p-4 space-y-0">
            {recentTimeline.length === 0 && <EmptyMini message="No updates yet" />}
            {recentTimeline.slice(0, 5).map((entry, idx) => (
              <div key={entry.entryId ?? idx} className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid #F8FAFC" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#EFF6FF", color: "#1E3A8A" }}>
                  <FileText size={10} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-neutral-900">{entry.title}</p>
                  {entry.description && <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{entry.description}</p>}
                </div>
                <span className="text-[10px] text-neutral-400 flex-shrink-0 whitespace-nowrap">{ageLabel(entry.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Payments */}
        <Card>
          <SectionHeader
            icon={<CreditCard size={14} strokeWidth={2} style={{ color: "#15803D" }} />}
            title="Payments"
            action={{ label: "View all", onClick: () => navigate("/crm/client/payments") }}
          />
          <div className="p-4 space-y-2">
            {displayInvoices.length === 0 && <EmptyMini message="No invoices found" />}
            {displayInvoices.slice(0, 4).map((inv, idx) => {
              const isPaid = inv.invoiceStatus === "paid";
              return (
                <div key={inv.invoiceId ?? idx} className="flex items-center justify-between p-3 rounded-xl gap-3"
                  style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{inv.invoiceNumber}</p>
                    {inv.dueDate && <p className="text-[10px] text-neutral-400 mt-0.5">Due {fmtDate(inv.dueDate)}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: isPaid ? "#15803D" : "#B45309" }}>
                      {fmtCurrency(inv.totalAmount)}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: isPaid ? "rgba(22,163,74,0.10)" : "rgba(217,119,6,0.10)", color: isPaid ? "#15803D" : "#B45309" }}>
                      {isPaid ? "Paid" : `Due: ${fmtCurrency(inv.amountDue)}`}
                    </span>
                  </div>
                </div>
              );
            })}
            {totalDue > 0 && (
              <button onClick={() => navigate("/crm/client/payments")}
                className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "white" }}>
                Pay Balance — {fmtCurrency(totalDue)}
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "My Projects",   icon: <FolderKanban size={16} />, path: "/crm/client/projects",  accent: "#1E3A8A" },
          { label: "Upload Docs",   icon: <Send size={16} />,         path: "/crm/client/submit",    accent: "#6D28D9" },
          { label: "Payments",      icon: <CreditCard size={16} />,   path: "/crm/client/payments",  accent: "#15803D" },
          { label: "Support",       icon: <MessageCircle size={16} />, path: "/crm/client/support",  accent: "#D97706" },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${a.accent}08`, border: `1px solid ${a.accent}18`, color: a.accent }}>
            {a.icon}{a.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
