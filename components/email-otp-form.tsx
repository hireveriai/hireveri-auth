"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import AuthSubmitButton from "@/components/auth-submit-button";
import EmailField from "@/components/email-field";
import SocialAuthButtons from "@/components/social-auth-buttons";

export type AuthIntent = "recruiter_login" | "candidate_practice";

type EmailOtpFormProps = {
  intent: AuthIntent;
  /** Only used for copy and analytics — the OTP request is identical either
   *  way, because a first-time email creates its identity on verification. */
  mode: "login" | "signup";
  emailPlaceholder: string;
  cta: string;
  hint: string;
  invalidEmailMessage: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailOtpForm({
  intent,
  mode,
  emailPlaceholder,
  cta,
  hint,
  invalidEmailMessage,
}: EmailOtpFormProps) {
  const router = useRouter();
  const next = useSearchParams().get("next");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = email.trim();
  const isEmailValid = emailPattern.test(normalizedEmail);
  const errorId = `${intent}-${mode}-email-error`;
  const hintId = `${intent}-${mode}-email-hint`;

  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    if (loading) {
      return;
    }

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!isEmailValid) {
      setError(invalidEmailMessage);
      return;
    }

    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        intent,
      }),
    });

    let data: { error?: string; identityId?: string } | null = null;

    try {
      data = await res.json();
    } catch {
      setLoading(false);
      setError("Server error. Please try again.");
      return;
    }

    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Failed to send OTP");
      return;
    }

    if (!data?.identityId) {
      setError("Identity could not be created. Please try again.");
      return;
    }

    const verifyUrl = new URL("/verify-otp", window.location.origin);
    verifyUrl.searchParams.set("identityId", data.identityId);
    verifyUrl.searchParams.set("email", normalizedEmail);
    verifyUrl.searchParams.set("intent", intent);
    verifyUrl.searchParams.set("mode", mode);

    if (next) {
      verifyUrl.searchParams.set("next", next);
    }

    router.push(`${verifyUrl.pathname}${verifyUrl.search}`);
  }

  return (
    <>
      <SocialAuthButtons />

      <form onSubmit={handleSubmit} noValidate>
        <EmailField
          placeholder={emailPlaceholder}
          autoComplete="email"
          value={email}
          invalid={!!error}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) {
              setError(null);
            }
          }}
          aria-describedby={error ? errorId : hintId}
        />

        <p id={hintId} className="mt-2.5 text-xs text-ink-muted">
          {hint}
        </p>

        {error ? (
          <p id={errorId} role="alert" className="mt-3 text-sm text-signal-risk">
            {error}
          </p>
        ) : null}

        <div className="mt-6">
          <AuthSubmitButton
            disabled={!isEmailValid}
            loading={loading}
            loadingLabel="Sending code..."
          >
            {cta}
          </AuthSubmitButton>
        </div>
      </form>
    </>
  );
}
