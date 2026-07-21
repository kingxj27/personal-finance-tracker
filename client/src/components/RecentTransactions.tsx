import { useEffect, useState } from "react";
import { API_BASE_URL, authHeaders } from "../api";
import { Utensils, Car, Zap, Clapperboard, ShoppingBag, HeartPulse, Package, Inbox } from "lucide-react";

type Transaction = {
  id: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
};

const CATEGORY_ICONS: Record<string, typeof Utensils> = {
  Food: Utensils,
  Transport: Car,
  Utilities: Zap,
  Entertainment: Clapperboard,
  Shopping: ShoppingBag,
  Health: HeartPulse,
  Other: Package,
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

        const transformed = (data.expenses || [])
          .map((exp: any) => ({
            id: exp.id || Math.random().toString(),
            category: exp.category || "Other",
            amount: exp.amount || 0,
            date: exp.date || new Date().toISOString(),
            description: exp.title || exp.description || "",
          }))
          .sort(
            (a: Transaction, b: Transaction) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 10);

        setTransactions(transformed);
      } catch (err) {
        setError((err as Error).message);
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
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Transactions</h2>
        <a href="/expenses" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
          View all
        </a>
      </div>

      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400" role="status">
          Loading transactions...
        </p>
      )}

      {error && !loading && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && transactions.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700/50 p-8 text-center">
          <Inbox size={20} className="mx-auto text-slate-400 mb-2" strokeWidth={1.75} />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No transactions yet</p>
          <p className="mt-1 text-xs text-slate-500">Start tracking your expenses</p>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div className="space-y-2">
          {transactions.map((tx) => {
            const Icon = CATEGORY_ICONS[tx.category] ?? Package;
            return (
              <div
                key={tx.id}
                className="flex items-center gap-4 rounded-lg border border-slate-100 dark:border-slate-800 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                  <Icon size={16} strokeWidth={1.75} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 dark:text-white">{tx.category}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                    {tx.description || formatDate(tx.date)}
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    -{formatAmount(tx.amount)}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
