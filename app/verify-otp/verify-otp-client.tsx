"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyOtpClient() {
  const searchParams = useSearchParams();
  const identityId = searchParams.get("identityId");

  const [otp, setOtp] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Resend timer (starts immediately)
  const [timer, setTimer] = useState(30);

  /* ---------------- Timer Logic ---------------- */
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* ---------------- Verify OTP ---------------- */
  async function verifyOtp() {
    if (!identityId) {
      setError("Session expired. Please restart.");
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
      body: JSON.stringify({ otp, identityId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Invalid or expired code.");
      return;
    }

    if (data.redirectTo) {
      window.location.href = data.redirectTo;
      return;
    }

    window.location.href = "/";
  }

  /* ---------------- Resend OTP ---------------- */
  async function resendOtp() {
    if (!identityId) {
      setError("Session expired. Please restart.");
      return;
    }

    setError(null);
    setTimer(30);

    await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityId,
        purpose: "LOGIN",
      }),
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-white">
      <div className="w-[420px] bg-[#0F141B]/90 border border-cyan-400/20 rounded-2xl p-8">

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center mb-1">
          Verify your code
        </h1>

        <p className="text-sm text-white/60 text-center mb-6">
          Enter the 6-digit code we sent to your email
        </p>

        {/* OTP Input */}
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
          disabled={loading}
          placeholder="••••••"
          className="w-full p-3 mb-3 bg-black border border-white/10 rounded text-center tracking-widest text-lg focus:outline-none focus:border-cyan-400/40 disabled:opacity-60"
        />

        {/* ✅ RESEND TIMER (THIS WAS MISSING BEFORE) */}
        <div className="text-center mb-4 text-sm text-white/50">
          {timer > 0 ? (
            <span>Resend code in {timer}s</span>
          ) : (
            <button
              type="button"
              onClick={resendOtp}
              className="underline hover:text-white transition"
            >
              Didn’t receive the code? Resend
            </button>
          )}
        </div>

        {/* Terms & Conditions */}
        <label className="flex items-start gap-2 text-[12px] text-white/60 mb-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 accent-cyan-500"
          />
          <span>
            I agree to HireVeri’s{" "}
            <a
              href="/terms"
              target="_blank"
              className="underline hover:text-white"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              className="underline hover:text-white"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 mb-3 text-center">
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={verifyOtp}
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 transition py-3 rounded text-black font-semibold disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify & Continue"}
        </button>
      </div>
    </div>
  );
}
