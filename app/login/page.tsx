"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // intent can later come from URL (?intent=recruiter)
  const intent = searchParams.get("intent") || "recruiter";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    if (!email) {
      alert("Email is required");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        purpose: "LOGIN",
        intent, // 🔒 intent-aware, UI-reflected
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data?.error || "Failed to send OTP");
      return;
    }

    // identityId issued after OTP request
    router.push(`/verify-otp?identityId=${data.identityId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-white">
      <div className="w-[420px] bg-[#0F141B]/90 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur">

        {/* Intent Indicator */}
        <div className="text-xs text-cyan-400 mb-4 text-center uppercase tracking-wide">
          {intent === "recruiter" && "Recruiter Access"}
          {intent === "candidate" && "Candidate Interview"}
          {intent === "mock" && "Mock Interview"}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center">
          Continue to HireVeri
        </h1>

        {/* Subtext */}
        <p className="text-sm text-white/60 text-center mt-1 mb-6">
          Secure OTP-based access. No passwords.
        </p>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Work email address"
          className="w-full p-3 mb-2 rounded bg-black border border-white/10 focus:outline-none focus:border-cyan-400/40"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Helper Text */}
        <p className="text-xs text-white/50 mb-4">
          We’ll send a 6-digit one-time verification code
        </p>

        {/* CTA */}
        <button
          onClick={sendOtp}
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-semibold disabled:opacity-50 transition"
        >
          {loading ? "Sending OTP..." : "Continue securely"}
        </button>

        {/* Trust Footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-white/40">
  <div className="flex items-center gap-1">
    <span>🔐</span>
    <span>Secure identity verification</span>
  </div>

  <span className="opacity-30">•</span>

  <div className="flex items-center gap-1">
    <span>🧠</span>
    <span>AI-verified interviews</span>
  </div>

  <span className="opacity-30">•</span>

  <div className="flex items-center gap-1">
    <span>🏢</span>
    <span>Enterprise-ready audit trails</span>
    </div>
        </div>
      </div>
    </div>
  );
}
