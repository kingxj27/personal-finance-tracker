import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prismaClient";

// simple random id generator for in-memory users when prisma is unavailable
function cryptoRandomId() {
  return [...Array(16)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

app.use(cors());
app.use(express.json());

type AuthRequest = Request & { userId?: string };

function createToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Auth routes ---------------------------------------------------------------
// On platforms where Prisma cannot connect (e.g. missing adapter or DB unavailable),
// fall back to a simple in-memory store so login/register still work during dev.

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const users: Array<{ id: string; email: string; password: string; createdAt: Date }> = [];

// In-memory expense store for when Prisma is unavailable
const expenses: Array<{
  id: string;
  userId: string;
  title?: string;
  amount: number;
  category: string;
  date: Date;
  note: string | null;
  recurring?: boolean;
}> = [];

// In-memory income store for when Prisma is unavailable
const income: Array<{
  id: string;
  userId: string;
  title: string;
  amount: number;
  source: string;
  date: Date;
  notes?: string | null;
  createdAt: Date;
}> = [];

// In-memory budget store for when Prisma is unavailable
const budgets: Array<{
  id: string;
  userId: string;
  month: number;
  year: number;
  category: string;
  limit: number;
}> = [];

// In-memory goals store for when Prisma is unavailable
const goals: Array<{
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  deadline: Date;
  savedAmount: number;
  createdAt: Date;
}> = [];

async function findUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    // if prisma fails (no adapter, connection refused), search in memory
    return users.find((u) => u.email === email) || null;
  }
}
async function createUser(email: string, hashed: string) {
  try {
    const user = await prisma.user.create({ data: { email, password: hashed } });
    return user;
  } catch (e) {
    const u = { id: cryptoRandomId(), email, password: hashed, createdAt: new Date() };
    users.push(u);
    return u;
  }
}
async function getUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, createdAt: true },
    });
  } catch (e) {
    return users.find((u) => u.id === id) || null;
  }
}

app.post("/api/auth/register", async (req: Request, res: Response) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;
  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser(email, hashed);
  const token = createToken(user.id);
  return res.status(201).json({ token });
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);
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
  const user = await getUserById(req.userId!);
  return res.json({ user });
});

// Seed test user for development
app.post("/api/auth/seed", async (req: Request, res: Response) => {
  const testEmail = "demo@example.com";
  const testPassword = "demo@123";
  
  try {
    const existing = await findUserByEmail(testEmail);
    if (existing) {
      return res.json({ message: "Demo user already exists", email: testEmail, password: testPassword });
    }
    
    const hashed = await bcrypt.hash(testPassword, 10);
    const user = await createUser(testEmail, hashed);
    res.json({ 
      message: "Demo user created", 
      email: testEmail, 
      password: testPassword,
      token: createToken(user.id)
    });
  } catch (err) {
    res.json({ message: "Could not create demo user", error: (err as Error).message });
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
  try {
    const budgetList = await prisma.budget.findMany({
      where: {
        userId: req.userId!,
        ...(monthNum ? { month: monthNum } : {}),
        ...(yearNum ? { year: yearNum } : {}),
      },
    });
    res.json({ budgets: budgetList });
  } catch (err) {
    // Fallback to in-memory store
    let result = budgets.filter((b) => b.userId === req.userId!);
    if (monthNum !== undefined) {
      result = result.filter((b) => b.month === monthNum);
    }
    if (yearNum !== undefined) {
      result = result.filter((b) => b.year === yearNum);
    }
    res.json({ budgets: result });
  }
});

app.post("/api/budgets", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const data = parsed.data;
  try {
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
  } catch (err) {
    // Fallback to in-memory store
    const existingIdx = budgets.findIndex(
      (b) =>
        b.userId === req.userId! &&
        b.month === data.month &&
        b.year === data.year &&
        b.category === data.category,
    );
    if (existingIdx !== -1) {
      const updated = budgets[existingIdx]!;
      updated.limit = data.limit;
      res.status(201).json({ budget: updated });
    } else {
      const budget = {
        id: cryptoRandomId(),
        userId: req.userId!,
        ...data,
      };
      budgets.push(budget);
      res.status(201).json({ budget });
    }
  }
});

app.put(
  "/api/budgets/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
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
    } catch (err) {
      // Fallback to in-memory store
      const idx = budgets.findIndex((b) => b.id === id);
      if (idx === -1) {
        return res.status(404).json({ message: "Budget not found" });
      }
      const budget = budgets[idx]!;
      if (data.month !== undefined) budget.month = data.month;
      if (data.year !== undefined) budget.year = data.year;
      if (data.category !== undefined) budget.category = data.category;
      if (data.limit !== undefined) budget.limit = data.limit;
      res.json({ budget });
    }
  },
);

app.delete(
  "/api/budgets/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    try {
      await prisma.budget.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      // Fallback to in-memory store
      const idx = budgets.findIndex((b) => b.id === id);
      if (idx === -1) {
        return res.status(404).json({ message: "Budget not found" });
      }
      budgets.splice(idx, 1);
      res.status(204).send();
    }
  },
);

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
  try {
    const result = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });
    res.json({ expenses: result });
  } catch (err) {
    // Fallback to in-memory store
    let result = expenses.filter((e) => e.userId === req.userId!);
    if (category && typeof category === "string") {
      result = result.filter((e) => e.category === category);
    }
    if (from || to) {
      const fromDate = from ? new Date(String(from)) : null;
      const toDate = to ? new Date(String(to)) : null;
      result = result.filter((e) => {
        if (fromDate && e.date < fromDate) return false;
        if (toDate && e.date > toDate) return false;
        return true;
      });
    }
    result.sort((a, b) => b.date.getTime() - a.date.getTime());
    res.json({ expenses: result });
  }
});

app.post("/api/expenses", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const data = parsed.data;
  try {
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
  } catch (err) {
    // Fallback to in-memory store
    const expense = {
      id: cryptoRandomId(),
      userId: req.userId!,
      title: data.title,
      amount: data.amount,
      category: data.category,
      date: new Date(data.date),
      note: data.note ?? null,
      recurring: data.recurring ?? false,
    };
    expenses.push(expense);
    res.status(201).json({ expense });
  }
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
        ...(Object.prototype.hasOwnProperty.call(data, "note")
          ? { note: data.note ?? null }
          : {}),
        ...(data.recurring !== undefined ? { recurring: data.recurring } : {}),
      },
    });
    res.json({ expense });
  } catch (err) {
    // Fallback to in-memory store
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Expense not found" });
    }
    const exp = expenses[idx]!;
    if (data.title !== undefined) exp.title = data.title;
    if (data.amount !== undefined) exp.amount = data.amount;
    if (data.category !== undefined) exp.category = data.category;
    if (data.date !== undefined) exp.date = new Date(data.date);
    if (Object.prototype.hasOwnProperty.call(data, "note"))
      exp.note = data.note ?? null;
    if (data.recurring !== undefined) exp.recurring = data.recurring;
    res.json({ expense: exp });
  }
});

app.delete("/api/expenses/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.expense.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    // Fallback to in-memory store
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Expense not found" });
    }
    expenses.splice(idx, 1);
    res.status(204).send();
  }
});

// Goals

// Goals
const goalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().int().positive(),
  deadline: z.string().datetime(),
  savedAmount: z.number().int().nonnegative().optional(),
});

app.get("/api/goals", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dbGoals = await prisma.goal.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
    });
    res.json({ goals: dbGoals });
  } catch {
    // Fallback to in-memory store
    const memGoals = goals
      .filter((g) => g.userId === req.userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    res.json({ goals: memGoals });
  }
});

app.post("/api/goals", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const data = parsed.data;
  try {
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
  } catch {
    // Fallback to in-memory store
    const id = cryptoRandomId();
    const newGoal = {
      id,
      userId: req.userId!,
      name: data.name,
      targetAmount: data.targetAmount,
      deadline: new Date(data.deadline),
      savedAmount: data.savedAmount ?? 0,
      createdAt: new Date(),
    };
    goals.push(newGoal);
    res.status(201).json({ goal: newGoal });
  }
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
    // Fallback to in-memory store
    const goalIndex = goals.findIndex((g) => g.id === id && g.userId === req.userId);
    if (goalIndex === -1) {
      return res.status(404).json({ message: "Goal not found" });
    }
    const goal = goals[goalIndex]!;
    if (data.name !== undefined) goal.name = data.name;
    if (data.targetAmount !== undefined) goal.targetAmount = data.targetAmount;
    if (data.deadline !== undefined) goal.deadline = new Date(data.deadline);
    if (data.savedAmount !== undefined) goal.savedAmount = data.savedAmount;
    res.json({ goal });
  }
});

app.delete("/api/goals/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.goal.delete({ where: { id } });
    res.json({ message: "Goal deleted" });
  } catch {
    // Fallback to in-memory store
    const index = goals.findIndex((g) => g.id === id && g.userId === req.userId);
    if (index === -1) {
      return res.status(404).json({ message: "Goal not found" });
    }
    goals.splice(index, 1);
    res.json({ message: "Goal deleted" });
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
  try {
    const result = await prisma.income.findMany({
      where: {
        userId: req.userId!,
      },
      orderBy: { date: "desc" },
    });
    res.json({ income: result });
  } catch (err) {
    // Fallback to in-memory store
    let result = income.filter((inc) => inc.userId === req.userId!);
    if (source && typeof source === "string") {
      result = result.filter((inc) => inc.source === source);
    }
    if (from || to) {
      const fromDate = from ? new Date(String(from)) : null;
      const toDate = to ? new Date(String(to)) : null;
      result = result.filter((inc) => {
        if (fromDate && inc.date < fromDate) return false;
        if (toDate && inc.date > toDate) return false;
        return true;
      });
    }
    result.sort((a, b) => b.date.getTime() - a.date.getTime());
    res.json({ income: result });
  }
});

app.post("/api/income", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = incomeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const data = parsed.data;
  try {
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
  } catch (err) {
    // Fallback to in-memory store
    const incomeRecord = {
      id: cryptoRandomId(),
      userId: req.userId!,
      title: data.title,
      amount: data.amount,
      source: data.source,
      date: new Date(data.date),
      notes: data.notes ?? null,
      createdAt: new Date(),
    };
    income.push(incomeRecord);
    res.status(201).json({ income: incomeRecord });
  }
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
  } catch (err) {
    // Fallback to in-memory store
    const idx = income.findIndex((inc) => inc.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Income record not found" });
    }
    const inc = income[idx]!;
    if (data.title !== undefined) inc.title = data.title;
    if (data.amount !== undefined) inc.amount = data.amount;
    if (data.source !== undefined) inc.source = data.source;
    if (data.date !== undefined) inc.date = new Date(data.date);
    if (Object.prototype.hasOwnProperty.call(data, "notes")) inc.notes = data.notes ?? null;
    res.json({ income: inc });
  }
});

app.delete(
  "/api/income/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    try {
      await prisma.income.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      // Fallback to in-memory store
      const idx = income.findIndex((inc) => inc.id === id);
      if (idx === -1) {
        return res.status(404).json({ message: "Income record not found" });
      }
      income.splice(idx, 1);
      res.status(204).send();
    }
  }
);

app.get("/api/summary", authMiddleware, async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();

  try {
    const [incomeRecords, expenses, budgets] = await Promise.all([
      prisma.income.findMany({
        where: {
          userId: req.userId!,
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        _sum: { amount: true },
        where: {
          userId: req.userId!,
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      }),
      prisma.budget.findMany({
        where: { userId: req.userId!, month, year },
      }),
    ]);

    const totalIncome = incomeRecords.reduce(
      (sum: number, inc: { amount: number }) => sum + inc.amount,
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum: number, e: { _sum: { amount: number | null }; category: string }) =>
        sum + (e._sum.amount ?? 0),
      0,
    );
    const netBalance = totalIncome - totalExpenses;

    const categories = expenses.map((e: { category: string; _sum: { amount: number | null } }) => ({
      category: e.category,
      spent: e._sum.amount ?? 0,
      budget:
        budgets.find((b: { category: string; limit: number }) => b.category === e.category)
          ?.limit ?? 0,
    }));

    res.json({
      month,
      year,
      totalIncome,
      totalExpenses,
      netBalance,
      categories,
    });
  } catch (err) {
    // Fallback: use in-memory stores when Prisma is unavailable
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    
    // Get income for this month from in-memory store
    const userIncome = income.filter(
      (inc) => inc.userId === req.userId! && inc.date >= monthStart && inc.date < monthEnd
    );
    const totalIncome = userIncome.reduce((sum: number, inc: { amount: number }) => sum + inc.amount, 0);

    // Get expenses for this month from in-memory store
    const userExpenses = expenses.filter((e) => e.userId === req.userId! && e.date >= monthStart && e.date < monthEnd);

    // Group expenses by category
    const categoryMap: Record<string, number> = {};
    userExpenses.forEach((e) => {
      categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount;
    });

    const totalExpenses = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
    const netBalance = totalIncome - totalExpenses;

    const categories = Object.entries(categoryMap).map(([category, spent]) => ({
      category,
      spent,
      budget: 0,
    }));

    res.json({
      month,
      year,
      totalIncome,
      totalExpenses,
      netBalance,
      categories,
    });
  }
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

