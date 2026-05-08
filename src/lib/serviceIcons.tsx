// ============================================================
// KlawTax Icon System
// Maps string icon names → Lucide React components
// ============================================================

import React from "react";
import {
  // NGO & Legal
  ShieldCheck,
  BadgeCheck,
  Handshake,
  Globe,
  Landmark,
  Award,
  FileText,
  ClipboardCheck,
  FileBarChart,
  BookOpen,
  Users,
  HeartHandshake,

  // Business
  Building,
  Building2,
  Briefcase,
  UserCheck,
  Fingerprint,
  ScanLine,
  Receipt,
  Medal,
  Utensils,
  Ship,

  // Audit & Finance
  BarChart3,
  TrendingUp,

  // Digital
  Monitor,
  Cloud,

  // UI / Utility
  CheckCircle,
  Star,
  Zap,
  Lock,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Download,
  Upload,
  Search,
  Filter,
  Menu,
  X,
  Check,
  Plus,
  Minus,
  Info,
  AlertCircle,
  Clock,
  Calendar,
  CreditCard,
  MessageCircle,
  Send,
  Eye,
  EyeOff,
  Home,
  Settings,
  LogOut,
  User,
  type LucideIcon,
} from "lucide-react";

// ============================================================
// ICON MAP
// ============================================================

const iconMap: Record<string, LucideIcon> = {
  // ── Service Icons ──────────────────────────────────────
  ShieldCheck,
  BadgeCheck,
  Handshake,
  Globe,
  Landmark,
  Award,
  FileText,
  ClipboardCheck,
  FileBarChart,
  BookOpen,
  Users,
  HeartHandshake,
  Building,
  Building2,
  Briefcase,
  UserCheck,
  Fingerprint,
  ScanLine,
  Receipt,
  Medal,
  Utensils,
  Ship,
  BarChart3,
  TrendingUp,
  Monitor,
  Cloud,

  // ── Category Icons ─────────────────────────────────────
  CheckCircle,
  Star,
  Zap,
  Lock,

  // ── Contact & Info ─────────────────────────────────────
  Phone,
  Mail,
  MapPin,
  Info,
  AlertCircle,
  Clock,
  Calendar,

  // ── Navigation ─────────────────────────────────────────
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Home,
  Menu,
  X,

  // ── Actions ────────────────────────────────────────────
  Download,
  Upload,
  Search,
  Filter,
  Check,
  Plus,
  Minus,
  Send,
  Eye,
  EyeOff,

  // ── Payment & Commerce ────────────────────────────────
  CreditCard,
  MessageCircle,

  // ── Dashboard ─────────────────────────────────────────
  Settings,
  LogOut,
  User,
};

// ============================================================
// EXPORTS
// ============================================================

/**
 * Returns a Lucide icon component by string name.
 * Falls back to FileText if the name is not found.
 *
 * @example
 * const Icon = getServiceIcon("ShieldCheck");
 * <Icon size={24} />
 */
export function getServiceIcon(name: string): LucideIcon {
  return iconMap[name] ?? FileText;
}

/**
 * Renders a Lucide icon component inline with standard KlawTax sizing.
 *
 * @example
 * <ServiceIcon name="ShieldCheck" size={20} className="text-primary" />
 */
interface ServiceIconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function ServiceIcon({
  name,
  size = 20,
  className = "",
  strokeWidth = 1.75,
}: ServiceIconProps): React.ReactElement {
  const Icon = getServiceIcon(name);
  return React.createElement(Icon, {
    size,
    className,
    strokeWidth,
  });
}

// ============================================================
// CATEGORY → ICON MAPPING
// ============================================================

/**
 * Returns the default icon for a service category.
 */
export const CATEGORY_ICON_MAP: Record<string, string> = {
  ngo: "Users",
  business: "Building",
  audit: "BarChart3",
  digital: "Monitor",
};

export function getCategoryIcon(category: string): LucideIcon {
  const name = CATEGORY_ICON_MAP[category] ?? "FileText";
  return getServiceIcon(name);
}

// ============================================================
// SEMANTIC ICON ALIASES (for UI consistency)
// ============================================================

export const UI_ICONS = {
  checkmark: CheckCircle,
  arrow: ArrowRight,
  chevron: ChevronRight,
  external: ExternalLink,
  phone: Phone,
  mail: Mail,
  location: MapPin,
  time: Clock,
  calendar: Calendar,
  payment: CreditCard,
  whatsapp: MessageCircle,
  download: Download,
  upload: Upload,
  search: Search,
  filter: Filter,
  close: X,
  menu: Menu,
  home: Home,
  settings: Settings,
  logout: LogOut,
  user: User,
  info: Info,
  alert: AlertCircle,
  star: Star,
  lock: Lock,
  send: Send,
  plus: Plus,
  minus: Minus,
  eye: Eye,
  eyeOff: EyeOff,
} as const;

export type UIIconKey = keyof typeof UI_ICONS;

export default iconMap;
