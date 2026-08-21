export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import RecruiterAccessClient from "./recruiter-access-client";

export default function RecruiterAccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b1220]" />}>
      <RecruiterAccessClient />
    </Suspense>
  );
}
