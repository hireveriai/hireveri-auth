"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const identityId = searchParams.get("identityId");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifyOtp() {
    if (!identityId) {
      alert("Invalid or expired OTP session. Please login again.");
      router.push("/login");
      return;
    }

    if (!otp || otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identityId, otp })
      });

      let data: any = null;

      try {
        data = await res.json();
      } catch {
        // Response had no JSON body
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data?.error || "OTP invalid or expired");
      }

      // ✅ session cookie already set by API
      router.push("/hireveri-control");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F14] text-white">
      <div className="w-[420px] bg-[#0F141B]/90 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Verify OTP
        </h2>

        <input
          placeholder="Enter 6-digit OTP"
          className="w-full p-3 mb-4 rounded bg-black border border-white/10 text-center tracking-widest"
          value={otp}
          maxLength={6}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />

        <button
          onClick={verifyOtp}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 text-black py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify & Continue"}
        </button>
      </div>
    </div>
  );
}
