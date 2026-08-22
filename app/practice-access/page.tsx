export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";

import AuthCrossLinks from "@/components/auth-cross-links";
import AuthEntryScreen from "@/components/auth-entry-screen";

export default function PracticeAccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-1" />}>
      <AuthEntryScreen
        intent="candidate_practice"
        mode="login"
        documentTitle="Practice Candidate Login | VerisNova"
        sessionKey="verisnova_candidate_email"
        badge="Practice access"
        title="Log in to Practice Room"
        subtitle="Welcome back! Select method to log in:"
        emailPlaceholder="Email address"
        cta="Continue Securely and Verify"
        hint="We'll send a 6-digit one-time verification code. No passwords."
        invalidEmailMessage="Enter a valid email address."
      >
        <AuthCrossLinks
          prompt="Don't have an account?"
          actionLabel="Create an account"
          actionHref="/practice-signup"
          secondaryPrompt="Hiring with VerisNova?"
          secondaryLabel="Recruiter login"
          secondaryHref="/recruiter-access"
        />
      </AuthEntryScreen>
    </Suspense>
  );
}
