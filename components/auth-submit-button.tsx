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
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3.5 text-sm font-semibold text-[#07111f] transition hover:bg-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1626] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07111f]/30 border-t-[#07111f]" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
