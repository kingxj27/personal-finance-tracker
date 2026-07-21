import { API_BASE_URL, authHeaders } from "../api";

export const PRODUCT_CATEGORIES = [
  "Ankara Garments",
  "Bags",
  "Joggers",
  "Hair Products",
  "Shoes",
  "Accessories",
  "Other",
];

export type Location = {
  id: string;
  name: string;
  discountApprovalThreshold: number;
  lowStockThreshold: number;
  onlineCommissionDefaultPercent: number;
  createdAt: string;
};

export type Batch = {
  id: string;
  locationId: string;
  label: string;
  totalUnits: number;
  totalCost: number;
  dateAdded: string;
  createdAt: string;
};

export type Product = {
  id: string;
  locationId: string;
  batchId: string | null;
  name: string;
  category: string;
  unitCost: number;
  salePrice: number;
  quantity: number;
  dateAdded: string;
  archived: boolean;
  createdAt: string;
};

export type SaleChannel = "IN_PERSON" | "ONLINE";
export type ApprovalStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type Sale = {
  id: string;
  locationId: string;
  productId: string;
  quantity: number;
  priceSold: number;
  unitCostAtSale: number;
  channel: SaleChannel;
  isDiscounted: boolean;
  discountPercent: number;
  commissionPercent: number | null;
  commissionAmount: number | null;
  needsApproval: boolean;
  approvalStatus: ApprovalStatus;
  date: string;
  createdAt: string;
  product: Product;
  location: { id: string; name: string };
};

export type LogType = "COMPLAINT" | "STAFF_ISSUE";

export type WeeklyLogEntry = {
  id: string;
  locationId: string;
  date: string;
  type: LogType;
  text: string;
  createdAt: string;
};

export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
  bestSellingItem: string | null;
  lowStockItems: { id: string; name: string; quantity: number }[];
  complaints: { id: string; date: string; text: string }[];
  staffIssues: { id: string; date: string; text: string }[];
};

export type BusinessDashboard = {
  revenueByLocation: { locationId: string; location: string; revenue: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  agingStock: { days: number; count: number }[];
  monthlyTrend: { month: string; revenue: number }[];
};

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}/api/business${path}`, {
    ...init,
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { message?: string });
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const businessApi = {
  listLocations: () => request<{ locations: Location[] }>("/locations"),
  createLocation: (data: { name: string }) =>
    request<{ location: Location }>("/locations", { method: "POST", body: JSON.stringify(data) }),
  updateLocation: (
    id: string,
    data: Partial<Pick<Location, "name" | "discountApprovalThreshold" | "lowStockThreshold" | "onlineCommissionDefaultPercent">>,
  ) => request<{ location: Location }>(`/locations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  listBatches: (locationId?: string) => request<{ batches: Batch[] }>(`/batches${query({ locationId })}`),
  listBatchProducts: (batchId: string) => request<{ products: Product[] }>(`/batches/${batchId}/products`),
  createBatch: (data: { locationId: string; label: string; totalUnits: number; totalCost: number; dateAdded?: string }) =>
    request<{ batch: Batch }>("/batches", { method: "POST", body: JSON.stringify(data) }),

  listProducts: (params: { locationId?: string; category?: string; aging?: 60 | 90 | 180; includeArchived?: boolean }) =>
    request<{ products: Product[] }>(`/products${query(params)}`),
  createProduct: (data: {
    locationId: string;
    batchId?: string;
    name: string;
    category: string;
    unitCost: number;
    salePrice: number;
    quantity: number;
    dateAdded?: string;
  }) => request<{ product: Product }>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (
    id: string,
    data: Partial<Pick<Product, "name" | "category" | "unitCost" | "salePrice" | "quantity">>,
  ) => request<{ product: Product }>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  archiveProduct: (id: string) => request<{ product: Product }>(`/products/${id}`, { method: "DELETE" }),

  listSales: (params: { locationId?: string; productId?: string; channel?: SaleChannel; approvalStatus?: ApprovalStatus }) =>
    request<{ sales: Sale[] }>(`/sales${query(params)}`),
  createSale: (data: {
    productId: string;
    quantity: number;
    priceSold: number;
    channel: SaleChannel;
    commissionPercent?: number;
    date?: string;
  }) => request<{ sale: Sale }>("/sales", { method: "POST", body: JSON.stringify(data) }),
  deleteSale: (id: string) => request<void>(`/sales/${id}`, { method: "DELETE" }),

  listApprovals: (locationId?: string) => request<{ sales: Sale[] }>(`/approvals${query({ locationId })}`),
  actOnApproval: (id: string, action: "approve" | "reject") =>
    request<{ sale: Sale }>(`/approvals/${id}`, { method: "PATCH", body: JSON.stringify({ action }) }),

  listWeeklyLog: (params: { locationId?: string; type?: LogType; from?: string; to?: string }) =>
    request<{ entries: WeeklyLogEntry[] }>(`/weekly-log${query(params)}`),
  createWeeklyLog: (data: { locationId: string; date: string; type: LogType; text: string }) =>
    request<{ entry: WeeklyLogEntry }>("/weekly-log", { method: "POST", body: JSON.stringify(data) }),
  deleteWeeklyLog: (id: string) => request<void>(`/weekly-log/${id}`, { method: "DELETE" }),

  getWeeklyReport: (locationId: string, weekStart: string) =>
    request<WeeklyReport>(`/reports/weekly${query({ locationId, weekStart })}`),

  getDashboard: () => request<BusinessDashboard>("/dashboard"),
};

/** Formats a possibly-negative NGN amount using the currency formatter, which otherwise clamps negatives to 0. */
export function formatSigned(amountNGN: number, format: (n: number) => string): string {
  return amountNGN < 0 ? `-${format(Math.abs(amountNGN))}` : format(amountNGN);
}

/** Monday-based week start (YYYY-MM-DD) for the given date, using local calendar date components
 * (never toISOString, which converts to UTC and can land on the wrong day near midnight in WAT). */
export function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // shift Sunday(0) back to previous Monday
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
