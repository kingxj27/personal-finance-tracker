import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, authHeaders } from "../api";
import { Layout } from "../components/Layout";

/* --- Types --- */
type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  deadline: string;
  savedAmount: number;
};

/* --- Helpers --- */
function formatNGN(amount: number) {
  return "₦" + Math.round(Math.max(0, amount)).toLocaleString();
}

/* --- UI Components --- */
function StatCard({
  title,
  value,
  subtitle,
  emoji,
  colorClasses = "from-white to-slate-50",
  borderClass = "border-slate-200",
}: {
  title: string;
  value: string;
  subtitle?: string;
  emoji?: string;
  colorClasses?: string;
  borderClass?: string;
}) {
  return (
    <div
      className={`rounded-xl border ${borderClass} bg-gradient-to-br ${colorClasses} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
      style={{
        boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.12)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {title}
          </p>
          <p className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-2 text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        {emoji && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md text-2xl">
            {emoji}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "on-track" | "behind" | "completed" | "overdue";
}) {
  const configs = {
    "on-track": {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "On Track",
    },
    behind: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Behind Schedule",
    },
    completed: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Completed",
    },
    overdue: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Overdue",
    },
  };

  const config = configs[status];

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

export function GoalsPage() {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState<number | "">("");
  const [deadline, setDeadline] = useState<string>(
    () =>
      new Date(new Date().setMonth(new Date().getMonth() + 3))
        .toISOString()
        .slice(0, 10)
  );
  const [savedAmount, setSavedAmount] = useState<number | "">("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<number | "">("");

  const token = localStorage.getItem("token");

  async function loadGoals() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/goals`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("Unable to load goals");
      const data = (await res.json()) as { goals: Goal[] };
      setGoals(data.goals);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      void loadGoals();
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || targetAmount === "") {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/goals`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          name,
          targetAmount: Number(targetAmount),
          deadline: new Date(deadline).toISOString(),
          savedAmount: savedAmount === "" ? 0 : Number(savedAmount),
        }),
      });

      if (!res.ok) throw new Error("Failed to create goal");
      await loadGoals();
      setName("");
      setTargetAmount("");
      setSavedAmount("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAddContribution(goalId: string, amount: number) {
    if (amount <= 0) return;

    setError(null);
    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const res = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({
          savedAmount: goal.savedAmount + amount,
        }),
      });

      if (!res.ok) throw new Error("Failed to add contribution");

      await loadGoals();
      setContributionGoalId(null);
      setContributionAmount("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteGoal(goalId: string) {
    if (!window.confirm("Delete this goal?")) return;

    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to delete goal");
      setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const getGoalStatus = (
    goal: Goal
  ): "on-track" | "behind" | "completed" | "overdue" => {
    const now = new Date();
    const deadlineDate = new Date(goal.deadline);
    const daysRemaining = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const completionPercent = (goal.savedAmount / goal.targetAmount) * 100;

    if (goal.savedAmount >= goal.targetAmount) return "completed";
    if (daysRemaining < 0) return "overdue";
    if (completionPercent >= 60 || daysRemaining > 30) return "on-track";
    return "behind";
  };

  const stats = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter((goal) => goal.savedAmount >= goal.targetAmount).length;
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSaved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const activeGoals = goals.filter((goal) => goal.savedAmount < goal.targetAmount);

    return { totalGoals, completedGoals, totalTarget, totalSaved, activeGoals };
  }, [goals]);

  const completedGoals = useMemo(() => {
    return goals.filter((goal) => goal.savedAmount >= goal.targetAmount);
  }, [goals]);

  const activeGoals = useMemo(() => {
    return goals.filter((goal) => goal.savedAmount < goal.targetAmount);
  }, [goals]);

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900">
              Goals Overview
            </h1>
            <p className="mt-2 text-slate-600 font-medium">
              Plan and track your savings targets with clear progress insights
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 border-l-4 border-l-red-500 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-3 rounded-lg px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Loading your goals...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Goals"
              value={stats.totalGoals.toString()}
              subtitle={`${stats.completedGoals} completed`}
              emoji="🎯"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
            <StatCard
              title="Total Target"
              value={formatNGN(stats.totalTarget)}
              subtitle={`${stats.activeGoals.length} active`}
              emoji="💰"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
            <StatCard
              title="Total Saved"
              value={formatNGN(stats.totalSaved)}
              subtitle={
                stats.totalTarget > 0
                  ? `${Math.round((stats.totalSaved / stats.totalTarget) * 100)}% of target`
                  : "No goals"
              }
              emoji="🏦"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
            <StatCard
              title="Completed"
              value={stats.completedGoals.toString()}
              subtitle={`${
                ((stats.completedGoals / stats.totalGoals) * 100 || 0).toFixed(0)
              }% completion rate`}
              emoji="✅"
              colorClasses="from-white to-slate-50"
              borderClass="border-slate-200"
            />
          </div>

          <div
            className="mb-8 rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Create Goal</h3>
              <p className="mt-1 text-sm text-slate-600">
                Set a new target and start tracking progress
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Goal Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Emergency Fund"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Target Amount (₦)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={targetAmount}
                    onChange={(e) =>
                      setTargetAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Enter target amount"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Current Savings (₦)</label>
                  <input
                    type="number"
                    min="0"
                    value={savedAmount}
                    onChange={(e) =>
                      setSavedAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Enter current savings"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Create Goal
              </button>
            </form>
          </div>

          {activeGoals.length > 0 && (
            <div className="mb-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Active Goals</h3>
                <p className="mt-1 text-sm text-slate-600">Track ongoing targets and add contributions</p>
              </div>

              <div className="space-y-6">
                {activeGoals.map((goal) => {
                  const percent = (goal.savedAmount / goal.targetAmount) * 100;
                  const remaining = goal.targetAmount - goal.savedAmount;
                  const status = getGoalStatus(goal);
                  const deadlineDate = new Date(goal.deadline);
                  const daysRemaining = Math.ceil(
                    (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={goal.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
                      style={{
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div className="bg-white rounded-lg p-5 shadow-inner">
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-semibold text-slate-900">{goal.name}</h4>
                              <StatusBadge status={status} />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-xs text-slate-600 font-medium">Target Amount</p>
                              <p className="mt-1 text-xl font-bold text-slate-900">
                                {formatNGN(goal.targetAmount)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-600 font-medium">Saved</p>
                              <p className="mt-1 text-xl font-bold text-green-600">
                                {formatNGN(goal.savedAmount)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-600 font-medium">Remaining</p>
                              <p className="mt-1 text-xl font-bold text-orange-600">
                                {formatNGN(remaining)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-600 font-medium">Deadline</p>
                              <p className="mt-1 text-lg font-bold text-slate-900">
                                {deadlineDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              <p className="text-xs text-slate-600">
                                {daysRemaining > 0
                                  ? `${daysRemaining} days left`
                                  : daysRemaining === 0
                                  ? "Due today"
                                  : `${Math.abs(daysRemaining)} days overdue`}
                              </p>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700">Progress</span>
                              <span className="text-sm font-bold text-slate-900">
                                {Math.round(percent)}%
                              </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-300"
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          </div>

                          {contributionGoalId === goal.id ? (
                            <div className="flex flex-col md:flex-row gap-2">
                              <input
                                type="number"
                                min="0"
                                value={contributionAmount}
                                onChange={(e) =>
                                  setContributionAmount(
                                    e.target.value === "" ? "" : Number(e.target.value)
                                  )
                                }
                                placeholder="Amount"
                                className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                              />
                              <button
                                onClick={() => {
                                  if (contributionAmount !== "" && contributionAmount > 0) {
                                    void handleAddContribution(goal.id, Number(contributionAmount));
                                  }
                                }}
                                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setContributionGoalId(null);
                                  setContributionAmount("");
                                }}
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col md:flex-row gap-2">
                              <button
                                onClick={() => setContributionGoalId(goal.id)}
                                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                              >
                                ＋ Add Contribution
                              </button>
                              <button
                                onClick={() => void handleDeleteGoal(goal.id)}
                                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="mb-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Completed Goals</h3>
                <p className="mt-1 text-sm text-slate-600">Goals you have already achieved</p>
              </div>

              <div className="space-y-4">
                {completedGoals.map((goal) => {
                  const deadlineDate = new Date(goal.deadline);
                  return (
                    <div
                      key={goal.id}
                      className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-lg"
                      style={{
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{goal.name}</p>
                          <p className="mt-1 text-sm text-green-700 font-medium">
                            ✓ Goal achieved! {formatNGN(goal.savedAmount)} saved by{" "}
                            {deadlineDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <button
                          onClick={() => void handleDeleteGoal(goal.id)}
                          className="rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {goals.length === 0 && (
            <div
              className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-12 text-center shadow-lg"
              style={{
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
              }}
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 shadow-md text-3xl">
                  🎯
                </div>
              </div>
              <p className="font-semibold text-slate-900 text-lg">No goals yet</p>
              <p className="mt-2 text-slate-600">
                Create your first savings goal to start tracking progress
              </p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}


