import { Suspense } from "react";
import VerifyOtpClient from "./verify-otp-client";

// 🚫 absolutely disable prerendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
      <VerifyOtpClient />
    </Suspense>
  );
}
