export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";

import AuthCrossLinks from "@/components/auth-cross-links";
import AuthEntryScreen from "@/components/auth-entry-screen";

export default function RecruiterSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-1" />}>
      <AuthEntryScreen
        intent="recruiter_login"
        mode="signup"
        documentTitle="Create your recruiter account | HireVeri"
        sessionKey="hireveri_recruiter_email"
        badge="Recruiter access"
        title="Create your Account"
        subtitle="Set up your hiring workspace. Select a method to get started:"
        emailPlaceholder="Work email address"
        cta="Create Account and Verify"
        hint="We'll send a 6-digit one-time verification code to confirm it's you. No passwords to choose."
        invalidEmailMessage="Enter a valid work email address."
      >
        <AuthCrossLinks
          prompt="Already have an account?"
          actionLabel="Log in"
          actionHref="/recruiter-access"
          secondaryPrompt="Practising for an interview?"
          secondaryLabel="Create a practice account"
          secondaryHref="/practice-signup"
        />
      </AuthEntryScreen>
    </Suspense>
  );
}
