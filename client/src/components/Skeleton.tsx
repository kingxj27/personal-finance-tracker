/* Shimmer skeleton components — drop-in replacements for loading states */
import type React from "react";

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-100 ${className ?? ""}`}
      style={style}
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
          animation: "shimmer 1.6s infinite",
        }}
      />
      <style>{`@keyframes shimmer { to { transform: translateX(200%); } }`}</style>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-9 w-36 mt-3" />
          <Shimmer className="h-3 w-20 mt-2" />
        </div>
        <Shimmer className="h-12 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <Shimmer className="h-5 w-40 mb-6" />
      <Shimmer className="w-full rounded-xl" style={{ height }} />
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4">
          <Shimmer className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3.5 w-48" />
            <Shimmer className="h-3 w-28" />
          </div>
          <Shimmer className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <Shimmer className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-32" />
              <Shimmer className="h-3 w-20" />
            </div>
          </div>
          <Shimmer className="h-8 w-28" />
          <Shimmer className="h-3 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Shimmer className="h-9 w-64" />
          <Shimmer className="h-4 w-80" />
        </div>
        <Shimmer className="h-10 w-28 rounded-lg" />
      </div>
      {/* Stat cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <TableRowSkeleton />
    </div>
  );
}
