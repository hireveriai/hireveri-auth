// app/practice/page.tsx

import Link from "next/link";

import AuthShell from "@/components/auth-shell";

const benefits = [
  "Real interview-style questions, drawn from the recruiter question bank",
  "A structured, distraction-free calm room — one question at a time",
  "Practise as often as you like; nothing is shared with any employer",
];

export default function PracticeEntryPage() {
  return (
    <AuthShell
      badge="Practice Room"
      title="Practice Mock Interviews"
      subtitle="Practice technical and behavioral interviews in a calm, AI-guided environment. No recruiters. No pressure."
      footer={
        <>
          Hiring with HireVeri?{" "}
          <Link
            href="/recruiter-access"
            className="font-semibold text-brand-600 transition hover:text-brand-700"
          >
            Recruiter login
          </Link>
        </>
      }
    >
      <ul className="space-y-3">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"
            >
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 4.5 4.5L19 7" />
              </svg>
            </span>

            <span className="text-[13px] leading-6 text-ink-muted">{benefit}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/practice-access"
        className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Start Practice Interview
      </Link>

      <p className="mt-3 text-center text-xs text-ink-muted">
        You&rsquo;ll verify your email with a one-time code. No passwords.
      </p>
    </AuthShell>
  );
}
