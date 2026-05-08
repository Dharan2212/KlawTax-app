import React from "react";
import { User, Shield, Briefcase, Clock, Flag, Check, X } from "lucide-react";

export type TimelineActor = "admin" | "employee" | "client" | "deadline" | "system";

export interface TimelineEntry {
  id?: string;
  date: string;   // ISO or "YYYY-MM-DD"
  type: TimelineActor;
  label: string;
  actor?: string; // display name
  isMilestone?: boolean;
}

// ── Actor config ──────────────────────────────────────────
const ACTOR_CFG: Record<TimelineActor, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  admin:    { color:"#2563EB", bg:"rgba(37,99,235,0.10)",   label:"Admin",    icon:<Shield   size={11} strokeWidth={2.5} aria-hidden="true" /> },
  employee: { color:"#7C3AED", bg:"rgba(124,58,237,0.10)", label:"Team",     icon:<Briefcase size={11} strokeWidth={2.5} aria-hidden="true" /> },
  client:   { color:"#15803D", bg:"rgba(22,163,74,0.10)",  label:"Client",   icon:<User      size={11} strokeWidth={2.5} aria-hidden="true" /> },
  deadline: { color:"#D97706", bg:"rgba(217,119,6,0.10)",  label:"Deadline", icon:<Clock     size={11} strokeWidth={2.5} aria-hidden="true" /> },
  system:   { color:"#64748B", bg:"rgba(100,116,139,0.10)",label:"System",   icon:<Flag      size={11} strokeWidth={2.5} aria-hidden="true" /> },
};

function fmtDate(d: string): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  const today    = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString())     return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

/** Group entries by date bucket: Today / This Week / Earlier */
export function groupEntriesByDate(entries: TimelineEntry[]): Record<string, TimelineEntry[]> {
  const now = Date.now();
  const DAY  = 86400000;
  const WEEK = 7 * DAY;
  const groups: Record<string, TimelineEntry[]> = {};
  for (const e of entries) {
    const age = now - new Date(e.date).getTime();
    const bucket = age < DAY ? "Today" : age < WEEK ? "This Week" : "Earlier";
    if (!groups[bucket]) groups[bucket] = [];
    groups[bucket].push(e);
  }
  return groups;
}

// ── Single timeline item ──────────────────────────────────
interface TimelineItemProps {
  entry: TimelineEntry;
  isLast?: boolean;
}

export function TimelineItem({ entry, isLast }: TimelineItemProps) {
  const cfg = ACTOR_CFG[entry.type] ?? ACTOR_CFG.system;

  return (
    <div className="flex items-start gap-3" aria-label={`${cfg.label}: ${entry.label}`}>
      {/* Spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center z-10 flex-shrink-0"
          style={{
            background: cfg.bg,
            border: `1.5px solid ${cfg.color}40`,
          }}
        >
          <span style={{ color: cfg.color }}>{cfg.icon}</span>
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 mt-1"
            style={{ background: "hsl(var(--color-neutral-200))", minHeight: "16px" }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium leading-snug text-foreground"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {entry.label}
            </p>
            {entry.actor && (
              <span
                className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {entry.actor}
              </span>
            )}
          </div>
          <span
            className="text-[11px] flex-shrink-0 mt-0.5"
            style={{ color: "#94A3B8", fontFamily: "'DM Sans', sans-serif" }}
          >
            {fmtDate(entry.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Grouped timeline with date labels ─────────────────────
interface GroupedTimelineProps {
  entries: TimelineEntry[];
  emptyMessage?: string;
}

export function GroupedTimeline({ entries, emptyMessage = "No activity yet." }: GroupedTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10" aria-label="No timeline entries">
        <Clock size={22} strokeWidth={1.5} className="mx-auto mb-2 opacity-30 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  const grouped = groupEntriesByDate(entries);
  const buckets = ["Today", "This Week", "Earlier"].filter((b) => grouped[b]?.length > 0);

  return (
    <div role="list" aria-label="Activity timeline">
      {buckets.map((bucket, bi) => (
        <div key={bucket} className={bi > 0 ? "mt-4" : ""}>
          {/* Date bucket label */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "#94A3B8", fontFamily: "'DM Sans', sans-serif" }}
            >
              {bucket}
            </span>
            <div className="flex-1 h-px" style={{ background: "hsl(var(--color-neutral-100))" }} aria-hidden="true" />
          </div>

          {/* Items */}
          {grouped[bucket].map((entry, i) => (
            <div key={entry.id ?? `${bucket}-${i}`} role="listitem">
              <TimelineItem
                entry={entry}
                isLast={i === grouped[bucket].length - 1 && bi === buckets.length - 1}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
