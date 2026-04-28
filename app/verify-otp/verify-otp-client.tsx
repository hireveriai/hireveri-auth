"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type VerifyOtpResponse = {
  error?: string;
  nextRoute?: string;
  token?: string;
};

export default function VerifyOtpClient() {
  const searchParams = useSearchParams();

  const identityId = searchParams.get("identityId");
  const email = searchParams.get("email");
  const intent = searchParams.get("intent");

  const [otp, setOtp] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  async function handleVerifySubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    if (loading) {
      return;
    }

    if (!identityId || !email) {
      setError("Session expired. Please restart sign in.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms and Privacy Policy to continue.");
      return;
    }

    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityId,
        otp,
        email,
      }),
    });

    let data: VerifyOtpResponse;

    try {
      data = await res.json();
    } catch {
      setLoading(false);
      setError("Server error during verification. Please try again.");
      return;
    }

    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Invalid or expired code.");
      return;
    }

    if (data.nextRoute) {
      window.location.href = data.nextRoute;
      return;
    }

    window.location.href = "/";
  }

  async function resendOtp() {
    if (!email) {
      setError("Session expired. Please restart sign in.");
      return;
    }

    setError(null);
    setTimer(30);

    await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        intent:
          intent === "recruiter_login" ? "recruiter_login" : "candidate_practice",
      }),
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] px-6 py-20 text-white">
      <div className="w-[420px] rounded-2xl border border-cyan-400/20 bg-[#0F141B]/90 p-8">
        <form onSubmit={handleVerifySubmit}>
          <h1 className="mb-1 text-center text-2xl font-semibold">
            Verify your code
          </h1>

          <p className="mb-6 text-center text-sm text-white/60">
            Enter the 6-digit code we sent to{" "}
            <span className="font-medium text-white">{email}</span>
          </p>

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={6}
            disabled={loading}
            placeholder="••••••"
            className="mb-3 w-full rounded border border-white/10 bg-black p-3 text-center text-lg tracking-widest focus:border-cyan-400/40 focus:outline-none disabled:opacity-60"
          />

          <div className="mb-4 text-center text-sm text-white/50">
            {timer > 0 ? (
              <span>Resend code in {timer}s</span>
            ) : (
              <button
                type="button"
                onClick={resendOtp}
                className="underline transition hover:text-white"
              >
                Didn&apos;t receive the code? Resend
              </button>
            )}
          </div>

          <label className="mb-4 flex items-start gap-2 text-[12px] text-white/60">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 accent-cyan-500"
            />
            <span>
              I agree to HireVeri&apos;s{" "}
              <a href="/terms" target="_blank" className="underline hover:text-white">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="underline hover:text-white">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          {error ? (
            <p className="mb-3 text-center text-sm text-red-400">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
