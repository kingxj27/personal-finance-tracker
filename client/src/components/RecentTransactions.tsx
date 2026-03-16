import { useEffect, useState } from "react";
import { API_BASE_URL, authHeaders } from "../api";

type Transaction = {
  id: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
};

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
  Food: "bg-amber-100 text-amber-700",
  Transport: "bg-blue-100 text-blue-700",
  Utilities: "bg-yellow-100 text-yellow-700",
  Entertainment: "bg-purple-100 text-purple-700",
  Shopping: "bg-pink-100 text-pink-700",
  Health: "bg-green-100 text-green-700",
  Other: "bg-gray-100 text-gray-700",
};

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/expenses`, {
          headers: authHeaders(token),
        });
        if (!res.ok) {
          throw new Error("Unable to load transactions");
        }
        const data = await res.json();
        
        // Transform to expected format and sort by date descending
        const transformed = (data.expenses || [])
          .map((exp: any) => ({
            id: exp.id || Math.random().toString(),
            category: exp.category || "Other",
            amount: exp.amount || 0,
            date: exp.date || new Date().toISOString(),
            description: exp.description || "",
          }))
          .sort(
            (a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 10); // Get last 10

        setTransactions(transformed);
      } catch (err) {
        setError((err as Error).message);
        // Fallback: show empty state
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount: number) => {
    return "₦" + Math.round(Math.max(0, amount)).toLocaleString();
  };

  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-b from-white to-amber-50 p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
        <a href="/expenses" className="text-sm font-medium text-amber-600 hover:text-amber-700">
          View All →
        </a>
      </div>

      {loading && (
        <p className="text-sm text-slate-500" role="status">
          Loading transactions...
        </p>
      )}

      {error && !loading && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && transactions.length === 0 && (
        <div className="rounded-lg border border-dashed border-amber-200 bg-white p-8 text-center">
          <p className="text-lg">📋</p>
          <p className="mt-2 text-sm font-medium text-slate-600">No transactions yet</p>
          <p className="mt-1 text-xs text-slate-500">Start tracking your expenses</p>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 rounded-lg border border-slate-100 bg-white p-4 hover:shadow-sm transition"
            >
              {/* Icon */}
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg ${
                  CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.Other
                }`}
              >
                {CATEGORY_ICONS[tx.category] || CATEGORY_ICONS.Other}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{tx.category}</p>
                <p className="text-xs text-slate-500">
                  {tx.description || formatDate(tx.date)}
                </p>
              </div>

              {/* Amount */}
              <div className="flex flex-col items-end">
                <p className="font-semibold text-slate-900">
                  -{formatAmount(tx.amount)}
                </p>
                <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
