/**
 * LoadingStates — Batch 4.4
 * Reusable loading skeleton and empty state components.
 * Used across dashboards, CRM panels, and public pages.
 */

import type { ReactNode } from "react";

// ── Skeleton primitives ───────────────────────────────────────────────────────

function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)", backgroundSize: "200% 100%" }}
      aria-hidden="true"
    />
  );
}

/** Card-shaped skeleton */
export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "white", border: "1px solid #E8EDF3" }}
      aria-hidden="true"
    >
      <SkeletonBox className="h-4 w-1/3 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} className={`h-3 mb-2 ${i % 2 === 1 ? "w-3/4" : "w-full"}`} />
      ))}
    </div>
  );
}

/** KPI metric card skeleton */
export function SkeletonKPI() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "white", border: "1px solid #E8EDF3" }}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between mb-4">
        <SkeletonBox className="h-3 w-1/2" />
        <SkeletonBox className="h-8 w-8 rounded-xl" />
      </div>
      <SkeletonBox className="h-7 w-2/5 mb-2" />
      <SkeletonBox className="h-2.5 w-3/5" />
    </div>
  );
}

/** Dashboard grid of skeletons */
export function DashboardSkeleton({ kpis = 4, cards = 2 }: { kpis?: number; cards?: number }) {
  return (
    <div role="status" aria-label="Loading dashboard…">
      {/* KPI row */}
      <div className={`grid gap-4 mb-6 grid-cols-2 lg:grid-cols-${kpis}`}>
        {Array.from({ length: kpis }).map((_, i) => <SkeletonKPI key={i} />)}
      </div>
      {/* Cards row */}
      <div className={`grid gap-4 grid-cols-1 lg:grid-cols-${cards}`}>
        {Array.from({ length: cards }).map((_, i) => <SkeletonCard key={i} rows={4} />)}
      </div>
    </div>
  );
}

/** List skeleton for project/lead lists */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading list…">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-4"
          style={{ borderBottom: "1px solid #F1F5F9" }}
          aria-hidden="true"
        >
          <SkeletonBox className="h-9 w-9 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <SkeletonBox className="h-3.5 w-2/5 mb-2" />
            <SkeletonBox className="h-2.5 w-3/5" />
          </div>
          <SkeletonBox className="h-6 w-16 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      role="status"
    >
      {icon && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "#F1F5F9" }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <p
        className="text-base font-semibold mb-1"
        style={{ color: "#1E3A8A", fontFamily: "'Sora', sans-serif" }}
      >
        {title}
      </p>
      {description && (
        <p className="text-sm max-w-xs" style={{ color: "#64748B", fontFamily: "'DM Sans', sans-serif" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
      role="alert"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: "rgba(239,68,68,0.08)" }}
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p
        className="text-sm font-medium mb-1"
        style={{ color: "#0F172A", fontFamily: "'Sora', sans-serif" }}
      >
        Unable to load data
      </p>
      <p className="text-xs mb-4" style={{ color: "#64748B" }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{ background: "#EFF6FF", color: "#1E3A8A" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}
