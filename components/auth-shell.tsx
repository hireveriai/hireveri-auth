import type { ReactNode } from "react";

import BrandLogo from "@/components/brand-logo";
import AuthVisualPanel from "@/components/auth-visual-panel";

type AuthShellProps = {
  badge?: string;
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  footer?: ReactNode;
  /** Onboarding needs a roomier form column than the sign-in screens. */
  size?: "default" | "wide";
  children: ReactNode;
};

export default function AuthShell({
  badge,
  title,
  subtitle,
  onBack,
  footer,
  size = "default",
  children,
}: AuthShellProps) {
  const cardWidth = size === "wide" ? "max-w-[1140px]" : "max-w-[1040px]";
  const columnWidth = size === "wide" ? "max-w-[460px]" : "max-w-[360px]";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-1 px-4 py-4 sm:px-6">
      {/* The visual panel is first in the source so it renders on the left at
          lg and up; it is hidden below that, leaving the form on its own. */}
      <div
        className={`grid w-full ${cardWidth} overflow-hidden rounded-[20px] border border-line bg-surface shadow-lg lg:grid-cols-2`}
      >
        <AuthVisualPanel />

        <div className="flex flex-col justify-center px-6 py-7 sm:px-9">
          <div className={`mx-auto w-full ${columnWidth}`}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <BrandLogo priority />

              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Go back"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-brand-300 hover:text-brand-700"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                  </svg>
                </button>
              ) : null}
            </div>

            {badge ? (
              <span className="mb-3 inline-flex rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                {badge}
              </span>
            ) : null}

            <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-ink-strong">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-1.5 text-[13px] leading-6 text-ink-muted">{subtitle}</p>
            ) : null}

            <div className="mt-5">{children}</div>

            {footer ? (
              <div className="mt-5 text-center text-[13px] text-ink-muted">{footer}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
