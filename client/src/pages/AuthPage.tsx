import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Authentication failed");
      }
      const body = await res.json();
      localStorage.setItem("token", body.token);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 -z-10" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-200/30 to-emerald-200/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-100/30 to-emerald-100/20 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-0">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:flex flex-col justify-center px-12 origin-center">
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg ring-4 ring-green-100">
              <span className="text-2xl font-bold text-white">💰</span>
            </div>
            <h1 className="mt-6 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-green-800 to-slate-900 leading-tight">
              Smart Money<br />Management
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Take control of your finances with our intuitive platform. Track expenses, set budgets, and achieve your financial goals.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-5">
            {[
              { icon: "📊", title: "Real-time Analytics", desc: "Monitor your spending instantly" },
              { icon: "🎯", title: "Smart Goals", desc: "Set and achieve financial targets" },
              { icon: "💳", title: "Budget Planning", desc: "Control your expenses effectively" },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4 group cursor-default">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 group-hover:from-green-200 group-hover:to-emerald-200 transition duration-300">
                    <span className="text-xl">{feature.icon}</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{feature.title}</p>
                  <p className="text-sm text-slate-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex flex-col justify-center px-6 lg:px-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-slate-600">
                {mode === "login"
                  ? "Log in to access your financial dashboard"
                  : "Start your financial journey today"}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="mb-8 inline-flex rounded-full bg-gradient-to-r from-green-100 to-emerald-100 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-6 py-2.5 rounded-full font-semibold transition duration-300 ${
                  mode === "login"
                    ? "bg-white text-green-600 shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`px-6 py-2.5 rounded-full font-semibold transition duration-300 ${
                  mode === "register"
                    ? "bg-white text-green-600 shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border-2 border-green-100 bg-white/50 text-slate-900 placeholder-slate-500 focus:border-green-500 focus:bg-white focus:outline-none transition duration-300 font-medium"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border-2 border-green-100 bg-white/50 text-slate-900 placeholder-slate-500 focus:border-green-500 focus:bg-white focus:outline-none transition duration-300 font-medium"
                />
                <p className="mt-2 text-xs text-slate-500">
                  {mode === "register" ? "At least 6 characters" : "Enter your password"}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 border-l-4 border-l-red-500">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : mode === "login" ? (
                  "Sign In →"
                ) : (
                  "Create Account →"
                )}
              </button>

              {/* Footer Text */}
              <p className="text-center text-sm text-slate-600">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-green-600 font-semibold hover:text-green-700 transition"
                    >
                      Sign up here
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-green-600 font-semibold hover:text-green-700 transition"
                    >
                      Sign in here
                    </button>
                  </>
                )}
              </p>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
              <p className="text-xs font-semibold text-slate-700 mb-2">Demo Credentials:</p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Email:</span> demo@example.com
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-medium">Password:</span> demo@123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

