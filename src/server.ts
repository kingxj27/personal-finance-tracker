import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prismaClient";
import { authMiddleware, createToken, type AuthRequest } from "./middleware/auth";
import { businessRouter } from "./routes/business";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const PORT = process.env.PORT || 4000;
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

app.use(cors());
app.use(express.json());

// Auth routes ---------------------------------------------------------------

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  persona: z.enum(["STUDENT", "YOUNG_PROFESSIONAL", "INVESTOR"]).optional(),
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { email, password, persona } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, persona: (persona ?? "YOUNG_PROFESSIONAL") as any },
  });
  const token = createToken(user.id);
  return res.status(201).json({ token, persona: persona ?? "YOUNG_PROFESSIONAL" });
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = createToken(user.id);
  return res.json({ token });
});

app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, persona: true, createdAt: true },
  });
  return res.json({ user });
});

// Seed demo user with rich 3-month dataset
app.post("/api/auth/seed", async (req: Request, res: Response) => {
  const testEmail = "demo@example.com";
  const testPassword = "demo@123";

  try {
    let user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!user) {
      const hashed = await bcrypt.hash(testPassword, 10);
      try {
        user = await prisma.user.create({
          data: { email: testEmail, password: hashed, persona: "YOUNG_PROFESSIONAL" },
        });
      } catch {
        // A concurrent seed request (e.g. a double-fired click) created it first — use that one.
        user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (!user) throw new Error("Failed to find or create demo user");
      }
    }

    const uid = user.id;
    const now = new Date();

    // Clear existing demo data for this user so re-seeding is idempotent
    await Promise.all([
      prisma.expense.deleteMany({ where: { userId: uid } }),
      prisma.income.deleteMany({ where: { userId: uid } }),
      prisma.budget.deleteMany({ where: { userId: uid } }),
      prisma.goal.deleteMany({ where: { userId: uid } }),
    ]);

    // Helper to make dates within a specific month
    const d = (monthsAgo: number, day: number) => {
      return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
    };

    // --- 3 months of income ---
    await prisma.income.createMany({
      data: [
        { userId: uid, title: "Monthly Salary", amount: 350000, source: "Salary", date: d(2, 1) },
        { userId: uid, title: "Freelance Project - Web Design", amount: 85000, source: "Freelance", date: d(2, 15), notes: "Client: TechCorp" },
        { userId: uid, title: "Monthly Salary", amount: 350000, source: "Salary", date: d(1, 1) },
        { userId: uid, title: "Freelance Project - Dashboard UI", amount: 120000, source: "Freelance", date: d(1, 18), notes: "Client: StartupXYZ" },
        { userId: uid, title: "Monthly Salary", amount: 350000, source: "Salary", date: d(0, 1) },
        { userId: uid, title: "Investment Dividend", amount: 45000, source: "Investment", date: d(0, 10), notes: "Q1 dividend payout" },
      ],
    });

    // --- 3 months of expenses ---
    const expData = [
      { cat: "Food", amt: 28000, day: 3, mo: 2, note: "Grocery shopping" },
      { cat: "Transport", amt: 15000, day: 5, mo: 2, note: "Fuel & Uber" },
      { cat: "Utilities", amt: 22000, day: 7, mo: 2, note: "Electricity & Internet" },
      { cat: "Entertainment", amt: 18000, day: 12, mo: 2, note: "Streaming & cinema" },
      { cat: "Shopping", amt: 35000, day: 20, mo: 2, note: "Clothing" },
      { cat: "Health", amt: 12000, day: 25, mo: 2, note: "Gym membership" },
      { cat: "Food", amt: 31000, day: 2, mo: 1, note: "Grocery + restaurant" },
      { cat: "Transport", amt: 12500, day: 6, mo: 1, note: "Fuel" },
      { cat: "Utilities", amt: 21000, day: 8, mo: 1, note: "Bills" },
      { cat: "Entertainment", amt: 25000, day: 14, mo: 1, note: "Concert tickets" },
      { cat: "Shopping", amt: 48000, day: 22, mo: 1, note: "Electronics" },
      { cat: "Health", amt: 12000, day: 28, mo: 1, note: "Gym & pharmacy" },
      { cat: "Other", amt: 8000, day: 29, mo: 1, note: "Miscellaneous" },
      { cat: "Food", amt: 26000, day: 3, mo: 0, note: "Weekly groceries" },
      { cat: "Transport", amt: 9500, day: 5, mo: 0, note: "Uber & fuel" },
      { cat: "Utilities", amt: 22000, day: 7, mo: 0, note: "Electricity bill" },
      { cat: "Entertainment", amt: 14000, day: 11, mo: 0, note: "Netflix & games" },
      { cat: "Shopping", amt: 22000, day: 16, mo: 0, note: "Home goods" },
      { cat: "Health", amt: 12000, day: 20, mo: 0, note: "Gym membership" },
    ];
    await prisma.expense.createMany({
      data: expData.map((e) => ({
        userId: uid,
        title: e.note,
        amount: e.amt,
        category: e.cat,
        date: d(e.mo, e.day),
        note: e.note,
        recurring: false,
      })),
    });

    // --- Budgets for current month ---
    const budgetData = [
      { category: "Food", limit: 35000 },
      { category: "Transport", limit: 15000 },
      { category: "Utilities", limit: 25000 },
      { category: "Entertainment", limit: 20000 },
      { category: "Shopping", limit: 40000 },
      { category: "Health", limit: 15000 },
    ];
    await prisma.budget.createMany({
      data: budgetData.map((b) => ({
        userId: uid,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        category: b.category,
        limit: b.limit,
      })),
    });

    // --- Savings Goals ---
    await prisma.goal.createMany({
      data: [
        { userId: uid, name: "Emergency Fund", targetAmount: 500000, deadline: new Date(now.getFullYear() + 1, 5, 30), savedAmount: 185000 },
        { userId: uid, name: "MacBook Pro", targetAmount: 900000, deadline: new Date(now.getFullYear(), now.getMonth() + 4, 1), savedAmount: 360000 },
        { userId: uid, name: "Vacation — Dubai Trip", targetAmount: 750000, deadline: new Date(now.getFullYear() + 1, 2, 15), savedAmount: 120000 },
      ],
    });

    const token = createToken(uid);
    res.json({ message: "Demo account ready with 3 months of data", email: testEmail, password: testPassword, token });
  } catch (err) {
    res.status(500).json({ message: "Seed failed", error: (err as Error).message });
  }
});

// Budget routes
const budgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  category: z.string().min(1),
  limit: z.number().int().nonnegative(),
});

app.get("/api/budgets", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { month, year } = req.query;
  const monthNum = month ? Number(month) : undefined;
  const yearNum = year ? Number(year) : undefined;
  const budgetList = await prisma.budget.findMany({
    where: {
      userId: req.userId!,
      ...(monthNum ? { month: monthNum } : {}),
      ...(yearNum ? { year: yearNum } : {}),
    },
  });
  res.json({ budgets: budgetList });
});

app.post("/api/budgets", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const data = parsed.data;
  const budget = await prisma.budget.upsert({
    where: {
      userId_month_year_category: {
        userId: req.userId!,
        month: data.month,
        year: data.year,
        category: data.category,
      },
    },
    update: { limit: data.limit },
    create: { ...data, userId: req.userId! },
  });
  res.status(201).json({ budget });
});

app.put("/api/budgets/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = budgetSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const id = String(req.params.id);
  const data = parsed.data;
  try {
    const budget = await prisma.budget.update({
      where: { id },
      data: {
        ...(data.month !== undefined ? { month: data.month } : {}),
        ...(data.year !== undefined ? { year: data.year } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.limit !== undefined ? { limit: data.limit } : {}),
      },
    });
    res.json({ budget });
  } catch {
    res.status(404).json({ message: "Budget not found" });
  }
});

app.delete("/api/budgets/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.budget.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: "Budget not found" });
  }
});

// Expense routes
const expenseSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string().datetime(),
  note: z.string().optional(),
  recurring: z.boolean().optional(),
});

app.get("/api/expenses", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { from, to, category } = req.query;
  const where: Record<string, unknown> = { userId: req.userId! };
  if (category && typeof category === "string") {
    where.category = category;
  }
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(String(from)) } : {}),
      ...(to ? { lte: new Date(String(to)) } : {}),
    };
  }
  const result = await prisma.expense.findMany({ where, orderBy: { date: "desc" } });
  res.json({ expenses: result });
});

app.post("/api/expenses", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const data = parsed.data;
  const expense = await prisma.expense.create({
    data: {
      userId: req.userId!,
      title: data.title,
      amount: data.amount,
      category: data.category,
      date: new Date(data.date),
      note: data.note ?? null,
      recurring: data.recurring ?? false,
    },
  });
  res.status(201).json({ expense });
});

app.put("/api/expenses/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = expenseSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const id = String(req.params.id);
  const data = parsed.data;
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
        ...(Object.prototype.hasOwnProperty.call(data, "note") ? { note: data.note ?? null } : {}),
        ...(data.recurring !== undefined ? { recurring: data.recurring } : {}),
      },
    });
    res.json({ expense });
  } catch {
    res.status(404).json({ message: "Expense not found" });
  }
});

app.delete("/api/expenses/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.expense.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: "Expense not found" });
  }
});

// Goals
const goalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().int().positive(),
  deadline: z.string().datetime(),
  savedAmount: z.number().int().nonnegative().optional(),
});

app.get("/api/goals", authMiddleware, async (req: AuthRequest, res: Response) => {
  const dbGoals = await prisma.goal.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  res.json({ goals: dbGoals });
});

app.post("/api/goals", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const data = parsed.data;
  const goal = await prisma.goal.create({
    data: {
      userId: req.userId!,
      name: data.name,
      targetAmount: data.targetAmount,
      deadline: new Date(data.deadline),
      savedAmount: data.savedAmount ?? 0,
    },
  });
  res.status(201).json({ goal });
});

app.put("/api/goals/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = goalSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const id = String(req.params.id);
  const data = parsed.data;
  try {
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.targetAmount !== undefined ? { targetAmount: data.targetAmount } : {}),
        ...(data.deadline !== undefined ? { deadline: new Date(data.deadline) } : {}),
        ...(data.savedAmount !== undefined ? { savedAmount: data.savedAmount } : {}),
      },
    });
    res.json({ goal });
  } catch {
    res.status(404).json({ message: "Goal not found" });
  }
});

app.delete("/api/goals/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.goal.delete({ where: { id } });
    res.json({ message: "Goal deleted" });
  } catch {
    res.status(404).json({ message: "Goal not found" });
  }
});

// Income + summary
const incomeSchema = z.object({
  title: z.string().min(1).max(100),
  amount: z.number().int().positive(),
  source: z.enum(["Salary", "Freelance", "Investment", "Gift", "Business", "Other"]),
  date: z.string().datetime(),
  notes: z.string().optional(),
});

app.get("/api/income", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { from, to, source } = req.query;
  const where: Record<string, unknown> = { userId: req.userId! };
  if (source && typeof source === "string") {
    where.source = source;
  }
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(String(from)) } : {}),
      ...(to ? { lte: new Date(String(to)) } : {}),
    };
  }
  const result = await prisma.income.findMany({ where, orderBy: { date: "desc" } });
  res.json({ income: result });
});

app.post("/api/income", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = incomeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const data = parsed.data;
  const incomeRecord = await prisma.income.create({
    data: {
      userId: req.userId!,
      title: data.title,
      amount: data.amount,
      source: data.source,
      date: new Date(data.date),
      notes: data.notes ?? null,
    },
  });
  res.status(201).json({ income: incomeRecord });
});

app.put("/api/income/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = incomeSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const id = String(req.params.id);
  const data = parsed.data;
  try {
    const incomeRecord = await prisma.income.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
        ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
        ...(Object.prototype.hasOwnProperty.call(data, "notes") ? { notes: data.notes ?? null } : {}),
      },
    });
    res.json({ income: incomeRecord });
  } catch {
    res.status(404).json({ message: "Income record not found" });
  }
});

app.delete("/api/income/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.income.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: "Income record not found" });
  }
});

app.get("/api/summary", authMiddleware, async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();

  const [incomeRecords, expenseGroups, budgets] = await Promise.all([
    prisma.income.findMany({
      where: {
        userId: req.userId!,
        date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
      },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
      where: {
        userId: req.userId!,
        date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
      },
    }),
    prisma.budget.findMany({ where: { userId: req.userId!, month, year } }),
  ]);

  const totalIncome = incomeRecords.reduce((sum: number, inc: { amount: number }) => sum + inc.amount, 0);
  const totalExpenses = expenseGroups.reduce(
    (sum: number, e: { _sum: { amount: number | null }; category: string }) => sum + (e._sum.amount ?? 0),
    0,
  );
  const netBalance = totalIncome - totalExpenses;

  const categories = expenseGroups.map((e: { category: string; _sum: { amount: number | null } }) => ({
    category: e.category,
    spent: e._sum.amount ?? 0,
    budget: budgets.find((b: { category: string; limit: number }) => b.category === e.category)?.limit ?? 0,
  }));

  res.json({ month, year, totalIncome, totalExpenses, netBalance, categories });
});

// AI Insights endpoint — calls Claude with the user's financial snapshot
app.get("/api/insights", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ message: "AI insights not configured" });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [userExpenses, userIncome, userBudgets, userGoals, dbUser] = await Promise.all([
    prisma.expense.findMany({ where: { userId: req.userId!, date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } } }),
    prisma.income.findMany({ where: { userId: req.userId!, date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } } }),
    prisma.budget.findMany({ where: { userId: req.userId!, month, year } }),
    prisma.goal.findMany({ where: { userId: req.userId! } }),
    prisma.user.findUnique({ where: { id: req.userId! }, select: { persona: true } }),
  ]);
  const persona = dbUser?.persona ? String(dbUser.persona) : "YOUNG_PROFESSIONAL";

  const totalIncome = userIncome.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = userExpenses.reduce((s, e) => s + e.amount, 0);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const categoryBreakdown = userExpenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const budgetAlerts = userBudgets
    .map((b) => ({ category: b.category, limit: b.limit, spent: categoryBreakdown[b.category] ?? 0 }))
    .filter((b) => b.spent > 0);

  const goalsInfo = userGoals.map((g) => ({
    name: g.name,
    target: g.targetAmount,
    saved: g.savedAmount,
    progress: Math.round((g.savedAmount / g.targetAmount) * 100),
    deadline: g.deadline,
  }));

  const personaLabel = persona === "STUDENT" ? "student" : persona === "INVESTOR" ? "investor" : "young professional";

  const prompt = `You are a personal finance advisor. Analyze this user's financial data and provide exactly 4 concise, actionable insights tailored for a ${personaLabel}.

Financial Snapshot (Current Month):
- Total Income: ₦${totalIncome.toLocaleString()}
- Total Expenses: ₦${totalExpenses.toLocaleString()}
- Net Balance: ₦${(totalIncome - totalExpenses).toLocaleString()}
- Savings Rate: ${savingsRate}%

Spending by Category:
${Object.entries(categoryBreakdown).map(([cat, amt]) => `- ${cat}: ₦${amt.toLocaleString()}`).join("\n")}

Budget Performance:
${budgetAlerts.map((b) => `- ${b.category}: spent ₦${b.spent.toLocaleString()} of ₦${b.limit.toLocaleString()} limit (${Math.round((b.spent / b.limit) * 100)}%)`).join("\n")}

Savings Goals:
${goalsInfo.map((g) => `- ${g.name}: ${g.progress}% saved (₦${g.saved.toLocaleString()} / ₦${g.target.toLocaleString()})`).join("\n")}

Return a JSON array of exactly 4 insight objects. Each object must have:
- "title": short title (max 6 words)
- "message": actionable insight (max 25 words)
- "type": one of "success", "warning", "tip", "alert"
- "icon": a single relevant emoji

Respond with ONLY the JSON array, no other text.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    const insights = JSON.parse(jsonMatch[0]);
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ message: "AI insights unavailable", error: (err as Error).message });
  }
});

// Business (inventory/sales) module
app.use("/api/business", authMiddleware, businessRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({ name: "FinanceTracker API", status: "running", version: "1.0.0" });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
