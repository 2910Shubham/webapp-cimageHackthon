"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginSchema } from "@/lib/validations";

type FormState = {
  email: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = loginSchema.safeParse(form);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;

      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setLoading(true);

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (!result || result.error || !result.ok) {
      setFormError("Invalid email or password");
      return;
    }

    const nextUrl = result.url ?? "/dashboard";

    router.replace(nextUrl);
    router.refresh();
    window.location.href = nextUrl;
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10 lg:px-8">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-500">
              Responsive Experience
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-gray-900">
              A mobile-first app that still feels right on desktop.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-500">
              Use the full browser width on larger screens, keep the native feel
              on smaller ones, and move navigation where it belongs for each
              device size.
            </p>
          </div>
        </section>

        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-600 lg:mx-0">
            <Sparkles size={28} />
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-violet-600">
              Hackathon App
            </h1>
            <p className="mt-2 text-sm text-gray-500">Welcome back</p>
          </div>

          <form
            className="space-y-4 rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm lg:p-8"
            onSubmit={handleSubmit}
          >
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              error={errors.email}
              icon={<Mail size={18} />}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              error={errors.password}
              icon={<Lock size={18} />}
            />

            {formError ? (
              <p className="text-sm text-red-500">{formError}</p>
            ) : null}

            <Button type="submit" fullWidth loading={loading}>
              Sign in
            </Button>
            <div className="hidden lg:block">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                loading={googleLoading}
                onClick={handleGoogleSignIn}
              >
                Continue with Google
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 lg:text-left">
            Don&apos;t have an account?{" "}
            <Link className="font-medium text-violet-600" href="/signup">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
