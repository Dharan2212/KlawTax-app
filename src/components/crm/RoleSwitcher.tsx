import { useNavigate } from "react-router-dom";
import { useCRMStore, CRMRole } from "@/store/useCRMStore";
import { ShieldCheck, Briefcase, User, ChevronDown } from "lucide-react";
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
  },
  {
    value: "employee",
    label: "Employee",
    icon: <Briefcase size={15} strokeWidth={2} />,
    description: "Assigned tasks & projects",
    dot: "hsl(160 84% 39%)",
    activeBg: "hsl(152 60% 92%)",
    activeText: "hsl(160 84% 25%)",
  },
  {
    value: "client",
    label: "Client",
    icon: <User size={15} strokeWidth={2} />,
    description: "Track & submit updates",
    dot: "hsl(43 96% 56%)",
    activeBg: "hsl(48 96% 89%)",
    activeText: "hsl(28 90% 37%)",
  },
];

export default function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const currentRole = useCRMStore((s) => s.currentRole);
  const setRole = useCRMStore((s) => s.setRole);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const activeConfig = ROLES.find((r) => r.value === currentRole)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitch = (role: CRMRole) => {
    setRole(role);
    navigate(`/crm/${role}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors"
        style={{
          background: "hsl(210 40% 96%)",
          border: "1px solid hsl(213 27% 84% / 0.8)",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.8rem",
        }}
      >
        <span style={{ color: activeConfig.dot }}>{activeConfig.icon}</span>
        <span
          className="hidden sm:block font-semibold"
          style={{ color: "hsl(222 47% 11%)" }}
        >
          {activeConfig.label}
        </span>
        <ChevronDown
          size={12}
          strokeWidth={2.5}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "hsl(215 16% 47%)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0, 0, 0.2, 1] }}
            className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
            style={{
              background: "white",
              border: "1px solid hsl(213 27% 84%)",
              boxShadow: "0 10px 32px rgba(15,27,76,0.14)",
              minWidth: "220px",
            }}
          >
            <div
              className="px-3 py-2"
              style={{ borderBottom: "1px solid hsl(210 40% 96%)" }}
            >
              <p
                className="text-[11px] font-bold tracking-wider"
                style={{ color: "hsl(215 16% 47%)", fontFamily: "'DM Sans', sans-serif" }}
              >
                SWITCH ROLE
              </p>
            </div>

            <div className="p-1.5 space-y-0.5">
              {ROLES.map((role) => {
                const isActive = currentRole === role.value;
                return (
                  <button
                    key={role.value}
                    onClick={() => handleSwitch(role.value)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left"
                    style={{
                      background: isActive ? role.activeBg : "transparent",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background = "hsl(210 40% 97%)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                      style={{ background: `${role.dot}18`, color: role.dot }}
                    >
                      {role.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span
                        className="block text-sm font-semibold leading-none mb-0.5"
                        style={{ color: isActive ? role.activeText : "hsl(222 47% 11%)" }}
                      >
                        {role.label}
                      </span>
                      <span
                        className="block text-xs truncate"
                        style={{ color: "hsl(215 16% 47%)" }}
                      >
                        {role.description}
                      </span>
                    </div>
                    {isActive && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: role.dot }}
                      />
                    )}
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
