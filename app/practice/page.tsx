// app/practice/page.tsx

import Link from "next/link";

import BrandLogo from "@/components/brand-logo";

const benefits = [
  {
    title: "Real interview-style questions",
    body: "Role-relevant prompts drawn from the same question bank recruiters interview with.",
  },
  {
    title: "Structured, distraction-free calm room",
    body: "One question at a time, a clear timer, and nothing else competing for your attention.",
  },
  {
    title: "Designed for skill improvement",
    body: "Practise as often as you like. Nothing here is shared with any employer.",
  },
];

export default function PracticeEntryPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-1 px-4 py-12 sm:px-6">
      <div className="w-full max-w-[520px]">
        <div className="mb-8 flex justify-center">
          <BrandLogo priority />
        </div>

        <div className="rounded-[24px] border border-line bg-surface p-8 shadow-lg sm:p-10">
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
            Practice Room
          </span>

          <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-ink-strong sm:text-[32px]">
            Practice Mock Interviews
          </h1>

          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Practice technical and behavioral interviews in a calm, AI-guided
            environment. No recruiters. No pressure.
          </p>

          <ul className="mt-7 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12.5 4.5 4.5L19 7" />
                  </svg>
                </span>

                <span>
                  <span className="block text-sm font-medium text-ink-strong">
                    {benefit.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-6 text-ink-muted">
                    {benefit.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/practice-access"
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Start Practice Interview
          </Link>

          <p className="mt-4 text-center text-xs text-ink-muted">
            You&rsquo;ll verify your email with a one-time code. No passwords.
          </p>
        </div>
      </div>
    </div>
  );
}
