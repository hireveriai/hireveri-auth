"use client";

import type { InputHTMLAttributes } from "react";

type EmailFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export default function EmailField({ invalid = false, className = "", ...props }: EmailFieldProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
          <path d="m3.5 7 7.6 5.3a1.6 1.6 0 0 0 1.8 0L20.5 7" />
        </svg>
      </span>

      <input
        type="email"
        aria-invalid={invalid}
        className={`w-full rounded-xl border bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/35 transition focus:outline-none ${
          invalid
            ? "border-red-400/60"
            : "border-white/12 focus:border-cyan-300/60 focus:bg-cyan-300/[0.05] focus:shadow-[0_0_0_1px_rgba(103,232,249,0.3),0_0_22px_rgba(103,232,249,0.15)]"
        } ${className}`.trim()}
        {...props}
      />
    </div>
  );
}
