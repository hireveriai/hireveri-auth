export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";

import AuthCrossLinks from "@/components/auth-cross-links";
import AuthEntryScreen from "@/components/auth-entry-screen";

export default function RecruiterAccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-1" />}>
      <AuthEntryScreen
        intent="recruiter_login"
        mode="login"
        documentTitle="Recruiter Login | VerisNova"
        sessionKey="verisnova_recruiter_email"
        badge="Recruiter access"
        title="Log in to your Account"
        subtitle="Welcome back! Select method to log in:"
        emailPlaceholder="Work email address"
        cta="Continue Securely and Verify"
        hint="We'll send a 6-digit one-time verification code. No passwords."
        invalidEmailMessage="Enter a valid work email address."
      >
        <AuthCrossLinks
          prompt="Don't have an account?"
          actionLabel="Create an account"
          actionHref="/recruiter-signup"
          secondaryPrompt="Practising for an interview?"
          secondaryLabel="Go to Practice Room"
          secondaryHref="/practice-access"
        />
      </AuthEntryScreen>
    </Suspense>
  );
}
