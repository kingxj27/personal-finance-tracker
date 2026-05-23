import { Link } from "react-router-dom";

const features = [
  {
    icon: "📊",
    title: "Real-time Dashboard",
    desc: "See your income, expenses, net balance, and savings rate at a glance — updated instantly.",
  },
  {
    icon: "🤖",
    title: "AI Financial Insights",
    desc: "Claude AI analyzes your spending patterns and gives you personalized, actionable advice.",
  },
  {
    icon: "🎯",
    title: "Smart Goal Tracking",
    desc: "Set savings goals and track progress with deadlines. Know exactly if you're on track.",
  },
  {
    icon: "💳",
    title: "Budget Management",
    desc: "Set monthly limits per category. Get alerted before you overspend.",
  },
  {
    icon: "📄",
    title: "PDF Monthly Reports",
    desc: "Download a professional financial summary any time — perfect for planning.",
  },
  {
    icon: "👤",
    title: "Persona-based Advice",
    desc: "Whether you're a student, professional, or investor — the app adapts to your financial stage.",
  },
];

const stats = [
  { value: "₦2.4M+", label: "Tracked Monthly" },
  { value: "6", label: "Spending Categories" },
  { value: "AI", label: "Powered Insights" },
  { value: "100%", label: "Private & Secure" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF6] via-white to-emerald-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
              <span className="text-lg font-bold text-white">💰</span>
            </div>
            <span className="text-lg font-bold text-slate-900">FinanceTracker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow hover:from-green-600 hover:to-emerald-700 transition"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs font-semibold text-green-700 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          AI-Powered Personal Finance
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-green-800 to-slate-900 leading-tight mb-6">
          Take Control of<br />Your Money
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
          Track every naira, set smart budgets, hit your savings goals, and get AI-powered insights
          — all in one beautiful dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/auth"
            state={{ demo: true }}
            className="px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 transition transform hover:scale-105"
          >
            Try Live Demo →
          </Link>
          <Link
            to="/auth"
            className="px-8 py-4 text-base font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-green-300 hover:text-green-700 transition"
          >
            Create Free Account
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">No credit card required • Demo pre-loaded with 3 months of data</p>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  {s.value}
                </p>
                <p className="text-sm text-slate-500 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need</h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Built for Nigerians who take their money seriously. Simple enough for daily use, powerful enough for real insights.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 group-hover:from-green-100 group-hover:to-emerald-200 text-2xl mb-4 transition">
                {f.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-12 text-center shadow-2xl">
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to get started?</h2>
          <p className="text-green-100 text-lg mb-8 max-w-lg mx-auto">
            Join thousands managing their money smarter. Try the live demo — no signup required.
          </p>
          <Link
            to="/auth"
            state={{ demo: true }}
            className="inline-block px-10 py-4 text-base font-bold text-green-700 bg-white rounded-xl shadow-lg hover:bg-green-50 transition transform hover:scale-105"
          >
            Launch Demo Dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8 text-center">
        <p className="text-sm text-slate-400">
          Built with React, TypeScript, Express & Claude AI •{" "}
          <Link to="/auth" className="text-green-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </footer>
    </div>
  );
}
