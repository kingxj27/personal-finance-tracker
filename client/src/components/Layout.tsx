import { type ReactNode, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  CircleUser,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Store,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useCurrency, CURRENCIES } from "../contexts/CurrencyContext";

type LayoutProps = { children: ReactNode };

function getInitials() {
  const email = localStorage.getItem("email") ?? "";
  return email.length > 0 ? email[0]!.toUpperCase() : "U";
}

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/budgets",   label: "Budgets",   Icon: Wallet          },
  { to: "/income",    label: "Income",    Icon: TrendingUp      },
  { to: "/expenses",  label: "Expenses",  Icon: TrendingDown    },
  { to: "/goals",     label: "Goals",     Icon: Target          },
  { to: "/business/dashboard", label: "Business", Icon: Store   },
  { to: "/profile",   label: "Profile",   Icon: CircleUser      },
];

/* ── Currency Picker dropdown ── */
function CurrencyPicker() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20"
        title="Switch currency"
      >
        <span className="text-emerald-400">{currency.symbol}</span>
        <span>{currency.code}</span>
        <ChevronDown size={12} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#0D1117] shadow-2xl shadow-black/60 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Select Currency
            </p>
          </div>
          <div className="py-1 max-h-72 overflow-y-auto">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onMouseDown={() => { setCurrency(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  c.code === currency.code
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-7 text-center text-base font-bold leading-none">
                  {c.symbol}
                </span>
                <div>
                  <p className="text-xs font-semibold">{c.code}</p>
                  <p className="text-[10px] text-slate-500">{c.name}</p>
                </div>
                {c.code === currency.code && (
                  <Check size={13} className="ml-auto text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Theme Toggle ── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20"
    >
      {theme === "dark"
        ? <Sun size={15} strokeWidth={1.75} />
        : <Moon size={15} strokeWidth={1.75} />
      }
    </button>
  );
}

/* ── Layout ── */
export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = getInitials();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("persona");
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0D1117] transition-colors duration-300">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50">
        {/* Accent stripe */}
        <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500" />

        {/* Navbar */}
        <div className="bg-[#0D1117] shadow-[0_2px_24px_rgba(0,0,0,0.4)]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex h-[60px] items-center justify-between gap-6">

              {/* Brand */}
              <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-900/40 group-hover:shadow-emerald-700/60 transition-shadow duration-300">
                  <span className="text-sm font-black text-white tracking-tight">₦</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-white leading-none tracking-tight">
                    Finance<span className="text-emerald-400">Tracker</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase mt-0.5">
                    Smart Money
                  </p>
                </div>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
                {NAV_LINKS.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group ${
                        isActive
                          ? "text-white bg-white/10"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                        )}
                        <Icon
                          size={15}
                          strokeWidth={1.75}
                          className={
                            isActive
                              ? "text-emerald-400"
                              : "text-slate-500 group-hover:text-slate-300 transition-colors"
                          }
                        />
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              {/* Right controls */}
              <div className="flex items-center gap-2 shrink-0">
                <CurrencyPicker />
                <ThemeToggle />

                <div className="hidden md:block h-6 w-px bg-white/10" />

                {/* User pill */}
                <div className="hidden md:flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-700 text-white text-xs font-bold shadow-md shadow-emerald-900/30 ring-2 ring-white/10">
                    {initials}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-white leading-none">
                      {localStorage.getItem("persona") === "STUDENT"
                        ? "Student"
                        : localStorage.getItem("persona") === "INVESTOR"
                        ? "Investor"
                        : "Professional"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Personal Account</p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 border border-transparent hover:border-red-400/20"
                >
                  <LogOut size={14} strokeWidth={1.75} />
                  <span className="hidden lg:inline">Sign out</span>
                </button>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen((v) => !v)}
                  className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  {mobileOpen
                    ? <X size={20} strokeWidth={1.75} />
                    : <Menu size={20} strokeWidth={1.75} />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-white/10 bg-[#0D1117] px-4 pb-4 pt-3">
              {/* Mobile settings row */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                <span className="text-[11px] text-slate-500 font-medium">Currency:</span>
                <select
                  value={currency.code}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="text-xs bg-white/5 border border-white/10 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500/50"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#0D1117]">
                      {c.symbol} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={toggleTheme}
                  className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition"
                >
                  {theme === "dark"
                    ? <Sun size={13} strokeWidth={1.75} />
                    : <Moon size={13} strokeWidth={1.75} />
                  }
                  <span>{theme === "dark" ? "Light" : "Dark"}</span>
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "text-white bg-white/10 border border-white/10"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={16}
                          strokeWidth={1.75}
                          className={isActive ? "text-emerald-400" : "text-slate-500"}
                        />
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition mt-1"
                >
                  <LogOut size={16} strokeWidth={1.75} />
                  Sign out
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Page Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
