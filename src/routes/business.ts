import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import type { AuthRequest } from "../middleware/auth";

export const businessRouter = Router();

const DEFAULT_LOCATIONS = ["Silverbird Mall Shop", "Airport Shop", "Calabar Pot Shop"];

async function ensureDefaultLocations(userId: string) {
  const count = await prisma.location.count({ where: { userId } });
  if (count > 0) return;
  await prisma.location.createMany({
    data: DEFAULT_LOCATIONS.map((name) => ({ userId, name })),
  });
}

// Every business route depends on the user having at least their default locations set up.
businessRouter.use(async (req: AuthRequest, _res: Response, next) => {
  await ensureDefaultLocations(req.userId!);
  next();
});

async function assertLocationOwned(userId: string, locationId: string) {
  const location = await prisma.location.findFirst({ where: { id: locationId, userId } });
  return location;
}

// --- Locations ---------------------------------------------------------

const locationCreateSchema = z.object({
  name: z.string().min(1),
  discountApprovalThreshold: z.number().int().min(0).max(100).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  onlineCommissionDefaultPercent: z.number().min(0).max(100).optional(),
});
const locationUpdateSchema = locationCreateSchema.partial();

businessRouter.get("/locations", async (req: AuthRequest, res: Response) => {
  const locations = await prisma.location.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "asc" },
  });
  res.json({ locations });
});

businessRouter.post("/locations", async (req: AuthRequest, res: Response) => {
  const parsed = locationCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { name, discountApprovalThreshold, lowStockThreshold, onlineCommissionDefaultPercent } = parsed.data;
  const location = await prisma.location.create({
    data: {
      userId: req.userId!,
      name,
      ...(discountApprovalThreshold !== undefined ? { discountApprovalThreshold } : {}),
      ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
      ...(onlineCommissionDefaultPercent !== undefined ? { onlineCommissionDefaultPercent } : {}),
    },
  });
  res.status(201).json({ location });
});

businessRouter.patch("/locations/:id", async (req: AuthRequest, res: Response) => {
  const parsed = locationUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const existing = await assertLocationOwned(req.userId!, String(req.params.id));
  if (!existing) return res.status(404).json({ message: "Location not found" });
  const { name, discountApprovalThreshold, lowStockThreshold, onlineCommissionDefaultPercent } = parsed.data;
  const location = await prisma.location.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(discountApprovalThreshold !== undefined ? { discountApprovalThreshold } : {}),
      ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
      ...(onlineCommissionDefaultPercent !== undefined ? { onlineCommissionDefaultPercent } : {}),
    },
  });
  res.json({ location });
});

businessRouter.delete("/locations/:id", async (req: AuthRequest, res: Response) => {
  const existing = await assertLocationOwned(req.userId!, String(req.params.id));
  if (!existing) return res.status(404).json({ message: "Location not found" });
  const [products, batches, sales, logs] = await Promise.all([
    prisma.product.count({ where: { locationId: existing.id } }),
    prisma.batch.count({ where: { locationId: existing.id } }),
    prisma.sale.count({ where: { locationId: existing.id } }),
    prisma.weeklyLogEntry.count({ where: { locationId: existing.id } }),
  ]);
  if (products + batches + sales + logs > 0) {
    return res.status(409).json({ message: "Location still has products, sales, or logs attached" });
  }
  await prisma.location.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// --- Batches -------------------------------------------------------------

const batchCreateSchema = z.object({
  locationId: z.string().min(1),
  label: z.string().min(1),
  totalUnits: z.number().int().positive(),
  totalCost: z.number().int().nonnegative(),
  dateAdded: z.string().datetime().optional(),
});
const batchUpdateSchema = z.object({
  label: z.string().min(1).optional(),
  totalUnits: z.number().int().positive().optional(),
  totalCost: z.number().int().nonnegative().optional(),
});

businessRouter.get("/batches", async (req: AuthRequest, res: Response) => {
  const { locationId } = req.query;
  const batches = await prisma.batch.findMany({
    where: {
      userId: req.userId!,
      ...(locationId && typeof locationId === "string" ? { locationId } : {}),
    },
    orderBy: { dateAdded: "desc" },
  });
  res.json({ batches });
});

businessRouter.get("/batches/:id/products", async (req: AuthRequest, res: Response) => {
  const batch = await prisma.batch.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!batch) return res.status(404).json({ message: "Batch not found" });
  const products = await prisma.product.findMany({ where: { batchId: batch.id } });
  res.json({ products });
});

businessRouter.post("/batches", async (req: AuthRequest, res: Response) => {
  const parsed = batchCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const location = await assertLocationOwned(req.userId!, parsed.data.locationId);
  if (!location) return res.status(404).json({ message: "Location not found" });
  const { locationId, label, totalUnits, totalCost, dateAdded } = parsed.data;
  const batch = await prisma.batch.create({
    data: {
      userId: req.userId!,
      locationId,
      label,
      totalUnits,
      totalCost,
      ...(dateAdded ? { dateAdded: new Date(dateAdded) } : {}),
    },
  });
  res.status(201).json({ batch });
});

businessRouter.put("/batches/:id", async (req: AuthRequest, res: Response) => {
  const parsed = batchUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const existing = await prisma.batch.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!existing) return res.status(404).json({ message: "Batch not found" });
  const { label, totalUnits, totalCost } = parsed.data;
  const batch = await prisma.batch.update({
    where: { id: existing.id },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(totalUnits !== undefined ? { totalUnits } : {}),
      ...(totalCost !== undefined ? { totalCost } : {}),
    },
  });
  res.json({ batch });
});

businessRouter.delete("/batches/:id", async (req: AuthRequest, res: Response) => {
  const existing = await prisma.batch.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!existing) return res.status(404).json({ message: "Batch not found" });
  const productCount = await prisma.product.count({ where: { batchId: existing.id } });
  if (productCount > 0) {
    return res.status(409).json({ message: "Batch still has products attached" });
  }
  await prisma.batch.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// --- Products --------------------------------------------------------------

const productCreateSchema = z.object({
  locationId: z.string().min(1),
  batchId: z.string().min(1).optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  unitCost: z.number().int().nonnegative(),
  salePrice: z.number().int().nonnegative(),
  quantity: z.number().int().nonnegative(),
  dateAdded: z.string().datetime().optional(),
});
const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unitCost: z.number().int().nonnegative().optional(),
  salePrice: z.number().int().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
});

const AGING_DAY_OPTIONS = [60, 90, 180] as const;

businessRouter.get("/products", async (req: AuthRequest, res: Response) => {
  const { locationId, category, aging, includeArchived } = req.query;
  const where: Record<string, unknown> = { userId: req.userId! };
  if (!includeArchived || includeArchived !== "true") where.archived = false;
  if (locationId && typeof locationId === "string") where.locationId = locationId;
  if (category && typeof category === "string") where.category = category;
  if (aging && AGING_DAY_OPTIONS.includes(Number(aging) as (typeof AGING_DAY_OPTIONS)[number])) {
    const cutoff = new Date(Date.now() - Number(aging) * 24 * 60 * 60 * 1000);
    where.dateAdded = { lte: cutoff };
    where.sales = { none: {} };
  }
  const products = await prisma.product.findMany({ where, orderBy: { dateAdded: "desc" } });
  res.json({ products });
});

businessRouter.post("/products", async (req: AuthRequest, res: Response) => {
  const parsed = productCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const location = await assertLocationOwned(req.userId!, parsed.data.locationId);
  if (!location) return res.status(404).json({ message: "Location not found" });
  if (parsed.data.batchId) {
    const batch = await prisma.batch.findFirst({ where: { id: parsed.data.batchId, userId: req.userId! } });
    if (!batch) return res.status(404).json({ message: "Batch not found" });
  }
  const { locationId, batchId, name, category, unitCost, salePrice, quantity, dateAdded } = parsed.data;
  const product = await prisma.product.create({
    data: {
      userId: req.userId!,
      locationId,
      name,
      category,
      unitCost,
      salePrice,
      quantity,
      ...(batchId !== undefined ? { batchId } : {}),
      ...(dateAdded ? { dateAdded: new Date(dateAdded) } : {}),
    },
  });
  res.status(201).json({ product });
});

businessRouter.put("/products/:id", async (req: AuthRequest, res: Response) => {
  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const existing = await prisma.product.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!existing) return res.status(404).json({ message: "Product not found" });
  const { name, category, unitCost, salePrice, quantity } = parsed.data;
  const product = await prisma.product.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(unitCost !== undefined ? { unitCost } : {}),
      ...(salePrice !== undefined ? { salePrice } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
    },
  });
  res.json({ product });
});

businessRouter.delete("/products/:id", async (req: AuthRequest, res: Response) => {
  const existing = await prisma.product.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!existing) return res.status(404).json({ message: "Product not found" });
  const product = await prisma.product.update({ where: { id: existing.id }, data: { archived: true } });
  res.json({ product });
});

// --- Sales -------------------------------------------------------------

class InsufficientStockError extends Error {}

const saleCreateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  priceSold: z.number().int().nonnegative(),
  channel: z.enum(["IN_PERSON", "ONLINE"]).default("IN_PERSON"),
  commissionPercent: z.number().min(0).max(100).optional(),
  date: z.string().datetime().optional(),
});

businessRouter.get("/sales", async (req: AuthRequest, res: Response) => {
  const { locationId, productId, channel, approvalStatus, from, to } = req.query;
  const where: Record<string, unknown> = { userId: req.userId! };
  if (locationId && typeof locationId === "string") where.locationId = locationId;
  if (productId && typeof productId === "string") where.productId = productId;
  if (channel && typeof channel === "string") where.channel = channel;
  if (approvalStatus && typeof approvalStatus === "string") where.approvalStatus = approvalStatus;
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(String(from)) } : {}),
      ...(to ? { lte: new Date(String(to)) } : {}),
    };
  }
  const sales = await prisma.sale.findMany({
    where,
    include: { product: true, location: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
  res.json({ sales });
});

businessRouter.post("/sales", async (req: AuthRequest, res: Response) => {
  const parsed = saleCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const data = parsed.data;

  const product = await prisma.product.findFirst({
    where: { id: data.productId, userId: req.userId!, archived: false },
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  const location = await prisma.location.findUnique({ where: { id: product.locationId } });
  if (!location) return res.status(404).json({ message: "Location not found" });

  const discountPercent =
    data.priceSold < product.salePrice
      ? Math.round(((product.salePrice - data.priceSold) / product.salePrice) * 100)
      : 0;
  const isDiscounted = discountPercent > 0;
  const needsApproval = discountPercent > location.discountApprovalThreshold;

  const commissionPercent =
    data.channel === "ONLINE" ? data.commissionPercent ?? location.onlineCommissionDefaultPercent : null;
  const commissionAmount =
    data.channel === "ONLINE" && commissionPercent != null
      ? Math.round(data.priceSold * data.quantity * (commissionPercent / 100))
      : null;

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.updateMany({
        where: { id: product.id, quantity: { gte: data.quantity } },
        data: { quantity: { decrement: data.quantity } },
      });
      if (updated.count === 0) throw new InsufficientStockError();
      return tx.sale.create({
        data: {
          userId: req.userId!,
          locationId: product.locationId,
          productId: product.id,
          quantity: data.quantity,
          priceSold: data.priceSold,
          unitCostAtSale: product.unitCost,
          channel: data.channel,
          isDiscounted,
          discountPercent,
          commissionPercent,
          commissionAmount,
          needsApproval,
          approvalStatus: needsApproval ? "PENDING" : "NONE",
          date: data.date ? new Date(data.date) : new Date(),
        },
      });
    });
    res.status(201).json({ sale });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return res.status(400).json({ message: "Insufficient stock for this sale" });
    }
    throw err;
  }
});

businessRouter.delete("/sales/:id", async (req: AuthRequest, res: Response) => {
  const existing = await prisma.sale.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!existing) return res.status(404).json({ message: "Sale not found" });
  await prisma.$transaction([
    prisma.product.update({
      where: { id: existing.productId },
      data: { quantity: { increment: existing.quantity } },
    }),
    prisma.sale.delete({ where: { id: existing.id } }),
  ]);
  res.status(204).send();
});

// --- Approvals -----------------------------------------------------------

const approvalActionSchema = z.object({ action: z.enum(["approve", "reject"]) });

businessRouter.get("/approvals", async (req: AuthRequest, res: Response) => {
  const { locationId } = req.query;
  const sales = await prisma.sale.findMany({
    where: {
      userId: req.userId!,
      approvalStatus: "PENDING",
      ...(locationId && typeof locationId === "string" ? { locationId } : {}),
    },
    include: { product: true, location: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
  res.json({ sales });
});

businessRouter.patch("/approvals/:id", async (req: AuthRequest, res: Response) => {
  const parsed = approvalActionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const existing = await prisma.sale.findFirst({
    where: { id: String(req.params.id), userId: req.userId!, needsApproval: true },
  });
  if (!existing) return res.status(404).json({ message: "Pending sale not found" });
  const sale = await prisma.sale.update({
    where: { id: existing.id },
    data: { approvalStatus: parsed.data.action === "approve" ? "APPROVED" : "REJECTED" },
  });
  res.json({ sale });
});

// --- Weekly log (complaints / staff issues) -------------------------------

const weeklyLogCreateSchema = z.object({
  locationId: z.string().min(1),
  date: z.string().datetime(),
  type: z.enum(["COMPLAINT", "STAFF_ISSUE"]),
  text: z.string().min(1),
});

businessRouter.get("/weekly-log", async (req: AuthRequest, res: Response) => {
  const { locationId, type, from, to } = req.query;
  const where: Record<string, unknown> = { userId: req.userId! };
  if (locationId && typeof locationId === "string") where.locationId = locationId;
  if (type && typeof type === "string") where.type = type;
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(String(from)) } : {}),
      ...(to ? { lte: new Date(String(to)) } : {}),
    };
  }
  const entries = await prisma.weeklyLogEntry.findMany({ where, orderBy: { date: "desc" } });
  res.json({ entries });
});

businessRouter.post("/weekly-log", async (req: AuthRequest, res: Response) => {
  const parsed = weeklyLogCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const location = await assertLocationOwned(req.userId!, parsed.data.locationId);
  if (!location) return res.status(404).json({ message: "Location not found" });
  const entry = await prisma.weeklyLogEntry.create({
    data: { ...parsed.data, userId: req.userId!, date: new Date(parsed.data.date) },
  });
  res.status(201).json({ entry });
});

businessRouter.delete("/weekly-log/:id", async (req: AuthRequest, res: Response) => {
  const existing = await prisma.weeklyLogEntry.findFirst({ where: { id: String(req.params.id), userId: req.userId! } });
  if (!existing) return res.status(404).json({ message: "Log entry not found" });
  await prisma.weeklyLogEntry.delete({ where: { id: existing.id } });
  res.status(204).send();
});

// --- Reports ---------------------------------------------------------------

businessRouter.get("/reports/weekly", async (req: AuthRequest, res: Response) => {
  const { locationId, weekStart } = req.query;
  if (!locationId || typeof locationId !== "string" || !weekStart || typeof weekStart !== "string") {
    return res.status(400).json({ message: "locationId and weekStart are required" });
  }
  const location = await assertLocationOwned(req.userId!, locationId);
  if (!location) return res.status(404).json({ message: "Location not found" });

  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [weekSales, lowStockItems, complaints, staffIssues] = await Promise.all([
    prisma.sale.findMany({
      where: { userId: req.userId!, locationId, date: { gte: start, lt: end } },
      include: { product: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { userId: req.userId!, locationId, archived: false, quantity: { lt: location.lowStockThreshold } },
      orderBy: { quantity: "asc" },
    }),
    prisma.weeklyLogEntry.findMany({
      where: { userId: req.userId!, locationId, type: "COMPLAINT", date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
    }),
    prisma.weeklyLogEntry.findMany({
      where: { userId: req.userId!, locationId, type: "STAFF_ISSUE", date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
    }),
  ]);

  const totalRevenue = weekSales.reduce((sum, s) => sum + s.priceSold * s.quantity, 0);

  const revenueByProduct = new Map<string, { name: string; revenue: number }>();
  for (const s of weekSales) {
    const key = s.productId;
    const entry = revenueByProduct.get(key) ?? { name: s.product.name, revenue: 0 };
    entry.revenue += s.priceSold * s.quantity;
    revenueByProduct.set(key, entry);
  }
  const bestSellingItem =
    [...revenueByProduct.values()].sort((a, b) => b.revenue - a.revenue)[0]?.name ?? null;

  res.json({
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    totalRevenue,
    bestSellingItem,
    lowStockItems: lowStockItems.map((p) => ({ id: p.id, name: p.name, quantity: p.quantity })),
    complaints: complaints.map((c) => ({ id: c.id, date: c.date, text: c.text })),
    staffIssues: staffIssues.map((s) => ({ id: s.id, date: s.date, text: s.text })),
  });
});

// --- Dashboard ---------------------------------------------------------------

businessRouter.get("/dashboard", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [locations, sales, agingBuckets] = await Promise.all([
    prisma.location.findMany({ where: { userId } }),
    prisma.sale.findMany({
      where: { userId, date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
      include: { product: { select: { category: true } } },
    }),
    Promise.all(
      AGING_DAY_OPTIONS.map(async (days) => {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const count = await prisma.product.count({
          where: { userId, archived: false, dateAdded: { lte: cutoff }, sales: { none: {} } },
        });
        return { days, count };
      }),
    ),
  ]);

  const thisMonthSales = sales.filter((s) => s.date >= monthStart);
  const revenueByLocationMap = new Map<string, number>();
  const revenueByCategoryMap = new Map<string, number>();
  for (const s of thisMonthSales) {
    const revenue = s.priceSold * s.quantity;
    revenueByLocationMap.set(s.locationId, (revenueByLocationMap.get(s.locationId) ?? 0) + revenue);
    const category = s.product.category;
    revenueByCategoryMap.set(category, (revenueByCategoryMap.get(category) ?? 0) + revenue);
  }

  const revenueByLocation = locations.map((l) => ({
    locationId: l.id,
    location: l.name,
    revenue: revenueByLocationMap.get(l.id) ?? 0,
  }));
  const revenueByCategory = [...revenueByCategoryMap.entries()].map(([category, revenue]) => ({
    category,
    revenue,
  }));

  const monthlyTrend: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const revenue = sales
      .filter((s) => s.date >= mStart && s.date < mEnd)
      .reduce((sum, s) => sum + s.priceSold * s.quantity, 0);
    monthlyTrend.push({ month: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`, revenue });
  }

  res.json({
    revenueByLocation,
    revenueByCategory,
    agingStock: agingBuckets,
    monthlyTrend,
  });
});
