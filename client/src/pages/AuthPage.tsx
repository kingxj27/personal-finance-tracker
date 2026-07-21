import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

type Persona = "STUDENT" | "YOUNG_PROFESSIONAL" | "INVESTOR";

const PERSONAS: { value: Persona; label: string; icon: string; desc: string }[] = [
  { value: "STUDENT", label: "Student", icon: "🎓", desc: "Building financial habits on a budget" },
  { value: "YOUNG_PROFESSIONAL", label: "Professional", icon: "💼", desc: "Growing income, managing lifestyle" },
  { value: "INVESTOR", label: "Investor", icon: "📈", desc: "Building wealth and passive income" },
];

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [persona, setPersona] = useState<Persona>("YOUNG_PROFESSIONAL");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const demoTriggered = useRef(false);

  // If navigated from landing page "Try Demo", auto-trigger demo login.
  // Guarded against React StrictMode's dev-mode double-invoke, which would
  // otherwise fire two concurrent seed requests racing on the same unique user row.
  useEffect(() => {
    if ((location.state as any)?.demo && !demoTriggered.current) {
      demoTriggered.current = true;
      handleDemoLogin();
    }
  }, []);

  async function handleDemoLogin() {
    setDemoLoading(true);
    setError(null);
    try {
      // Seed rich demo data first, returns a token directly
      const seedRes = await fetch(`${API_BASE_URL}/api/auth/seed`, { method: "POST" });
      const seedData = await seedRes.json();
      if (seedData.token) {
        localStorage.setItem("token", seedData.token);
        localStorage.setItem("persona", "YOUNG_PROFESSIONAL");
        localStorage.setItem("email", "demo@example.com");
        navigate("/dashboard");
        return;
      }
      // Fallback: login with demo credentials
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@example.com", password: "demo@123" }),
      });
      const body = await res.json();
      if (body.token) {
        localStorage.setItem("token", body.token);
        localStorage.setItem("persona", "YOUNG_PROFESSIONAL");
        localStorage.setItem("email", "demo@example.com");
        navigate("/dashboard");
      } else {
        throw new Error(body.message || "Demo login failed");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { email, password };
      if (mode === "register") body.persona = persona;

      const res = await fetch(`${API_BASE_URL}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Authentication failed");
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("persona", data.persona ?? persona);
      localStorage.setItem("email", email);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-0">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-200/30 to-emerald-200/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-100/30 to-emerald-100/20 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-0">
        {/* Left — Branding */}
        <div className="hidden lg:flex flex-col justify-center px-12">
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg ring-4 ring-green-100">
              <span className="text-2xl font-bold text-white">💰</span>
            </div>
            <h1 className="mt-6 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-green-800 to-slate-900 leading-tight">
              Smart Money<br />Management
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Track expenses, set budgets, achieve goals, and get AI-powered insights — personalized for your financial stage.
            </p>
          </div>
          <div className="space-y-5">
            {[
              { icon: "🤖", title: "AI Financial Advisor", desc: "Claude AI analyzes your spending and gives tailored advice" },
              { icon: "📄", title: "PDF Monthly Reports", desc: "Download professional summaries of your finances" },
              { icon: "🎯", title: "Goal Tracking", desc: "Know exactly when you'll hit your savings targets" },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 group cursor-default">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 group-hover:from-green-200 group-hover:to-emerald-200 transition">
                  <span className="text-xl">{f.icon}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{f.title}</p>
                  <p className="text-sm text-slate-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="flex flex-col justify-center px-6 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-slate-600">
                {mode === "login" ? "Log in to your financial dashboard" : "Start your financial journey today"}
              </p>
            </div>

            {/* Try Demo Button */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="w-full mb-6 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {demoLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading demo...
                </>
              ) : (
                <>⚡ Try Live Demo (3 months of data pre-loaded)</>
              )}
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Mode Toggle */}
            <div className="mb-6 inline-flex rounded-full bg-gradient-to-r from-green-100 to-emerald-100 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`px-6 py-2.5 rounded-full font-semibold transition duration-300 ${mode === "login" ? "bg-white text-green-600 shadow-md" : "text-slate-600 hover:text-slate-900"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`px-6 py-2.5 rounded-full font-semibold transition duration-300 ${mode === "register" ? "bg-white text-green-600 shadow-md" : "text-slate-600 hover:text-slate-900"}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border-2 border-green-100 bg-white/50 text-slate-900 placeholder-slate-400 focus:border-green-500 focus:bg-white focus:outline-none transition font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border-2 border-green-100 bg-white/50 text-slate-900 placeholder-slate-400 focus:border-green-500 focus:bg-white focus:outline-none transition font-medium"
                />
              </div>

              {/* Persona picker — only on register */}
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-3">I am a...</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PERSONAS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPersona(p.value)}
                        className={`p-3 rounded-xl border-2 text-center transition ${
                          persona === p.value
                            ? "border-green-500 bg-green-50"
                            : "border-slate-200 bg-white hover:border-green-200"
                        }`}
                      >
                        <div className="text-xl mb-1">{p.icon}</div>
                        <div className="text-xs font-semibold text-slate-800">{p.label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {PERSONAS.find((p) => p.value === persona)?.desc}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 border-l-4 border-l-red-500">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : mode === "login" ? "Sign In →" : "Create Account →"}
              </button>

              <p className="text-center text-sm text-slate-600">
                {mode === "login" ? (
                  <>Don't have an account?{" "}<button type="button" onClick={() => setMode("register")} className="text-green-600 font-semibold hover:text-green-700 transition">Sign up here</button></>
                ) : (
                  <>Already have an account?{" "}<button type="button" onClick={() => setMode("login")} className="text-green-600 font-semibold hover:text-green-700 transition">Sign in here</button></>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
