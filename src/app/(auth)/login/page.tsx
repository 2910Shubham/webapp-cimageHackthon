import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { isGoogleAuthEnabled } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <AuthShell
      title="Hackathon App"
      subtitle="Welcome back"
      eyebrow="Responsive Experience"
      heroTitle="A mobile-first app that still feels right on desktop."
      heroDescription="Use the full browser width on larger screens, keep the native feel on smaller ones, and move navigation where it belongs for each device size."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link className="font-medium text-violet-600" href="/signup">
            Sign up
          </Link>
        </>
      }
    >
      <LoginForm
        googleEnabled={isGoogleAuthEnabled}
        callbackUrl={params.callbackUrl}
        oauthError={params.error}
      />
    </AuthShell>
  );
}
