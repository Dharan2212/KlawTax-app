/**
 * ClientSubmission — Batch 3 (live API)
 * Document upload flow — posts to /projects/:id/documents
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchClientProjects, type ApiProject } from "@/lib/crmApi";
import { post } from "@/lib/api";
import {
  Loader2, AlertCircle, RefreshCw, Upload, FileText,
  CheckCircle2, X, Send,
} from "lucide-react";

const REQUIRED_DOCS = [
  { id: "aadhaar",    label: "Aadhaar Card (front & back)",           category: "directors"        },
  { id: "pan",        label: "PAN Card",                               category: "directors"        },
  { id: "photo",      label: "Passport-size Photo (white background)", category: "directors"        },
  { id: "address",    label: "Address Proof (utility bill / bank statement)", category: "directors" },
  { id: "elecbill",   label: "Electricity Bill (not older than 3 months)",   category: "office"   },
  { id: "noc",        label: "NOC from Property Owner",               category: "office"           },
  { id: "rent",       label: "Rent Agreement (if rented)",            category: "office"           },
];

export default function ClientSubmission() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects]     = useState<ApiProject[]>([]);
  const [selectedProject, setSelected] = useState<string>("");
  const [selectedDocType, setDocType] = useState<string>(REQUIRED_DOCS[0].id);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchClientProjects();
      const active = (data ?? []).filter((p) => !["completed", "cancelled", "archived"].includes(p.projectStatus ?? ""));
      setProjects(active);
      if (active.length > 0) setSelected(active[0]._id);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError("");
    setUploadDone(false);
  }

  async function handleUpload() {
    if (!selectedFile || !selectedProject) return;
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("documentType", selectedDocType);
      // POST multipart — use fetch directly since api.ts wraps JSON
      const token = localStorage.getItem("access_token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? "/api/v1"}/projects/${selectedProject}/documents/upload`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Upload failed");
      }
      setUploadDone(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const whatsappUrl = `https://wa.me/919999999999?text=${encodeURIComponent("Hi KlawTax! I'd like to submit documents for my project. Please guide me.")}`;

  if (!user) return null;
  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-blue-600" /></div>;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText size={32} className="text-neutral-300 mb-3" />
        <h3 className="font-bold text-neutral-700 mb-1">No Active Projects</h3>
        <p className="text-sm text-neutral-400">Document submission is available once your project is active.</p>
      </div>
    );
  }

  const categories = Array.from(new Set(REQUIRED_DOCS.map((d) => d.category)));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Submit Documents</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Upload required documents for your registration</p>
      </div>

      {/* WhatsApp option */}
      <a href={whatsappUrl} target="_blank" rel="noreferrer"
        className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:-translate-y-px hover:shadow-md"
        style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", border: "1px solid #A7F3D0" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#25D366" }}>
          <Send size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-green-900">Send via WhatsApp (Recommended)</p>
          <p className="text-xs text-green-700 mt-0.5">Fastest way — send documents directly on WhatsApp</p>
        </div>
        <span className="text-green-700 text-sm">→</span>
      </a>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "#E8EDF3" }} />
        <span className="text-xs text-neutral-400">or upload here</span>
        <div className="flex-1 h-px" style={{ background: "#E8EDF3" }} />
      </div>

      {/* Upload form */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "white", border: "1px solid #E8EDF3" }}>
        <h2 className="text-sm font-bold text-neutral-900">Upload Document</h2>

        {/* Project selector */}
        {projects.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1.5">Select Project</label>
            <select value={selectedProject} onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }}>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title || p.projectCode}</option>
              ))}
            </select>
          </div>
        )}

        {/* Document type */}
        <div>
          <label className="text-xs font-semibold text-neutral-700 block mb-1.5">Document Type</label>
          <select value={selectedDocType} onChange={(e) => setDocType(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }}>
            {REQUIRED_DOCS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* File picker */}
        <div>
          <label className="text-xs font-semibold text-neutral-700 block mb-1.5">File</label>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="w-full text-sm text-neutral-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:cursor-pointer"
            style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", borderRadius: 12, padding: "10px 12px" }} />
          <p className="text-[10px] text-neutral-400 mt-1">PDF, JPG, PNG — Max 5MB</p>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
            <FileText size={14} style={{ color: "#15803D" }} />
            <span className="text-xs font-semibold text-green-800 truncate flex-1">{selectedFile.name}</span>
            <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
              <X size={12} className="text-green-600" />
            </button>
          </div>
        )}

        {uploadError && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle size={12} /> {uploadError}
          </p>
        )}

        {uploadDone && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#DCFCE7", border: "1px solid #A7F3D0" }}>
            <CheckCircle2 size={14} style={{ color: "#15803D" }} />
            <span className="text-xs font-semibold text-green-800">Document uploaded successfully!</span>
          </div>
        )}

        <button onClick={handleUpload} disabled={!selectedFile || uploading}
          className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          style={{ background: "linear-gradient(135deg, #1E3A8A, #3B82F6)", color: "white" }}>
          {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload Document</>}
        </button>
      </div>

      {/* Checklist */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E8EDF3" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
          <h2 className="text-sm font-bold text-neutral-900">Required Documents Checklist</h2>
        </div>
        <div className="p-4 space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-2">{cat.replace(/_/g, " ")}</p>
              <div className="space-y-1.5">
                {REQUIRED_DOCS.filter((d) => d.category === cat).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-xs text-neutral-700">
                    <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0" style={{ borderColor: "#CBD5E1" }} />
                    {doc.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
