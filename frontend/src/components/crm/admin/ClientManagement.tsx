/**
 * ClientManagement — Batch 1
 * Full CRUD: create, view, edit, deactivate, archive clients
 */

import { useState, useEffect, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import {
  Search, User, Mail, Phone, FolderKanban,
  AlertCircle, Loader2, RefreshCw, Plus, Edit2,
  Trash2, ChevronRight, X, Calendar,
  IndianRupee, MapPin, MessageSquare,
  AlertTriangle, Eye, Shield, ShieldOff,
  FileText,
} from "lucide-react";
import {
  fetchClientsEnhanced,
  fetchClientDetail,
  createClient,
  updateClient,
  deactivateClient,
  reactivateClient,
  archiveClient,
  exportClients,
  type ApiUserWithProfile,
  type CreateClientPayload,
} from "@/lib/crmApi";
import { CRMFilterBar, PaginationBar, SortSelector, type PillFilter } from "@/components/crm/shared/CRMFilterBar";
import { ExportButton } from "@/components/crm/shared/ExportButton";

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtCurrency(n?: number) {
  if (n === undefined || n === null) return "—";
  return "₹" + n.toLocaleString("en-IN");
}

function getInitials(first: string, last?: string) {
  return `${first.charAt(0)}${last ? last.charAt(0) : ""}`.toUpperCase();
}

const WORK_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:     { bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  in_progress: { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  completed:   { bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
};

const PAY_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:       { bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
  partial_paid:  { bg: "rgba(217,119,6,0.10)",  color: "#B45309" },
  fully_paid:    { bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
};

const ACCOUNT_COLORS: Record<string, { bg: string; color: string }> = {
  active:   { bg: "rgba(22,163,74,0.10)",    color: "#15803D" },
  inactive: { bg: "rgba(100,116,139,0.10)",  color: "#64748B" },
  pending:  { bg: "rgba(217,119,6,0.10)",    color: "#B45309" },
  archived: { bg: "rgba(100,116,139,0.10)",  color: "#475569" },
};

function Badge({ label, colors }: { label: string; colors: { bg: string; color: string } }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
      style={{ background: colors.bg, color: colors.color }}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

function Input({ label, name, value, onChange, type = "text", required = false,
  placeholder = "", half = false }: {
  label: string; name: string; value: string; onChange: (n: string, v: string) => void;
  type?: string; required?: boolean; placeholder?: string; half?: boolean;
}) {
  const cls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none";
  const sty = { background: "#F8FAFC", border: "1.5px solid #E8EDF3", color: "#1E1E1E" };
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea className={cls} style={sty} rows={3} value={value} placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.value)} />
      ) : (
        <input className={cls} style={sty} type={type} value={value} placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.value)} />
      )}
    </div>
  );
}

function Select({ label, name, value, onChange, options, half = false }: {
  label: string; name: string; value: string; onChange: (n: string, v: string) => void;
  options: { value: string; label: string }[]; half?: boolean;
}) {
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">{label}</label>
      <select className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "#F8FAFC", border: "1.5px solid #E8EDF3", color: "#1E1E1E" }}
        value={value} onChange={(e) => onChange(name, e.target.value)}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="col-span-2 pt-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 pb-1.5 border-b border-neutral-100">{label}</p>
    </div>
  );
}

interface FormState {
  firstName: string; lastName: string; email: string; phone: string;
  whatsappNumber: string; sameAsPhone: boolean;
  city: string; address: string; organizationName: string;
  serviceName: string; serviceNotes: string;
  workStatus: string; followUpDate: string;
  totalAmount: string; paidAmount: string; paymentStatus: string;
  remarks: string; password: string; confirmPassword: string;
}

const EMPTY: FormState = {
  firstName: "", lastName: "", email: "", phone: "",
  whatsappNumber: "", sameAsPhone: false,
  city: "", address: "", organizationName: "",
  serviceName: "", serviceNotes: "",
  workStatus: "pending", followUpDate: "",
  totalAmount: "", paidAmount: "", paymentStatus: "pending",
  remarks: "", password: "", confirmPassword: "",
};

function ClientModal({ mode, initial, onClose, onSaved }: {
  mode: "create" | "edit";
  initial?: ApiUserWithProfile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const u = initial?.user;
  const p = initial?.clientProfile;
  const [form, setForm] = useState<FormState>(() => {
    if (mode === "edit" && u && p) {
      const ux = u as unknown as Record<string, unknown>;
      return {
        firstName: u.firstName ?? "", lastName: u.lastName ?? "",
        email: u.email ?? "", phone: u.phone ?? "",
        whatsappNumber: String(ux.whatsappNumber ?? ""),
        sameAsPhone: false,
        city: String(ux.city ?? ""), address: String(ux.address ?? ""),
        organizationName: p.organizationName ?? "",
        serviceName: p.serviceName ?? "", serviceNotes: p.serviceNotes ?? "",
        workStatus: p.workStatus ?? "pending",
        followUpDate: p.followUpDate ? p.followUpDate.split("T")[0] : "",
        totalAmount: p.totalAmount !== undefined ? String(p.totalAmount) : "",
        paidAmount: p.paidAmount !== undefined ? String(p.paidAmount) : "",
        paymentStatus: p.paymentStatus ?? "pending",
        remarks: p.remarks ?? "", password: "", confirmPassword: "",
      };
    }
    return { ...EMPTY };
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function set(name: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "phone" && prev.sameAsPhone) next.whatsappNumber = value;
      if (name === "totalAmount" || name === "paidAmount") {
        const tot = parseFloat(name === "totalAmount" ? value : prev.totalAmount) || 0;
        const paid = parseFloat(name === "paidAmount" ? value : prev.paidAmount) || 0;
        if (paid <= 0) next.paymentStatus = "pending";
        else if (paid < tot) next.paymentStatus = "partial_paid";
        else next.paymentStatus = "fully_paid";
      }
      return next;
    });
  }

  async function submit() {
    setErr("");
    if (!form.firstName.trim()) return setErr("First name is required");
    if (!form.email.trim()) return setErr("Email is required");
    if (mode === "create") {
      if (!form.password) return setErr("Password is required");
      if (form.password.length < 8) return setErr("Password must be at least 8 characters");
      if (form.password !== form.confirmPassword) return setErr("Passwords do not match");
    }
    setSaving(true);
    try {
      const payload: CreateClientPayload = {
        firstName: form.firstName, lastName: form.lastName || undefined as unknown as string,
        email: form.email,
        phone: form.phone || undefined, whatsappNumber: form.whatsappNumber || undefined,
        city: form.city || undefined, address: form.address || undefined,
        organizationName: form.organizationName || undefined,
        serviceName: form.serviceName || undefined, serviceNotes: form.serviceNotes || undefined,
        workStatus: form.workStatus || undefined, followUpDate: form.followUpDate || undefined,
        totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : undefined,
        paidAmount: form.paidAmount ? parseFloat(form.paidAmount) : undefined,
        paymentStatus: form.paymentStatus || undefined,
        remarks: form.remarks || undefined,
        ...(mode === "create" && { password: form.password }),
      };
      if (mode === "create") await createClient(payload);
      else if (initial?.user._id) await updateClient(initial.user._id, payload);
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const balance = (parseFloat(form.totalAmount) || 0) - (parseFloat(form.paidAmount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl"
        style={{ background: "white", boxShadow: "0 24px 64px rgba(15,27,76,0.20)" }}>

        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
              {mode === "create" ? "Add New Client" : "Edit Client"}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {mode === "create" ? "Create a client account with service details" : "Update client information"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors">
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
            <SectionDivider label="Identity" />
            <Input label="First Name" name="firstName" value={form.firstName} onChange={set} required half placeholder="Ramesh" />
            <Input label="Last Name" name="lastName" value={form.lastName} onChange={set} half placeholder="Kumar" />
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
            <Input label="Email" name="email" value={form.email} onChange={set} type="email" required half placeholder="client@example.com" />
            <Input label="City" name="city" value={form.city} onChange={set} half placeholder="Mumbai" />
            <Input label="Address" name="address" value={form.address} onChange={set} type="textarea" placeholder="Street address…" />
            <Input label="Organization / NGO Name" name="organizationName" value={form.organizationName} onChange={set} placeholder="Company or NGO name" />

            <SectionDivider label="Service Details" />
            <Input label="Service Name" name="serviceName" value={form.serviceName} onChange={set} placeholder="Section 8 Registration" />
            <Input label="Service Notes" name="serviceNotes" value={form.serviceNotes} onChange={set} type="textarea" placeholder="Additional notes about the service…" />

            <SectionDivider label="Workflow" />
            <Select label="Work Status" name="workStatus" value={form.workStatus} onChange={set} half
              options={[
                { value: "pending",     label: "Pending" },
                { value: "in_progress", label: "In Progress" },
                { value: "completed",   label: "Completed" },
              ]} />
            <Input label="Follow-up Date" name="followUpDate" value={form.followUpDate} onChange={set} type="date" half />

            <SectionDivider label="Payment Details" />
            <Input label="Total Amount (₹)" name="totalAmount" value={form.totalAmount} onChange={set} type="number" half placeholder="13500" />
            <Input label="Paid Amount (₹)" name="paidAmount" value={form.paidAmount} onChange={set} type="number" half placeholder="6750" />
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Balance Amount (₹)</label>
              <div className="px-3 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", color: "#15803D" }}>
                {balance >= 0 ? `₹${balance.toLocaleString("en-IN")}` : "—"}
              </div>
            </div>
            <Select label="Payment Status" name="paymentStatus" value={form.paymentStatus} onChange={set} half
              options={[
                { value: "pending",      label: "Pending" },
                { value: "partial_paid", label: "Partial Paid" },
                { value: "fully_paid",   label: "Fully Paid" },
              ]} />

            <SectionDivider label="Remarks" />
            <Input label="Remarks / Notes" name="remarks" value={form.remarks} onChange={set} type="textarea" placeholder="Internal notes…" />

            {mode === "create" && (
              <Fragment>
                <SectionDivider label="Account Setup" />
                <div className="col-span-2 px-4 py-3 rounded-xl text-xs flex items-start gap-2"
                  style={{ background: "rgba(37,99,235,0.06)", color: "#1E3A8A", border: "1px solid rgba(37,99,235,0.12)" }}>
                  <Shield size={13} className="mt-0.5 flex-shrink-0" />
                  <span>Login ID is the email above. Share credentials securely with the client.</span>
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
            style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)", boxShadow: "0 4px 16px rgba(30,58,138,0.25)" }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {mode === "create" ? "Create Client" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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

function ClientDetailPanel({ client, onEdit, onDeactivate, onReactivate, onArchive, onClose }: {
  client: ApiUserWithProfile;
  onEdit: () => void; onDeactivate: () => void; onReactivate: () => void;
  onArchive: () => void; onClose: () => void;
}) {
  const u = client.user;
  const p = client.clientProfile;
  const projects = client.projects ?? [];
  const ux = u as unknown as Record<string, unknown>;
  const isActive = u.accountStatus === "active";
  const wkC = WORK_STATUS_COLORS[p?.workStatus ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
  const pyC = PAY_STATUS_COLORS[p?.paymentStatus ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
  const acC = ACCOUNT_COLORS[u.accountStatus ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 4px 16px rgba(15,27,76,0.08)" }}>
      <div className="relative p-5" style={{ background: "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 60%, #2E1065 100%)" }}>
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
            {p?.organizationName && <p className="text-xs text-white/60 mt-0.5">{p.organizationName}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge label={u.accountStatus} colors={acC} />
          {p?.workStatus && <Badge label={p.workStatus} colors={wkC} />}
          {p?.paymentStatus && <Badge label={p.paymentStatus} colors={pyC} />}
        </div>
      </div>

      {/* Action row */}
      <div className="flex border-b border-neutral-100">
        {[
          { icon: <Edit2 size={12} />, label: "Edit",       onClick: onEdit,       color: "#1E3A8A" },
          isActive
            ? { icon: <ShieldOff size={12} />, label: "Deactivate", onClick: onDeactivate, color: "#B45309" }
            : { icon: <Shield size={12} />,    label: "Reactivate", onClick: onReactivate, color: "#15803D" },
          { icon: <Trash2 size={12} />,  label: "Archive",  onClick: onArchive,    color: "#DC2626" },
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

        {/* Service */}
        {p?.serviceName && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Service</p>
            <div className="flex items-center gap-2 text-xs text-neutral-700 mb-1">
              <FileText size={11} className="text-neutral-400 flex-shrink-0" />
              <span className="font-semibold">{p.serviceName}</span>
            </div>
            {p.serviceNotes && <p className="text-xs text-neutral-500 pl-4">{p.serviceNotes}</p>}
          </div>
        )}

        {/* Payment */}
        {p?.totalAmount !== undefined && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Payment</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { l: "Total",   v: fmtCurrency(p.totalAmount),   c: "#1E1E1E" },
                { l: "Paid",    v: fmtCurrency(p.paidAmount),    c: "#15803D" },
                { l: "Balance", v: fmtCurrency((p.totalAmount ?? 0) - (p.paidAmount ?? 0)), c: "#B45309" },
              ].map((r) => (
                <div key={r.l} className="text-center p-2 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                  <p className="text-[9px] uppercase tracking-widest text-neutral-400">{r.l}</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: r.c }}>{r.v}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {p?.followUpDate && (
          <div className="flex items-center gap-2 p-3 rounded-xl"
            style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}>
            <Calendar size={13} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-amber-700 font-semibold">Follow-up</p>
              <p className="text-xs font-bold text-amber-800">{fmtDate(p.followUpDate)}</p>
            </div>
          </div>
        )}

        {p?.remarks && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">Remarks</p>
            <p className="text-xs text-neutral-600 leading-relaxed">{p.remarks}</p>
          </div>
        )}

        {/* Projects */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1.5">
            <FolderKanban size={10} /> Projects ({projects.length})
          </p>
          {projects.length === 0
            ? <p className="text-xs text-neutral-400">No projects yet</p>
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
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0"
                        style={{ background: "rgba(37,99,235,0.10)", color: "#1E3A8A" }}>
                        {String(x.projectStatus ?? "")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        <p className="text-[10px] text-neutral-400 pt-2 border-t border-neutral-100">
          Joined: {fmtDate(u.createdAt)} · ID: {u._id.slice(-6).toUpperCase()}
        </p>
      </div>
    </div>
  );
}

// ── Quick filter pills ────────────────────────────────────────

const CLIENT_PILLS: PillFilter[] = [
  { key: "all",           label: "All",              bg: "#1E3A8A", color: "white" },
  { key: "active",        label: "Active",           bg: "#16A34A", color: "white" },
  { key: "pending",       label: "Pending",          bg: "#D97706", color: "white" },
  { key: "pay_pending",   label: "Pay Pending",      bg: "#DC2626", color: "white" },
  { key: "work_done",     label: "Work Done",        bg: "#0F766E", color: "white" },
  { key: "completed",     label: "Completed + Paid", bg: "#15803D", color: "white" },
];

const CLIENT_SORT_OPTIONS = [
  { value: "createdAt",    label: "Date Created"   },
  { value: "updatedAt",    label: "Last Updated"   },
  { value: "followUpDate", label: "Follow-up Date" },
  { value: "firstName",    label: "Name"           },
];

// ── Main ───────────────────────────────────────────────────────────────────────

export default function ClientManagement() {
  const [clients, setClients]       = useState<ApiUserWithProfile[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [quickPill, setQuickPill]   = useState("all");
  const [sortBy, setSortBy]         = useState("createdAt");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [selected, setSelected]     = useState<ApiUserWithProfile | null>(null);
  const [detailLoading, setDL]      = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<ApiUserWithProfile | null>(null);
  const [confirmAction, setConfirm] = useState<{
    type: "deactivate" | "reactivate" | "archive"; client: ApiUserWithProfile;
  } | null>(null);
  const [actionLoading, setAL]      = useState(false);

  const LIMIT = 15;

  // Build query from pill
  function pillToFilter(pill: string): Record<string, string | undefined> {
    if (pill === "active")      return { status: "active" };
    if (pill === "pending")     return { status: "pending" };
    if (pill === "pay_pending") return { paymentStatus: "pending" };
    if (pill === "work_done")   return { workStatus: "completed" };
    if (pill === "completed")   return { status: "active", paymentStatus: "fully_paid" };
    return {};
  }

  const loadData = useCallback(async (pg = 1) => {
    setLoading(true); setError(false);
    try {
      const extra = pillToFilter(quickPill);
      const res = await fetchClientsEnhanced({
        page: pg, limit: LIMIT,
        search: search || undefined,
        status: (extra.status ?? statusFilter) || undefined,
        sortBy, sortOrder: sortDir,
      });
      const list: ApiUserWithProfile[] = (res.users ?? []).map((u: unknown) => {
        const rec = u as unknown as Record<string, unknown>;
        if (rec.user) return rec as unknown as ApiUserWithProfile;
        const { profile, ...rest } = rec;
        return {
          user: rest as unknown as ApiUserWithProfile["user"],
          clientProfile: profile as unknown as ApiUserWithProfile["clientProfile"],
        };
      });
      // Client-side filter for pills that backend may not support
      let filtered = list;
      if (extra.paymentStatus) {
        filtered = list.filter((c) => c.clientProfile?.paymentStatus === extra.paymentStatus);
      }
      if (extra.workStatus) {
        filtered = list.filter((c) => c.clientProfile?.workStatus === extra.workStatus);
      }
      setClients(filtered);
      setTotal(res.meta?.total ?? filtered.length);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, quickPill, sortBy, sortDir]); // eslint-disable-line

  useEffect(() => { setPage(1); loadData(1); }, [search, statusFilter, quickPill, sortBy, sortDir]); // eslint-disable-line
  useEffect(() => { if (page > 1) loadData(page); }, [page]); // eslint-disable-line

  async function openDetail(item: ApiUserWithProfile) {
    const id = item.user?._id ?? (item as unknown as { _id?: string })._id;
    if (!id) { setSelected(item); return; }
    setSelected(item); setDL(true);
    try { const d = await fetchClientDetail(id); setSelected(d); } catch { /* keep */ }
    finally { setDL(false); }
  }

  async function doAction() {
    if (!confirmAction) return;
    setAL(true);
    try {
      const id = confirmAction.client.user?._id ?? (confirmAction.client as unknown as { _id?: string })._id ?? "";
      if (confirmAction.type === "deactivate") await deactivateClient(id);
      if (confirmAction.type === "reactivate") await reactivateClient(id);
      if (confirmAction.type === "archive")    await archiveClient(id);
      setConfirm(null); setSelected(null); loadData(page);
    } catch { /* ignore */ } finally { setAL(false); }
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Clients</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} registered clients</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            label="Export"
            onExport={() => exportClients({ search, status: statusFilter })}
          />
          <button onClick={() => loadData(page)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-50"
            style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:-translate-y-px transition-all"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)", boxShadow: "0 4px 16px rgba(30,58,138,0.25)" }}>
            <Plus size={14} /> Add Client
          </button>
        </div>
      </div>

      {/* Filters */}
      <CRMFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, email, phone…"
        pills={CLIENT_PILLS}
        activePill={quickPill}
        onPillChange={(k) => { setQuickPill(k); setPage(1); }}
        rightSlot={
          <SortSelector
            value={sortBy}
            options={CLIENT_SORT_OPTIONS}
            dir={sortDir}
            onValueChange={(v) => { setSortBy(v); setPage(1); }}
            onDirChange={(d) => { setSortDir(d); setPage(1); }}
          />
        }
      />

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-blue-600" /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-neutral-500 text-sm">Failed to load clients.</p>
          <button onClick={() => loadData(page)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#1E3A8A" }}>
            Retry
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* List */}
          <div className="lg:col-span-2 space-y-2">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
                style={{ background: "white", border: "1px solid #E8EDF3" }}>
                <User size={32} className="text-neutral-300" />
                <p className="text-neutral-400 text-sm">No clients found</p>
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#1E3A8A" }}>
                  <Plus size={13} /> Add First Client
                </button>
              </div>
            ) : (
              <>
                {clients.map((item) => {
                  const u = item.user ?? (item as unknown as ApiUserWithProfile["user"]);
                  const p = item.clientProfile;
                  const uid = u?._id ?? (item as unknown as { _id?: string })._id ?? "";
                  const isSel = (selected?.user?._id ?? (selected as unknown as { _id?: string })?._id) === uid;
                  const wkC = WORK_STATUS_COLORS[p?.workStatus ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
                  const acC = ACCOUNT_COLORS[u?.accountStatus ?? ""] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748B" };
                  return (
                    <button key={uid} onClick={() => openDetail(item)}
                      className="w-full text-left rounded-2xl p-4 transition-all hover:-translate-y-px"
                      style={{
                        background: "white",
                        border: `1.5px solid ${isSel ? "#1E3A8A" : "#E8EDF3"}`,
                        boxShadow: isSel ? "0 4px 16px rgba(30,58,138,0.12)" : "0 1px 4px rgba(15,27,76,0.05)",
                      }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)" }}>
                            {getInitials(u?.firstName ?? "?", u?.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-neutral-900 truncate">{u?.firstName} {u?.lastName}</p>
                            <p className="text-xs text-neutral-400 truncate">{u?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="hidden sm:flex flex-col items-end gap-1">
                            <Badge label={u?.accountStatus ?? "—"} colors={acC} />
                            {p?.workStatus && <Badge label={p.workStatus} colors={wkC} />}
                          </div>
                          {detailLoading && isSel
                            ? <Loader2 size={13} className="animate-spin text-blue-500" />
                            : <ChevronRight size={14} className="text-neutral-400" />}
                        </div>
                      </div>
                      {(u?.phone || p?.serviceName || p?.totalAmount !== undefined) && (
                        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-neutral-400">
                          {u?.phone && <span className="flex items-center gap-1"><Phone size={9} />{u.phone}</span>}
                          {p?.serviceName && <span className="flex items-center gap-1"><FileText size={9} />{p.serviceName}</span>}
                          {p?.totalAmount !== undefined && (
                            <span className="flex items-center gap-1">
                              <IndianRupee size={9} />{fmtCurrency(p.paidAmount ?? 0)} / {fmtCurrency(p.totalAmount)}
                            </span>
                          )}
                        </div>
                      )}
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

          {/* Detail */}
          <div>
            {!selected ? (
              <div className="rounded-2xl p-5 sm:p-8 flex flex-col items-center justify-center text-center"
                style={{ background: "white", border: "1px solid #E8EDF3", minHeight: 240 }}>
                <Eye size={28} className="text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">Select a client to view details</p>
              </div>
            ) : (
              <ClientDetailPanel
                client={selected}
                onEdit={() => setEditClient(selected)}
                onDeactivate={() => setConfirm({ type: "deactivate", client: selected })}
                onReactivate={() => setConfirm({ type: "reactivate", client: selected })}
                onArchive={() => setConfirm({ type: "archive", client: selected })}
                onClose={() => setSelected(null)}
              />
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <ClientModal mode="create" onClose={() => setShowCreate(false)}
            onSaved={() => { setShowCreate(false); loadData(page); }} />
        )}
        {editClient && (
          <ClientModal mode="edit" initial={editClient} onClose={() => setEditClient(null)}
            onSaved={() => { setEditClient(null); loadData(page); }} />
        )}
        {confirmAction && (
          <ConfirmDialog
            title={confirmAction.type === "deactivate" ? "Deactivate Client?" : confirmAction.type === "reactivate" ? "Reactivate Client?" : "Archive Client?"}
            message={
              confirmAction.type === "deactivate"
                ? `Prevent ${confirmAction.client.user?.firstName ?? "this client"} from logging in?`
                : confirmAction.type === "reactivate"
                ? `Restore ${confirmAction.client.user?.firstName ?? "this client"}'s access?`
                : `Archive ${confirmAction.client.user?.firstName ?? "this client"}? This cannot be easily undone.`
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
