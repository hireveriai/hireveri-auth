import { Suspense } from "react";
import VerifyOtpClient from "./verify-otp-client";

// 🔒 Force runtime rendering (no prerender)
export const dynamic = "force-dynamic";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
      <VerifyOtpClient />
    </Suspense>
  );
}
