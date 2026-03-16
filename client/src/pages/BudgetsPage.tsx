import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { API_BASE_URL, authHeaders } from "../api";
import { Layout } from "../components/Layout";

/* --- Types --- */
type Budget = {
  id: string;
  month: number;
  year: number;
  category: string;
  limit: number;
};

type Expense = {
  id: string;
  title?: string;
  amount: number;
  category: string;
  date: string;
  note?: string | null;
  recurring?: boolean;
};

/* --- Constants --- */
const CATEGORIES = [
  "Food",
  "Transport",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Health",
  "Other",
];

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
  Food: "#EF4444",
  Transport: "#F97316",
  Utilities: "#EAB308",
  Entertainment: "#8B5CF6",
  Shopping: "#EC4899",
  Health: "#06B6D4",
  Other: "#6B7280",
};

const CATEGORY_COLORS_LIGHT: Record<string, string> = {
  Food: "#FEE2E2",
  Transport: "#FFEDD5",
  Utilities: "#FEF08A",
  Entertainment: "#F3E8FF",
  Shopping: "#FCE7F3",
  Health: "#CFFAFE",
  Other: "#F3F4F6",
};

/* --- UI Components --- */
const StatCard = ({
  icon,
  label,
  value,
  subtext,
}: {
  icon: string;
  label: string;
  value: string;
  subtext?: string;
}) => (
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
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        {subtext && <p className="mt-1 text-xs text-slate-600">{subtext}</p>}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md text-2xl">
        {icon}
      </div>
    </div>
  </div>
);

export function BudgetsPage() {
  const token = localStorage.getItem("token");
  const now = new Date();

  /* --- State --- */
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* --- Filter State --- */
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  /* --- Form State --- */
  const [formData, setFormData] = useState({
    category: CATEGORIES[0],
    limit: "",
  });

  /* --- Load Data --- */
  async function loadBudgets() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });
      const res = await fetch(`${API_BASE_URL}/api/budgets?${params.toString()}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("Unable to load budgets");
      const data = (await res.json()) as { budgets: Budget[] };
      setBudgets(data.budgets);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadExpenses() {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 1).toISOString();
      const params = new URLSearchParams({ from: startDate, to: endDate });
      const res = await fetch(`${API_BASE_URL}/api/expenses?${params.toString()}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { expenses: Expense[] };
      setExpenses(data.expenses);
    } catch (err) {
      console.error("Failed to load expenses", err);
    }
  }

  useEffect(() => {
    if (token) {
      void loadBudgets();
      void loadExpenses();
    }
  }, [month, year, token]);

  /* --- CRUD Operations --- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.limit) return;

    setError(null);
    try {
      const payload = {
        month,
        year,
        category: formData.category,
        limit: Number(formData.limit),
      };

      const res = await fetch(`${API_BASE_URL}/api/budgets`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save budget");

      await loadBudgets();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(budgetId: string) {
    if (!confirm("Delete this budget?")) return;

    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/budgets/${budgetId}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });

      if (!res.ok) throw new Error("Failed to delete budget");
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function resetForm() {
    setFormData({ category: CATEGORIES[0], limit: "" });
  }

  /* --- Calculations --- */
  const spentByCategory = useMemo(() => {
    const spent: Record<string, number> = {};
    expenses.forEach((exp) => {
      spent[exp.category] = (spent[exp.category] || 0) + exp.amount;
    });
    return spent;
  }, [expenses]);

  const totalBudget = useMemo(() => budgets.reduce((sum, b) => sum + b.limit, 0), [budgets]);
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const totalRemaining = totalBudget - totalSpent;
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  /* --- Chart Data --- */
  const chartData = useMemo(() => {
    return budgets.map((budget) => {
      const spent = spentByCategory[budget.category] || 0;
      return {
        category: budget.category,
        budgeted: budget.limit,
        spent: Math.min(spent, budget.limit * 1.5),
        actual: spent,
      };
    });
  }, [budgets, spentByCategory]);

  /* --- Insights --- */
  const insights = useMemo(() => {
    const insightsList: string[] = [];

    const overSpendingCategories = budgets
      .filter((b) => (spentByCategory[b.category] || 0) > b.limit)
      .map((b) => ({
        category: b.category,
        excess: (spentByCategory[b.category] || 0) - b.limit,
      }));

    if (overSpendingCategories.length > 0) {
      const worst = overSpendingCategories.reduce((a, b) => (a.excess > b.excess ? a : b));
      insightsList.push(
        `⚠️ ${worst.category} is over budget by ₦${worst.excess.toLocaleString()}`
      );
    }

    if (percentageUsed > 90) {
      insightsList.push(`🔴 You've used ${Math.round(percentageUsed)}% of your budget`);
    } else if (percentageUsed > 75) {
      insightsList.push(`🟡 You've used ${Math.round(percentageUsed)}% of your budget`);
    }

    const bestCategories = budgets.filter((b) => {
      const spent = spentByCategory[b.category] || 0;
      return spent < b.limit * 0.5;
    });

    if (bestCategories.length > 0) {
      insightsList.push(`✅ ${bestCategories[0].category} is well within budget`);
    }

    return insightsList;
  }, [budgets, spentByCategory, percentageUsed]);

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Budgets</h1>
            <p className="text-slate-600">Plan and track your spending</p>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-4">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2024, m - 1).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <div className="text-sm text-slate-600">{monthName}</div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="💰"
            label="Total Budget"
            value={`₦${totalBudget.toLocaleString()}`}
          />
          <StatCard
            icon="💳"
            label="Total Spent"
            value={`₦${totalSpent.toLocaleString()}`}
            subtext={budgets.length > 0 ? `${Math.round(percentageUsed)}% used` : "No budgets"}
          />
          <StatCard
            icon="💵"
            label="Remaining"
            value={`₦${Math.max(0, totalRemaining).toLocaleString()}`}
            subtext={totalRemaining < 0 ? "Over budget" : "Available to spend"}
          />
          <StatCard
            icon="🎯"
            label="Budget Count"
            value={budgets.length.toString()}
            subtext={`${expenses.length} transactions`}
          />
        </div>

        {/* Overall Progress Bar */}
        {budgets.length > 0 && (
          <div 
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
            style={{
              boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">📊 Overall Budget Progress</h3>
              <span
                className={`text-xl font-bold ${
                  percentageUsed >= 100
                    ? "text-red-600"
                    : percentageUsed >= 75
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {Math.round(percentageUsed)}%
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
              <div
                className={`h-full transition-all ${
                  percentageUsed >= 100
                    ? "bg-red-500"
                    : percentageUsed >= 75
                    ? "bg-orange-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div 
            className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-lg"
            style={{
              boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
            }}
          >
            <h3 className="mb-3 font-semibold text-blue-900">💡 Insights</h3>
            <ul className="space-y-2">
              {insights.map((insight, i) => (
                <li key={i} className="text-sm text-blue-800">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div 
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
            style={{
              boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
            }}
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-900">📈 Budget vs Spent</h3>
            <div className="bg-white rounded-lg p-4 shadow-inner">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number | undefined) => 
                      value ? `₦${value.toLocaleString()}` : "N/A"
                    }
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                  <Bar dataKey="budgeted" fill="#3B82F6" name="Budgeted" />
                  <Bar dataKey="spent" fill="#EF4444" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Add Budget Form */}
        <div 
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
          style={{
            boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
          }}
        >
          <h3 className="mb-4 text-lg font-semibold text-slate-900">➕ Create New Budget</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Budget Limit (₦)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  placeholder="Enter limit amount"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:shadow-md shadow-sm"
                >
                  Create Budget
                </button>
              </div>
            </div>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Budget Cards */}
        <div>
          <h3 className="mb-6 text-lg font-semibold text-slate-900">💳 Your Budgets</h3>
          {loading && <p className="text-sm text-slate-500">Loading budgets...</p>}

          {!loading && budgets.length === 0 ? (
            <div 
              className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center shadow-lg"
              style={{
                boxShadow: '0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)',
              }}
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 shadow-md text-3xl">
                  📋
                </div>
              </div>
              <p className="font-semibold text-slate-900">No budgets yet</p>
              <p className="mt-1 text-sm text-slate-600">Create your first budget to start planning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const spent = spentByCategory[budget.category] || 0;
                const remaining = budget.limit - spent;
                const percentage = (spent / budget.limit) * 100;
                const isOverBudget = spent > budget.limit;

                return (
                  <div
                    key={budget.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
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
                    <div className="flex-1">
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br shadow-md text-lg font-semibold"
                          style={{
                            background: `linear-gradient(135deg, ${CATEGORY_COLORS_LIGHT[budget.category]}, ${CATEGORY_COLORS_LIGHT[budget.category]}dd)`,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)',
                          }}
                        >
                          {CATEGORY_ICONS[budget.category]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{budget.category}</p>
                          <p className="text-xs text-slate-600">Budget: ₦{budget.limit.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700">
                            Spent: ₦{spent.toLocaleString()}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              isOverBudget
                                ? "text-red-600"
                                : percentage >= 75
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {Math.round(percentage)}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden shadow-inner">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: isOverBudget
                                ? "#EF4444"
                                : percentage >= 75
                                ? "#F97316"
                                : CATEGORY_COLORS[budget.category],
                            }}
                          />
                        </div>
                      </div>

                      {isOverBudget && (
                        <p className="text-xs font-medium text-red-600">
                          ⚠️ Over budget by ₦{(spent - budget.limit).toLocaleString()}
                        </p>
                      )}
                      {!isOverBudget && (
                        <p className="text-xs text-green-600">✓ ₦{remaining.toLocaleString()} remaining</p>
                      )}
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => void handleDelete(budget.id)}
                        className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition-all duration-300 hover:bg-red-100 hover:shadow-md shadow-sm"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
