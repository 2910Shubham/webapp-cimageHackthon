"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Keyboard,
  User,
  Building2,
  Clock,
  Scan,
  Hash,
} from "lucide-react";

type ScanResult =
  | { type: "success"; data: Record<string, unknown> }
  | { type: "error"; message: string; code?: number }
  | null;

export default function ManualEntryPage() {
  const [token, setToken] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || processing) return;

    setProcessing(true);
    setResult(null);

    try {
      const res = await fetch("/api/visits/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ type: "success", data });
      } else {
        setResult({
          type: "error",
          message: data.message || data.error || "Check-in failed",
          code: res.status,
        });
      }
    } catch {
      setResult({ type: "error", message: "Network error." });
    }
    setProcessing(false);
  };

  const handleCheckout = async () => {
    if (!token.trim() || processing) return;
    setProcessing(true);
    setResult(null);

    // First find the visit by token
    try {
      const res = await fetch("/api/visits/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();

      // If 409 means already checked in — we can do checkout
      if (res.status === 409 || data.error === "Already checked in") {
        // Now do checkout via the visitId approach
        // We need to search by token — use checkout-by-token endpoint or visitId
      }

      if (res.ok) {
        setResult({ type: "success", data });
      } else {
        // If already checked in, attempt checkout
        if (res.status === 409 && data.visitId) {
          const checkoutRes = await fetch("/api/visits/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitId: data.visitId }),
          });
          const checkoutData = await checkoutRes.json();
          if (checkoutRes.ok) {
            setResult({
              type: "success",
              data: { ...checkoutData, isCheckout: true },
            });
          } else {
            setResult({
              type: "error",
              message: checkoutData.message || "Checkout failed",
            });
          }
        } else {
          setResult({ type: "error", message: data.message || data.error, code: res.status });
        }
      }
    } catch {
      setResult({ type: "error", message: "Network error." });
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/guard/dashboard"
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-400" />
            Manual Entry
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {!result && (
          <>
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <p className="text-sm text-slate-400">
                  Enter the visitor&apos;s 6-digit OTP or QR token to check them in.
                </p>

                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter OTP or QR token..."
                    autoFocus
                    className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-2xl tracking-widest font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition text-center"
                    maxLength={36}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={!token.trim() || processing}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  Check In
                </button>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!token.trim() || processing}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <XCircle className="w-5 h-5" />
                  Check Out
                </button>
              </div>
            </form>

            {/* Quick numeric keypad hint */}
            <p className="text-xs text-center text-slate-600">
              For 6-digit OTP, use the numeric keypad
            </p>
          </>
        )}

        {/* Success */}
        {result?.type === "success" && (
          <div className="animate-in fade-in space-y-4">
            <div
              className={`text-center p-8 rounded-2xl border ${
                (result.data.isCheckout as boolean)
                  ? "bg-blue-500/10 border-blue-500/20"
                  : "bg-emerald-500/10 border-emerald-500/20"
              }`}
            >
              <div
                className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  (result.data.isCheckout as boolean)
                    ? "bg-blue-500/20"
                    : "bg-emerald-500/20"
                }`}
              >
                <CheckCircle2
                  className={`w-12 h-12 ${
                    (result.data.isCheckout as boolean) ? "text-blue-400" : "text-emerald-400"
                  }`}
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {(result.data.isCheckout as boolean) ? "Check-out Successful! 👋" : "Check-in Successful! ✅"}
              </h2>
              <p className="text-slate-400">
                {(result.data.message as string) || "Operation completed"}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Visitor</p>
                  <p className="text-white font-medium">
                    {result.data.visitorName as string}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Host</p>
                  <p className="text-white font-medium">
                    {result.data.hostName as string}
                  </p>
                </div>
              </div>
              {(result.data.duration as string) && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="text-white font-medium">
                      {result.data.duration as string}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setToken("");
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-medium"
              >
                <Scan className="w-4 h-4" />
                Next Entry
              </button>
              <Link
                href="/guard/dashboard"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {result?.type === "error" && (
          <div className="animate-in fade-in space-y-4">
            <div className="text-center p-8 rounded-2xl bg-red-500/10 border border-red-500/20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                {result.code === 403 ? (
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-400" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {result.code === 403 ? "⛔ Access Denied" : "❌ Operation Failed"}
              </h2>
              <p className="text-red-300/80">{result.message}</p>
            </div>
            <button
              onClick={() => {
                setResult(null);
                setToken("");
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
