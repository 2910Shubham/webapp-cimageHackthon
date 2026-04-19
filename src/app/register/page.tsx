import { Metadata } from "next";
import RegistrationForm from "@/components/vms/RegistrationForm";

export const metadata: Metadata = {
  title: "Register Your Visit | Smart Campus VMS",
  description:
    "Fill in your details and get your QR visitor pass instantly. Fast, secure campus entry.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Register Your Visit
          </h1>
          <p className="text-slate-400">
            Fill in your details to get your QR pass
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-2xl">
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
}
