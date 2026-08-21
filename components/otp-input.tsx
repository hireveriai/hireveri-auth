"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

const LENGTH = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
};

export default function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
}: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function focusAt(index: number) {
    inputs.current[Math.min(Math.max(index, 0), LENGTH - 1)]?.focus();
  }

  function commit(next: string) {
    onChange(next);

    if (next.length === LENGTH) {
      onComplete?.(next);
    }
  }

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");

    if (!digits) {
      return;
    }

    const chars = value.padEnd(LENGTH, " ").split("");

    digits
      .slice(0, LENGTH - index)
      .split("")
      .forEach((digit, offset) => {
        chars[index + offset] = digit;
      });

    commit(chars.join("").replace(/\s/g, "").slice(0, LENGTH));
    focusAt(index + digits.length);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();

      const chars = value.split("");

      if (chars[index]) {
        chars[index] = "";
        commit(chars.join("").slice(0, LENGTH));
        return;
      }

      chars[index - 1] = "";
      commit(chars.join("").slice(0, LENGTH));
      focusAt(index - 1);
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();

    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);

    if (!digits) {
      return;
    }

    commit(digits);
    focusAt(digits.length);
  }

  return (
    <div className="flex justify-center gap-2.5 sm:gap-3" role="group" aria-label="6-digit verification code">
      {Array.from({ length: LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          value={value[index] ?? ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid}
          className={`h-12 w-10 rounded-xl border bg-surface-1 text-center text-xl font-semibold text-ink-strong transition focus:bg-surface focus:outline-none disabled:opacity-50 sm:h-13 sm:w-11 ${
            invalid
              ? "border-signal-risk"
              : "border-line-strong focus:border-brand-600 focus:shadow-[0_0_0_3px_rgba(10,108,158,0.14)]"
          }`}
        />
      ))}
    </div>
  );
}
