"use client";

import type { ReactNode } from "react";

type AuthSubmitButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

export default function AuthSubmitButton({
  disabled = false,
  loading = false,
  loadingLabel = "Please wait...",
  children,
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-600/40 disabled:shadow-none"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
