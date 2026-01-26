"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyOtpClient() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifyOtp() {
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data?.error || "Invalid OTP");
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-white">
      <div className="w-[420px] bg-[#0F141B]/90 border border-cyan-400/20 rounded-2xl p-8">
        <h1 className="text-2xl mb-4 text-center">Verify OTP</h1>

        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="w-full p-3 mb-4 bg-black border border-white/10 rounded"
        />

        <button
          onClick={verifyOtp}
          disabled={loading}
          className="w-full bg-cyan-500 py-3 rounded text-black font-semibold"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </div>
    </div>
  );
}
