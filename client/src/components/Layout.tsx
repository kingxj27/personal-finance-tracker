import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[#FDFBF6]">
      <header className="sticky top-0 z-50 bg-[#FFFDF7] shadow-[0_2px_10px_rgba(0,0,0,0.06)] border-b border-[#E8E4D8]">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex h-12 items-center justify-between">
            {/* Left Section - Logo */}
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                  <span className="text-lg font-bold text-white">💰</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm font-semibold text-slate-900">Personal Finance Tracker</h1>
                  <p className="text-[10px] text-slate-500"></p>
                </div>
              </Link>
            </div>

            {/* Center Section - Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200 rounded-lg ${
                    isActive
                      ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50"
                  }`
                }
              >
                <span className="text-base">📊</span>
                Dashboard
              </NavLink>
              <NavLink
                to="/budgets"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200 rounded-lg ${
                    isActive
                      ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50"
                  }`
                }
              >
                <span className="text-base">💳</span>
                Budgets
              </NavLink>
              <NavLink
                to="/income"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200 rounded-lg ${
                    isActive
                      ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50"
                  }`
                }
              >
                <span className="text-base">📈</span>
                Income
              </NavLink>
              <NavLink
                to="/expenses"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200 rounded-lg ${
                    isActive
                      ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50"
                  }`
                }
              >
                <span className="text-base">📉</span>
                Expenses
              </NavLink>
              <NavLink
                to="/goals"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200 rounded-lg ${
                    isActive
                      ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50"
                  }`
                }
              >
                <span className="text-base">🎯</span>
                Goals
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text- font-medium transition-all duration-200 rounded-lg ${
                    isActive
                      ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-emerald-50"
                  }`
                }
              >
                <span className="text-base">👤</span>
                Profile
              </NavLink>
            </nav>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-4">
              {/* Month Selector */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs text-slate-600">📅</span>
                <select className="text-xs font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer hover:text-slate-900 transition-colors">
                  <option>March 2026</option>
                  <option>February 2026</option>
                  <option>January 2026</option>
                </select>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200">
                <span className="text-lg">🔔</span>
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                  JD
                </div>
                <span className="hidden lg:block text-sm font-medium text-emerald-700">Nyong Charles</span>
              </div>

          
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-8 py-8 bg-transparent">{children}</main>
    </div>
  );
}

