import Image from "next/image";

type RecruiterVisualPreviewProps = {
  className?: string;
  imageUrl?: string;
};

const defaultHeroImage = "/Dashboard.png";

export default function RecruiterVisualPreview({
  className = "",
  imageUrl = defaultHeroImage,
}: RecruiterVisualPreviewProps) {
  return (
    <section
      className={`relative flex min-h-[420px] items-center overflow-hidden rounded-2xl border border-white/10 bg-[#050a11] p-8 shadow-[0_0_120px_rgba(0,200,255,0.15)] ${className}`.trim()}
    >
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-center opacity-95 brightness-[0.68] contrast-110 blur-[2px] scale-[1.03]"
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-400/8 blur-3xl" />

      <div className="relative flex max-w-[500px] flex-col justify-center gap-4">
        <span className="inline-flex w-fit rounded-full border border-cyan-300/16 bg-cyan-300/8 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-100/82">
          HireVeri Intelligence
        </span>

        <h3 className="text-4xl font-semibold leading-tight text-white md:text-[2.8rem]">
          Cognitive Forensic Hiring System
        </h3>

        <p className="text-base leading-7 text-white/78 md:text-lg">
          Detect fraud signals. Analyze real behavior. Make confident hiring
          decisions.
        </p>
      </div>
    </section>
  );
}
