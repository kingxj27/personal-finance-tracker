import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, authHeaders } from "../api";
import { Layout } from "../components/Layout";
import { RecentTransactions } from "../components/RecentTransactions";
import { IncomeExpenseChart } from "../components/IncomeExpenseChart";
import { generatePDFReport } from "../utils/pdfReport";
import { AnimatedNGN, AnimatedPercent } from "../components/AnimatedNumber";
import { PageSkeleton } from "../components/Skeleton";
import { useCurrency } from "../contexts/CurrencyContext";
import {
  FileDown,
  RefreshCw,
  Loader2,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  Lightbulb,
  GraduationCap,
  Briefcase,
  LineChart,
  Utensils,
  Car,
  Zap,
  Clapperboard,
  ShoppingBag,
  HeartPulse,
  Package,
  BarChart3,
  Search,
  CalendarCheck,
} from "lucide-react";

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
const CATEGORY_ICONS: Record<string, typeof Utensils> = {
  Food: Utensils,
  Transport: Car,
  Utilities: Zap,
  Entertainment: Clapperboard,
  Shopping: ShoppingBag,
  Health: HeartPulse,
  Other: Package,
};

/* Card shell used throughout — flat border, no glow/lift, consistent across the page */
function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] ${className}`}>
      {children}
    </div>
  );
}

function IconBadge({ icon: Icon, className = "" }: { icon: typeof Wallet; className?: string }) {
  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/60 ${className}`}>
      <Icon size={16} strokeWidth={1.75} />
    </div>
  );
}

/* --- Stat Card with animated number --- */
function StatCard({
  title,
  amount,
  isPercent,
  subtitle,
  icon,
  accent = "text-slate-500 dark:text-slate-400",
  valueColor = "text-slate-900",
}: {
  title: string;
  amount?: number;
  isPercent?: boolean;
  subtitle?: string;
  icon: typeof Wallet;
  accent?: string;
  valueColor?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        <IconBadge icon={icon} className={accent} />
      </div>
      <p className={`text-2xl font-bold tabular-nums dark:text-white ${valueColor}`}>
        {amount !== undefined && !isPercent && <AnimatedNGN value={amount} />}
        {amount !== undefined && isPercent && <AnimatedPercent value={amount} />}
      </p>
      {subtitle && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-500">{subtitle}</p>}
    </Card>
  );
}

function CategoryCard({ cat, index }: { cat: CategorySummary; index: number }) {
  const { format: formatCurrency } = useCurrency();
  const [barWidth, setBarWidth] = useState(0);
  const percent = cat.budget > 0 ? Math.min(100, (cat.spent / cat.budget) * 100) : 0;
  const isOverBudget = cat.budget > 0 && cat.spent > cat.budget;
  const isNearLimit = percent > 75 && !isOverBudget;
  const barColor = isOverBudget ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-emerald-500";
  const chipColor = isOverBudget
    ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
    : isNearLimit
    ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  const Icon = CATEGORY_ICONS[cat.category] ?? Package;

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(Math.min(100, percent)), 100 + index * 60);
    return () => clearTimeout(t);
  }, [percent, index]);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <IconBadge icon={Icon} className="text-slate-500 dark:text-slate-400" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{cat.category}</p>
          {cat.budget > 0 && <p className="text-xs text-slate-400 mt-0.5">Budget {formatCurrency(cat.budget)}</p>}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${chipColor}`}>{Math.round(percent)}%</span>
      </div>

      <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums mb-3">
        <AnimatedNGN value={cat.spent} />
      </p>

      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${barWidth}%` }} />
      </div>

      {isOverBudget && (
        <p className="mt-2 text-xs font-medium text-red-500">Over by {formatCurrency(cat.spent - cat.budget)}</p>
      )}
    </Card>
  );
}

/* --- AI Insights Panel --- */
const INSIGHT_BORDER: Record<AIInsight["type"], string> = {
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  tip: "border-l-blue-500",
  alert: "border-l-red-500",
};

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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <IconBadge icon={Sparkles} className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Financial Advisor</h3>
            <p className="text-xs text-slate-500 dark:text-slate-500">Powered by Claude, personalized for your finances</p>
          </div>
        </div>
        {!fetched && (
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : null}
            {loading ? "Analyzing..." : "Get Insights"}
          </button>
        )}
        {fetched && (
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={12} />}
            Refresh
          </button>
        )}
      </div>

      {!fetched && !loading && (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-lg">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Click "Get Insights" to analyze your spending</p>
          <p className="text-xs text-slate-400 mt-1">Claude will review your data and give personalized advice</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 size={24} className="mx-auto animate-spin text-emerald-500 mb-3" />
          <p className="text-sm text-slate-500">Analyzing your financial data...</p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm">
          {error} — make sure ANTHROPIC_API_KEY is set in the backend .env
        </div>
      )}

      {insights.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border-l-4 ${INSIGHT_BORDER[insight.type] ?? INSIGHT_BORDER.tip}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">{insight.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{insight.title}</p>
                  <p className="text-xs mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
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
    STUDENT: { Icon: GraduationCap, label: "Student", tip: "Focus on building your emergency fund first — aim for 1 month of expenses." },
    YOUNG_PROFESSIONAL: { Icon: Briefcase, label: "Professional", tip: "The 50/30/20 rule: 50% needs, 30% wants, 20% savings. Track it here." },
    INVESTOR: { Icon: LineChart, label: "Investor", tip: "Maximize savings rate first. Every naira saved today compounds tomorrow." },
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
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Overview</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track your spending and goals — {monthLabel}
            </p>
          </div>
          <div className="flex gap-2.5 self-start md:self-center">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading || !summary}
              className="rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center gap-2 disabled:opacity-50"
            >
              {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} strokeWidth={1.75} />}
              PDF Report
            </button>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center gap-2"
            >
              <RefreshCw size={14} strokeWidth={1.75} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Persona Banner */}
      <div className="mb-6 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 flex items-center gap-3">
        <IconBadge icon={banner.Icon} className="text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800" />
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{banner.label} mode</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{banner.tip}</p>
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
        <div className="space-y-6">
          {/* Primary Stats - 4 Column Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Income"
              amount={summary.totalIncome}
              icon={Wallet}
              subtitle={new Date().toLocaleString("en-US", { month: "long" })}
            />
            <StatCard
              title="Total Expenses"
              amount={summary.totalExpenses}
              icon={CreditCard}
              subtitle={`${Math.round((summary.totalExpenses / Math.max(1, summary.totalIncome)) * 100)}% of income`}
            />
            <StatCard
              title="Net Balance"
              amount={Math.max(0, summary.netBalance)}
              icon={summary.netBalance >= 0 ? TrendingUp : TrendingDown}
              accent={summary.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-500 bg-red-50 dark:bg-red-900/20"}
              valueColor={summary.netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}
              subtitle={summary.netBalance >= 0 ? "You're in good shape" : "Review spending"}
            />
            <StatCard
              title="Savings Rate"
              amount={summary.totalIncome > 0 ? Math.max(0, Math.round(savingsRate)) : 0}
              isPercent
              icon={Target}
              subtitle="of income saved"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Income vs Expense Chart */}
            <IncomeExpenseChart
              month={summary.month}
              year={summary.year}
              totalIncome={summary.totalIncome}
              totalExpenses={summary.totalExpenses}
              netBalance={summary.netBalance}
            />

            {/* Quick Stats Card */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">This Month at a Glance</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700/50">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Savings Rate</p>
                  <div className="flex items-end gap-2 mb-3">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {summary.totalIncome > 0 ? `${Math.max(0, Math.round(savingsRate))}%` : "—"}
                    </p>
                    <p className="text-xs text-slate-500 mb-1">of income saved</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${savingsPercentForBar}%` }} />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={14} className="text-amber-500" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Quick Take</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {summary.totalExpenses === 0
                      ? "No expenses recorded yet. Start tracking your spending."
                      : summary.netBalance > 0
                      ? `You're saving ${Math.round((summary.netBalance / Math.max(1, summary.totalIncome)) * 100)}% of your income this month.`
                      : `You've spent ${Math.round((summary.totalExpenses / Math.max(1, summary.totalIncome)) * 100)}% of your income. Time to review your budget.`}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Insights Panel */}
          <AIInsightsPanel summary={summary} />

          {/* Spending by Category */}
          {summary.categories && summary.categories.length > 0 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Spending by Category</h3>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Monitor your expenses across categories</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {summary.categories.map((cat, i) => (
                  <CategoryCard key={cat.category} cat={cat} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <RecentTransactions />

          {/* Budgeting Tips */}
          <Card className="p-6">
            <p className="mb-5 text-sm font-semibold text-slate-900 dark:text-white">Smart Budgeting Tips</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { Icon: BarChart3, title: "Monitor Categories", desc: "Track spending close to budget limits to stay in control" },
                { Icon: Target, title: "Set Goals", desc: "Create realistic savings targets based on your monthly income" },
                { Icon: CalendarCheck, title: "Log Daily", desc: "Record expenses daily to keep tracking accurate" },
                { Icon: Search, title: "Analyze Patterns", desc: "Review spending trends to find room to save" },
              ].map((tip) => (
                <div key={tip.title} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700/50">
                  <IconBadge icon={tip.Icon} className="text-slate-500 dark:text-slate-400 mb-3" />
                  <p className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{tip.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{tip.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!loading && !summary && !error && (
        <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#161B22]/30 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <BarChart3 size={22} strokeWidth={1.75} />
            </div>
          </div>
          <p className="font-semibold text-slate-900 dark:text-white">No data available</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start tracking your finances to see insights</p>
        </div>
      )}
    </Layout>
  );
}
