/**
 * ClientManagement — Batch 3 (live API)
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import {
  Search, User, Mail, Phone, FolderKanban,
  AlertCircle, Loader2, RefreshCw, ChevronRight,
} from "lucide-react";
import { fetchUsers, fetchProjects, type ApiUser, type ApiProject } from "@/lib/crmApi";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ClientManagement() {
  const [clients, setClients]   = useState<ApiUser[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<ApiUser | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [usersRes, projRes] = await Promise.all([
        fetchUsers("client"),
        fetchProjects({ limit: 100 }),
      ]);
      setClients(usersRes ?? []);
      setProjects(projRes.projects ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-blue-600" /></div>;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load clients.</p>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q)
    );
  });

  const clientProjects = selected
    ? projects.filter((p) => p.clientId === selected._id)
    : [];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Clients</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{clients.length} registered clients</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100"
          style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "white", border: "1px solid #E8EDF3", color: "#1E1E1E" }}
            />
          </div>

          {filtered.length === 0
            ? <p className="text-center text-neutral-400 text-sm py-10">No clients found</p>
            : filtered.map((c) => {
                const cProjects = projects.filter((p) => p.clientId === c._id);
                const active = cProjects.filter((p) => !["completed", "cancelled"].includes(p.projectStatus ?? "")).length;
                const isSelected = selected?._id === c._id;
                return (
                  <button key={c._id} onClick={() => setSelected(isSelected ? null : c)}
                    className="w-full text-left rounded-2xl p-4 transition-all hover:-translate-y-px"
                    style={{ background: "white", border: `1.5px solid ${isSelected ? "#1E3A8A" : "#E8EDF3"}`, boxShadow: isSelected ? "0 4px 16px rgba(30,58,138,0.12)" : "0 1px 4px rgba(15,27,76,0.05)" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)" }}>
                          {c.firstName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-neutral-400 truncate">{c.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {active > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(37,99,235,0.10)", color: "#1E3A8A" }}>
                            {active} active
                          </span>
                        )}
                        <ChevronRight size={14} className="text-neutral-400" />
                      </div>
                    </div>
                  </button>
                );
              })
          }
        </div>

        {/* Detail panel */}
        <div>
          {!selected ? (
            <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center"
              style={{ background: "white", border: "1px solid #E8EDF3", minHeight: 200 }}>
              <User size={28} className="text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-400">Select a client to view details</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #E8EDF3" }}>
              <div className="p-5 border-b" style={{ borderColor: "#F1F5F9" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)" }}>
                    {selected.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">{selected.firstName} {selected.lastName}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: selected.accountStatus === "active" ? "rgba(22,163,74,0.10)" : "rgba(100,116,139,0.10)", color: selected.accountStatus === "active" ? "#15803D" : "#64748B" }}>
                      {selected.accountStatus}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: <Mail size={12} />, label: selected.email },
                    { icon: <Phone size={12} />, label: selected.phone ?? "—" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-neutral-500">
                      {r.icon}<span>{r.label}</span>
                    </div>
                  ))}
                  <p className="text-xs text-neutral-400">Joined: {fmtDate(selected.createdAt)}</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
                  <FolderKanban size={12} /> Projects ({clientProjects.length})
                </p>
                {clientProjects.length === 0
                  ? <p className="text-xs text-neutral-400 py-2">No projects</p>
                  : (
                    <div className="space-y-2">
                      {clientProjects.slice(0, 5).map((p) => (
                        <div key={p._id} className="flex items-center justify-between p-2 rounded-lg"
                          style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                          <p className="text-xs font-semibold text-neutral-900 truncate">{p.title || p.projectCode}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2"
                            style={{ background: "rgba(37,99,235,0.10)", color: "#1E3A8A" }}>
                            {p.projectStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
