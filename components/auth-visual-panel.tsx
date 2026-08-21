"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDE_MS = 6000;

/**
 * Captures are 16:9 and sit inside a 16:9 frame, so nothing is cropped.
 * The panel is deliberately light: the screenshots are dark UI, and a dark
 * panel behind them pulled attention away from the form.
 */
const slides = [
  {
    id: "structured",
    image: "/product/structured-interview.jpg",
    title: "AI-led structured interviews.",
    body: "Every candidate answers the same competency-mapped questions, scored against the same rubric.",
  },
  {
    id: "integrity",
    image: "/product/integrity-review.jpg",
    title: "Integrity you can review.",
    body: "VERIS surfaces fraud and assistance signals with the evidence attached.",
  },
  {
    id: "evidence",
    image: "/product/evidence-record.jpg",
    title: "Decisions backed by evidence.",
    body: "Competency scores, transcripts, and behavioural signals in one candidate record.",
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

      {/* Frames and copy are stacked in one grid cell so the panel keeps a
          fixed height and the slides crossfade without any layout shift. */}
      <div className="grid">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="hv-slide col-start-1 row-start-1"
            data-active={index === active}
            aria-hidden={index !== active}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line-strong bg-surface-2 shadow-sm">
              <Image
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                loading="eager"
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-contain object-center"
              />
            </div>

            <h2 className="mt-6 text-[20px] font-semibold leading-snug tracking-tight text-ink-strong">
              {slide.title}
            </h2>

            <p className="mt-2 text-[13px] leading-6 text-ink-muted">
              {slide.body}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1}: ${slide.title}`}
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
