"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Clock,
  User,
  Building2,
  Calendar,
  FileText,
  RefreshCw,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Shield,
} from "lucide-react";

interface PassData {
  visitId: string;
  qrToken: string;
  qrDataUrl: string;
  otp: string;
  otpExpired: boolean;
  status: string;
  visitorName: string;
  visitorEmail: string;
  hostName: string;
  hostDepartment: string;
  purpose: string;
  scheduledAt: string;
  expectedOut: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}

const OTP_TTL_SECONDS = 300; // 5 minutes

export default function PassDisplay({ visitId }: { visitId: string }) {
  const router = useRouter();
  const [passData, setPassData] = useState<PassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(OTP_TTL_SECONDS);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch pass data
  const fetchPass = useCallback(async () => {
    try {
      const res = await fetch(`/api/visitors/${visitId}/pass`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load pass");
        setLoading(false);
        return;
      }

      setPassData(data);
      setLoading(false);

      // Reset countdown if OTP is not expired
      if (!data.otpExpired) {
        setCountdown(OTP_TTL_SECONDS);
      } else {
        setCountdown(0);
      }

      // Cache for offline
      try {
        localStorage.setItem(`vms-pass-${visitId}`, JSON.stringify(data));
      } catch {
        // ignore
      }

      // Redirect if checked in
      if (data.status === "CHECKED_IN" || data.status === "OVERSTAYED" || data.status === "CHECKED_OUT") {
        router.push(`/visit/${visitId}`);
      }
    } catch {
      // Try loading from cache
      try {
        const cached = localStorage.getItem(`vms-pass-${visitId}`);
        if (cached) {
          setPassData(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, [visitId, router]);

  useEffect(() => {
    fetchPass();
    // Poll every 10 seconds for status updates
    const pollInterval = setInterval(fetchPass, 10000);
    return () => clearInterval(pollInterval);
  }, [fetchPass]);

  // OTP countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const regenerateOTP = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/visitors/${visitId}/regenerate-otp`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setPassData((prev) =>
          prev ? { ...prev, otp: data.otp, otpExpired: false } : prev
        );
        setCountdown(OTP_TTL_SECONDS);
      }
    } catch {
      // ignore
    }
    setRegenerating(false);
  };

  const copyOTP = () => {
    if (passData?.otp) {
      navigator.clipboard.writeText(passData.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (!passData) return;
    const text = `🏫 Smart Campus Visit Pass\n\n👤 ${passData.visitorName}\n🏢 Host: ${passData.hostName}\n📅 ${new Date(passData.scheduledAt).toLocaleDateString("en-IN")}\n🔑 OTP: ${passData.otp}\n\nShow this at the campus gate.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-4" />
        <p className="text-slate-400">Loading your pass...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={() => { setError(""); setLoading(true); fetchPass(); }}
          className="px-6 py-3 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!passData) return null;

  return (
    <div className="w-full max-w-md">
      {/* Pass Card */}
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-white/80" />
            <span className="text-sm text-white/80 font-medium">Smart Campus</span>
          </div>
          <h1 className="text-xl font-bold text-white">Visitor Pass</h1>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center -mt-4">
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
              passData.status === "APPROVED"
                ? "bg-green-500 text-white"
                : passData.status === "PENDING"
                ? "bg-amber-500 text-white"
                : "bg-slate-500 text-white"
            }`}
          >
            {passData.status === "PENDING"
              ? "⏳ Awaiting Approval"
              : passData.status === "APPROVED"
              ? "✅ Approved"
              : passData.status}
          </span>
        </div>

        {/* QR Code */}
        <div className="px-6 py-6 flex flex-col items-center">
          <div className="p-4 bg-white rounded-2xl shadow-2xl shadow-indigo-500/20 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={passData.qrDataUrl}
              alt="QR Code"
              className="w-52 h-52"
              id="qr-code-image"
            />
          </div>

          <p className="text-xs text-slate-500 mb-6">
            Show this QR code at the campus gate
          </p>

          {/* OTP Section */}
          <div className="w-full p-4 rounded-2xl bg-white/5 border border-dashed border-indigo-500/30 text-center">
            <p className="text-xs text-slate-400 mb-2">Your One-Time Password</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl font-mono font-bold text-white tracking-[0.3em]" id="otp-display">
                {passData.otp}
              </span>
              <button
                onClick={copyOTP}
                className="p-2 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white"
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Countdown */}
            {countdown > 0 ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className={`font-mono ${countdown < 60 ? "text-red-400 animate-pulse" : "text-indigo-300"}`}>
                  Expires in {formatTime(countdown)}
                </span>
                <button
                  onClick={regenerateOTP}
                  disabled={regenerating}
                  title="Refresh OTP"
                  className="p-1.5 rounded-lg hover:bg-white/10 transition text-slate-500 hover:text-indigo-400 disabled:opacity-50"
                >
                  {regenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-center gap-2 text-red-400 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm font-medium">OTP has expired</p>
                </div>
                <button
                  onClick={regenerateOTP}
                  disabled={regenerating}
                  id="btn-regenerate-otp"
                  className="flex items-center gap-2 mx-auto px-6 py-3 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {regenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  {regenerating ? "Generating..." : "Get New OTP"}
                </button>
                <p className="text-xs text-slate-600 text-center">
                  A new OTP will be sent to your email
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="px-6">
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-dashed border-white/10" />
            <QrCode className="mx-3 w-5 h-5 text-slate-600" />
            <div className="flex-grow border-t border-dashed border-white/10" />
          </div>
        </div>

        {/* Visit Details */}
        <div className="px-6 py-5 space-y-3">
          <DetailRow
            icon={<User className="w-4 h-4" />}
            label="Visitor"
            value={passData.visitorName}
          />
          <DetailRow
            icon={<Building2 className="w-4 h-4" />}
            label="Host"
            value={`${passData.hostName} — ${passData.hostDepartment}`}
          />
          <DetailRow
            icon={<FileText className="w-4 h-4" />}
            label="Purpose"
            value={passData.purpose}
          />
          <DetailRow
            icon={<Calendar className="w-4 h-4" />}
            label="Scheduled"
            value={new Date(passData.scheduledAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
          {passData.expectedOut && (
            <DetailRow
              icon={<Clock className="w-4 h-4" />}
              label="Expected Out"
              value={new Date(passData.expectedOut).toLocaleString("en-IN", {
                timeStyle: "short",
              })}
            />
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          <button
            onClick={shareViaWhatsApp}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Share2 className="w-5 h-5" />
            Share via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div>
        <span className="text-xs text-slate-500 block">{label}</span>
        <span className="text-sm text-white">{value}</span>
      </div>
    </div>
  );
}
