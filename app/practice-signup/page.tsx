export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";

import AuthCrossLinks from "@/components/auth-cross-links";
import AuthEntryScreen from "@/components/auth-entry-screen";

export default function PracticeSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-1" />}>
      <AuthEntryScreen
        intent="candidate_practice"
        mode="signup"
        documentTitle="Create your practice account | VerisNova"
        sessionKey="verisnova_candidate_email"
        badge="Practice access"
        title="Create your Account"
        subtitle="Practise interviews on your own terms. Select a method to get started:"
        emailPlaceholder="Email address"
        cta="Create Account and Verify"
        hint="We'll send a 6-digit one-time verification code to confirm it's you. No passwords to choose."
        invalidEmailMessage="Enter a valid email address."
      >
        <AuthCrossLinks
          prompt="Already have an account?"
          actionLabel="Log in"
          actionHref="/practice-access"
          secondaryPrompt="Hiring with VerisNova?"
          secondaryLabel="Create a recruiter account"
          secondaryHref="/recruiter-signup"
        />
      </AuthEntryScreen>
    </Suspense>
  );
}
