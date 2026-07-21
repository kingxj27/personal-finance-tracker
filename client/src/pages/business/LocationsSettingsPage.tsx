import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { BusinessTabs } from "../../components/business/BusinessTabs";
import { useToast } from "../../components/Toast";
import { PageSkeleton } from "../../components/Skeleton";
import { businessApi, type Location } from "../../lib/businessApi";
import { Store } from "lucide-react";

type EditableFields = {
  name: string;
  discountApprovalThreshold: string;
  lowStockThreshold: string;
  onlineCommissionDefaultPercent: string;
};

function toFields(l: Location): EditableFields {
  return {
    name: l.name,
    discountApprovalThreshold: String(l.discountApprovalThreshold),
    lowStockThreshold: String(l.lowStockThreshold),
    onlineCommissionDefaultPercent: String(l.onlineCommissionDefaultPercent),
  };
}

export function LocationsSettingsPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [drafts, setDrafts] = useState<Record<string, EditableFields>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { locations: list } = await businessApi.listLocations();
      setLocations(list);
      setDrafts(Object.fromEntries(list.map((l) => [l.id, toFields(l)])));
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

  function updateDraft(id: string, patch: Partial<EditableFields>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id]!, ...patch } }));
  }

  async function handleSave(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    try {
      const { location } = await businessApi.updateLocation(id, {
        name: draft.name,
        discountApprovalThreshold: Number(draft.discountApprovalThreshold),
        lowStockThreshold: Number(draft.lowStockThreshold),
        onlineCommissionDefaultPercent: Number(draft.onlineCommissionDefaultPercent),
      });
      setLocations((prev) => prev.map((l) => (l.id === id ? location : l)));
      toast("Location updated", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900 dark:from-white dark:via-emerald-300 dark:to-white">
          Locations & Policy
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
          Set the discount-approval threshold and low-stock alert level per shop
        </p>
      </div>

      <BusinessTabs />

      {loading && <PageSkeleton />}

      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((l) => {
            const draft = drafts[l.id];
            if (!draft) return null;
            return (
              <div
                key={l.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-[#161B22]/50 p-6 shadow-lg"
                style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)" }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                    <Store size={18} strokeWidth={1.75} />
                  </div>
                  <input
                    value={draft.name}
                    onChange={(e) => updateDraft(l.id, { name: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Discount approval threshold (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={draft.discountApprovalThreshold}
                      onChange={(e) => updateDraft(l.id, { discountApprovalThreshold: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Discounts above this % need your approval
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Low-stock alert (units)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={draft.lowStockThreshold}
                      onChange={(e) => updateDraft(l.id, { lowStockThreshold: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Default online commission (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={draft.onlineCommissionDefaultPercent}
                      onChange={(e) => updateDraft(l.id, { onlineCommissionDefaultPercent: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1117] dark:text-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                    />
                  </div>

                  <button
                    onClick={() => void handleSave(l.id)}
                    disabled={savingId === l.id}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingId === l.id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
