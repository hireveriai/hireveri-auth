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
          className="object-cover object-[68%_center] opacity-100 brightness-[0.82] contrast-[1.18] saturate-110 blur-[1px] scale-[1.02]"
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.54) 0%, rgba(0,0,0,0.38) 45%, rgba(0,0,0,0.24) 100%)",
        }}
      />
      <div
        className="absolute inset-y-0 left-0 w-[72%]"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.78) 40%, rgba(0,0,0,0.18) 100%)",
        }}
      />

      <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-sky-400/8 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_48%,rgba(0,200,255,0.12),transparent_30%)]" />

      <div className="relative flex max-w-[500px] flex-col justify-center gap-4">
        <span className="inline-flex w-fit rounded-full border border-cyan-300/16 bg-cyan-300/8 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-100/82">
          HireVeri Intelligence
        </span>

        <h3 className="text-4xl font-semibold leading-tight text-white md:text-[2.8rem]">
          AI-led structured interviews with reviewable integrity and competency evidence
        </h3>

        <p className="text-base leading-7 text-white/78 md:text-lg">
          Detect fraud signals. Analyze real behavior. Make confident hiring
          decisions.
        </p>
      </div>
    </section>
  );
}
