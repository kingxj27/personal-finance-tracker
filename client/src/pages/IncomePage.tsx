import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/Toast";
import { PageSkeleton } from "../components/Skeleton";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { API_BASE_URL, authHeaders } from "../api";
import { Layout } from "../components/Layout";

type IncomeEntry = {
  id: string;
  title: string;
  amount: number;
  source: "Salary" | "Freelance" | "Investment" | "Gift" | "Business" | "Other";
  date: string;
  notes?: string | null;
  createdAt?: string;
};

const INCOME_SOURCES = ["Salary", "Freelance", "Investment", "Gift", "Business", "Other"] as const;

const SOURCE_COLORS: Record<string, string> = {
  Salary: "#10b981",
  Freelance: "#059669",
  Investment: "#84cc16",
  Gift: "#f59e0b",
  Business: "#14b8a6",
  Other: "#6b7280",
};

const SOURCE_COLORS_LIGHT: Record<string, string> = {
  Salary: "from-green-50 to-emerald-100",
  Freelance: "from-emerald-50 to-green-100",
  Investment: "from-lime-50 to-green-100",
  Gift: "from-amber-50 to-yellow-100",
  Business: "from-teal-50 to-emerald-100",
  Other: "from-gray-50 to-slate-100",
};

function formatNGN(amount: number) {
  return "₦" + Math.round(Math.max(0, amount)).toLocaleString();
}

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
      className={`rounded-xl border ${borderClass} bg-gradient-to-br ${colorClasses} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
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

function Modal({
  isOpen,
  title,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
        style={{
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-slate-100"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function IncomePage() {
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    amount: "" as string | number,
    source: "Salary" as IncomeEntry["source"],
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const token = localStorage.getItem("token");
  const { toast } = useToast();

  async function loadIncome() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/income`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("Unable to load income");
      const data = (await res.json()) as { income: IncomeEntry[] };
      setIncomeEntries(data.income);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadIncome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount || Number(formData.amount) <= 0) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    try {
      const url = editingId ? `${API_BASE_URL}/api/income/${editingId}` : `${API_BASE_URL}/api/income`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(token),
        body: JSON.stringify({
          title: formData.title,
          amount: Number(formData.amount),
          source: formData.source,
          date: new Date(formData.date).toISOString(),
          notes: formData.notes || undefined,
        }),
      });

      if (!res.ok) throw new Error(editingId ? "Failed to update income" : "Failed to add income");
      await loadIncome();
      resetForm();
      setIsModalOpen(false);
      toast(editingId ? "Income updated!" : "Income added!", "success");
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message, "error");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this income entry?")) return;

    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/income/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to delete income");
      setIncomeEntries((prev) => prev.filter((entry) => entry.id !== id));
      toast("Income deleted", "info");
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message, "error");
    }
  }

  function handleEdit(entry: IncomeEntry) {
    setFormData({
      title: entry.title,
      amount: entry.amount,
      source: entry.source,
      date: entry.date.split("T")[0],
      notes: entry.notes || "",
    });
    setEditingId(entry.id);
    setIsModalOpen(true);
  }

  function resetForm() {
    setFormData({
      title: "",
      amount: "",
      source: "Salary",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setEditingId(null);
  }

  const filteredIncome = useMemo(() => {
    return incomeEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      const entryMonth = entryDate.getMonth() + 1;
      const entryYear = entryDate.getFullYear();

      const matchesMonth = entryMonth === selectedMonth;
      const matchesYear = entryYear === selectedYear;
      const matchesSource = !selectedSource || entry.source === selectedSource;
      const matchesSearch =
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.source.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesMonth && matchesYear && matchesSource && matchesSearch;
    });
  }, [incomeEntries, selectedMonth, selectedYear, selectedSource, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredIncome.reduce((sum, entry) => sum + entry.amount, 0);
    const count = filteredIncome.length;
    const largest =
      filteredIncome.length > 0
        ? filteredIncome.reduce((max, entry) => (entry.amount > max.amount ? entry : max))
        : null;

    return { total, count, largest };
  }, [filteredIncome]);

  const incomeBySourceData = useMemo(() => {
    const sourceMap: Record<string, number> = {};
    filteredIncome.forEach((entry) => {
      sourceMap[entry.source] = (sourceMap[entry.source] ?? 0) + entry.amount;
    });

    return Object.entries(sourceMap).map(([source, amount]) => ({
      name: source,
      value: amount,
    }));
  }, [filteredIncome]);

  const monthlyTrendData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      monthMap[key] = 0;
    }

    incomeEntries.forEach((entry) => {
      const date = new Date(entry.date);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (Object.prototype.hasOwnProperty.call(monthMap, key)) {
        monthMap[key] += entry.amount;
      }
    });

    return Object.entries(monthMap).map(([month, amount]) => ({
      month: month.split("/")[0],
      amount,
    }));
  }, [incomeEntries]);

  const months = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: new Date(selectedYear, index).toLocaleString("default", { month: "short" }),
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900">
              Income Overview
            </h1>
            <p className="mt-2 text-slate-600 font-medium">
              Track all your income sources and analyze earnings over time
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="self-start md:self-center rounded-lg border border-green-200 bg-white px-4 py-2.5 font-medium text-green-700 hover:bg-green-50 transition duration-300 flex items-center gap-2"
          >
            <span>＋</span> Add Income
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 border-l-4 border-l-red-500 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-3 rounded-lg px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition"
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
              title="Total Income"
              value={formatNGN(stats.total)}
              subtitle={`${stats.count} entries`}
              emoji="💰"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
            <StatCard
              title="Entries"
              value={stats.count}
              subtitle="This period"
              emoji="📊"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
            <StatCard
              title="Largest Entry"
              value={stats.largest ? formatNGN(stats.largest.amount) : "—"}
              subtitle={stats.largest ? stats.largest.source : "No data"}
              emoji="🏆"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
            <StatCard
              title="Average"
              value={stats.count > 0 ? formatNGN(stats.total / stats.count) : "—"}
              subtitle="Per entry"
              emoji="📈"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
          </div>

          <div
            className="mb-8 rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filter Income</h3>
              <p className="mt-1 text-sm text-slate-600">Narrow down your income records</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Source</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">All Sources</option>
                  {INCOME_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>
          </div>

          {filteredIncome.length > 0 && (
            <div className="mb-8 grid gap-8 lg:grid-cols-2">
              <div
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h3 className="mb-6 text-lg font-semibold text-slate-900">Income by Source</h3>
                <div className="bg-white rounded-lg p-4 shadow-inner">
                  {incomeBySourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={incomeBySourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${formatNGN(value)}`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {incomeBySourceData.map((entry) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={SOURCE_COLORS[entry.name] || "#6b7280"}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNGN(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-sm text-slate-400">No data available</p>
                  )}
                </div>
              </div>

              <div
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h3 className="mb-6 text-lg font-semibold text-slate-900">Monthly Trend</h3>
                <div className="bg-white rounded-lg p-4 shadow-inner">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatNGN(value as number)} />
                      <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div
            className="mb-8 rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                {filteredIncome.length === 0 ? "No income entries" : `${filteredIncome.length} income entries`}
              </h3>
              <p className="mt-1 text-sm text-slate-600">Your recorded income for this period</p>
            </div>

            <div className="bg-white rounded-lg shadow-inner overflow-hidden">
              {filteredIncome.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-lg font-medium text-slate-900">No income entries found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {incomeEntries.length === 0
                      ? "Start tracking your income by clicking the Add Income button."
                      : "Try adjusting your filters or search term."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredIncome.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r ${
                        SOURCE_COLORS_LIGHT[entry.source] || "from-gray-50 to-gray-100"
                      } px-6 py-4 transition-all duration-300 hover:bg-white`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{entry.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {entry.source} • {new Date(entry.date).toLocaleDateString()}
                          {entry.notes && ` • ${entry.notes}`}
                        </p>
                      </div>

                      <div className="md:ml-4 text-left md:text-right">
                        <p className="text-lg font-bold text-emerald-600">{formatNGN(entry.amount)}</p>
                      </div>

                      <div className="md:ml-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(entry.id)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
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
        title={editingId ? "Edit Income" : "Add Income"}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Monthly Salary"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900">Amount (₦) *</label>
              <input
                type="number"
                required
                min={1}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900">Source *</label>
              <select
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value as typeof formData.source })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                {INCOME_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {editingId ? "Update" : "Save"} Income
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
