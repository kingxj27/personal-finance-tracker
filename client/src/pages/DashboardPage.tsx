
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, authHeaders } from "../api";
import { Layout } from "../components/Layout";
import { RecentTransactions } from "../components/RecentTransactions";
import { IncomeExpenseChart } from "../components/IncomeExpenseChart";
import { generatePDFReport } from "../utils/pdfReport";

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

/* --- Helpers --- */
function formatNGN(amount: number) {
  return "₦" + Math.round(Math.max(0, amount)).toLocaleString();
}

/* --- Small Reusable Components --- */
function StatCard({
  title,
  value,
  subtitle,
  emoji,
  colorClasses = "from-white to-white",
  borderClass = "border-slate-200",
}: {
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  emoji?: string;
  colorClasses?: string;
  borderClass?: string;
}) {
  return (
    <div
      className={`rounded-xl border ${borderClass} bg-gradient-to-br ${colorClasses} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
      style={{
        boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {title}
          </p>
          <p className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-2 text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        {emoji && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md text-2xl">
            {emoji}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryCard({ cat }: { cat: CategorySummary }) {
  const percent = cat.budget > 0 ? Math.min(100, (cat.spent / cat.budget) * 100) : 0;
  const isOverBudget = cat.budget > 0 && cat.spent > cat.budget;
  const isNearLimit = percent > 75;
  const progressColor = isOverBudget
    ? "bg-gradient-to-r from-red-400 to-red-600"
    : isNearLimit
      ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
      : "bg-gradient-to-r from-green-400 to-emerald-600";

  return (
    <div 
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      style={{
        boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br shadow-md ${
            CATEGORY_COLORS[cat.category] || "from-gray-100 to-slate-100"
          } text-lg font-semibold`}
          style={{
            boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)',
          }}
        >
          {CATEGORY_ICONS[cat.category] || "📦"}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900">{cat.category}</p>
          {cat.budget > 0 && (
            <p className="text-xs text-slate-500">Budget: {formatNGN(cat.budget)}</p>
          )}
        </div>
      </div>

      <div className="mb-3 flex justify-between items-end">
        <div>
          <p className="text-xs text-slate-600 font-medium mb-1">Spent</p>
          <p className="text-2xl font-bold text-slate-900">{formatNGN(cat.spent)}</p>
        </div>
        <p className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg shadow-sm">
          {Math.round(percent)}%
        </p>
      </div>

      <div className="h-3 rounded-full bg-gradient-to-r from-slate-200 to-slate-100 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full ${progressColor} transition-all duration-300`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      {isOverBudget && (
        <p className="mt-3 text-xs font-semibold text-red-600 flex items-center gap-1">
          🔴 Over by {formatNGN(cat.spent - cat.budget)}
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
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900">
              Financial Overview
            </h1>
            <p className="mt-2 text-slate-600 font-medium">
              Track your spending and achieve your financial goals • {monthLabel}
            </p>
          </div>
          <div className="flex gap-3 self-start md:self-center">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || !summary}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 disabled:opacity-50"
            >
              {pdfLoading ? <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : "📄"}
              PDF Report
            </button>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg border border-green-200 bg-white px-4 py-2.5 font-medium text-green-700 hover:bg-green-50 transition flex items-center gap-2"
            >
              <span>↻</span> Refresh
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
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 border-l-4 border-l-red-500 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="ml-3 rounded-lg px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {summary && (
        <div className="space-y-8">
          {/* Primary Stats - 4 Column Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Income"
              value={formatNGN(summary.totalIncome)}
              emoji="💰"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
              subtitle={new Date().toLocaleString("en-US", { month: "long" })}
            />
            <StatCard
              title="Total Expenses"
              value={formatNGN(summary.totalExpenses)}
              emoji="💳"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
              subtitle={`${Math.round((summary.totalExpenses / summary.totalIncome) * 100) || 0}% of income`}
            />
            <StatCard
              title="Net Balance"
              value={formatNGN(summary.netBalance)}
              emoji={summary.netBalance >= 0 ? "📈" : "📉"}
              colorClasses="from-white to-slate-50"
              borderClass={summary.netBalance >= 0 ? "border-green-200" : "border-red-200"}
              subtitle={summary.netBalance >= 0 ? "You're in good shape!" : "Review spending"}
            />
            <StatCard
              title="Savings Rate"
              value={`${summary.totalIncome > 0 ? Math.max(0, Math.round(savingsRate)) : 0}%`}
              emoji="🎯"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
              subtitle="% of income saved"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Income vs Expense Chart */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="mb-6 text-lg font-semibold text-slate-900">Income vs Expenses</h3>
              <div className="bg-white rounded-lg p-4 shadow-inner">
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
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">This Month at a Glance</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Savings Rate</p>
                  <div className="flex items-end gap-2 mb-3">
                    <p className="text-3xl font-bold text-green-600">
                      {summary.totalIncome > 0 ? `${Math.max(0, Math.round(savingsRate))}%` : "—"}
                    </p>
                    <p className="text-xs text-slate-600 mb-1 font-medium">of income saved</p>
                  </div>
                  <div className="h-2.5 rounded-full bg-green-100 overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600" style={{ width: `${savingsPercentForBar}%` }} />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900 mb-2">💡 Quick Take</p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
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
                <h3 className="text-2xl font-semibold text-slate-900">Spending by Category</h3>
                <p className="mt-1 text-sm text-slate-600">Monitor your expenses across different categories</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {summary.categories.map((cat) => (
                  <CategoryCard key={cat.category} cat={cat} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div 
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
            style={{
              boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
            }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
              <p className="mt-1 text-sm text-slate-600">Your latest income and expenses</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-inner">
              <RecentTransactions />
            </div>
          </div>

          {/* Budgeting Tips */}
          <div 
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
            style={{
              boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
            }}
          >
            <p className="mb-6 text-xl font-semibold text-slate-900">💡 Smart Budgeting Tips</p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="font-semibold text-slate-900 text-sm mb-2">📊 Monitor Categories</p>
                <p className="text-xs text-slate-600">
                  Track where spending is close to budget limits to stay in control
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="font-semibold text-slate-900 text-sm mb-2">🎯 Set Goals</p>
                <p className="text-xs text-slate-600">
                  Create realistic savings targets based on your monthly income
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="font-semibold text-slate-900 text-sm mb-2">📈 Log Daily</p>
                <p className="text-xs text-slate-600">
                  Record expenses daily to maintain accurate tracking and visibility
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="font-semibold text-slate-900 text-sm mb-2">🔍 Analyze Patterns</p>
                <p className="text-xs text-slate-600">
                  Review spending trends to identify areas for better savings
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !summary && !error && (
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center shadow-lg"
             style={{
               boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
             }}>
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 shadow-md text-3xl">
              📊
            </div>
          </div>
          <p className="font-semibold text-slate-900 text-lg">No data available</p>
          <p className="mt-2 text-slate-600">Start tracking your finances to see insights</p>
        </div>
      )}
    </Layout>
  );
}



