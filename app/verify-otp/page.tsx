export const dynamic = "force-dynamic";
import { Suspense } from "react";
import VerifyOtpClient from "./verify-otp-client";

// 🚫 absolutely disable prerendering

export const revalidate = 0;
const isProd = process.env.NODE_ENV === "production";

const redirectBase = isProd
  ? "https://app.verihireai.work"
  : "http://localhost:3001"; // or your local app port

window.location.href = redirectBase;
export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
      <VerifyOtpClient />
    </Suspense>
  );
}
