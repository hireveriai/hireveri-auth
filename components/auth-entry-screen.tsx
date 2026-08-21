"use client";

import { useEffect, type ReactNode } from "react";

import AuthShell from "@/components/auth-shell";
import EmailOtpForm, { type AuthIntent } from "@/components/email-otp-form";

type AuthEntryScreenProps = {
  intent: AuthIntent;
  mode: "login" | "signup";
  documentTitle: string;
  /** Stale email left over from a previous attempt, cleared on mount. */
  sessionKey: string;
  badge: string;
  title: string;
  subtitle: string;
  emailPlaceholder: string;
  cta: string;
  hint: string;
  invalidEmailMessage: string;
  children: ReactNode;
};

export default function AuthEntryScreen({
  intent,
  mode,
  documentTitle,
  sessionKey,
  badge,
  title,
  subtitle,
  emailPlaceholder,
  cta,
  hint,
  invalidEmailMessage,
  children,
}: AuthEntryScreenProps) {
  useEffect(() => {
    document.title = documentTitle;
    sessionStorage.removeItem(sessionKey);
  }, [documentTitle, sessionKey]);

  return (
    <AuthShell badge={badge} title={title} subtitle={subtitle} footer={children}>
      <EmailOtpForm
        intent={intent}
        mode={mode}
        emailPlaceholder={emailPlaceholder}
        cta={cta}
        hint={hint}
        invalidEmailMessage={invalidEmailMessage}
      />
    </AuthShell>
  );
}
