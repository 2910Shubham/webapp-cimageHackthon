import Link from "next/link";
import {
  Shield,
  QrCode,
  Clock,
  ArrowRight,
  Zap,
  Users,
  BarChart3,
} from "lucide-react";

export const metadata = {
  title: "Smart Campus Visitor Pass | Intelligent VMS",
  description:
    "Register in 30 seconds. Get your QR pass instantly. Secure, fast, and intelligent visitor management for smart campuses.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full backdrop-blur-sm">
          <Zap className="w-4 h-4" />
          Intelligent Visitor Management System
        </div>

        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          <span className="bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
            Smart Campus
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Visitor Pass
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-xl mb-10 leading-relaxed">
          Register in <span className="text-white font-semibold">30 seconds</span>.
          Get your <span className="text-indigo-300 font-semibold">QR pass instantly</span>.
          Secure entry powered by real-time intelligence.
        </p>

        {/* CTA Button */}
        <Link
          href="/register"
          id="cta-register"
          className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span>Register Your Visit</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity -z-10" />
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-8 mt-12 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>500+ Daily Visitors</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>99.9% Uptime</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Enterprise Security</span>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 — Instant QR Pass */}
          <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Instant QR Pass
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Register and receive your unique QR code with a 6-digit OTP
              instantly. Show it at the gate for seamless entry.
            </p>
          </div>

          {/* Card 2 — Secure Entry */}
          <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Secure Entry
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Blacklist screening, schedule validation, and full audit trail.
              Every entry and exit is logged and verified.
            </p>
          </div>

          {/* Card 3 — Real-time Updates */}
          <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 group-hover:scale-110 transition-transform">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Real-time Updates
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Track your visit status live. Get instant check-in confirmation,
              overstay alerts, and visit completion notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm text-slate-600 border-t border-white/5">
        <p>
          Smart Campus VMS • Powered by{" "}
          <span className="text-indigo-400">CIMAGE Group of Institutions</span>
        </p>
      </footer>
    </div>
  );
}
