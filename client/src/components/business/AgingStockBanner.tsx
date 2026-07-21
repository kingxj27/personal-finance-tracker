import { AlertTriangle } from "lucide-react";

export function AgingStockBanner({
  buckets,
  onSelect,
  activeDays,
}: {
  buckets: { days: number; count: number }[];
  onSelect?: (days: 60 | 90 | 180 | null) => void;
  activeDays?: number | null;
}) {
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  if (total === 0) return null;

  return (
    <div className="mb-8 rounded-xl border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 dark:border-amber-700/40 p-5 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
          <AlertTriangle size={20} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-amber-900 dark:text-amber-200">Aging stock alert</p>
          <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-0.5">
            Items sitting with zero sales — consider a discount or promotion to move them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {buckets.map((b) => (
              <button
                key={b.days}
                type="button"
                disabled={!onSelect || b.count === 0}
                onClick={() => onSelect?.(activeDays === b.days ? null : (b.days as 60 | 90 | 180))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeDays === b.days
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white/70 dark:bg-black/20 border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300"
                } ${!onSelect || b.count === 0 ? "cursor-default opacity-70" : "cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40"}`}
              >
                {b.count} item{b.count === 1 ? "" : "s"} · {b.days}+ days
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
