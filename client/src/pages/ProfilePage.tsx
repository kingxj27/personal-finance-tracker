import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, authHeaders } from "../api";
import { Layout } from "../components/Layout";
import { X } from "lucide-react";

/* --- Types --- */
type UserProfile = {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  bio: string;
  currency: string;
  theme: "light" | "dark";
  notifications: {
    email: boolean;
    pushNotifications: boolean;
    sms: boolean;
  };
};

type AccountStats = {
  totalIncomeEntries: number;
  totalExpenseEntries: number;
  activeGoals: number;
  totalIncome: number;
  totalExpenses: number;
};

/* --- Defaults --- */
const defaultProfile: UserProfile = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  bio: "",
  currency: "NGN",
  theme: "light",
  notifications: {
    email: true,
    pushNotifications: true,
    sms: false,
  },
};

const defaultStats: AccountStats = {
  totalIncomeEntries: 0,
  totalExpenseEntries: 0,
  activeGoals: 0,
  totalIncome: 0,
  totalExpenses: 0,
};

/* --- UI Constants --- */
const CURRENCY_OPTIONS = [
  { code: "NGN", name: "Nigerian Naira (₦)" },
  { code: "USD", name: "US Dollar ($)" },
  { code: "EUR", name: "Euro (€)" },
  { code: "GBP", name: "British Pound (£)" },
];

function formatNGN(amount: number) {
  return "₦" + Math.round(Math.max(0, amount)).toLocaleString();
}

function StatCard({
  title,
  value,
  subtitle,
  emoji,
  colorClasses = "from-white to-slate-50",
  borderClass = "border-slate-200",
}: {
  title: string;
  value: string | number;
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

function Modal({
  isOpen,
  title,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        style={{
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [stats, setStats] = useState<AccountStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    bio: "",
  });

  const initials = useMemo(() => {
    if (!profile.fullName.trim()) return "U";
    return profile.fullName
      .trim()
      .split(" ")
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  }, [profile.fullName]);

  async function loadProfileData() {
    setLoading(true);
    setError(null);

    try {
      const [profileRes, incomeRes, expensesRes, goalsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/profile`, {
          headers: authHeaders(token),
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/income`, {
          headers: authHeaders(token),
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/expenses`, {
          headers: authHeaders(token),
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/goals`, {
          headers: authHeaders(token),
        }).catch(() => null),
      ]);

      let loadedProfile = defaultProfile;

      if (profileRes && profileRes.ok) {
        const profileData = await profileRes.json();
        loadedProfile = {
          ...defaultProfile,
          ...profileData.profile,
          notifications: {
            ...defaultProfile.notifications,
            ...(profileData.profile?.notifications || {}),
          },
        };
      }

      let incomeEntries: any[] = [];
      let expenseEntries: any[] = [];
      let goals: any[] = [];

      if (incomeRes && incomeRes.ok) {
        const incomeData = await incomeRes.json();
        incomeEntries = incomeData.income || [];
      }

      if (expensesRes && expensesRes.ok) {
        const expenseData = await expensesRes.json();
        expenseEntries = expenseData.expenses || [];
      }

      if (goalsRes && goalsRes.ok) {
        const goalsData = await goalsRes.json();
        goals = goalsData.goals || [];
      }

      const computedStats: AccountStats = {
        totalIncomeEntries: incomeEntries.length,
        totalExpenseEntries: expenseEntries.length,
        activeGoals: goals.filter((goal: any) => goal.savedAmount < goal.targetAmount).length,
        totalIncome: incomeEntries.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0),
        totalExpenses: expenseEntries.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0),
      };

      setProfile(loadedProfile);
      setEditFormData({
        fullName: loadedProfile.fullName,
        email: loadedProfile.email,
        phone: loadedProfile.phone,
        country: loadedProfile.country,
        bio: loadedProfile.bio,
      });
      setStats(computedStats);
    } catch (err) {
      setError((err as Error).message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      void loadProfileData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handlePersonalInfoChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePersonalInfo = async () => {
    setSaving(true);
    setError(null);

    const updatedProfile: UserProfile = {
      ...profile,
      ...editFormData,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(updatedProfile),
      });

      if (!res.ok) throw new Error("Failed to save profile");

      setProfile(updatedProfile);
      setIsEditingPersonal(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    const updatedProfile = { ...profile, currency: newCurrency };
    setProfile(updatedProfile);

    try {
      await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(updatedProfile),
      });
    } catch {
      // keep UI responsive even if endpoint is not ready
    }
  };

  const handleThemeChange = async (newTheme: "light" | "dark") => {
    const updatedProfile = { ...profile, theme: newTheme };
    setProfile(updatedProfile);

    try {
      await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(updatedProfile),
      });
    } catch {
      // keep UI responsive even if endpoint is not ready
    }
  };

  const handleNotificationChange = async (
    key: keyof typeof profile.notifications
  ) => {
    const updatedProfile = {
      ...profile,
      notifications: {
        ...profile.notifications,
        [key]: !profile.notifications[key],
      },
    };

    setProfile(updatedProfile);

    try {
      await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(updatedProfile),
      });
    } catch {
      // keep UI responsive even if endpoint is not ready
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/auth";
  };

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-green-800 to-slate-900">
              Profile Overview
            </h1>
            <p className="mt-2 text-slate-600 font-medium">
              Manage your account information and app preferences
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
            <p className="text-slate-600 font-medium">Loading your profile...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Income Entries"
              value={stats.totalIncomeEntries}
              subtitle={formatNGN(stats.totalIncome)}
              emoji="💰"
            />
            <StatCard
              title="Expense Entries"
              value={stats.totalExpenseEntries}
              subtitle={formatNGN(stats.totalExpenses)}
              emoji="💳"
            />
            <StatCard
              title="Active Goals"
              value={stats.activeGoals}
              subtitle="Goals in progress"
              emoji="🎯"
            />
            <StatCard
              title="Net Position"
              value={formatNGN(stats.totalIncome - stats.totalExpenses)}
              subtitle="Income minus expenses"
              emoji="📈"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div className="bg-white rounded-lg p-6 shadow-inner">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-3xl font-bold text-white shadow-md">
                      {initials}
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">
                      {profile.fullName || "Your Name"}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {profile.email || "your@email.com"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {profile.bio || "Add a short bio about yourself"}
                    </p>

                    <div className="mt-6 w-full space-y-3 border-t border-slate-200 pt-6">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">🌍</div>
                          <div className="text-left">
                            <p className="text-xs text-slate-500">Country</p>
                            <p className="font-semibold text-slate-900">
                              {profile.country || "Not set"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">📱</div>
                          <div className="text-left">
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="font-semibold text-slate-900">
                              {profile.phone || "Not set"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">💱</div>
                          <div className="text-left">
                            <p className="text-xs text-slate-500">Currency</p>
                            <p className="font-semibold text-slate-900">{profile.currency}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  🔐 Change Password
                </button>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  🚪 Logout
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Update your basic profile details
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingPersonal(!isEditingPersonal);
                      if (isEditingPersonal) {
                        setEditFormData({
                          fullName: profile.fullName,
                          email: profile.email,
                          phone: profile.phone,
                          country: profile.country,
                          bio: profile.bio,
                        });
                      }
                    }}
                    className="text-sm font-medium text-green-700 hover:text-green-800"
                  >
                    {isEditingPersonal ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-inner">
                  {isEditingPersonal ? (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-900">Full Name</label>
                        <input
                          type="text"
                          value={editFormData.fullName}
                          onChange={(e) => handlePersonalInfoChange("fullName", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-900">Email</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-900">Phone Number</label>
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-900">Country</label>
                        <input
                          type="text"
                          value={editFormData.country}
                          onChange={(e) => handlePersonalInfoChange("country", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-900">Bio</label>
                        <textarea
                          value={editFormData.bio}
                          onChange={(e) => handlePersonalInfoChange("bio", e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                        />
                      </div>

                      <button
                        onClick={handleSavePersonalInfo}
                        disabled={saving}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-500">Full Name</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {profile.fullName || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {profile.email || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Phone Number</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {profile.phone || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Country</p>
                          <p className="mt-1 font-medium text-slate-900">
                            {profile.country || "Not set"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Bio</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {profile.bio || "No bio added"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Finance Preferences</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Configure how financial values appear in your app
                  </p>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-inner">
                  <label className="block text-sm font-medium text-slate-700">
                    Preferred Currency
                  </label>
                  <select
                    value={profile.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  >
                    {CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">
                    Your currency preference will be applied across all financial displays
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">App Preferences</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Control your app theme and notification settings
                  </p>
                </div>

                <div className="bg-white rounded-lg p-5 shadow-inner space-y-6">
                  <div>
                    <p className="mb-3 text-sm font-medium text-slate-700">Theme</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleThemeChange("light")}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          profile.theme === "light"
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        ☀️ Light
                      </button>
                      <button
                        onClick={() => handleThemeChange("dark")}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          profile.theme === "dark"
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        🌙 Dark
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-4 text-sm font-medium text-slate-700">Notifications</p>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.notifications.email}
                          onChange={() => handleNotificationChange("email")}
                          className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-200"
                        />
                        <span className="text-sm font-medium text-slate-700">Email Notifications</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.notifications.pushNotifications}
                          onChange={() => handleNotificationChange("pushNotifications")}
                          className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-200"
                        />
                        <span className="text-sm font-medium text-slate-700">Push Notifications</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.notifications.sms}
                          onChange={() => handleNotificationChange("sms")}
                          className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-200"
                        />
                        <span className="text-sm font-medium text-slate-700">SMS Notifications</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={showPasswordModal}
        title="Change Password"
        onClose={() => setShowPasswordModal(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Update Password
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLogoutModal}
        title="Logout"
        onClose={() => setShowLogoutModal(false)}
      >
        <p className="mb-6 text-slate-600">
          Are you sure you want to logout from your account?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
