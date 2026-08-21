"use client";

import { useEffect, useState } from "react";

import {
  EvidenceRecordArt,
  IntegritySignalArt,
  StructuredInterviewArt,
} from "@/components/auth-illustrations";

const SLIDE_MS = 6000;

/**
 * Explanatory diagrams rather than product screenshots — at this size a
 * screenshot reads as visual noise and competes with the form beside it.
 */
const slides = [
  {
    id: "structured",
    Art: StructuredInterviewArt,
    title: "Every candidate, the same interview.",
    body: "Competency-mapped questions asked in the same order and scored against the same rubric.",
  },
  {
    id: "integrity",
    Art: IntegritySignalArt,
    title: "Integrity signals, with the evidence.",
    body: "VERIS flags assistance and fraud signals at the moment they occur, and shows you what triggered them.",
  },
  {
    id: "evidence",
    Art: EvidenceRecordArt,
    title: "Decisions you can defend.",
    body: "Competency scores, transcripts, and behavioural evidence in one reviewable record.",
  },
];

export default function AuthVisualPanel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const id = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, SLIDE_MS);

    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What HireVeri does"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative hidden flex-col justify-center gap-6 border-r border-line bg-gradient-to-b from-brand-50 to-surface-2 px-9 py-9 lg:flex"
    >
      <span className="inline-flex w-fit rounded-full border border-brand-200 bg-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700">
        HireVeri Intelligence
      </span>

      {/* Art and copy are stacked in one grid cell so the panel keeps a fixed
          height and the slides crossfade without any layout shift. */}
      <div className="grid">
        {slides.map(({ id, Art, title, body }, index) => (
          <div
            key={id}
            className="hv-slide col-start-1 row-start-1"
            data-active={index === active}
            aria-hidden={index !== active}
          >
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-line bg-surface p-3 shadow-sm">
              <Art className="h-full w-full" />
            </div>

            <h2 className="mt-6 text-[20px] font-semibold leading-snug tracking-tight text-ink-strong">
              {title}
            </h2>

            <p className="mt-2 text-[13px] leading-6 text-ink-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {slides.map(({ id, title }, index) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1}: ${title}`}
            aria-current={index === active}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === active
                ? "w-6 bg-brand-600"
                : "w-1.5 bg-line-strong hover:bg-brand-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
