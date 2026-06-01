/**
 * ExportButton — Reusable Excel export trigger for CRM screens.
 * Shows loading state, handles errors, and triggers a blob download.
 */

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ExportButtonProps {
  /** Async function that triggers the export (from crmApi) */
  onExport: () => Promise<void>;
  /** Optional label override */
  label?: string;
  /** Optional compact mode (icon only) */
  compact?: boolean;
}

export function ExportButton({ onExport, label = "Export", compact = false }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await onExport();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        title={label}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
        style={{
          background: loading ? "rgba(30,58,138,0.07)" : "rgba(30,58,138,0.06)",
          color: "#1E3A8A",
          border: "1px solid rgba(30,58,138,0.15)",
        }}
      >
        {loading
          ? <Loader2 size={13} className="animate-spin" />
          : <Download size={13} />}
        {!compact && <span>{loading ? "Exporting…" : label}</span>}
      </button>

      {error && (
        <div
          className="absolute top-full mt-1 right-0 z-50 text-xs px-3 py-2 rounded-xl shadow-lg whitespace-nowrap"
          style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
