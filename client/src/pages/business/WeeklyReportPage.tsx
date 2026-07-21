import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { BusinessTabs } from "../../components/business/BusinessTabs";
import { useToast } from "../../components/Toast";
import { PageSkeleton } from "../../components/Skeleton";
import { useCurrency } from "../../contexts/CurrencyContext";
import { businessApi, mondayOf, type Location, type LogType, type WeeklyReport } from "../../lib/businessApi";
import { ChevronLeft, ChevronRight, Copy, MessageSquareWarning, UserX } from "lucide-react";

function shiftWeek(weekStart: string, days: number): string {
  const d = new Date(`${weekStart}T00:00:00`);
  d.setDate(d.getDate() + days);
  return mondayOf(d);
}

function formatRange(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, { ...opts, year: "numeric" })}`;
}

export function WeeklyReportPage() {
  const { toast } = useToast();
  const { format } = useCurrency();

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const [logType, setLogType] = useState<LogType>("COMPLAINT");
  const [logText, setLogText] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [submittingLog, setSubmittingLog] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { locations: locs } = await businessApi.listLocations();
        setLocations(locs);
        if (locs[0]) setLocationId(locs[0].id);
      } catch (err) {
        toast((err as Error).message, "error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReport() {
    if (!locationId) return;
    setLoading(true);
    try {
      const data = await businessApi.getWeeklyReport(locationId, weekStart);
      setReport(data);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, weekStart]);

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logText.trim()) return;
    setSubmittingLog(true);
    try {
      await businessApi.createWeeklyLog({
        locationId,
        date: new Date(logDate).toISOString(),
        type: logType,
        text: logText,
      });
      toast("Logged", "success");
      setLogText("");
      await loadReport();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSubmittingLog(false);
    }
  }

  async function handleCopy() {
    if (!report) return;
    const locationName = locations.find((l) => l.id === locationId)?.name ?? "";
    const lines = [
      `📍 ${locationName} — Weekly Report (${formatRange(weekStart)})`,
      ``,
      `💰 Total sales: ${format(report.totalRevenue)}`,
      `🏆 Best-selling item: ${report.bestSellingItem ?? "—"}`,
      `📦 Low stock: ${report.lowStockItems.length === 0 ? "None" : report.lowStockItems.map((i) => `${i.name} (${i.quantity} left)`).join(", ")}`,
      `⚠️ Complaints: ${report.complaints.length === 0 ? "None" : report.complaints.map((c) => c.text).join("; ")}`,
      `👥 Staff issues: ${report.staffIssues.length === 0 ? "None" : report.staffIssues.map((s) => s.text).join("; ")}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast("Copied — ready to paste into WhatsApp", "success");
    } catch {
      toast("Could not copy to clipboard", "error");
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 dark:from-white dark:via-emerald-300 dark:to-white">
          Weekly Report
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
          A 5-point summary you can screenshot or copy straight into WhatsApp
        </p>
      </div>

      <BusinessTabs />

      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => shiftWeek(w, -7))}
            className="rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-40 text-center">
            {formatRange(weekStart)}
          </span>
          <button
            onClick={() => setWeekStart((w) => shiftWeek(w, 7))}
            className="rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => void handleCopy()}
            disabled={!report}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Copy size={14} /> Copy summary
          </button>
        </div>
      </div>

      {loading && <PageSkeleton />}

      {!loading && report && (
        <div className="space-y-6">
          <div
            className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] p-6 shadow-lg"
            style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Sales</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{format(report.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Best-Selling Item</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{report.bestSellingItem ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Low Stock Items</p>
                {report.lowStockItems.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">All good — nothing low</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {report.lowStockItems.map((i) => (
                      <li key={i.id} className="text-sm text-amber-700 dark:text-amber-400">
                        {i.name} — {i.quantity} left
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
            >
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <MessageSquareWarning size={16} /> Complaints this week
              </h3>
              {report.complaints.length === 0 ? (
                <p className="text-sm text-slate-500">None logged</p>
              ) : (
                <ul className="space-y-2">
                  {report.complaints.map((c) => (
                    <li key={c.id} className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0D1117] rounded-lg p-3 border border-slate-200 dark:border-slate-700/50">
                      {c.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
            >
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <UserX size={16} /> Staff issues this week
              </h3>
              {report.staffIssues.length === 0 ? (
                <p className="text-sm text-slate-500">None logged</p>
              ) : (
                <ul className="space-y-2">
                  {report.staffIssues.map((s) => (
                    <li key={s.id} className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0D1117] rounded-lg p-3 border border-slate-200 dark:border-slate-700/50">
                      {s.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div
            className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
            style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
          >
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Log a complaint or staff issue</h3>
            <form onSubmit={handleAddLog} className="flex flex-col md:flex-row gap-3">
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value as LogType)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="COMPLAINT">Complaint</option>
                <option value="STAFF_ISSUE">Staff Issue</option>
              </select>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
              <input
                type="text"
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="Describe what happened..."
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white dark:placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
              <button
                type="submit"
                disabled={submittingLog}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
