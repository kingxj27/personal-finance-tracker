import { useEffect, useMemo, useState } from "react";
import { Layout } from "../../components/Layout";
import { BusinessTabs } from "../../components/business/BusinessTabs";
import { useToast } from "../../components/Toast";
import { TableRowSkeleton } from "../../components/Skeleton";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  businessApi,
  formatSigned,
  type Location,
  type Product,
  type Sale,
  type SaleChannel,
} from "../../lib/businessApi";
import { Trash2 } from "lucide-react";

const APPROVAL_LABEL: Record<Sale["approvalStatus"], { label: string; className: string }> = {
  NONE: { label: "—", className: "text-slate-400" },
  PENDING: { label: "Pending approval", className: "text-amber-600 dark:text-amber-400 font-semibold" },
  APPROVED: { label: "Approved", className: "text-emerald-600 dark:text-emerald-400 font-semibold" },
  REJECTED: { label: "Rejected", className: "text-red-500 font-semibold" },
};

export function SalesPage() {
  const { toast } = useToast();
  const { format } = useCurrency();

  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [locationId, setLocationId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [priceSold, setPriceSold] = useState("");
  const [channel, setChannel] = useState<SaleChannel>("IN_PERSON");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  async function loadSales() {
    setLoading(true);
    try {
      const { sales: list } = await businessApi.listSales({ locationId: locationId || undefined });
      setSales(list);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const { locations: locs } = await businessApi.listLocations();
        setLocations(locs);
        if (locs[0]) setLocationId(locs[0].id);
      } catch (err) {
        toast((err as Error).message, "error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!locationId) return;
    (async () => {
      try {
        const { products: list } = await businessApi.listProducts({ locationId });
        setProducts(list.filter((p) => p.quantity > 0));
      } catch (err) {
        toast((err as Error).message, "error");
      }
    })();
    void loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const selectedLocation = useMemo(() => locations.find((l) => l.id === locationId), [locations, locationId]);

  useEffect(() => {
    if (selectedProduct) setPriceSold(String(selectedProduct.salePrice));
  }, [selectedProduct]);

  useEffect(() => {
    if (channel === "ONLINE" && selectedLocation && !commissionPercent) {
      setCommissionPercent(String(selectedLocation.onlineCommissionDefaultPercent));
    }
  }, [channel, selectedLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = useMemo(() => {
    if (!selectedProduct) return null;
    const qty = Number(quantity) || 0;
    const price = Number(priceSold) || 0;
    const revenue = price * qty;
    const cost = selectedProduct.unitCost * qty;
    const margin = revenue - cost;
    const discountPercent =
      price < selectedProduct.salePrice
        ? Math.round(((selectedProduct.salePrice - price) / selectedProduct.salePrice) * 100)
        : 0;
    const commission =
      channel === "ONLINE" ? Math.round(revenue * ((Number(commissionPercent) || 0) / 100)) : 0;
    return { revenue, cost, margin, discountPercent, commission };
  }, [selectedProduct, quantity, priceSold, channel, commissionPercent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !quantity || !priceSold) {
      toast("Select a product and fill in quantity and price", "error");
      return;
    }
    setSubmitting(true);
    try {
      await businessApi.createSale({
        productId,
        quantity: Number(quantity),
        priceSold: Number(priceSold),
        channel,
        ...(channel === "ONLINE" ? { commissionPercent: Number(commissionPercent) || 0 } : {}),
        date: new Date(date).toISOString(),
      });
      toast("Sale logged", "success");
      setQuantity("1");
      setProductId("");
      const { products: list } = await businessApi.listProducts({ locationId });
      setProducts(list.filter((p) => p.quantity > 0));
      await loadSales();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this sale? Stock quantity will be restored.")) return;
    try {
      await businessApi.deleteSale(id);
      toast("Sale deleted, stock restored", "info");
      await loadSales();
      const { products: list } = await businessApi.listProducts({ locationId });
      setProducts(list.filter((p) => p.quantity > 0));
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 dark:from-white dark:via-emerald-300 dark:to-white">
          Sales
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
          Log a sale and track revenue, cost, and margin automatically
        </p>
      </div>

      <BusinessTabs />

      <div
        className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Log a Sale</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Location</label>
              <select
                value={locationId}
                onChange={(e) => { setLocationId(e.target.value); setProductId(""); }}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Product</label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="">Select a product ({products.length} in stock)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.quantity} left</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.quantity ?? undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Price sold at {selectedProduct && `(list: ${format(selectedProduct.salePrice)})`}
              </label>
              <input
                type="number"
                min="0"
                value={priceSold}
                onChange={(e) => setPriceSold(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as SaleChannel)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="IN_PERSON">In-person (shop)</option>
                <option value="ONLINE">Online (storefront)</option>
              </select>
            </div>
            {channel === "ONLINE" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Commission (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            )}
          </div>

          {preview && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 rounded-lg bg-white dark:bg-[#0D1117] border border-slate-200 dark:border-slate-700/50 p-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Revenue</p>
                <p className="font-semibold text-slate-900 dark:text-white">{format(preview.revenue)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Margin</p>
                <p className={`font-semibold ${preview.margin < 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {formatSigned(preview.margin, format)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Discount</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {preview.discountPercent > 0 ? `${preview.discountPercent}%` : "—"}
                  {preview.discountPercent > (selectedLocation?.discountApprovalThreshold ?? 0) && (
                    <span className="ml-1 text-[11px] text-amber-600 dark:text-amber-400">needs approval</span>
                  )}
                </p>
              </div>
              {channel === "ONLINE" && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Your commission</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{format(preview.commission)}</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Logging..." : "Log Sale"}
          </button>
        </form>
      </div>

      <div
        className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Recent Sales</h3>
        {loading && <TableRowSkeleton rows={5} />}
        {!loading && sales.length === 0 && (
          <div className="px-6 py-8 text-center bg-white dark:bg-[#161B22] rounded-lg">
            <p className="text-slate-500">No sales logged yet for this location.</p>
          </div>
        )}
        {!loading && sales.length > 0 && (
          <div className="overflow-x-auto bg-white dark:bg-[#161B22] rounded-lg shadow-inner">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Margin</th>
                  <th className="px-4 py-3">Approval</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map((s) => {
                  const revenue = s.priceSold * s.quantity;
                  const margin = revenue - s.unitCostAtSale * s.quantity;
                  const approval = APPROVAL_LABEL[s.approvalStatus];
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.product.name}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                        {s.channel === "ONLINE" ? "Online" : "In-person"}
                      </td>
                      <td className="px-4 py-3 text-right">{s.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">{format(revenue)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${margin < 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {formatSigned(margin, format)}
                      </td>
                      <td className={`px-4 py-3 text-xs ${approval.className}`}>{approval.label}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => void handleDelete(s.id)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-1 ml-auto"
                        >
                          <Trash2 size={12} strokeWidth={2} /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
