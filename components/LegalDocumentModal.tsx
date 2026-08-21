"use client";

import { useEffect, useId, useRef } from "react";

import type { LegalDocument } from "@/lib/legal-documents";

type LegalDocumentModalProps = {
  document: LegalDocument | null;
  onClose: () => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function LegalDocumentModal({ document: activeDocument, onClose }: LegalDocumentModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!activeDocument) {
      return;
    }

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement?.focus();
    };
  }, [activeDocument, onClose]);

  if (!activeDocument) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,22,38,0.55)] px-4 py-6 backdrop-blur-sm sm:px-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lg"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">
              Verixans Technologies Pvt Ltd
            </p>
            <h2 id={titleId} className="mt-2 text-xl font-semibold tracking-tight text-ink-strong sm:text-2xl">
              {activeDocument.title}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
              Last Updated: {activeDocument.lastUpdated}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-muted transition hover:border-brand-300 hover:bg-surface-1 hover:text-ink-strong"
            aria-label={`Close ${activeDocument.title}`}
          >
            Close
          </button>
        </div>

        <div className="scroll-smooth overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <p className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 text-sm leading-7 text-ink">
            {activeDocument.intro}
          </p>

          <div className="mt-6 space-y-6">
            {activeDocument.sections.map((section) => (
              <section key={section.title} className="border-t border-line pt-5">
                <h3 className="text-base font-semibold text-ink-strong">{section.title}</h3>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-sm leading-7 text-ink-muted">
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-3 space-y-2 pl-5 text-sm leading-6 text-ink-muted">
                    {section.bullets.map((item) => (
                      <li key={item} className="list-disc marker:text-brand-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
