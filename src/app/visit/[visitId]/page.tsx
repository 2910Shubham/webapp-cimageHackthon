import { Metadata } from "next";
import VisitStatus from "@/components/vms/VisitStatus";

export const metadata: Metadata = {
  title: "Visit Status | Smart Campus VMS",
  description: "Track your campus visit in real-time.",
};

export default async function VisitPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  const { visitId } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-8 sm:py-12">
        <VisitStatus visitId={visitId} />
      </div>
    </div>
  );
}
