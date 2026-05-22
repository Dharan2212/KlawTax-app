/**
 * CRMEntryPage — Batch 3
 *
 * In production: auto-redirects to the correct role portal based on
 * the authenticated user's real role from useAuth().
 *
 * Dev/demo: if not authenticated, shows role-selection cards so
 * developers can preview each portal without needing real credentials.
 */

import { useNavigate, Navigate } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/shared/SEO";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/motion";
import { type ReactNode } from "react";
import { ShieldCheck, Briefcase, User, ArrowRight, Scale, Loader2 } from "lucide-react";

interface PanelConfig {
  role: "admin" | "employee" | "client";
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: ReactNode;
  accentColor: string;
  accentBg: string;
  accentText: string;
  path: string;
}

const PANELS: PanelConfig[] = [
  {
    role: "admin",
    title: "Admin Panel",
    subtitle: "Full platform control",
    description: "Manage all clients, projects, approvals, payments, and generate reports.",
    features: ["Client Management", "Project Oversight", "Approval Queue", "Payments & Reports"],
    icon: <ShieldCheck size={22} strokeWidth={1.75} />,
    accentColor: "hsl(221 83% 53%)",
    accentBg: "hsl(214 95% 93%)",
    accentText: "hsl(222 73% 33%)",
    path: "/crm/admin",
  },
  {
    role: "employee",
    title: "Employee Panel",
    subtitle: "Assigned work view",
    description: "Access your assigned projects, manage tasks, and update progress.",
    features: ["My Projects", "Task Management", "Progress Updates", "Client Communication"],
    icon: <Briefcase size={22} strokeWidth={1.75} />,
    accentColor: "hsl(160 84% 39%)",
    accentBg: "hsl(152 60% 92%)",
    accentText: "hsl(160 84% 25%)",
    path: "/crm/employee",
  },
  {
    role: "client",
    title: "Client Panel",
    subtitle: "Track your registration",
    description: "Monitor your NGO or business registration progress and submit document updates.",
    features: ["Project Status", "Document Submission", "Progress Tracking", "Expert Support"],
    icon: <User size={22} strokeWidth={1.75} />,
    accentColor: "hsl(43 96% 50%)",
    accentBg: "hsl(48 96% 89%)",
    accentText: "hsl(28 90% 32%)",
    path: "/crm/client",
  },
];

export default function CRMEntryPage() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const navigate = useNavigate();

  // If authenticated → redirect immediately to the correct portal
  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      const dest =
        role === "admin"    ? "/crm/admin"    :
        role === "employee" ? "/crm/employee" : "/crm/client";
      navigate(dest, { replace: true });
    }
  }, [isLoading, isAuthenticated, role, navigate]);

  // Loading spinner while auth resolves
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(222 47% 11%)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "hsl(221 83% 53%)" }} />
      </div>
    );
  }

  // Authenticated → redirect handled by useEffect above
  if (isAuthenticated && role) {
    const dest = role === "admin" ? "/crm/admin" : role === "employee" ? "/crm/employee" : "/crm/client";
    return <Navigate to={dest} replace />;
  }

  // ── Dev/demo mode: not authenticated, show role cards for local dev ──

  return (
    <>
      <SEO title="CRM | KlawTax" noindex={true} />
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ background: "hsl(222 47% 11%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, hsl(221 83% 53% / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, hsl(263 70% 58% / 0.07) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 w-full max-w-4xl">
          {/* Header */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)", boxShadow: "0 8px 32px hsl(221 83% 53% / 0.35)" }}>
                <Scale size={22} strokeWidth={2} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              KlawTax <span style={{ color: "#F59E0B" }}>CRM</span>
            </h1>
            <p className="text-base max-w-md mx-auto" style={{ color: "hsl(215 16% 55%)", fontFamily: "'DM Sans', sans-serif" }}>
              Internal operations platform. Please sign in to continue.
            </p>
            <div className="mt-4">
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#1E3A8A", color: "white" }}
              >
                Sign In to CRM <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>

          {/* Role cards — dev preview only */}
          <p className="text-center text-xs mb-5" style={{ color: "hsl(215 16% 35%)", fontFamily: "'DM Sans', sans-serif" }}>
            Dev preview — select a portal view
          </p>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid md:grid-cols-3 gap-5">
            {PANELS.map((panel) => (
              <motion.div key={panel.role} variants={staggerItem}>
                <button onClick={() => navigate(panel.path)} className="w-full text-left group">
                  <div className="rounded-2xl p-6 h-full flex flex-col transition-all duration-200"
                    style={{ background: "hsl(215 25% 14%)", border: "1.5px solid hsl(215 25% 20%)" }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "hsl(215 25% 17%)";
                      el.style.borderColor = `${panel.accentColor}30`;
                      el.style.transform = "translateY(-2px)";
                      el.style.boxShadow = `0 8px 24px ${panel.accentColor}15`;
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "hsl(215 25% 14%)";
                      el.style.borderColor = "hsl(215 25% 20%)";
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "none";
                    }}>
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                      style={{ background: `${panel.accentColor}18`, color: panel.accentColor }}>
                      {panel.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>{panel.title}</h3>
                    <p className="text-xs font-semibold mb-3" style={{ color: panel.accentColor }}>{panel.subtitle}</p>
                    <p className="text-sm mb-5 flex-1" style={{ color: "hsl(215 16% 55%)", lineHeight: 1.6 }}>{panel.description}</p>
                    <ul className="space-y-1.5 mb-5">
                      {panel.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "hsl(215 16% 60%)" }}>
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: panel.accentColor }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: panel.accentColor }}>
                      Preview <ArrowRight size={14} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-center text-xs mt-8" style={{ color: "hsl(215 16% 35%)" }}>
            KlawTax Internal Operations Platform — v1.5
          </motion.p>
        </div>
      </div>
    </>
  );
}
