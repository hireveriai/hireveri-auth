import Image from "next/image";

const slides = [
  {
    title: "AI-led structured interviews.",
    body: "Detect fraud signals, analyze real behavior, and make confident hiring decisions.",
  },
];

export default function AuthVisualPanel() {
  const active = slides[0];

  return (
    <section className="relative hidden overflow-hidden bg-[#061020] lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-0">
        <Image
          src="/Dashboard.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-[62%_center] brightness-[0.6] contrast-[1.15] saturate-110"
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(6,16,32,0.55) 0%, rgba(6,16,32,0.78) 55%, rgba(6,16,32,0.94) 100%)",
        }}
      />

      <div className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-sky-500/12 blur-3xl" />

      <div className="relative px-12 pt-14">
        <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100/85">
          HireVeri Intelligence
        </span>
      </div>

      <div className="relative px-12 pb-14 text-center">
        <h2 className="text-[26px] font-semibold leading-snug text-white">
          {active.title}
        </h2>

        <p className="mx-auto mt-3 max-w-[380px] text-sm leading-6 text-white/70">
          {active.body}
        </p>

        <div className="mt-7 flex items-center justify-center gap-2" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-cyan-300" />
          <span className="h-2 w-2 rounded-full bg-white/25" />
          <span className="h-2 w-2 rounded-full bg-white/25" />
        </div>
      </div>
    </section>
  );
}
