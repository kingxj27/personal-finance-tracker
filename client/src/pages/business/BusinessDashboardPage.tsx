import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { Layout } from "../../components/Layout";
import { BusinessTabs } from "../../components/business/BusinessTabs";
import { AgingStockBanner } from "../../components/business/AgingStockBanner";
import { useToast } from "../../components/Toast";
import { PageSkeleton } from "../../components/Skeleton";
import { useCurrency } from "../../contexts/CurrencyContext";
import { businessApi, type BusinessDashboard } from "../../lib/businessApi";

const BAR_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export function BusinessDashboardPage() {
  const { toast } = useToast();
  const { format } = useCurrency();
  const [data, setData] = useState<BusinessDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await businessApi.getDashboard();
        setData(result);
      } catch (err) {
        toast((err as Error).message, "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 dark:from-white dark:via-emerald-300 dark:to-white">
          Business Overview
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
          Revenue across all shops, this month
        </p>
      </div>

      <BusinessTabs />

      {loading && <PageSkeleton />}

      {!loading && data && (
        <div className="space-y-8">
          <AgingStockBanner buckets={data.agingStock} />

          <div className="grid gap-8 lg:grid-cols-2">
            <div
              className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
            >
              <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Revenue by Location</h3>
              <div className="bg-white dark:bg-[#161B22] rounded-lg p-4 shadow-inner">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.revenueByLocation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => format(value as number)} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {data.revenueByLocation.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
            >
              <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Revenue by Category</h3>
              <div className="bg-white dark:bg-[#161B22] rounded-lg p-4 shadow-inner">
                {data.revenueByCategory.length === 0 ? (
                  <p className="py-16 text-center text-sm text-slate-500">No sales recorded yet this month</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.revenueByCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={110} />
                      <Tooltip formatter={(value) => format(value as number)} />
                      <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                        {data.revenueByCategory.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
            style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
          >
            <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">Month-over-Month Revenue</h3>
            <div className="bg-white dark:bg-[#161B22] rounded-lg p-4 shadow-inner">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => format(value as number)} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
