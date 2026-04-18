"use client";

import { Mail, Lock } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginSchema } from "@/lib/validations";

type FormState = {
  email: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

type LoginFormProps = {
  googleEnabled: boolean;
  callbackUrl?: string;
  oauthError?: string;
};

export function LoginForm({
  googleEnabled,
  callbackUrl,
  oauthError,
}: LoginFormProps) {
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

    if (!result?.ok || result.error) {
      setFormError("Invalid email or password");
      return;
    }

    const nextUrl =
      callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

    window.location.assign(nextUrl);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  const activeError =
    formError || (oauthError ? "Unable to complete sign in. Please try again." : "");

  return (
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

      {activeError ? <p className="text-sm text-red-500">{activeError}</p> : null}

      <Button type="submit" fullWidth loading={loading}>
        Sign in
      </Button>

      {googleEnabled ? (
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
      ) : null}
    </form>
  );
}
