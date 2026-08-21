"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import AuthShell from "@/components/auth-shell";
import AuthSubmitButton from "@/components/auth-submit-button";
import LegalDocumentModal from "@/components/LegalDocumentModal";
import OtpInput from "@/components/otp-input";
import { legalDocuments, PRIVACY_VERSION, TERMS_VERSION, type LegalDocument } from "@/lib/legal-documents";

type VerifyOtpResponse = {
  error?: string;
  nextRoute?: string;
  token?: string;
};

const RESEND_SECONDS = 60;

function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return `${mins}:${secs}`;
}

export default function VerifyOtpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const identityId = searchParams.get("identityId");
  const email = searchParams.get("email");
  const intent = searchParams.get("intent");
  const next = searchParams.get("next");

  const [otp, setOtp] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [openLegalDocument, setOpenLegalDocument] = useState<LegalDocument["id"] | null>(null);

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  async function submitOtp(code: string) {
    if (loading) {
      return;
    }

    if (!identityId || !email) {
      setError("Session expired. Please restart sign in.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
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
        otp: code,
        email,
        next,
        consent: {
          acceptedAt: new Date().toISOString(),
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION,
        },
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

  function handleVerifySubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    void submitOtp(otp);
  }

  async function resendOtp() {
    if (!email) {
      setError("Session expired. Please restart sign in.");
      return;
    }

    setError(null);
    setOtp("");
    setTimer(RESEND_SECONDS);

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
    <>
      <AuthShell
        badge="Enter OTP"
        title="Verify your code"
        subtitle={
          <>
            Please enter the 6-digit code we sent to{" "}
            <span className="font-medium text-white">{email}</span>
          </>
        }
        onBack={() =>
          router.push(
            intent === "candidate_practice" ? "/practice-access" : "/recruiter-access"
          )
        }
      >
        <form onSubmit={handleVerifySubmit} noValidate>
          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (error) {
                setError(null);
              }
            }}
            onComplete={(value) => {
              if (agreed) {
                void submitOtp(value);
              }
            }}
            disabled={loading}
            invalid={!!error}
          />

          <label className="mt-7 flex items-start gap-2.5 text-xs leading-5 text-white/55">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded accent-cyan-400"
            />
            <span>
              I agree to HireVeri&apos;s{" "}
              <button
                type="button"
                onClick={() => setOpenLegalDocument("terms")}
                className="text-cyan-300 underline-offset-2 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setOpenLegalDocument("privacy")}
                className="text-cyan-300 underline-offset-2 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              >
                Privacy Policy
              </button>
              .
            </span>
          </label>

          {error ? (
            <p role="alert" className="mt-4 text-center text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="mt-6">
            <AuthSubmitButton
              disabled={otp.length !== 6 || !agreed}
              loading={loading}
              loadingLabel="Verifying..."
            >
              Verify
            </AuthSubmitButton>
          </div>

          <div className="mt-6 text-center text-sm text-white/50">
            {timer > 0 ? (
              <p>
                You can resend the OTP in{" "}
                <span className="font-semibold text-white">{formatCountdown(timer)}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={resendOtp}
                className="font-medium text-cyan-300 transition hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
              >
                Resend OTP
              </button>
            )}
          </div>
        </form>
      </AuthShell>

      <LegalDocumentModal
        document={openLegalDocument ? legalDocuments[openLegalDocument] : null}
        onClose={() => setOpenLegalDocument(null)}
      />
    </>
  );
}
