"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
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
        intent: "recruiter" // default for now
      })
    });

    const data = await res.json(); // ✅ READ ONCE
    setLoading(false);

    if (!res.ok) {
      alert(data?.error || "Failed to send OTP");
      return;
    }

    // ✅ identityId now correctly available
    router.push(`/verify-otp?identityId=${data.identityId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-white">
      <div className="w-[420px] bg-[#0F141B]/90 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Sign in to HireVeri
        </h1>

        <input
          type="email"
          placeholder="Enter your work email"
          className="w-full p-3 mb-4 rounded bg-black border border-white/10"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={sendOtp}
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "Sending OTP..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
