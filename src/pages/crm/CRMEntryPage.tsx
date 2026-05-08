import { useNavigate } from "react-router-dom";
import { useCRMStore, CRMRole } from "@/store/useCRMStore";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/motion";
import { type ReactNode } from "react";
import {
  ShieldCheck,
  Briefcase,
  User,
  ArrowRight,
  Scale,
} from "lucide-react";

interface PanelConfig {
  role: CRMRole;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: ReactNode;
  accentColor: string;
  accentBg: string;
  accentText: string;
  gradient: string;
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
    gradient: "linear-gradient(135deg, hsl(222 67% 18%) 0%, hsl(222 73% 33%) 100%)",
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
    gradient: "linear-gradient(135deg, hsl(160 60% 20%) 0%, hsl(160 84% 32%) 100%)",
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
    gradient: "linear-gradient(135deg, hsl(28 60% 22%) 0%, hsl(38 80% 38%) 100%)",
  },
];

export default function CRMEntryPage() {
  const currentRole = useCRMStore((s) => s.currentRole);
  const setRole = useCRMStore((s) => s.setRole);
  const navigate = useNavigate();

  const handleEnter = (role: CRMRole) => {
    setRole(role);
    navigate(`/crm/${role}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "hsl(222 47% 11%)" }}
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, hsl(221 83% 53% / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, hsl(263 70% 58% / 0.07) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(var(--color-primary-700)), hsl(var(--color-secondary-500)))",
                boxShadow: "0 8px 32px hsl(221 83% 53% / 0.35)",
              }}
            >
              <Scale size={22} strokeWidth={2} className="text-white" />
            </div>
          </div>

          <h1
            className="text-4xl font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            KlawTax <span style={{ color: "hsl(var(--color-accent-400))" }}>CRM</span>
          </h1>
          <p
            className="text-base max-w-md mx-auto"
            style={{ color: "hsl(215 16% 55%)", fontFamily: "'DM Sans', sans-serif" }}
          >
            Internal operations platform. Select your role to access your workspace.
          </p>

          {currentRole && (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: "hsl(215 25% 16%)",
                color: "hsl(215 16% 55%)",
                fontFamily: "'DM Sans', sans-serif",
                border: "1px solid hsl(215 25% 20%)",
              }}
            >
              Currently active as:
              <span className="font-semibold capitalize" style={{ color: "hsl(0 0% 85%)" }}>
                {currentRole}
              </span>
              <button
                onClick={() => navigate(`/crm/${currentRole}`)}
                className="flex items-center gap-1 font-semibold"
                style={{ color: "hsl(var(--color-accent-400))" }}
              >
                Resume
                <ArrowRight size={11} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Role cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-5"
        >
          {PANELS.map((panel) => {
            const isActive = currentRole === panel.role;

            return (
              <motion.div key={panel.role} variants={staggerItem}>
                <button
                  onClick={() => handleEnter(panel.role)}
                  className="w-full text-left group"
                >
                  <div
                    className="rounded-2xl p-6 h-full flex flex-col transition-all duration-300"
                    style={{
                      background: isActive
                        ? `${panel.gradient}, hsl(215 25% 16%)`
                        : "hsl(215 25% 14%)",
                      border: `1.5px solid ${isActive ? panel.accentColor + "40" : "hsl(215 25% 20%)"}`,
                      boxShadow: isActive
                        ? `0 8px 32px ${panel.accentColor}20`
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "hsl(215 25% 17%)";
                        el.style.borderColor = `${panel.accentColor}30`;
                        el.style.transform = "translateY(-2px)";
                        el.style.boxShadow = `0 8px 24px ${panel.accentColor}15`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "hsl(215 25% 14%)";
                        el.style.borderColor = "hsl(215 25% 20%)";
                        el.style.transform = "translateY(0)";
                        el.style.boxShadow = "none";
                      }
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                      style={{
                        background: `${panel.accentColor}18`,
                        color: panel.accentColor,
                      }}
                    >
                      {panel.icon}
                    </div>

                    {/* Title */}
                    <h3
                      className="text-lg font-bold text-white mb-1"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {panel.title}
                    </h3>
                    <p
                      className="text-xs font-semibold mb-3"
                      style={{ color: panel.accentColor, fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {panel.subtitle}
                    </p>
                    <p
                      className="text-sm mb-5 flex-1"
                      style={{ color: "hsl(215 16% 55%)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
                    >
                      {panel.description}
                    </p>

                    {/* Feature list */}
                    <ul className="space-y-1.5 mb-5">
                      {panel.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs"
                          style={{ color: "hsl(215 16% 60%)", fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <span
                            className="w-1 h-1 rounded-full flex-shrink-0"
                            style={{ background: panel.accentColor }}
                          />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: panel.accentColor, fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {isActive ? "Resume Session" : "Enter Panel"}
                      <ArrowRight
                        size={14}
                        strokeWidth={2.5}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs mt-8"
          style={{ color: "hsl(215 16% 35%)", fontFamily: "'DM Sans', sans-serif" }}
        >
          KlawTax Internal Operations Platform — v1.0
        </motion.p>
      </div>
    </div>
  );
}

