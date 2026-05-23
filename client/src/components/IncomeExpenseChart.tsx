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
  // Use provided data or create mock data for current month
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
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Income vs Expenses
        </h2>
        <p className="mt-1 text-sm text-slate-600">Monthly comparison</p>
      </div>

      {/* Chart */}
      <div className="mb-6 -mx-6 overflow-x-auto px-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#9ca3af"
              tickFormatter={formatNGN}
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              formatter={(value) => formatNGN(value as number)}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              cursor={{ fill: "rgba(251, 191, 36, 0.1)" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="square"
            />
            <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <p className="text-xs font-medium text-green-700">Total Income</p>
          <p className="mt-2 text-xl font-bold text-green-900">
            ₦{totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border border-red-100 bg-red-50 p-4">
          <p className="text-xs font-medium text-red-700">Total Expenses</p>
          <p className="mt-2 text-xl font-bold text-red-900">
            ₦{totalExpenses.toLocaleString()}
          </p>
        </div>

        <div
          className={`rounded-lg border p-4 ${
            netBalance >= 0
              ? "border-blue-100 bg-blue-50"
              : "border-orange-100 bg-orange-50"
          }`}
        >
          <p
            className={`text-xs font-medium ${
              netBalance >= 0 ? "text-blue-700" : "text-orange-700"
            }`}
          >
            Net Balance
          </p>
          <p
            className={`mt-2 text-xl font-bold ${
              netBalance >= 0 ? "text-blue-900" : "text-orange-900"
            }`}
          >
            ₦{netBalance.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
