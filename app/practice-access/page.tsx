"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CandidateIntent = "candidate_practice";

const UI = {
  badge: "PRACTICE ACCESS",
  title: "Continue to Practice Room",
  subtitle: "Secure OTP-based access. No passwords.",
  emailPlaceholder: "Email address",
  cta: "Continue securely",
};

export default function PracticeAccessPage() {
  const router = useRouter();
  const intent: CandidateIntent = "candidate_practice";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🔒 Restore email if user comes back */
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("hireveri_candidate_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  async function sendOtp() {
    if (!email.trim()) {
      alert("Email is required");
      return;
    }

    setLoading(true);

    // persist email for this auth attempt
    sessionStorage.setItem("hireveri_candidate_email", email);

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        intent,
      }),
    });

    let data: any = null;

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

    router.push(
      `/verify-otp?identityId=${data.identityId}&email=${encodeURIComponent(
        email
      )}`
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-white">
      <div className="w-[420px] bg-[#0F141B]/90 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur">

        <div className="text-xs text-cyan-400 mb-4 text-center uppercase tracking-wide">
          {UI.badge}
        </div>

        <h1 className="text-2xl font-semibold text-center">
          {UI.title}
        </h1>

        <p className="text-sm text-white/60 text-center mt-1 mb-6">
          {UI.subtitle}
        </p>

        <input
          type="email"
          placeholder={UI.emailPlaceholder}
          className="w-full p-3 mb-2 rounded bg-black border border-white/10 focus:outline-none focus:border-cyan-400/40"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <p className="text-xs text-white/50 mb-4">
          We’ll send a 6-digit one-time verification code
        </p>

        <button
          onClick={sendOtp}
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-semibold disabled:opacity-50 transition"
        >
          {loading ? "Sending OTP..." : UI.cta}
        </button>

        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-white/40">
          <div className="flex items-center gap-1">
            <span>🔐</span>
            <span>Secure identity verification</span>
          </div>

          <span className="opacity-30">•</span>

          <div className="flex items-center gap-1">
            <span>🧠</span>
            <span>AI-guided practice</span>
          </div>

          <span className="opacity-30">•</span>

          <div className="flex items-center gap-1">
            <span>🎯</span>
            <span>Skill-focused improvement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
