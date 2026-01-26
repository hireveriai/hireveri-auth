"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyOtpClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const identityId = searchParams.get("identityId");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifyOtp() {
    if (!otp) {
      alert("OTP is required");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        otp
      })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data?.error || "Invalid OTP");
      return;
    }

    // 🚀 TEMP redirect after auth
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-white">
      <div className="w-[420px] bg-[#0F141B]/90 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Verify OTP
        </h1>

        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full p-3 mb-4 rounded bg-black border border-white/10"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={verifyOtp}
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </div>
    </div>
  );
}
