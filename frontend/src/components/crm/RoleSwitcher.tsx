/**
 * RoleSwitcher — Batch 3 (dev/demo tool only)
 *
 * This component lets developers preview different role views without
 * logging in as each role. It reads/writes useCRMStore.currentRole
 * (UI-only state) and navigates to the selected portal path.
 *
 * In PRODUCTION: this component should only be mounted in dev/staging.
 * The real auth identity comes from useAuth() in every page component.
 * This switcher does NOT change the real JWT role.
 *
 * Mount condition: only render when import.meta.env.DEV === true
 * (enforced by CRMNavbar or CRMLayout).
 */

import { useNavigate } from "react-router-dom";
import type { CRMRole } from "@/store/useCRMStore";
import { ShieldCheck, Briefcase, User, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface RoleConfig {
  value: CRMRole;
  label: string;
  icon: ReactNode;
  description: string;
  dot: string;
  activeBg: string;
  activeText: string;
  path: string;
}

const ROLES: RoleConfig[] = [
  {
    value: "admin",
    label: "Admin",
    icon: <ShieldCheck size={15} strokeWidth={2} />,
    description: "Full platform control",
    dot: "hsl(221 83% 53%)",
    activeBg: "hsl(214 95% 93%)",
    activeText: "hsl(222 73% 33%)",
    path: "/crm/admin",
  },
  {
    value: "employee",
    label: "Employee",
    icon: <Briefcase size={15} strokeWidth={2} />,
    description: "Assigned tasks & projects",
    dot: "hsl(160 84% 39%)",
    activeBg: "hsl(152 60% 92%)",
    activeText: "hsl(160 84% 25%)",
    path: "/crm/employee",
  },
  {
    value: "client",
    label: "Client",
    icon: <User size={15} strokeWidth={2} />,
    description: "Track your registration",
    dot: "hsl(43 96% 56%)",
    activeBg: "hsl(48 96% 89%)",
    activeText: "hsl(28 90% 37%)",
    path: "/crm/client",
  },
];

interface Props { currentRole?: CRMRole; }

export default function RoleSwitcher({ currentRole = "admin" }: Props) {
  const [open, setOpen]     = useState(false);
  const navigate            = useNavigate();
  const ref                 = useRef<HTMLDivElement>(null);
  const activeConfig        = ROLES.find((r) => r.value === currentRole) ?? ROLES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Dev-only label */}
      <div className="absolute -top-5 left-0 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#F59E0B" }}>
        dev
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Preview role — ${activeConfig.label}`}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-150"
        style={{
          background: open ? "hsl(213 27% 90%)" : "hsl(210 40% 96%)",
          border: "1px solid hsl(213 27% 84% / 0.8)",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.8rem",
        }}
      >
        <span style={{ color: activeConfig.dot }}>{activeConfig.icon}</span>
        <span className="hidden sm:block font-semibold" style={{ color: "hsl(222 47% 11%)" }}>
          {activeConfig.label}
        </span>
        <ChevronDown
          size={12} strokeWidth={2.5}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "hsl(215 16% 47%)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Preview role"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
            className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-50"
            style={{
              background: "white",
              border: "1px solid hsl(213 27% 84%)",
              boxShadow: "0 16px 48px rgba(15,27,76,0.18)",
              minWidth: "240px",
            }}
          >
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid #F1F5F9", background: "#FFFBEB" }}>
              <p className="text-[10px] font-bold tracking-wider" style={{ color: "#B45309" }}>
                DEV PREVIEW — Not real auth
              </p>
            </div>
            <div className="p-2 space-y-1">
              {ROLES.map((role) => {
                const isActive = currentRole === role.value;
                return (
                  <button
                    key={role.value}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => { navigate(role.path); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
                    style={{
                      background: isActive ? role.activeBg : "transparent",
                      border: isActive ? `1px solid ${role.dot}30` : "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = "hsl(210 40% 97%)"; }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; }
                    }}
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
                      style={{ background: `${role.dot}15`, color: role.dot }}>
                      {role.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold block leading-none" style={{ color: isActive ? role.activeText : "hsl(222 47% 11%)" }}>
                        {role.label}
                      </span>
                      <span className="block text-[10px] mt-0.5" style={{ color: "#64748B" }}>
                        {role.description}
                      </span>
                    </div>
                    {isActive && <Check size={13} strokeWidth={2.5} style={{ color: role.dot, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
