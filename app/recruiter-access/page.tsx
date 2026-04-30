"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RecruiterIntent = "recruiter_login";

const UI = {
  badge: "RECRUITER ACCESS",
  title: "Continue to HireVeri",
  subtitle: "Secure OTP-based access. No passwords.",
  emailPlaceholder: "Work email address",
  cta: "Continue Securely and Verify",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecruiterAccessPage() {
  const router = useRouter();
  const intent: RecruiterIntent = "recruiter_login";
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

    router.push(
      `/verify-otp?identityId=${data.identityId}&email=${encodeURIComponent(
        normalizedEmail
      )}&intent=${intent}`
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] px-6 py-20 text-white">
      <div className="w-[420px] rounded-2xl border border-cyan-400/20 bg-[#0F141B]/90 p-8 backdrop-blur">
        <div className="mb-4 text-center text-xs uppercase tracking-wide text-cyan-400">
          {UI.badge}
        </div>

        <h1 className="text-center text-2xl font-semibold">{UI.title}</h1>

        <p className="mb-6 mt-1 text-center text-sm text-white/60">
          {UI.subtitle}
        </p>

        <form onSubmit={handleContinue}>
          <input
            type="email"
            placeholder={UI.emailPlaceholder}
            className="mb-2 w-full rounded border border-white/10 bg-black p-3 focus:border-cyan-400/40 focus:outline-none"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) {
                setError(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "recruiter-email-error" : undefined}
          />

          <p className="mb-4 text-xs text-white/50">
            We&apos;ll send a 6-digit one-time verification code
          </p>

          {error ? (
            <p id="recruiter-email-error" className="mb-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!isEmailValid || loading}
            className="w-full rounded-xl bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? "Verifying..." : UI.cta}
          </button>
        </form>
      </div>
    </div>
  );
}
