/**
 * EmployeeManagement — Batch 1
 * Full CRUD: create, view, edit, deactivate, archive employees
 */

import { useState, useEffect, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import {
  Search, User, Mail, Phone, FolderKanban,
  AlertCircle, Loader2, RefreshCw, Plus, Edit2,
  Trash2, ChevronRight, X, Calendar,
  AlertTriangle, Eye, Shield, ShieldOff,
  Briefcase, Activity, MapPin, MessageSquare,
  Settings2,
} from "lucide-react";
import {
  fetchEmployeesEnhanced,
  fetchEmployeeDetail,
  createEmployeeEnhanced,
  updateEmployee,
  deactivateEmployeeById,
  reactivateEmployee,
  archiveEmployee,
  exportEmployees,
  type ApiUserWithProfile,
  type CreateEmployeePayload,
} from "@/lib/crmApi";
import { CRMFilterBar, PaginationBar, SortSelector, type PillFilter } from "@/components/crm/shared/CRMFilterBar";
import { ExportButton } from "@/components/crm/shared/ExportButton";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(first: string, last?: string) {
  return `${first.charAt(0)}${last ? last.charAt(0) : ""}`.toUpperCase();
}

const DEPT_COLORS: Record<string, { bg: string; color: string }> = {
  legal:      { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  operations: { bg: "rgba(124,58,237,0.10)",   color: "#6D28D9" },
  finance:    { bg: "rgba(22,163,74,0.10)",    color: "#15803D" },
  support:    { bg: "rgba(6,182,212,0.10)",    color: "#0E7490" },
  technology: { bg: "rgba(99,102,241,0.10)",   color: "#4338CA" },
};

const ACCOUNT_COLORS: Record<string, { bg: string; color: string }> = {
  active:   { bg: "rgba(22,163,74,0.10)",    color: "#15803D" },
  inactive: { bg: "rgba(100,116,139,0.10)",  color: "#64748B" },
  pending:  { bg: "rgba(217,119,6,0.10)",    color: "#B45309" },
  archived: { bg: "rgba(100,116,139,0.10)",  color: "#475569" },
};

const EMP_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:     { bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  on_leave:   { bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  suspended:  { bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
  resigned:   { bg: "rgba(100,116,139,0.10)", color: "#475569" },
  terminated: { bg: "rgba(220,38,38,0.10)",   color: "#B91C1C" },
};

const DEPARTMENTS = [
  { value: "legal",      label: "Legal" },
  { value: "operations", label: "Operations" },
  { value: "finance",    label: "Finance" },
  { value: "support",    label: "Support" },
  { value: "technology", label: "Technology" },
];

function Badge({ label, colors }: { label: string; colors: { bg: string; color: string } }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{ background: colors.bg, color: colors.color }}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

function Input({ label, name, value, onChange, type = "text", required = false,
  placeholder = "", half = false, disabled = false }: {
  label: string; name: string; value: string; onChange: (n: string, v: string) => void;
  type?: string; required?: boolean; placeholder?: string; half?: boolean; disabled?: boolean;
}) {
  const cls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all";
  const sty = {
    background: disabled ? "#F1F5F9" : "#F8FAFC",
    border: "1.5px solid #E8EDF3",
    color: "#1E1E1E",
  };
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea className={cls} style={sty} rows={3} value={value} placeholder={placeholder} disabled={disabled}
          onChange={(e) => onChange(name, e.target.value)} />
      ) : (
        <input className={cls} style={sty} type={type} value={value} placeholder={placeholder} disabled={disabled}
          onChange={(e) => onChange(name, e.target.value)} />
      )}
    </div>
  );
}

function Select({ label, name, value, onChange, options, half = false, required = false }: {
  label: string; name: string; value: string; onChange: (n: string, v: string) => void;
  options: { value: string; label: string }[]; half?: boolean; required?: boolean;
}) {
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "#F8FAFC", border: "1.5px solid #E8EDF3", color: "#1E1E1E" }}
        value={value} onChange={(e) => onChange(name, e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="col-span-2 pt-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 pb-1.5 border-b border-neutral-100">{label}</p>
    </div>
  );
}

// ── Employee Form Modal ───────────────────────────────────────────────────────

interface EmpForm {
  firstName: string; lastName: string; email: string;
  phone: string; whatsappNumber: string; sameAsPhone: boolean;
  designation: string; department: string;
  city: string; address: string;
  specializations: string;
  maxProjectCapacity: string; employeeCode: string;
  password: string; confirmPassword: string;
}

const EMPTY_FORM: EmpForm = {
  firstName: "", lastName: "", email: "",
  phone: "", whatsappNumber: "", sameAsPhone: false,
  designation: "", department: "",
  city: "", address: "",
  specializations: "",
  maxProjectCapacity: "20", employeeCode: "",
  password: "", confirmPassword: "",
};

function EmployeeModal({ mode, initial, onClose, onSaved }: {
  mode: "create" | "edit";
  initial?: ApiUserWithProfile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const u = initial?.user;
  const p = initial?.employeeProfile;

  const [form, setForm] = useState<EmpForm>(() => {
    if (mode === "edit" && u && p) {
      const ux = u as unknown as Record<string, unknown>;
      return {
        firstName: u.firstName ?? "", lastName: u.lastName ?? "",
        email: u.email ?? "", phone: u.phone ?? "",
        whatsappNumber: String(ux.whatsappNumber ?? ""),
        sameAsPhone: false,
        designation: p.designation ?? "", department: p.department ?? "",
        city: String(ux.city ?? ""), address: String(ux.address ?? ""),
        specializations: (p.specializations ?? []).join(", "),
        maxProjectCapacity: String(p.maxProjectCapacity ?? 20),
        employeeCode: p.employeeCode ?? "",
        password: "", confirmPassword: "",
      };
    }
    return { ...EMPTY_FORM };
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function set(name: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "phone" && prev.sameAsPhone) next.whatsappNumber = value;
      return next;
    });
  }

  async function submit() {
    setErr("");
    if (!form.firstName.trim()) return setErr("First name is required");
    if (!form.lastName.trim())  return setErr("Last name is required");
    if (!form.email.trim())     return setErr("Email is required");
    if (!form.designation.trim()) return setErr("Designation is required");
    if (!form.department)         return setErr("Department is required");
    if (mode === "create") {
      if (!form.password)            return setErr("Password is required");
      if (form.password.length < 8)  return setErr("Password must be at least 8 characters");
      if (form.password !== form.confirmPassword) return setErr("Passwords do not match");
    }

    setSaving(true);
    try {
      const specs = form.specializations
        .split(",").map((s) => s.trim()).filter(Boolean);

      const payload: CreateEmployeePayload = {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        whatsappNumber: form.whatsappNumber || undefined,
        designation: form.designation, department: form.department,
        city: form.city || undefined, address: form.address || undefined,
        specializations: specs,
        maxProjectCapacity: parseInt(form.maxProjectCapacity, 10) || 20,
        employeeCode: form.employeeCode || undefined,
        ...(mode === "create" && { password: form.password }),
      };

      if (mode === "create") await createEmployeeEnhanced(payload);
      else if (initial?.user._id) await updateEmployee(initial.user._id, payload);
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl"
        style={{ background: "white", boxShadow: "0 24px 64px rgba(15,27,76,0.20)" }}>

        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
              {mode === "create" ? "Add New Employee" : "Edit Employee"}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {mode === "create" ? "Create an employee account with role assignment" : "Update employee information"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100">
            <X size={16} className="text-neutral-500" />
          </button>
        </div>

        <div className="p-6">
          {err && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)" }}>
              <AlertTriangle size={14} />{err}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Divider label="Personal Info" />
            <Input label="First Name" name="firstName" value={form.firstName} onChange={set} required half placeholder="Priya" />
            <Input label="Last Name" name="lastName" value={form.lastName} onChange={set} required half placeholder="Sharma" />
            <Input label="Mobile Number" name="phone" value={form.phone} onChange={set} type="tel" half placeholder="+91 98765 43210" />
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">WhatsApp Number</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: form.sameAsPhone ? "#F1F5F9" : "#F8FAFC", border: "1.5px solid #E8EDF3", color: "#1E1E1E" }}
                type="tel" value={form.sameAsPhone ? form.phone : form.whatsappNumber}
                disabled={form.sameAsPhone}
                onChange={(e) => set("whatsappNumber", e.target.value)}
              />
              <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                <input type="checkbox" checked={form.sameAsPhone}
                  onChange={(e) => setForm((p) => ({
                    ...p, sameAsPhone: e.target.checked,
                    whatsappNumber: e.target.checked ? p.phone : p.whatsappNumber,
                  }))} />
                <span className="text-xs text-neutral-500">Same as mobile</span>
              </label>
            </div>
            <Input label="Email" name="email" value={form.email} onChange={set} type="email" required half placeholder="employee@klawtax.com" />
            <Input label="City" name="city" value={form.city} onChange={set} half placeholder="Mumbai" />
            <Input label="Address" name="address" value={form.address} onChange={set} type="textarea" placeholder="Work address…" />

            <Divider label="Role & Department" />
            <Input label="Designation" name="designation" value={form.designation} onChange={set} required half placeholder="Senior Legal Associate" />
            <Select label="Department" name="department" value={form.department} onChange={set} required half options={DEPARTMENTS} />
            <Input label="Employee Code" name="employeeCode" value={form.employeeCode} onChange={set} half placeholder="EMP-001" />
            <Input label="Max Project Capacity" name="maxProjectCapacity" value={form.maxProjectCapacity} onChange={set} type="number" half placeholder="20" />
            <Input label="Specializations (comma separated)" name="specializations" value={form.specializations} onChange={set}
              placeholder="section8, 12a_80g, gst, iso" />

            {mode === "create" && (
              <Fragment>
                <Divider label="Account Setup" />
                <div className="col-span-2 px-4 py-3 rounded-xl text-xs flex items-start gap-2"
                  style={{ background: "rgba(22,163,74,0.06)", color: "#15803D", border: "1px solid rgba(22,163,74,0.15)" }}>
                  <Shield size={13} className="mt-0.5 flex-shrink-0" />
                  <span>Login ID is the email above. Employee will use these credentials to access the workspace.</span>
                </div>
                <Input label="Temporary Password" name="password" value={form.password} onChange={set} type="password" required half placeholder="Min 8 characters" />
                <Input label="Confirm Password" name="confirmPassword" value={form.confirmPassword} onChange={set} type="password" required half placeholder="Repeat password" />
              </Fragment>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-neutral-100 px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:-translate-y-px transition-all"
            style={{ background: "linear-gradient(135deg, #15803D, #16A34A)", boxShadow: "0 4px 16px rgba(22,163,74,0.25)" }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {mode === "create" ? "Create Employee" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }: {
  title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "white", boxShadow: "0 24px 64px rgba(15,27,76,0.20)" }}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
          <AlertTriangle size={20} className={danger ? "text-red-500" : "text-amber-500"} />
        </div>
        <h3 className="text-base font-bold text-neutral-900 mb-1">{title}</h3>
        <p className="text-sm text-neutral-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ background: danger ? "#DC2626" : "#D97706" }}>
            {loading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Employee Detail Panel ─────────────────────────────────────────────────────

function EmployeeDetailPanel({ emp, onEdit, onDeactivate, onReactivate, onArchive, onClose }: {
  emp: ApiUserWithProfile;
  onEdit: () => void; onDeactivate: () => void;
  onReactivate: () => void; onArchive: () => void; onClose: () => void;
}) {
  const u = emp.user;
  const p = emp.employeeProfile;
  const projects = emp.projects ?? [];
  const ux = u as unknown as Record<string, unknown>;
  const isActive = u.accountStatus === "active";
  const acC = ACCOUNT_COLORS[u.accountStatus ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
  const deptC = DEPT_COLORS[p?.department ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
  const empC = EMP_STATUS_COLORS[p?.employmentStatus ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };

  const activeProj = projects.filter((pr) =>
    !["completed", "cancelled", "archived"].includes((pr as unknown as Record<string, unknown>).projectStatus as string ?? "")
  ).length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 4px 16px rgba(15,27,76,0.08)" }}>
      {/* Header */}
      <div className="relative p-5" style={{ background: "linear-gradient(135deg, #064E3B 0%, #065F46 60%, #047857 100%)" }}>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg"
          style={{ background: "rgba(255,255,255,0.12)" }}>
          <X size={14} className="text-white" />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.20)" }}>
            {getInitials(u.firstName, u.lastName)}
          </div>
          <div>
            <p className="font-bold text-white">{u.firstName} {u.lastName}</p>
            {p?.designation && <p className="text-xs text-white/70 mt-0.5">{p.designation}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge label={u.accountStatus} colors={acC} />
          {p?.department && <Badge label={p.department} colors={deptC} />}
          {p?.employmentStatus && <Badge label={p.employmentStatus} colors={empC} />}
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-b border-neutral-100">
        {[
          { icon: <Edit2 size={12} />,   label: "Edit",       onClick: onEdit,       color: "#1E3A8A" },
          isActive
            ? { icon: <ShieldOff size={12} />, label: "Deactivate", onClick: onDeactivate, color: "#B45309" }
            : { icon: <Shield size={12} />,    label: "Reactivate", onClick: onReactivate, color: "#15803D" },
          { icon: <Trash2 size={12} />,  label: "Archive",    onClick: onArchive,    color: "#DC2626" },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold hover:bg-neutral-50 transition-colors"
            style={{ color: btn.color, borderRight: i < 2 ? "1px solid #F1F5F9" : undefined }}>
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
        {/* Contact */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Contact</p>
          <div className="space-y-1.5">
            {[
              { icon: <Mail size={11} />, text: u.email },
              { icon: <Phone size={11} />, text: u.phone ?? "—" },
              { icon: <MessageSquare size={11} />, text: String(ux.whatsappNumber ?? "—") + " (WhatsApp)" },
              { icon: <MapPin size={11} />, text: [ux.city as string, ux.address as string].filter(Boolean).join(", ") || "—" },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-neutral-600">
                <span className="text-neutral-400 mt-0.5 flex-shrink-0">{r.icon}</span>
                <span className="break-all">{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role details */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Role & Capacity</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "Designation",  v: p?.designation ?? "—" },
              { l: "Department",   v: p?.department ?? "—" },
              { l: "Emp. Code",    v: p?.employeeCode ?? "—" },
              { l: "Max Capacity", v: p?.maxProjectCapacity ? `${p.activeProjectCount ?? 0}/${p.maxProjectCapacity}` : "—" },
            ].map((r) => (
              <div key={r.l} className="p-2 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                <p className="text-[9px] uppercase tracking-widest text-neutral-400">{r.l}</p>
                <p className="text-xs font-semibold text-neutral-800 mt-0.5 capitalize">{r.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Workload */}
        {(p?.activeProjectCount !== undefined) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Workload</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E8EDF3" }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((p.activeProjectCount ?? 0) / (p.maxProjectCapacity ?? 20)) * 100)}%`,
                    background: "linear-gradient(90deg, #15803D, #16A34A)",
                  }} />
              </div>
              <span className="text-xs font-semibold text-neutral-600 flex-shrink-0">
                {p.activeProjectCount ?? 0}/{p.maxProjectCapacity ?? 20} projects
              </span>
            </div>
          </div>
        )}

        {/* Specializations */}
        {(p?.specializations?.length ?? 0) > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Specializations</p>
            <div className="flex flex-wrap gap-1.5">
              {p!.specializations!.map((s) => (
                <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(37,99,235,0.08)", color: "#1E3A8A", border: "1px solid rgba(37,99,235,0.15)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <FolderKanban size={10} className="text-neutral-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Assigned Projects ({projects.length})
            </p>
            {activeProj > 0 && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(22,163,74,0.10)", color: "#15803D" }}>
                {activeProj} active
              </span>
            )}
          </div>
          {projects.length === 0
            ? <p className="text-xs text-neutral-400">No projects assigned</p>
            : (
              <div className="space-y-1.5">
                {projects.slice(0, 6).map((pr) => {
                  const x = pr as unknown as Record<string, unknown>;
                  return (
                    <div key={x._id as string} className="flex items-center justify-between p-2 rounded-lg"
                      style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-800 truncate">{String(x.title || x.projectCode || "—")}</p>
                        <p className="text-[10px] text-neutral-400">{String(x.projectCode ?? "")}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {x.isOverdue && (
                          <span className="text-[9px] px-1 py-0.5 rounded font-semibold"
                            style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>OD</span>
                        )}
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(37,99,235,0.10)", color: "#1E3A8A" }}>
                          {String(x.projectStatus ?? "")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* Joining date */}
        {p?.joiningDate && (
          <div className="flex items-center gap-2 p-3 rounded-xl"
            style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)" }}>
            <Calendar size={13} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-green-700 font-semibold">Joined</p>
              <p className="text-xs font-bold text-green-800">{fmtDate(p.joiningDate)}</p>
            </div>
          </div>
        )}

        <p className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-100">
          Account created: {fmtDate(u.createdAt)} · ID: {u._id.slice(-6).toUpperCase()}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

// ── Employee pills/sort ────────────────────────────────────────

const EMP_PILLS: PillFilter[] = [
  { key: "all",      label: "All",      bg: "#1E3A8A", color: "white" },
  { key: "active",   label: "Active",   bg: "#16A34A", color: "white" },
  { key: "inactive", label: "Inactive", bg: "#64748B", color: "white" },
];

const EMP_SORT_OPTIONS = [
  { value: "createdAt", label: "Date Joined" },
  { value: "updatedAt", label: "Last Updated" },
  { value: "firstName", label: "Name"         },
];

export default function EmployeeManagement() {
  const [employees, setEmployees]   = useState<ApiUserWithProfile[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [search, setSearch]         = useState("");
  const [deptFilter, setDept]       = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [quickPill, setQuickPill]   = useState("all");
  const [sortBy, setSortBy]         = useState("createdAt");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [selected, setSelected]     = useState<ApiUserWithProfile | null>(null);
  const [detailLoading, setDL]      = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editEmp, setEditEmp]       = useState<ApiUserWithProfile | null>(null);
  const [confirmAction, setConfirm] = useState<{
    type: "deactivate" | "reactivate" | "archive"; emp: ApiUserWithProfile;
  } | null>(null);
  const [actionLoading, setAL]      = useState(false);

  const LIMIT = 15;

  const loadData = useCallback(async (pg = 1) => {
    setLoading(true); setError(false);
    try {
      const res = await fetchEmployeesEnhanced({
        page: pg, limit: LIMIT,
        search: search || undefined,
        status: quickPill !== "all" ? quickPill : (statusFilter || undefined),
        department: deptFilter || undefined,
        sortBy, sortOrder: sortDir,
      });
      const list: ApiUserWithProfile[] = (res.users ?? []).map((u: unknown) => {
        const rec = u as unknown as Record<string, unknown>;
        if (rec.user) return rec as unknown as ApiUserWithProfile;
        const { profile, ...rest } = rec;
        return {
          user: rest as unknown as ApiUserWithProfile["user"],
          employeeProfile: profile as unknown as ApiUserWithProfile["employeeProfile"],
        };
      });
      setEmployees(list);
      setTotal(res.meta?.total ?? list.length);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, deptFilter, quickPill, sortBy, sortDir]); // eslint-disable-line

  useEffect(() => { setPage(1); loadData(1); }, [search, statusFilter, deptFilter, quickPill, sortBy, sortDir]); // eslint-disable-line
  useEffect(() => { if (page > 1) loadData(page); }, [page]); // eslint-disable-line

  async function openDetail(item: ApiUserWithProfile) {
    const id = item.user?._id ?? (item as unknown as { _id?: string })._id;
    if (!id) { setSelected(item); return; }
    setSelected(item); setDL(true);
    try { const d = await fetchEmployeeDetail(id); setSelected(d); } catch { /* keep cached */ }
    finally { setDL(false); }
  }

  async function doAction() {
    if (!confirmAction) return;
    setAL(true);
    try {
      const id = confirmAction.emp.user?._id ?? (confirmAction.emp as unknown as { _id?: string })._id ?? "";
      if (confirmAction.type === "deactivate") await deactivateEmployeeById(id);
      if (confirmAction.type === "reactivate") await reactivateEmployee(id);
      if (confirmAction.type === "archive")    await archiveEmployee(id);
      setConfirm(null); setSelected(null); loadData(page);
    } catch { /* ignore */ } finally { setAL(false); }
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Employees</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} team members</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            label="Export"
            onExport={() => exportEmployees({ search, status: statusFilter })}
          />
          <button onClick={() => loadData(page)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-50"
            style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:-translate-y-px transition-all"
            style={{ background: "linear-gradient(135deg, #15803D, #16A34A)", boxShadow: "0 4px 16px rgba(22,163,74,0.25)" }}>
            <Plus size={14} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <CRMFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, email, phone…"
        pills={EMP_PILLS}
        activePill={quickPill}
        onPillChange={(k) => { setQuickPill(k); setPage(1); }}
        rightSlot={
          <div className="flex items-center gap-2">
            <select value={deptFilter} onChange={(e) => { setDept(e.target.value); setPage(1); }}
              className="rounded-lg px-2.5 py-2 text-xs outline-none"
              style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155", minWidth: "130px" }}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <SortSelector
              value={sortBy}
              options={EMP_SORT_OPTIONS}
              dir={sortDir}
              onValueChange={(v) => { setSortBy(v); setPage(1); }}
              onDirChange={(d) => { setSortDir(d); setPage(1); }}
            />
          </div>
        }
      />

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-green-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-neutral-500 text-sm">Failed to load employees.</p>
          <button onClick={() => loadData(page)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#15803D" }}>
            Retry
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* List */}
          <div className="lg:col-span-2 space-y-2">
            {employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
                style={{ background: "white", border: "1px solid #E8EDF3" }}>
                <Briefcase size={32} className="text-neutral-300" />
                <p className="text-neutral-400 text-sm">No employees found</p>
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#15803D" }}>
                  <Plus size={13} /> Add First Employee
                </button>
              </div>
            ) : (
              <>
                {employees.map((item) => {
                  const u = item.user ?? (item as unknown as ApiUserWithProfile["user"]);
                  const p = item.employeeProfile;
                  const uid = u?._id ?? (item as unknown as { _id?: string })._id ?? "";
                  const isSel = (selected?.user?._id ?? (selected as unknown as { _id?: string })?._id) === uid;
                  const acC = ACCOUNT_COLORS[u?.accountStatus ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
                  const dC  = DEPT_COLORS[p?.department ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };

                  return (
                    <button key={uid} onClick={() => openDetail(item)}
                      className="w-full text-left rounded-2xl p-4 transition-all hover:-translate-y-px"
                      style={{
                        background: "white",
                        border: `1.5px solid ${isSel ? "#15803D" : "#E8EDF3"}`,
                        boxShadow: isSel ? "0 4px 16px rgba(22,163,74,0.12)" : "0 1px 4px rgba(15,27,76,0.05)",
                      }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #15803D, #16A34A)" }}>
                            {getInitials(u?.firstName ?? "?", u?.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-neutral-900 truncate">{u?.firstName} {u?.lastName}</p>
                            <p className="text-xs text-neutral-400 truncate">{p?.designation ? `${p.designation} · ` : ""}{u?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="hidden sm:flex flex-col items-end gap-1">
                            <Badge label={u?.accountStatus ?? "—"} colors={acC} />
                            {p?.department && <Badge label={p.department} colors={dC} />}
                          </div>
                          {detailLoading && isSel
                            ? <Loader2 size={13} className="animate-spin text-green-600" />
                            : <ChevronRight size={14} className="text-neutral-400" />}
                        </div>
                      </div>
                      {/* Quick info */}
                      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-neutral-400">
                        {u?.phone && <span className="flex items-center gap-1"><Phone size={9} />{u.phone}</span>}
                        {p?.activeProjectCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Activity size={9} />{p.activeProjectCount}/{p.maxProjectCapacity ?? 20} projects
                          </span>
                        )}
                        {(p?.specializations?.length ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Settings2 size={9} />{p!.specializations!.slice(0, 2).join(", ")}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
                {pages > 1 && (
                  <PaginationBar
                    page={page} pages={pages} total={total} limit={LIMIT}
                    onPageChange={(p) => setPage(p)} loading={loading}
                  />
                )}
              </>
            )}
          </div>

          {/* Detail Panel */}
          <div>
            {!selected ? (
              <div className="rounded-2xl p-5 sm:p-8 flex flex-col items-center justify-center text-center"
                style={{ background: "white", border: "1px solid #E8EDF3", minHeight: 240 }}>
                <Eye size={28} className="text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">Select an employee to view details</p>
              </div>
            ) : (
              <EmployeeDetailPanel
                emp={selected}
                onEdit={() => setEditEmp(selected)}
                onDeactivate={() => setConfirm({ type: "deactivate", emp: selected })}
                onReactivate={() => setConfirm({ type: "reactivate", emp: selected })}
                onArchive={() => setConfirm({ type: "archive", emp: selected })}
                onClose={() => setSelected(null)}
              />
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <EmployeeModal mode="create" onClose={() => setShowCreate(false)}
            onSaved={() => { setShowCreate(false); loadData(page); }} />
        )}
        {editEmp && (
          <EmployeeModal mode="edit" initial={editEmp} onClose={() => setEditEmp(null)}
            onSaved={() => { setEditEmp(null); loadData(page); }} />
        )}
        {confirmAction && (
          <ConfirmDialog
            title={confirmAction.type === "deactivate" ? "Deactivate Employee?" : confirmAction.type === "reactivate" ? "Reactivate Employee?" : "Archive Employee?"}
            message={
              confirmAction.type === "deactivate"
                ? `Prevent ${confirmAction.emp.user?.firstName ?? "this employee"} from logging in?`
                : confirmAction.type === "reactivate"
                ? `Restore ${confirmAction.emp.user?.firstName ?? "this employee"}'s access?`
                : `Archive ${confirmAction.emp.user?.firstName ?? "this employee"}? This marks the account as terminated.`
            }
            confirmLabel={confirmAction.type === "deactivate" ? "Deactivate" : confirmAction.type === "reactivate" ? "Reactivate" : "Archive"}
            danger={confirmAction.type === "archive"}
            onConfirm={doAction} onCancel={() => setConfirm(null)} loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
