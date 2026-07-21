import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { IncomePage } from "./pages/IncomePage";
import { GoalsPage } from "./pages/GoalsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { BusinessDashboardPage } from "./pages/business/BusinessDashboardPage";
import { InventoryPage } from "./pages/business/InventoryPage";
import { SalesPage } from "./pages/business/SalesPage";
import { ApprovalsPage } from "./pages/business/ApprovalsPage";
import { WeeklyReportPage } from "./pages/business/WeeklyReportPage";
import { LocationsSettingsPage } from "./pages/business/LocationsSettingsPage";

function RequireAuth({ children }: { children: ReactElement }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function App() {
  return (
    <ThemeProvider>
    <CurrencyProvider>
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/budgets"
          element={
            <RequireAuth>
              <BudgetsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/expenses"
          element={
            <RequireAuth>
              <ExpensesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/income"
          element={
            <RequireAuth>
              <IncomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/goals"
          element={
            <RequireAuth>
              <GoalsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/business/dashboard"
          element={
            <RequireAuth>
              <BusinessDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/business/inventory"
          element={
            <RequireAuth>
              <InventoryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/business/sales"
          element={
            <RequireAuth>
              <SalesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/business/approvals"
          element={
            <RequireAuth>
              <ApprovalsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/business/reports"
          element={
            <RequireAuth>
              <WeeklyReportPage />
            </RequireAuth>
          }
        />
        <Route
          path="/business/locations"
          element={
            <RequireAuth>
              <LocationsSettingsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
    </CurrencyProvider>
    </ThemeProvider>
  );
}

export default App;
