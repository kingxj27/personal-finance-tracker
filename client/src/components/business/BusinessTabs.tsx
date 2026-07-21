import { NavLink } from "react-router-dom";
import { LayoutDashboard, Boxes, Receipt, ShieldCheck, ClipboardList, Settings } from "lucide-react";

const TABS = [
  { to: "/business/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/business/inventory", label: "Inventory", Icon: Boxes },
  { to: "/business/sales", label: "Sales", Icon: Receipt },
  { to: "/business/approvals", label: "Approvals", Icon: ShieldCheck },
  { to: "/business/reports", label: "Weekly Report", Icon: ClipboardList },
  { to: "/business/locations", label: "Locations", Icon: Settings },
];

export function BusinessTabs() {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 border ${
              isActive
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white dark:bg-[#161B22] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`
          }
        >
          <Icon size={14} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </div>
  );
}
