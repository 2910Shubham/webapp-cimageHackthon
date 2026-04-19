"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  FileText,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Host {
  id: string;
  name: string;
  department: string;
  email: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  hostId: string;
  purpose: string;
  date: string;
  time: string;
  expectedDuration: number;
}

const PURPOSES = [
  "Project Discussion",
  "Campus Tour",
  "Interview",
  "Meeting",
  "Guest Lecture",
  "Document Submission",
  "Library Access",
  "Lab Visit",
  "Other",
];

const DURATIONS = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
  { label: "Half day (5h)", value: 300 },
  { label: "Full day (8h)", value: 480 },
];

const LOCAL_STORAGE_KEY = "vms-registration-form";

export default function RegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    hostId: "",
    purpose: "",
    date: "",
    time: "",
    expectedDuration: 120,
  });

  // Load saved form data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save form data to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // ignore
    }
  }, [formData]);

  // Fetch hosts for dropdown
  useEffect(() => {
    fetch("/api/hosts")
      .then((res) => res.json())
      .then((data) => setHosts(data.hosts || []))
      .catch(() => setHosts([]));
  }, []);

  const updateField = useCallback(
    (field: keyof FormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setError("");
    },
    []
  );

  // Validation
  const validateStep1 = (): boolean => {
    if (!formData.fullName || formData.fullName.length < 2) {
      setError("Please enter your full name (at least 2 characters)");
      return false;
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.phone || formData.phone.length < 10) {
      setError("Please enter a valid phone number (at least 10 digits)");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.hostId) {
      setError("Please select who you are visiting");
      return false;
    }
    if (!formData.purpose) {
      setError("Please select the purpose of your visit");
      return false;
    }
    if (!formData.date) {
      setError("Please select a date");
      return false;
    }
    if (!formData.time) {
      setError("Please select a time");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}:00`).toISOString();

      const res = await fetch("/api/visitors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          hostId: formData.hostId,
          purpose: formData.purpose,
          scheduledAt,
          expectedDuration: formData.expectedDuration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Clear saved form data
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      // Redirect to pass page
      router.push(`/pass/${data.visitId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const selectedHost = hosts.find((h) => h.id === formData.hostId);

  return (
    <div>
      {/* Progress Bar */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                s < step
                  ? "bg-green-500 text-white"
                  : s === step
                  ? "bg-indigo-500 text-white scale-110"
                  : "bg-white/10 text-slate-500"
              }`}
            >
              {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 sm:w-24 h-1 rounded-full transition-all duration-300 ${
                  s < step ? "bg-green-500" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-xs text-slate-500 mb-8 px-2">
        <span className={step >= 1 ? "text-indigo-400" : ""}>Personal Info</span>
        <span className={step >= 2 ? "text-indigo-400" : ""}>Visit Details</span>
        <span className={step >= 3 ? "text-indigo-400" : ""}>Review</span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Personal Details */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Personal Information
            </h2>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="input-fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="input-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="input-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+91-XXXXXXXXXX"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Visit Details */}
      {step === 2 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Visit Details
            </h2>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Who are you visiting?
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <select
                  id="input-hostId"
                  value={formData.hostId}
                  onChange={(e) => updateField("hostId", e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition appearance-none"
                >
                  <option value="" className="bg-slate-900">Select host...</option>
                  {hosts.map((host) => (
                    <option key={host.id} value={host.id} className="bg-slate-900">
                      {host.name} — {host.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Purpose of Visit</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <select
                  id="input-purpose"
                  value={formData.purpose}
                  onChange={(e) => updateField("purpose", e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition appearance-none"
                >
                  <option value="" className="bg-slate-900">Select purpose...</option>
                  {PURPOSES.map((p) => (
                    <option key={p} value={p} className="bg-slate-900">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="input-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="input-time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => updateField("time", e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Expected Duration
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <select
                  id="input-duration"
                  value={formData.expectedDuration}
                  onChange={(e) =>
                    updateField("expectedDuration", parseInt(e.target.value))
                  }
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition appearance-none"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value} className="bg-slate-900">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Review Your Details
            </h2>

            {/* Personal Info Review */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wider">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReviewItem label="Full Name" value={formData.fullName} />
                <ReviewItem label="Email" value={formData.email} />
                <ReviewItem label="Phone" value={formData.phone} />
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* Visit Details Review */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-purple-400 uppercase tracking-wider">
                Visit Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReviewItem
                  label="Visiting"
                  value={
                    selectedHost
                      ? `${selectedHost.name} (${selectedHost.department})`
                      : "—"
                  }
                />
                <ReviewItem label="Purpose" value={formData.purpose} />
                <ReviewItem label="Date" value={formData.date} />
                <ReviewItem label="Time" value={formData.time} />
                <ReviewItem
                  label="Duration"
                  value={
                    DURATIONS.find((d) => d.value === formData.expectedDuration)
                      ?.label || `${formData.expectedDuration}m`
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <button
            onClick={prevStep}
            className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            onClick={nextStep}
            id="btn-next-step"
            className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            id="btn-submit-registration"
            className="flex items-center gap-2 px-8 py-3 text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirm & Get Pass
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/5">
      <span className="text-xs text-slate-500 block mb-1">{label}</span>
      <span className="text-white font-medium">{value || "—"}</span>
    </div>
  );
}
