"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Lock, Mail, Sparkles, User2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signupSchema } from "@/lib/validations";

type FormState = {
  name: string;
  email: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function SignupPage() {
  const { status } = useSession();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.replace("/dashboard");
    }
  }, [status]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = signupSchema.safeParse(form);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;

      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setLoading(true);

    const createResponse = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });

    if (!createResponse.ok) {
      const payload = (await createResponse.json()) as { error?: string };

      setLoading(false);
      setFormError(payload.error ?? "Unable to create your account");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (!signInResult || signInResult.error || !signInResult.ok) {
      setFormError("Account created, but automatic sign in failed");
      return;
    }

    window.location.assign(signInResult.url ?? "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10 lg:px-8">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-500">
              Build Once
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-gray-900">
              Create an account from any screen size without being stuck in phone view.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-500">
              The layout expands naturally on desktop while preserving a clean,
              focused experience on mobile and tablet.
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
            <p className="mt-2 text-sm text-gray-500">
              Create your account to get started
            </p>
          </div>

          <form
            className="space-y-4 rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm lg:p-8"
            onSubmit={handleSubmit}
          >
            <Input
              label="Name"
              name="name"
              autoComplete="name"
              placeholder="Your name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              error={errors.name}
              icon={<User2 size={18} />}
            />
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
              autoComplete="new-password"
              placeholder="Create a secure password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              error={errors.password}
              icon={<Lock size={18} />}
            />

            {formError ? (
              <p className="text-sm text-red-500">{formError}</p>
            ) : null}

            <Button type="submit" fullWidth loading={loading}>
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 lg:text-left">
            Already have an account?{" "}
            <Link className="font-medium text-violet-600" href="/login">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
