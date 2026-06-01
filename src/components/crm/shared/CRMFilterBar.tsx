/**
 * CRMFilterBar — Batch 3
 * Reusable filter bar: search input + optional pill filters + sort dropdown.
 */

import { useRef, useEffect } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

export interface PillFilter {
  key: string;
  label: string;
  count?: number;
  color?: string;
  bg?: string;
}

interface CRMFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  pills?: PillFilter[];
  activePill?: string;
  onPillChange?: (key: string) => void;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function CRMFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  pills,
  activePill,
  onPillChange,
  rightSlot,
  className = "",
}: CRMFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search + right slot */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#94A3B8" }} />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "white",
              border: "1.5px solid #E8EDF3",
              color: "#1E1E1E",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#3B82F6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.10)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#E8EDF3"; e.currentTarget.style.boxShadow = "none"; }}
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X size={12} style={{ color: "#94A3B8" }} />
            </button>
          )}
        </div>
        {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      </div>

      {/* Quick filter pills */}
      {pills && pills.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {pills.map((p) => {
            const isActive = activePill === p.key;
            return (
              <button
                key={p.key}
                onClick={() => onPillChange?.(p.key)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: isActive ? (p.bg ?? "#1E3A8A") : "white",
                  color: isActive ? (p.color ?? "white") : "#64748B",
                  border: isActive ? `1.5px solid ${p.bg ?? "#1E3A8A"}` : "1.5px solid #E8EDF3",
                  boxShadow: isActive ? "0 2px 8px rgba(15,27,76,0.12)" : "none",
                }}
              >
                {p.label}
                {p.count !== undefined && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.25)" : "rgba(100,116,139,0.12)",
                      color: isActive ? "white" : "#64748B",
                    }}
                  >
                    {p.count > 99 ? "99+" : p.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Pagination bar ─────────────────────────────────────────────

interface PaginationBarProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
  loading?: boolean;
}

export function PaginationBar({ page, pages, total, limit, onPageChange, loading }: PaginationBarProps) {
  if (pages <= 1 && total <= limit) return null;
  const start = (page - 1) * limit + 1;
  const end   = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
      <p className="text-xs text-neutral-400">
        Showing <span className="font-semibold text-neutral-600">{start}–{end}</span> of{" "}
        <span className="font-semibold text-neutral-600">{total}</span> records
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-neutral-100"
          style={{ border: "1px solid #E8EDF3", color: "#334155" }}
        >
          ← Prev
        </button>
        {/* Page numbers (max 5 visible) */}
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          let p = i + 1;
          if (pages > 5) {
            if (page <= 3) p = i + 1;
            else if (page >= pages - 2) p = pages - 4 + i;
            else p = page - 2 + i;
          }
          return (
            <button
              key={p}
              disabled={loading}
              onClick={() => onPageChange(p)}
              className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: p === page ? "#1E3A8A" : "white",
                color: p === page ? "white" : "#64748B",
                border: p === page ? "1.5px solid #1E3A8A" : "1px solid #E8EDF3",
              }}
            >
              {p}
            </button>
          );
        })}
        <button
          disabled={page >= pages || loading}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-neutral-100"
          style={{ border: "1px solid #E8EDF3", color: "#334155" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Sort selector ──────────────────────────────────────────────

interface SortOption { value: string; label: string; }
interface SortSelectorProps {
  value: string;
  options: SortOption[];
  dir: "asc" | "desc";
  onValueChange: (v: string) => void;
  onDirChange: (d: "asc" | "desc") => void;
}

export function SortSelector({ value, options, dir, onValueChange, onDirChange }: SortSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <SlidersHorizontal size={13} style={{ color: "#94A3B8" }} />
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="rounded-lg px-2.5 py-2 text-xs outline-none"
        style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        onClick={() => onDirChange(dir === "asc" ? "desc" : "asc")}
        className="px-2 py-2 rounded-lg text-xs font-bold transition-colors hover:bg-neutral-100"
        style={{ border: "1px solid #E8EDF3", color: "#64748B", minWidth: "32px" }}
        title={dir === "asc" ? "Ascending" : "Descending"}
      >
        {dir === "asc" ? "↑" : "↓"}
      </button>
    </div>
  );
}
