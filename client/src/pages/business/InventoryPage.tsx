import { useEffect, useMemo, useState } from "react";
import { Layout } from "../../components/Layout";
import { Modal } from "../../components/Modal";
import { BusinessTabs } from "../../components/business/BusinessTabs";
import { AgingStockBanner } from "../../components/business/AgingStockBanner";
import { useToast } from "../../components/Toast";
import { TableRowSkeleton } from "../../components/Skeleton";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  businessApi,
  PRODUCT_CATEGORIES,
  type Location,
  type Product,
} from "../../lib/businessApi";
import { Pencil, Archive, Package, Layers } from "lucide-react";

const emptyProductForm = {
  name: "",
  category: PRODUCT_CATEGORIES[0]!,
  unitCost: "",
  salePrice: "",
  quantity: "",
  locationId: "",
  dateAdded: new Date().toISOString().slice(0, 10),
};

const emptyBatchForm = {
  label: "",
  totalUnits: "",
  totalCost: "",
  locationId: "",
  dateAdded: new Date().toISOString().slice(0, 10),
};

export function InventoryPage() {
  const { toast } = useToast();
  const { format } = useCurrency();

  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [agingBuckets, setAgingBuckets] = useState<{ days: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [agingFilter, setAgingFilter] = useState<60 | 90 | 180 | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeBatch, setActiveBatch] = useState<{ id: string; label: string; locationId: string } | null>(null);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [batchForm, setBatchForm] = useState(emptyBatchForm);

  async function loadProducts() {
    setLoading(true);
    try {
      const { products: list } = await businessApi.listProducts({
        locationId: locationFilter || undefined,
        category: categoryFilter || undefined,
        aging: agingFilter ?? undefined,
      });
      setProducts(list);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadStatic() {
    try {
      const [{ locations: locs }, dashboard] = await Promise.all([
        businessApi.listLocations(),
        businessApi.getDashboard(),
      ]);
      setLocations(locs);
      setAgingBuckets(dashboard.agingStock);
      if (!productForm.locationId && locs[0]) {
        setProductForm((f) => ({ ...f, locationId: locs[0]!.id }));
      }
      if (!batchForm.locationId && locs[0]) {
        setBatchForm((f) => ({ ...f, locationId: locs[0]!.id }));
      }
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  useEffect(() => {
    void loadStatic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, categoryFilter, agingFilter]);

  const locationName = useMemo(() => {
    const map = new Map(locations.map((l) => [l.id, l.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [locations]);

  function resetProductForm(overrides?: Partial<typeof emptyProductForm>) {
    setProductForm({
      ...emptyProductForm,
      locationId: locations[0]?.id ?? "",
      ...overrides,
    });
    setEditingId(null);
  }

  function openAddProduct() {
    resetProductForm();
    setActiveBatch(null);
    setIsProductModalOpen(true);
  }

  function handleEdit(product: Product) {
    setProductForm({
      name: product.name,
      category: product.category,
      unitCost: String(product.unitCost),
      salePrice: String(product.salePrice),
      quantity: String(product.quantity),
      locationId: product.locationId,
      dateAdded: product.dateAdded.slice(0, 10),
    });
    setEditingId(product.id);
    setActiveBatch(null);
    setIsProductModalOpen(true);
  }

  async function handleArchive(id: string) {
    if (!window.confirm("Remove this product from active inventory?")) return;
    try {
      await businessApi.archiveProduct(id);
      toast("Product archived", "info");
      await loadProducts();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function submitProduct(e: React.FormEvent, keepOpenForBatch: boolean) {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.locationId) {
      toast("Name and location are required", "error");
      return;
    }
    try {
      const payload = {
        locationId: productForm.locationId,
        ...(activeBatch ? { batchId: activeBatch.id } : {}),
        name: productForm.name,
        category: productForm.category,
        unitCost: Number(productForm.unitCost) || 0,
        salePrice: Number(productForm.salePrice) || 0,
        quantity: Number(productForm.quantity) || 0,
        dateAdded: new Date(productForm.dateAdded).toISOString(),
      };
      if (editingId) {
        await businessApi.updateProduct(editingId, {
          name: payload.name,
          category: payload.category,
          unitCost: payload.unitCost,
          salePrice: payload.salePrice,
          quantity: payload.quantity,
        });
        toast("Product updated", "success");
      } else {
        await businessApi.createProduct(payload);
        toast("Product added", "success");
      }
      await loadProducts();
      if (keepOpenForBatch && activeBatch) {
        resetProductForm({ locationId: activeBatch.locationId });
      } else {
        setIsProductModalOpen(false);
        resetProductForm();
      }
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function submitBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!batchForm.label.trim() || !batchForm.locationId) {
      toast("Label and location are required", "error");
      return;
    }
    try {
      const { batch } = await businessApi.createBatch({
        locationId: batchForm.locationId,
        label: batchForm.label,
        totalUnits: Number(batchForm.totalUnits) || 0,
        totalCost: Number(batchForm.totalCost) || 0,
        dateAdded: new Date(batchForm.dateAdded).toISOString(),
      });
      toast("Batch created — now add its line items", "success");
      setIsBatchModalOpen(false);
      setBatchForm(emptyBatchForm);
      setActiveBatch({ id: batch.id, label: batch.label, locationId: batch.locationId });
      resetProductForm({ locationId: batch.locationId });
      setIsProductModalOpen(true);
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 dark:from-white dark:via-emerald-300 dark:to-white">
              Inventory
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
              Products across all shop locations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="rounded-lg border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center gap-2"
            >
              <Layers size={15} strokeWidth={1.75} /> Add Bulk Batch
            </button>
            <button
              onClick={openAddProduct}
              className="rounded-lg border border-green-200 bg-white dark:bg-[#161B22] px-4 py-2.5 font-medium text-green-700 hover:bg-green-50 transition flex items-center gap-2"
            >
              <Package size={15} strokeWidth={1.75} /> Add Single Product
            </button>
          </div>
        </div>
      </div>

      <BusinessTabs />

      <AgingStockBanner buckets={agingBuckets} onSelect={setAgingFilter} activeDays={agingFilter} />

      <div
        className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="">All Locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              <option value="">All Categories</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {agingFilter && (
            <div className="flex items-end">
              <button
                onClick={() => setAgingFilter(null)}
                className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400"
              >
                Clear aging filter ({agingFilter}+ days)
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {loading ? "Loading..." : `${products.length} product${products.length === 1 ? "" : "s"}`}
          </h3>
        </div>

        {loading && <TableRowSkeleton rows={6} />}

        {!loading && products.length === 0 && (
          <div className="px-6 py-8 text-center bg-white dark:bg-[#161B22] rounded-lg">
            <p className="text-lg font-medium text-slate-900 dark:text-white">No products found</p>
            <p className="mt-1 text-sm text-slate-500">Try adjusting filters, or add a product above.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="overflow-x-auto bg-white dark:bg-[#161B22] rounded-lg shadow-inner">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Sale Price</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.category}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{locationName(p.locationId)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${p.quantity === 0 ? "text-red-500" : "text-slate-900 dark:text-white"}`}>
                      {p.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{format(p.unitCost)}</td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium">{format(p.salePrice)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(p.dateAdded).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1"
                        >
                          <Pencil size={12} strokeWidth={2} /> Edit
                        </button>
                        <button
                          onClick={() => void handleArchive(p.id)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-1"
                        >
                          <Archive size={12} strokeWidth={2} /> Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setActiveBatch(null);
          resetProductForm();
        }}
        title={editingId ? "Edit Product" : activeBatch ? `Add item to: ${activeBatch.label}` : "Add Product"}
      >
        <form onSubmit={(e) => void submitProduct(e, false)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Name *</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. Blue Ankara Gown (M)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Category</label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Location *</label>
              <select
                value={productForm.locationId}
                disabled={!!activeBatch || !!editingId}
                onChange={(e) => setProductForm({ ...productForm, locationId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 disabled:opacity-60"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Unit Cost</label>
              <input
                type="number"
                min="0"
                value={productForm.unitCost}
                onChange={(e) => setProductForm({ ...productForm, unitCost: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Sale Price</label>
              <input
                type="number"
                min="0"
                value={productForm.salePrice}
                onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Quantity</label>
              <input
                type="number"
                min="0"
                value={productForm.quantity}
                onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>

          {!editingId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Date Added</label>
              <input
                type="date"
                value={productForm.dateAdded}
                onChange={(e) => setProductForm({ ...productForm, dateAdded: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsProductModalOpen(false);
                setActiveBatch(null);
                resetProductForm();
              }}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700/50 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              {activeBatch ? "Done" : "Cancel"}
            </button>
            {activeBatch && !editingId ? (
              <button
                type="button"
                onClick={(e) => void submitProduct(e as unknown as React.FormEvent, true)}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Save & Add Another
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {editingId ? "Update" : "Save"} Product
              </button>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setBatchForm(emptyBatchForm);
        }}
        title="Add Bulk Batch"
      >
        <form onSubmit={(e) => void submitBatch(e)} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            Record the bulk purchase first, then you'll add each style/item from the batch right after.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Batch label *</label>
            <input
              type="text"
              required
              value={batchForm.label}
              onChange={(e) => setBatchForm({ ...batchForm, label: e.target.value })}
              placeholder="e.g. July bulk purchase — mixed Ankara styles"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Location *</label>
            <select
              value={batchForm.locationId}
              onChange={(e) => setBatchForm({ ...batchForm, locationId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Total units</label>
              <input
                type="number"
                min="1"
                value={batchForm.totalUnits}
                onChange={(e) => setBatchForm({ ...batchForm, totalUnits: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Total cost paid</label>
              <input
                type="number"
                min="0"
                value={batchForm.totalCost}
                onChange={(e) => setBatchForm({ ...batchForm, totalCost: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Date added</label>
            <input
              type="date"
              value={batchForm.dateAdded}
              onChange={(e) => setBatchForm({ ...batchForm, dateAdded: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsBatchModalOpen(false);
                setBatchForm(emptyBatchForm);
              }}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700/50 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Create Batch & Add Items
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
