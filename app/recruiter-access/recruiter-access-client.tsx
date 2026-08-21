"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AuthShell from "@/components/auth-shell";
import AuthSubmitButton from "@/components/auth-submit-button";
import EmailField from "@/components/email-field";
import SocialAuthButtons from "@/components/social-auth-buttons";

type RecruiterIntent = "recruiter_login";

const UI = {
  badge: "RECRUITER ACCESS",
  title: "Log in to your Account",
  subtitle: "Welcome back! Select method to log in:",
  emailPlaceholder: "Work email address",
  cta: "Continue Securely and Verify",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecruiterAccessClient() {
  const router = useRouter();
  const intent: RecruiterIntent = "recruiter_login";
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Recruiter Login | HireVeri";

    sessionStorage.removeItem("hireveri_recruiter_email");
  }, []);

  const normalizedEmail = email.trim();
  const isEmailValid = emailPattern.test(normalizedEmail);

  async function handleContinue(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    if (loading) {
      return;
    }

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!isEmailValid) {
      setError("Enter a valid work email address.");
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

    if (next) {
      verifyUrl.searchParams.set("next", next);
    }

    router.push(`${verifyUrl.pathname}${verifyUrl.search}`);
  }

  return (
    <AuthShell
      badge={UI.badge}
      title={UI.title}
      subtitle={UI.subtitle}
      footer={
        <>
          Practising for an interview?{" "}
          <a
            href="/practice-access"
            className="font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Go to Practice Room
          </a>
        </>
      }
    >
      <SocialAuthButtons />

      <form onSubmit={handleContinue} noValidate>
        <EmailField
          placeholder={UI.emailPlaceholder}
          autoComplete="email"
          value={email}
          invalid={!!error}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) {
              setError(null);
            }
          }}
          aria-describedby={error ? "recruiter-email-error" : "recruiter-email-hint"}
        />

        <p id="recruiter-email-hint" className="mt-2.5 text-xs text-white/45">
          We&apos;ll send a 6-digit one-time verification code. No passwords.
        </p>

        {error ? (
          <p id="recruiter-email-error" className="mt-3 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <div className="mt-6">
          <AuthSubmitButton
            disabled={!isEmailValid}
            loading={loading}
            loadingLabel="Sending code..."
          >
            {UI.cta}
          </AuthSubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}
