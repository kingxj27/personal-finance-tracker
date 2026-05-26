
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, authHeaders } from "../api";
import { Layout } from "../components/Layout";
import { RecentTransactions } from "../components/RecentTransactions";
import { IncomeExpenseChart } from "../components/IncomeExpenseChart";
import { generatePDFReport } from "../utils/pdfReport";
import { AnimatedNGN, AnimatedPercent } from "../components/AnimatedNumber";
import { PageSkeleton } from "../components/Skeleton";
import { useCurrency } from "../contexts/CurrencyContext";
import { FileDown, RefreshCw, Loader2 } from "lucide-react";

/* --- Types --- */
type CategorySummary = { category: string; spent: number; budget: number };
type SummaryResponse = {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categories: CategorySummary[];
};
type AIInsight = { title: string; message: string; type: "success" | "warning" | "tip" | "alert"; icon: string };

/* --- UI constants --- */
const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔",
  Transport: "🚙",
  Utilities: "⚡",
  Entertainment: "🎭",
  Shopping: "🛒",
  Health: "🏥",
  Other: "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "from-amber-100 to-orange-100",
  Transport: "from-blue-100 to-cyan-100",
  Utilities: "from-yellow-100 to-amber-100",
  Entertainment: "from-purple-100 to-pink-100",
  Shopping: "from-pink-100 to-rose-100",
  Health: "from-green-100 to-emerald-100",
  Other: "from-gray-100 to-slate-100",
};

/* --- Stat Card with animated number --- */
function StatCard({
  title,
  amount,
  isPercent,
  subtitle,
  emoji,
  borderClass = "border-slate-200",
  valueColor = "text-slate-900",
}: {
  title: string;
  amount?: number;
  isPercent?: boolean;
  subtitle?: string;
  emoji?: string;
  borderClass?: string;
  valueColor?: string;
}) {
  return (
    <div className={`group rounded-xl border ${borderClass} bg-white dark:bg-[#161B22] p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</p>
        {emoji && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-[#0D1117]/50 group-hover:bg-emerald-50 text-xl transition-colors duration-300">
            {emoji}
          </div>
        )}
      </div>
      <p className={`text-3xl font-extrabold tabular-nums dark:text-white ${valueColor}`}>
        {amount !== undefined && !isPercent && <AnimatedNGN value={amount} />}
        {amount !== undefined && isPercent && <AnimatedPercent value={amount} />}
      </p>
      {subtitle && <p className="mt-2 text-xs text-slate-400 font-medium">{subtitle}</p>}
    </div>
  );
}

function CategoryCard({ cat, index }: { cat: CategorySummary; index: number }) {
  const { format: formatCurrency } = useCurrency();
  const [barWidth, setBarWidth] = useState(0);
  const percent = cat.budget > 0 ? Math.min(100, (cat.spent / cat.budget) * 100) : 0;
  const isOverBudget = cat.budget > 0 && cat.spent > cat.budget;
  const isNearLimit = percent > 75 && !isOverBudget;
  const progressColor = isOverBudget
    ? "from-red-400 to-red-500"
    : isNearLimit
    ? "from-amber-400 to-amber-500"
    : "from-emerald-400 to-green-500";

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(Math.min(100, percent)), 100 + index * 80);
    return () => clearTimeout(t);
  }, [percent, index]);

  return (
    <div className="group rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[cat.category] || "from-gray-100 to-slate-100"} dark:opacity-80 text-lg`}>
          {CATEGORY_ICONS[cat.category] || "📦"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-200">{cat.category}</p>
          {cat.budget > 0 && <p className="text-xs text-slate-400 mt-0.5">Budget: {formatCurrency(cat.budget)}</p>}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
          isOverBudget ? "bg-red-50 text-red-600" : isNearLimit ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
        }`}>
          {Math.round(percent)}%
        </span>
      </div>

      <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums mb-3">
        <AnimatedNGN value={cat.spent} />
      </p>

      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-700 ease-out`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {isOverBudget && (
        <p className="mt-2.5 text-xs font-semibold text-red-500 flex items-center gap-1">
          ↑ Over by {formatCurrency(cat.spent - cat.budget)}
        </p>
      )}
    </div>
  );
}

/* --- AI Insights Panel --- */
function AIInsightsPanel(_props: { summary: SummaryResponse }) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsights() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/insights`, { headers: authHeaders(token) });
      if (!res.ok) throw new Error("Could not load AI insights");
      const data = await res.json();
      setInsights(data.insights ?? []);
      setFetched(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const typeColors: Record<string, string> = {
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    tip: "bg-blue-50 border-blue-200 text-blue-800",
    alert: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 to-green-950 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🤖 AI Financial Advisor
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Powered by Claude AI • personalized for your finances</p>
        </div>
        {!fetched && (
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : "Get Insights"}
          </button>
        )}
        {fetched && (
          <button onClick={fetchInsights} disabled={loading} className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1">
            {loading ? <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : "↻"} Refresh
          </button>
        )}
      </div>

      {!fetched && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🧠</div>
          <p className="text-slate-300 text-sm font-medium">Click "Get Insights" to analyze your spending</p>
          <p className="text-slate-500 text-xs mt-1">Claude AI will review your data and give personalized advice</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin mb-3" />
          <p className="text-slate-300 text-sm">Analyzing your financial data...</p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
          {error} — make sure ANTHROPIC_API_KEY is set in the backend .env
        </div>
      )}

      {insights.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {insights.map((insight, i) => (
            <div key={i} className={`p-4 rounded-xl border ${typeColors[insight.type] ?? typeColors.tip}`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{insight.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{insight.title}</p>
                  <p className="text-xs mt-1 opacity-90 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Main Component --- */
export function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const persona = (localStorage.getItem("persona") ?? "YOUNG_PROFESSIONAL") as "STUDENT" | "YOUNG_PROFESSIONAL" | "INVESTOR";

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/summary`, {
          headers: authHeaders(token),
          signal: controller.signal,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "Unable to load summary");
        }
        const data = (await res.json()) as SummaryResponse;
        if (mounted) setSummary(data);
      } catch (err) {
        if ((err as any).name === "AbortError") return;
        setError((err as Error).message || "Failed to load summary");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [reloadKey]);

  const monthLabel = useMemo(() => {
    if (!summary) return "—";
    try {
      return new Date(summary.year, summary.month - 1, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    } catch {
      return `${summary.month}/${summary.year}`;
    }
  }, [summary]);

  const savingsRate = useMemo(() => {
    if (!summary) return 0;
    if (summary.totalIncome <= 0) return 0;
    const rate = ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100;
    return isFinite(rate) ? rate : 0;
  }, [summary]);

  const savingsPercentForBar = Math.max(0, Math.min(100, Math.round(savingsRate)));

  const PERSONA_BANNERS = {
    STUDENT: { icon: "🎓", label: "Student Mode", color: "from-blue-50 to-indigo-50 border-blue-200", text: "text-blue-800", tip: "Focus on building your emergency fund first — aim for 1 month of expenses." },
    YOUNG_PROFESSIONAL: { icon: "💼", label: "Professional Mode", color: "from-green-50 to-emerald-50 border-green-200", text: "text-green-800", tip: "The 50/30/20 rule: 50% needs, 30% wants, 20% savings. Track it here." },
    INVESTOR: { icon: "📈", label: "Investor Mode", color: "from-purple-50 to-violet-50 border-purple-200", text: "text-purple-800", tip: "Maximize savings rate first. Every ₦ saved today compounds tomorrow." },
  };
  const banner = PERSONA_BANNERS[persona];

  async function handleDownloadPDF() {
    if (!summary) return;
    setPdfLoading(true);
    try {
      await generatePDFReport(summary, persona);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 dark:from-white dark:via-emerald-300 dark:to-white">
              Financial Overview
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
              Track your spending and achieve your financial goals • {monthLabel}
            </p>
          </div>
          <div className="flex gap-3 self-start md:self-center">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || !summary}
              className="rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center gap-2 disabled:opacity-50"
            >
              {pdfLoading
                ? <Loader2 size={15} className="animate-spin" />
                : <FileDown size={15} strokeWidth={1.75} />
              }
              PDF Report
            </button>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg border border-green-200 bg-white dark:bg-[#161B22] px-4 py-2.5 font-medium text-green-700 hover:bg-green-50 transition flex items-center gap-2"
            >
              <RefreshCw size={14} strokeWidth={1.75} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Persona Banner */}
      <div className={`mb-6 p-4 rounded-xl border bg-gradient-to-r ${banner.color} flex items-center gap-3`}>
        <span className="text-2xl">{banner.icon}</span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${banner.text}`}>{banner.label}</p>
          <p className={`text-sm font-medium ${banner.text} opacity-80`}>{banner.tip}</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 border-l-4 border-l-red-500 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
          </div>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="ml-3 rounded-lg px-3 py-1.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Skeleton loading */}
      {loading && <PageSkeleton />}

      {/* Main Content */}
      {summary && (
        <div className="space-y-8">
          {/* Primary Stats - 4 Column Grid */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Income"
              amount={summary.totalIncome}
              emoji="💰"
              borderClass="border-slate-200"
              subtitle={new Date().toLocaleString("en-US", { month: "long" })}
            />
            <StatCard
              title="Total Expenses"
              amount={summary.totalExpenses}
              emoji="💳"
              borderClass="border-slate-200"
              subtitle={`${Math.round((summary.totalExpenses / Math.max(1, summary.totalIncome)) * 100)}% of income`}
            />
            <StatCard
              title="Net Balance"
              amount={Math.max(0, summary.netBalance)}
              emoji={summary.netBalance >= 0 ? "📈" : "📉"}
              borderClass={summary.netBalance >= 0 ? "border-emerald-200" : "border-red-200"}
              valueColor={summary.netBalance >= 0 ? "text-emerald-600" : "text-red-500"}
              subtitle={summary.netBalance >= 0 ? "You're in good shape!" : "Review spending"}
            />
            <StatCard
              title="Savings Rate"
              amount={summary.totalIncome > 0 ? Math.max(0, Math.round(savingsRate)) : 0}
              isPercent
              emoji="🎯"
              borderClass="border-slate-200"
              subtitle="of income saved"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Income vs Expense Chart */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Income vs Expenses</h3>
              <div className="bg-white dark:bg-[#161B22] rounded-lg p-4 shadow-inner">
                <IncomeExpenseChart
                  month={summary.month}
                  year={summary.year}
                  totalIncome={summary.totalIncome}
                  totalExpenses={summary.totalExpenses}
                  netBalance={summary.netBalance}
                />
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">This Month at a Glance</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700/50 shadow-sm">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">Savings Rate</p>
                  <div className="flex items-end gap-2 mb-3">
                    <p className="text-3xl font-bold text-green-600">
                      {summary.totalIncome > 0 ? `${Math.max(0, Math.round(savingsRate))}%` : "—"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium">of income saved</p>
                  </div>
                  <div className="h-2.5 rounded-full bg-green-100 dark:bg-emerald-900/20 overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600" style={{ width: `${savingsPercentForBar}%` }} />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 dark:from-emerald-900/20 to-emerald-50 dark:to-emerald-900/10 border border-green-200 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">💡 Quick Take</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {summary.totalExpenses === 0
                      ? "👋 No expenses recorded yet. Start tracking your spending!"
                      : summary.netBalance > 0
                      ? `✨ Great work! You're saving ${Math.round((summary.netBalance / Math.max(1, summary.totalIncome)) * 100)}% of your income this month.`
                      : `⚠️ You've spent ${Math.round((summary.totalExpenses / Math.max(1, summary.totalIncome)) * 100)}% of your income. Time to review your budget.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Panel */}
          <AIInsightsPanel summary={summary} />

          {/* Spending by Category */}
          {summary.categories && summary.categories.length > 0 && (
            <div>
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Spending by Category</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Monitor your expenses across different categories</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {summary.categories.map((cat, i) => (
                  <CategoryCard key={cat.category} cat={cat} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div
            className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
            style={{
              boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
            }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Your latest income and expenses</p>
            </div>
            <div className="bg-white dark:bg-[#161B22] rounded-lg p-4 shadow-inner">
              <RecentTransactions />
            </div>
          </div>

          {/* Budgeting Tips */}
          <div
            className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
            style={{
              boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
            }}
          >
            <p className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">💡 Smart Budgeting Tips</p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="font-semibold text-slate-900 dark:text-white text-sm mb-2">📊 Monitor Categories</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Track where spending is close to budget limits to stay in control
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="font-semibold text-slate-900 dark:text-white text-sm mb-2">🎯 Set Goals</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Create realistic savings targets based on your monthly income
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="font-semibold text-slate-900 dark:text-white text-sm mb-2">📈 Log Daily</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Record expenses daily to maintain accurate tracking and visibility
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="font-semibold text-slate-900 dark:text-white text-sm mb-2">🔍 Analyze Patterns</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Review spending trends to identify areas for better savings
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !summary && !error && (
        <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#161B22]/30 p-12 text-center shadow-lg"
             style={{
               boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
             }}>
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 shadow-md text-3xl">
              📊
            </div>
          </div>
          <p className="font-semibold text-slate-900 dark:text-white text-lg">No data available</p>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Start tracking your finances to see insights</p>
        </div>
      )}
    </Layout>
  );
}



