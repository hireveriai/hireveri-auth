"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDE_MS = 6000;

/** Intrinsic size of the artwork — 16:9, served as WebP. */
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 675;

/**
 * Each artwork is a finished slide carrying its own heading and body copy, so
 * the panel adds no text of its own. They run edge to edge: the copy baked into
 * them is small, and any inset would shrink it further.
 */
const slides = [
  {
    id: "human",
    image: "/Image1.webp",
    alt: "AI + Human Intelligence. AI provides objective insights and evidence, while final decisions remain in the hands of recruiters.",
    label: "AI + Human Intelligence",
  },
  {
    id: "secure",
    image: "/Image2.webp",
    alt: "Secure and Private. Enterprise-grade security with end-to-end encryption; your data stays protected at every step.",
    label: "Secure & Private",
  },
  {
    id: "structured",
    image: "/Image3.webp",
    alt: "Structured and Fair. Every candidate gets the same set of competency-mapped questions in the same order, scored consistently.",
    label: "Structured & Fair",
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
      aria-label="What VerisNova does"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative hidden flex-col justify-center gap-6 border-r border-line bg-surface-1 py-8 lg:flex"
    >
      <span className="mx-8 inline-flex w-fit rounded-full border border-brand-200 bg-surface px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700">
        VerisNova Intelligence
      </span>

      {/* One grid cell holds every slide, so the panel keeps a constant height
          and the artwork crossfades without any layout shift. The frame owns the
          16:9 ratio, so space is reserved before the image decodes and the art
          is shown whole — never cropped, never stretched. */}
      <div className="grid">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="hv-slide col-start-1 row-start-1"
            data-active={index === active}
            aria-hidden={index !== active}
          >
            <div
              className="relative w-full"
              style={{ aspectRatio: `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}` }}
            >
              <Image
                src={slide.image}
                alt={index === active ? slide.alt : ""}
                fill
                priority={index === 0}
                loading="eager"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mx-8 flex items-center gap-2">
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
