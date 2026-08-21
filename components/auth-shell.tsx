import type { ReactNode } from "react";

import BrandLogo from "@/components/brand-logo";
import AuthVisualPanel from "@/components/auth-visual-panel";

type AuthShellProps = {
  badge?: string;
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

export default function AuthShell({
  badge,
  title,
  subtitle,
  onBack,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-1 px-4 py-10 sm:px-6 lg:py-16">
      <div className="grid w-full max-w-[1120px] overflow-hidden rounded-[24px] border border-line bg-surface shadow-lg lg:grid-cols-2">
        <div className="flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-14">
          <div className="mx-auto w-full max-w-[380px]">
            <div className="mb-9 flex items-center justify-between gap-4">
              <BrandLogo priority />

              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Go back"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-brand-300 hover:text-brand-700"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                  </svg>
                </button>
              ) : null}
            </div>

            {badge ? (
              <span className="mb-4 inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                {badge}
              </span>
            ) : null}

            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink-strong sm:text-[32px]">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-ink-muted">{subtitle}</p>
            ) : null}

            <div className="mt-8">{children}</div>

            {footer ? (
              <div className="mt-7 text-center text-sm text-ink-muted">{footer}</div>
            ) : null}
          </div>
        </div>

        <AuthVisualPanel />
      </div>
    </div>
  );
}
