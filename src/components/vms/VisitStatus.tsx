"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  PartyPopper,
  Clock,
  User,
  Building2,
  Calendar,
  Timer,
  Download,
  Phone,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface VisitData {
  visitId: string;
  status: string;
  visitorName: string;
  visitorEmail: string;
  hostName: string;
  hostDepartment: string;
  purpose: string;
  scheduledAt: string;
  expectedOut: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}

export default function VisitStatus({ visitId }: { visitId: string }) {
  const [visit, setVisit] = useState<VisitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [elapsedTime, setElapsedTime] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchVisit = useCallback(async () => {
    try {
      const res = await fetch(`/api/visitors/${visitId}/pass`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load visit");
        setLoading(false);
        return;
      }

      setVisit(data);
      setLoading(false);

      // Trigger confetti on checkout
      if (data.status === "CHECKED_OUT") {
        setShowConfetti(true);
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    fetchVisit();
    const pollInterval = setInterval(fetchVisit, 5000);
    return () => clearInterval(pollInterval);
  }, [fetchVisit]);

  // Live elapsed time clock
  useEffect(() => {
    if (!visit?.checkedInAt || visit.status === "CHECKED_OUT") return;

    const timer = setInterval(() => {
      const now = new Date();
      const checkedIn = new Date(visit.checkedInAt!);
      const diff = now.getTime() - checkedIn.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [visit]);

  const downloadReceipt = () => {
    if (!visit) return;
    const receipt = `
═══════════════════════════════════════
        SMART CAMPUS VISIT RECEIPT
═══════════════════════════════════════

Visitor:    ${visit.visitorName}
Host:       ${visit.hostName} (${visit.hostDepartment})
Purpose:    ${visit.purpose}
Date:       ${new Date(visit.scheduledAt).toLocaleDateString("en-IN")}

Check-in:   ${visit.checkedInAt ? new Date(visit.checkedInAt).toLocaleTimeString("en-IN") : "N/A"}
Check-out:  ${visit.checkedOutAt ? new Date(visit.checkedOutAt).toLocaleTimeString("en-IN") : "N/A"}

Duration:   ${getDuration()}

Status:     COMPLETED ✅

═══════════════════════════════════════
    Thank you for visiting!
    Smart Campus VMS • CIMAGE
═══════════════════════════════════════
    `.trim();

    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visit-receipt-${visitId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDuration = () => {
    if (!visit?.checkedInAt || !visit?.checkedOutAt) return "N/A";
    const diff = new Date(visit.checkedOutAt).getTime() - new Date(visit.checkedInAt).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours === 0) return `${minutes} min`;
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-4" />
        <p className="text-slate-400">Loading visit status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-white">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={() => { setError(""); setLoading(true); fetchVisit(); }}
          className="px-6 py-3 bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!visit) return null;

  return (
    <div className="w-full max-w-md">
      {/* Confetti CSS Effect */}
      {showConfetti && <ConfettiEffect />}

      {/* Back link */}
      <Link
        href={`/pass/${visitId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-400 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pass
      </Link>

      {/* Status Card */}
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
        {/* State A: CHECKED_IN */}
        {visit.status === "CHECKED_IN" && (
          <>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                You&apos;re Inside Campus
              </h1>
              <p className="text-green-100/80">Welcome! Have a great visit.</p>
            </div>

            {/* Live Timer */}
            <div className="px-6 py-6 text-center">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">
                Time Inside
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Timer className="w-6 h-6 text-green-400" />
                <span className="text-4xl font-mono font-bold text-white">
                  {elapsedTime || "00:00:00"}
                </span>
              </div>

              <div className="space-y-3">
                <DetailRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Checked In"
                  value={
                    visit.checkedInAt
                      ? new Date(visit.checkedInAt).toLocaleTimeString("en-IN")
                      : "—"
                  }
                />
                {visit.expectedOut && (
                  <DetailRow
                    icon={<Clock className="w-4 h-4" />}
                    label="Expected Out"
                    value={new Date(visit.expectedOut).toLocaleTimeString("en-IN")}
                  />
                )}
                <DetailRow
                  icon={<Building2 className="w-4 h-4" />}
                  label="Host"
                  value={`${visit.hostName} — ${visit.hostDepartment}`}
                />
              </div>
            </div>
          </>
        )}

        {/* State B: OVERSTAYED */}
        {visit.status === "OVERSTAYED" && (
          <>
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-white animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Overstay Alert
              </h1>
              <p className="text-amber-100/80">
                Please proceed to the exit gate
              </p>
            </div>

            <div className="px-6 py-6">
              {/* Warning Banner */}
              <div className="p-4 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-amber-200 font-medium">
                      Your expected checkout time has passed
                    </p>
                    <p className="text-xs text-amber-300/70 mt-1">
                      Expected out:{" "}
                      {visit.expectedOut
                        ? new Date(visit.expectedOut).toLocaleTimeString("en-IN")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Timer */}
              <div className="text-center mb-6">
                <p className="text-xs text-slate-500 mb-2">Time Inside</p>
                <span className="text-3xl font-mono font-bold text-amber-400">
                  {elapsedTime || "00:00:00"}
                </span>
              </div>

              <DetailRow
                icon={<Building2 className="w-4 h-4" />}
                label="Host"
                value={`${visit.hostName} — ${visit.hostDepartment}`}
              />

              {/* Contact Host */}
              <button
                onClick={() => window.open(`tel:`, "_self")}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all"
              >
                <Phone className="w-5 h-5" />
                Contact Host
              </button>
            </div>
          </>
        )}

        {/* State C: CHECKED_OUT */}
        {visit.status === "CHECKED_OUT" && (
          <>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <PartyPopper className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Visit Complete! 🎉
              </h1>
              <p className="text-indigo-100/80">
                Thank you for visiting our campus
              </p>
            </div>

            <div className="px-6 py-6 text-center">
              {/* Duration Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-3 mb-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <Timer className="w-5 h-5 text-indigo-400" />
                <span className="text-lg font-bold text-white">
                  {getDuration()}
                </span>
              </div>

              <div className="space-y-3 text-left">
                <DetailRow
                  icon={<User className="w-4 h-4" />}
                  label="Visitor"
                  value={visit.visitorName}
                />
                <DetailRow
                  icon={<Building2 className="w-4 h-4" />}
                  label="Host"
                  value={`${visit.hostName} — ${visit.hostDepartment}`}
                />
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Date"
                  value={new Date(visit.scheduledAt).toLocaleDateString("en-IN", {
                    dateStyle: "long",
                  })}
                />
                <DetailRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Check-in"
                  value={
                    visit.checkedInAt
                      ? new Date(visit.checkedInAt).toLocaleTimeString("en-IN")
                      : "—"
                  }
                />
                <DetailRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Check-out"
                  value={
                    visit.checkedOutAt
                      ? new Date(visit.checkedOutAt).toLocaleTimeString("en-IN")
                      : "—"
                  }
                />
              </div>

              {/* Download Receipt */}
              <button
                onClick={downloadReceipt}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                Download Receipt
              </button>
            </div>
          </>
        )}

        {/* Pending/Approved states redirect to pass page */}
        {(visit.status === "PENDING" || visit.status === "APPROVED") && (
          <div className="px-6 py-12 text-center">
            <Clock className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-bold text-white mb-2">
              Waiting for Check-in
            </h2>
            <p className="text-slate-400 mb-6">
              Your visit hasn&apos;t started yet.
            </p>
            <Link
              href={`/pass/${visitId}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              View Your Pass
            </Link>
          </div>
        )}
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

function ConfettiEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: [
                "#6366f1",
                "#a855f7",
                "#ec4899",
                "#f59e0b",
                "#10b981",
                "#3b82f6",
              ][Math.floor(Math.random() * 6)],
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
