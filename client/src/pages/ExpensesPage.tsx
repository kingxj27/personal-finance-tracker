import { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/Toast";
import { PageSkeleton } from "../components/Skeleton";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE_URL, authHeaders } from "../api";
import { Layout } from "../components/Layout";
import { useCurrency } from "../contexts/CurrencyContext";

/* --- Types --- */
type Expense = {
  id: string;
  title?: string;
  amount: number;
  category: string;
  date: string;
  note?: string | null;
  recurring?: boolean;
};


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
  Transport: "🚗",
  Utilities: "💡",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Health: "⚕️",
  Other: "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#ef4444",
  Transport: "#f97316",
  Utilities: "#eab308",
  Entertainment: "#8b5cf6",
  Shopping: "#ec4899",
  Health: "#06b6d4",
  Other: "#6b7280",
};

const CATEGORY_COLORS_LIGHT: Record<string, string> = {
  Food: "from-red-50 to-rose-100",
  Transport: "from-orange-50 to-amber-100",
  Utilities: "from-yellow-50 to-amber-100",
  Entertainment: "from-purple-50 to-pink-100",
  Shopping: "from-pink-50 to-rose-100",
  Health: "from-cyan-50 to-sky-100",
  Other: "from-gray-50 to-slate-100",
};

function StatCard({
  title,
  value,
  subtitle,
  emoji,
  colorClasses = "from-white to-slate-50",
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
      className={`rounded-xl border ${borderClass} dark:border-slate-700/50 bg-gradient-to-br ${colorClasses} dark:from-[#161B22] dark:to-[#1e293b]/40 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
      style={{
        boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.12)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{value}</p>
          {subtitle && <p className="mt-2 text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        {emoji && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#161B22] shadow-md text-2xl">
            {emoji}
          </div>
        )}
      </div>
    </div>
  );
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] p-6 shadow-xl"
        style={{
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function ExpensesPage() {
  const token = localStorage.getItem("token");
  const { format: formatCurrency } = useCurrency();
  const { toast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: CATEGORIES[0],
    date: new Date().toISOString().slice(0, 10),
    note: "",
    recurring: false,
  });

  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showInsights, setShowInsights] = useState(false);

  async function loadExpenses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("Unable to load expenses");
      const data = (await res.json()) as { expenses: Expense[] };
      setExpenses(data.expenses);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      void loadExpenses();
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.amount || !formData.title.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    try {
      const payload = {
        title: formData.title,
        amount: Number(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        note: formData.note || undefined,
        recurring: formData.recurring,
      };

      if (editingId) {
        const res = await fetch(`${API_BASE_URL}/api/expenses/${editingId}`, {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update expense");
      } else {
        const res = await fetch(`${API_BASE_URL}/api/expenses`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to add expense");
      }

      await loadExpenses();
      resetForm();
      setIsModalOpen(false);
      toast(editingId ? "Expense updated!" : "Expense added!", "success");
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message, "error");
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      amount: "",
      category: CATEGORIES[0],
      date: new Date().toISOString().slice(0, 10),
      note: "",
      recurring: false,
    });
    setEditingId(null);
  }

  function handleEdit(expense: Expense) {
    setFormData({
      title: expense.title || "",
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date.slice(0, 10),
      note: expense.note || "",
      recurring: expense.recurring || false,
    });
    setEditingId(expense.id);
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this expense?")) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to delete expense");
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      toast("Expense deleted", "info");
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message, "error");
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth() + 1;
      const expenseYear = expenseDate.getFullYear();

      const categoryMatch = filterCategory === "All" || expense.category === filterCategory;
      const monthMatch = expenseMonth === filterMonth;
      const yearMatch = expenseYear === filterYear;
      const amountMatch =
        (filterAmountMin === "" || expense.amount >= Number(filterAmountMin)) &&
        (filterAmountMax === "" || expense.amount <= Number(filterAmountMax));
      const searchMatch =
        searchText === "" ||
        (expense.title?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
        (expense.note?.toLowerCase().includes(searchText.toLowerCase()) ?? false);

      return categoryMatch && monthMatch && yearMatch && amountMatch && searchMatch;
    });
  }, [
    expenses,
    filterCategory,
    filterMonth,
    filterYear,
    filterAmountMin,
    filterAmountMax,
    searchText,
  ]);

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [filteredExpenses]
  );

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredExpenses.forEach((expense) => {
      stats[expense.category] = (stats[expense.category] || 0) + expense.amount;
    });

    return Object.entries(stats)
      .map(([category, spent]) => ({
        category,
        spent,
        percentage: totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.spent - a.spent);
  }, [filteredExpenses, totalExpenses]);

  const highestCategory = categoryStats[0];
  const avgExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

  const monthlyTrendData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthMap[monthKey] = 0;
    }

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (Object.prototype.hasOwnProperty.call(monthMap, monthKey)) {
        monthMap[monthKey] += expense.amount;
      }
    });

    return Object.entries(monthMap).map(([month, total]) => ({
      month,
      total,
    }));
  }, [expenses]);

  const insights = useMemo(() => {
    const insightsList: string[] = [];

    if (highestCategory) {
      insightsList.push(
        `${CATEGORY_ICONS[highestCategory.category]} ${highestCategory.category} is your highest spending category (${formatCurrency(highestCategory.spent)})`
      );
    }

    if (filteredExpenses.length > 0) {
      const lastMonthExpenses = expenses.filter((expense) => {
        const date = new Date(expense.date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        return month === lastMonth.getMonth() && year === lastMonth.getFullYear();
      });

      if (lastMonthExpenses.length > 0) {
        const lastMonthTotal = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const diff = ((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100;

        if (diff > 5) {
          insightsList.push(`📈 You spent ${Math.round(diff)}% more than last month`);
        } else if (diff < -5) {
          insightsList.push(`📉 You spent ${Math.round(Math.abs(diff))}% less than last month`);
        }
      }
    }

    const recurringCount = filteredExpenses.filter((expense) => expense.recurring).length;
    if (recurringCount > 0) {
      insightsList.push(`🔄 ${recurringCount} recurring expense(s) this month`);
    }

    return insightsList;
  }, [highestCategory, filteredExpenses, totalExpenses, expenses]);

  function handleExportCSV() {
    const headers = ["Date", "Title", "Amount", "Category", "Note", "Recurring"];
    const rows = filteredExpenses.map((expense) => [
      new Date(expense.date).toLocaleDateString(),
      expense.title || "",
      expense.amount,
      expense.category,
      expense.note || "",
      expense.recurring ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((col) => `"${col}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 dark:from-white dark:via-emerald-300 dark:to-white">
              Expense Overview
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
              Track and analyze your spending patterns with smart insights
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="self-start md:self-center rounded-lg border border-green-200 bg-white dark:bg-[#161B22] px-4 py-2.5 font-medium text-green-700 hover:bg-green-50 transition duration-300 flex items-center gap-2"
            >
              <span>＋</span> Add Expense
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredExpenses.length === 0}
              className="self-start md:self-center rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>📥</span> Export CSV
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 border-l-4 border-l-red-500 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-3 rounded-lg px-3 py-1.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && <PageSkeleton />}

      {!loading && (
        <>
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Expenses"
              value={formatCurrency(totalExpenses)}
              subtitle="This period"
              emoji="💳"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
            <StatCard
              title="Entries"
              value={filteredExpenses.length}
              subtitle="Tracked expenses"
              emoji="📊"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
            <StatCard
              title="Top Category"
              value={highestCategory ? highestCategory.category : "—"}
              subtitle={highestCategory ? formatCurrency(highestCategory.spent) : "No data"}
              emoji="🎯"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
            <StatCard
              title="Average"
              value={filteredExpenses.length > 0 ? formatCurrency(avgExpense) : "—"}
              subtitle="Per expense"
              emoji="📈"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
          </div>

          <div
            className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingId ? "Edit Expense" : "Add Expense"}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Enter and manage your expense records
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Lunch at restaurant"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white dark:placeholder-slate-500 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Amount (₦)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {CATEGORY_ICONS[category]} {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add any additional details..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white dark:placeholder-slate-500 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-200"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">🔄 Recurring Monthly</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  {editingId ? "Update Expense" : "Save Expense"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-200 dark:border-slate-700/50 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {insights.length > 0 && (
            <div
              className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
              style={{
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
              }}
            >
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"
              >
                💡 Smart Insights {showInsights ? "▼" : "▶"}
              </button>

              {showInsights && (
                <div className="mt-4 rounded-lg bg-gradient-to-br from-green-50 dark:from-emerald-900/20 to-emerald-50 dark:to-emerald-900/10 border border-green-200 p-4 shadow-sm">
                  <ul className="space-y-2">
                    {insights.map((insight, index) => (
                      <li key={index} className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        • {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {categoryStats.length > 0 && (
            <div className="mb-8 grid gap-8 lg:grid-cols-2">
              <div
                className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Spending by Category</h3>
                <div className="bg-white dark:bg-[#161B22] rounded-lg p-4 shadow-inner">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        dataKey="spent"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(props: any) => `${props.category} ${(props.percentage as number).toFixed(1)}%`}
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[entry.category]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Monthly Spending Trend</h3>
                <div className="bg-white dark:bg-[#161B22] rounded-lg p-4 shadow-inner">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div
            className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filter Expenses</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Search and refine your expense records</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Search</label>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by title or note..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white dark:placeholder-slate-500 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_ICONS[category]} {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2024, month - 1).toLocaleString("default", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Min Amount</label>
                <input
                  type="number"
                  min="0"
                  value={filterAmountMin}
                  onChange={(e) => setFilterAmountMin(e.target.value)}
                  placeholder="Min"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white dark:placeholder-slate-500 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Max Amount</label>
                <input
                  type="number"
                  min="0"
                  value={filterAmountMax}
                  onChange={(e) => setFilterAmountMax(e.target.value)}
                  placeholder="Max"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white dark:placeholder-slate-500 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>
          </div>

          {categoryStats.length > 0 && (
            <div
              className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
              style={{
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
              }}
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Category Spending Breakdown</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">See how your expenses are distributed</p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-inner">
                <div className="space-y-4">
                  {categoryStats.map((stat) => (
                    <div key={stat.category}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {CATEGORY_ICONS[stat.category]} {stat.category}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(stat.spent)} ({stat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${stat.percentage}%`,
                            backgroundColor: CATEGORY_COLORS[stat.category],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div
            className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {filteredExpenses.length === 0 ? "No expense entries" : `${filteredExpenses.length} expense entries`}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Your recorded expenses for this period</p>
            </div>

            <div className="bg-white dark:bg-[#161B22] rounded-lg shadow-inner overflow-hidden">
              {filteredExpenses.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-lg font-medium text-slate-900 dark:text-white">No expenses found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {expenses.length === 0
                      ? "Start tracking your expenses by clicking the Add Expense button."
                      : "Try adjusting your filters or search term."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r ${
                        CATEGORY_COLORS_LIGHT[expense.category] || "from-gray-50 to-slate-100"
                      } dark:from-slate-800/30 dark:to-slate-800/10 px-6 py-4 transition-all duration-300 hover:bg-white dark:hover:bg-slate-800/50`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{CATEGORY_ICONS[expense.category]}</span>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {expense.title}
                              {expense.recurring && (
                                <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">🔄 Recurring</span>
                              )}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {expense.category} • {new Date(expense.date).toLocaleDateString()}
                              {expense.note && ` • ${expense.note}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="md:ml-4 text-left md:text-right">
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(expense.amount)}</p>
                      </div>

                      <div className="md:ml-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(expense.id)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingId ? "Edit Expense" : "Add Expense"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Lunch at restaurant"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white dark:placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Amount (₦) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_ICONS[category]} {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Note (Optional)</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Add any additional details..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white dark:placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.recurring}
              onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-200"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">🔄 Recurring Monthly</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700/50 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {editingId ? "Update" : "Save"} Expense
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
