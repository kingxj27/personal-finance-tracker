import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { BusinessTabs } from "../../components/business/BusinessTabs";
import { useToast } from "../../components/Toast";
import { TableRowSkeleton } from "../../components/Skeleton";
import { useCurrency } from "../../contexts/CurrencyContext";
import { businessApi, type Sale } from "../../lib/businessApi";
import { Check, X } from "lucide-react";

export function ApprovalsPage() {
  const { toast } = useToast();
  const { format } = useCurrency();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { sales: list } = await businessApi.listApprovals();
      setSales(list);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActingId(id);
    try {
      await businessApi.actOnApproval(id, action);
      toast(action === "approve" ? "Sale approved" : "Sale flagged as rejected", action === "approve" ? "success" : "warning");
      setSales((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setActingId(null);
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 dark:from-white dark:via-emerald-300 dark:to-white">
          Discount Approvals
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
          Sales discounted beyond a location's policy threshold, awaiting your review
        </p>
      </div>

      <BusinessTabs />

      <div
        className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
      >
        {loading && <TableRowSkeleton rows={4} />}

        {!loading && sales.length === 0 && (
          <div className="px-6 py-10 text-center bg-white dark:bg-[#161B22] rounded-lg">
            <p className="text-lg font-medium text-slate-900 dark:text-white">Nothing pending 🎉</p>
            <p className="mt-1 text-sm text-slate-500">All discounted sales are within policy.</p>
          </div>
        )}

        {!loading && sales.length > 0 && (
          <div className="overflow-x-auto bg-white dark:bg-[#161B22] rounded-lg shadow-inner">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">Sold at</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{s.product.name}</p>
                      <p className="text-xs text-slate-500">Qty {s.quantity} · List price {format(s.product.salePrice)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.location.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                      {s.discountPercent}%
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                      {format(s.priceSold)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={actingId === s.id}
                          onClick={() => void handleAction(s.id, "approve")}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Check size={12} strokeWidth={2.5} /> Approve
                        </button>
                        <button
                          disabled={actingId === s.id}
                          onClick={() => void handleAction(s.id, "reject")}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-1 disabled:opacity-50"
                        >
                          <X size={12} strokeWidth={2.5} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-slate-500">
          Rejecting flags a sale as a policy exception to discuss with the manager — it doesn't undo the sale or restore stock.
        </p>
      </div>
    </Layout>
  );
}
