"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDE_MS = 6000;

/**
 * Each artwork is a finished slide — it carries its own heading and body copy —
 * so the panel adds no text of its own. The files are portrait (~411x844) and
 * their copy runs to both edges, so they are never cropped: the frame keeps the
 * source aspect ratio and is capped in height so it cannot stretch the card.
 */
const slides = [
  {
    id: "secure",
    image: "/Image1.png",
    alt: "Secure and private: enterprise-grade security with end-to-end encryption, so your data stays protected at every step.",
    label: "Secure & Private",
  },
  {
    id: "structured",
    image: "/Image2.png",
    alt: "Structured and fair: every candidate gets the same competency-mapped questions in the same order, scored consistently.",
    label: "Structured & Fair",
  },
  {
    id: "human",
    image: "/Image3.png",
    alt: "AI plus human intelligence: AI provides objective insights and evidence, while final decisions remain with recruiters.",
    label: "AI + Human Intelligence",
  },
];

const IMAGE_WIDTH = 411;
const IMAGE_HEIGHT = 844;

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
      className="relative hidden flex-col items-center justify-between gap-5 border-r border-line bg-gradient-to-b from-brand-50 to-surface-2 px-8 py-8 lg:flex"
    >
      <span className="inline-flex w-fit rounded-full border border-brand-200 bg-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700">
        HireVeri Intelligence
      </span>

      {/* One grid cell holds every slide, so the panel keeps a constant height
          and the artwork crossfades without any layout shift. */}
      <div className="grid">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="hv-slide col-start-1 row-start-1 flex items-center justify-center"
            data-active={index === active}
            aria-hidden={index !== active}
          >
            {/* The frame carries the source aspect ratio and a fixed height, so
                layout is reserved before the image decodes and the artwork is
                shown whole — never cropped, never stretched. */}
            <div
              className="relative h-[min(58vh,440px)] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
              style={{ aspectRatio: `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}` }}
            >
              <Image
                src={slide.image}
                alt={index === active ? slide.alt : ""}
                fill
                priority={index === 0}
                loading="eager"
                sizes="(min-width: 1024px) 260px, 100vw"
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1}: ${slide.label}`}
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
