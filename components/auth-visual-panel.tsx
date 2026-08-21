"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDE_MS = 6000;

/**
 * Product shots live in /public. Swap `image` here when a dedicated capture
 * exists for a slide — `objectPosition` picks the focal point of the crop.
 */
const slides = [
  {
    id: "structured",
    image: "/Dashboard.png",
    objectPosition: "18% center",
    title: "AI-led structured interviews.",
    body: "Every candidate answers the same competency-mapped questions, scored against the same rubric.",
  },
  {
    id: "veris",
    image: "/veris.png",
    objectPosition: "center",
    title: "Integrity you can review.",
    body: "VERIS surfaces fraud and assistance signals with the evidence attached, so you can judge them yourself.",
  },
  {
    id: "evidence",
    image: "/Dashboard.png",
    objectPosition: "82% center",
    title: "Decisions backed by evidence.",
    body: "Competency scores, transcripts, and behavioural signals in one reviewable candidate record.",
  },
];

export default function AuthVisualPanel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
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
      className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-end"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className="hv-slide absolute inset-0"
          data-active={index === active}
          aria-hidden={index !== active}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={index === 0}
            sizes="50vw"
            style={{ objectPosition: slide.objectPosition }}
            className="object-cover"
          />
        </div>
      ))}

      {/* Scrim: the copy sits over a product screenshot, so it needs a floor
          under it to stay AA-legible whichever slide is showing. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,23,38,0.55) 0%, rgba(6,23,38,0.72) 42%, rgba(6,23,38,0.94) 100%)",
        }}
      />

      <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-brand-400/15 blur-3xl" />

      <div className="relative px-12 pt-14">
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-ink-inv-strong backdrop-blur-sm">
          HireVeri Intelligence
        </span>
      </div>

      <div className="relative px-12 pb-14 pt-10">
        {/* All copy blocks share one grid cell so the panel keeps the height of
            the tallest slide and nothing shifts as they crossfade. */}
        <div className="grid">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="hv-slide col-start-1 row-start-1"
              data-active={index === active}
              aria-hidden={index !== active}
            >
              <h2 className="text-[26px] font-semibold leading-snug text-ink-inv-strong">
                {slide.title}
              </h2>

              <p className="mt-3 max-w-[420px] text-sm leading-6 text-ink-inv">
                {slide.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-2.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              aria-current={index === active}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === active
                  ? "w-7 bg-brand-300"
                  : "w-2 bg-white/30 hover:bg-white/55"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
