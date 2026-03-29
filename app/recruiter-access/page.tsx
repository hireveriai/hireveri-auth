"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RecruiterIntent = "recruiter_login";

const UI = {
  badge: "RECRUITER ACCESS",
  title: "Continue to HireVeri",
  subtitle: "Secure OTP-based access. No passwords.",
  emailPlaceholder: "Work email address",
  cta: "Continue securely",
};

export default function RecruiterAccessPage() {
  const router = useRouter();
  const intent: RecruiterIntent = "recruiter_login";

  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem("hireveri_recruiter_email") ?? "";
  });
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    if (!email.trim()) {
      alert("Email is required");
      return;
    }

    setLoading(true);
    sessionStorage.setItem("hireveri_recruiter_email", email);

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        intent,
      }),
    });

    let data: { error?: string; identityId?: string } | null = null;

    try {
      data = await res.json();
    } catch {
      setLoading(false);
      alert("Server error. Please try again.");
      return;
    }

    setLoading(false);

    if (!res.ok) {
      alert(data?.error || "Failed to send OTP");
      return;
    }

    if (!data?.identityId) {
      alert("Identity could not be created. Please try again.");
      return;
    }

    router.push(
      `/verify-otp?identityId=${data.identityId}&email=${encodeURIComponent(
        email
      )}&intent=${intent}`
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-white">
      <div className="w-[420px] rounded-2xl border border-cyan-400/20 bg-[#0F141B]/90 p-8 backdrop-blur">
        <div className="mb-4 text-center text-xs uppercase tracking-wide text-cyan-400">
          {UI.badge}
        </div>

        <h1 className="text-center text-2xl font-semibold">{UI.title}</h1>

        <p className="mb-6 mt-1 text-center text-sm text-white/60">
          {UI.subtitle}
        </p>

        <input
          type="email"
          placeholder={UI.emailPlaceholder}
          className="mb-2 w-full rounded border border-white/10 bg-black p-3 focus:border-cyan-400/40 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <p className="mb-4 text-xs text-white/50">
          We&apos;ll send a 6-digit one-time verification code
        </p>

        <button
          onClick={sendOtp}
          disabled={loading}
          className="w-full rounded-xl bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? "Sending OTP..." : UI.cta}
        </button>
      </div>
    </div>
  );
}
