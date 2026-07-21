import { useMemo } from "react";
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

interface ChartDataPoint {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseChartProps {
  data?: ChartDataPoint[];
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export function IncomeExpenseChart({
  data,
  month,
  year,
  totalIncome,
  totalExpenses,
  netBalance,
}: IncomeExpenseChartProps) {
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }

    const monthName = new Date(year, month - 1, 1).toLocaleDateString(
      "en-NG",
      { month: "short" }
    );

    return [
      {
        month: monthName,
        income: totalIncome,
        expenses: totalExpenses,
      },
    ];
  }, [data, month, year, totalIncome, totalExpenses]);

  const formatNGN = (value: number) => {
    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `₦${(value / 1000).toFixed(1)}K`;
    }
    return `₦${value}`;
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Income vs Expenses</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Monthly comparison</p>
      </div>

      <div className="mb-5 -mx-6 overflow-x-auto px-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: "12px" }} />
            <YAxis stroke="#9ca3af" tickFormatter={formatNGN} style={{ fontSize: "12px" }} />
            <Tooltip
              formatter={(value) => formatNGN(value as number)}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              cursor={{ fill: "rgba(16, 185, 129, 0.06)" }}
            />
            <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px" }} iconType="square" />
            <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700/50 p-3.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Income</p>
          <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
            ₦{totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-700/50 p-3.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Expenses</p>
          <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
            ₦{totalExpenses.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-700/50 p-3.5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Balance</p>
          <p className={`mt-1.5 text-lg font-bold ${netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
            ₦{netBalance.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
