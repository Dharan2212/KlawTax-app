/**
 * ClientDocuments — Batch 3 (live API)
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchClientDocuments } from "@/lib/crmApi";
import { Loader2, AlertCircle, RefreshCw, FileText, Download, CheckCircle2 } from "lucide-react";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ClientDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchClientDocuments();
      setDocuments(data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    uploaded:  { label: "Uploaded",       color: "#1E3A8A", bg: "rgba(37,99,235,0.10)"  },
    approved:  { label: "Approved",       color: "#15803D", bg: "rgba(22,163,74,0.10)"  },
    rejected:  { label: "Rejected",       color: "#DC2626", bg: "rgba(220,38,38,0.10)"  },
    delivered: { label: "Ready for Download", color: "#0F766E", bg: "rgba(20,184,166,0.10)" },
  };

  const deliverable = documents.filter((d) => d.documentCategory === "deliverable" || d.status === "delivered");
  const submitted   = documents.filter((d) => d.documentCategory !== "deliverable" && d.status !== "delivered");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Documents</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{documents.length} document{documents.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={loadData} className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100" title="Refresh">
          <RefreshCw size={13} className="text-neutral-400" />
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={32} className="text-neutral-300 mb-3" />
          <h3 className="font-bold text-neutral-700 mb-1">No Documents Yet</h3>
          <p className="text-sm text-neutral-400">Your submitted documents and completed certificates will appear here.</p>
        </div>
      ) : (
        <>
          {/* Deliverables */}
          {deliverable.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} style={{ color: "#15803D" }} />
                <h2 className="text-sm font-bold text-neutral-900">Ready to Download</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(22,163,74,0.10)", color: "#15803D" }}>{deliverable.length}</span>
              </div>
              <div className="space-y-2">
                {deliverable.map((doc, i) => (
                  <div key={doc._id ?? i} className="flex items-center justify-between p-4 rounded-2xl"
                    style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", border: "1px solid #A7F3D0" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(22,163,74,0.10)" }}>
                        <FileText size={16} style={{ color: "#15803D" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-900 truncate">{doc.fileName || doc.documentType}</p>
                        {doc.uploadedAt && <p className="text-xs text-neutral-500 mt-0.5">{fmtDate(doc.uploadedAt)}</p>}
                      </div>
                    </div>
                    {doc.downloadUrl ? (
                      <a href={doc.downloadUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
                        style={{ background: "#15803D", color: "white" }}>
                        <Download size={12} /> Download
                      </a>
                    ) : (
                      <span className="text-xs text-green-700 font-semibold flex-shrink-0">Ready</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitted documents */}
          {submitted.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-neutral-900 mb-3">Submitted Documents</h2>
              <div className="space-y-2">
                {submitted.map((doc, i) => {
                  const sc = STATUS_CFG[doc.status ?? "uploaded"] ?? STATUS_CFG.uploaded;
                  return (
                    <div key={doc._id ?? i} className="flex items-center justify-between p-4 rounded-2xl"
                      style={{ background: "white", border: "1px solid #E8EDF3" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={14} className="text-neutral-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{doc.fileName || doc.documentType}</p>
                          {doc.uploadedAt && <p className="text-xs text-neutral-400 mt-0.5">{fmtDate(doc.uploadedAt)}</p>}
                          {doc.rejectionReason && (
                            <p className="text-xs text-red-600 mt-0.5">Rejected: {doc.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
