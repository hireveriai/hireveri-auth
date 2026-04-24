type RecruiterVisualPreviewProps = {
  className?: string;
};

export default function RecruiterVisualPreview({
  className = "",
}: RecruiterVisualPreviewProps) {
  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(3,11,22,0.28)] backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent" />
      <div className="pointer-events-none absolute -left-10 top-10 h-36 w-36 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative">
        <h3 className="text-2xl font-semibold text-white">
          AI Hiring Decision
        </h3>
        <p className="mt-2 text-sm text-white/58">
          Confidence · Risk · Verdict
        </p>
      </div>

      <div className="relative mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.95fr)]">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#060b12] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_44%)]" />

          <div className="relative flex min-h-[320px] flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/62">
                Candidate Visual
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                Live Review
              </span>
            </div>

            <div className="mt-8 flex flex-1 items-center justify-center">
              <div className="relative flex h-[210px] w-[168px] items-center justify-center rounded-[34px] border border-white/10 bg-white/[0.04] shadow-[0_22px_60px_rgba(6,12,18,0.45)]">
                <div className="absolute inset-x-6 top-5 h-2 rounded-full bg-white/6" />
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-b from-cyan-100/22 to-white/5 shadow-[0_10px_30px_rgba(34,211,238,0.08)]" />
                  <div className="h-24 w-28 rounded-t-[30px] bg-gradient-to-b from-cyan-100/14 to-white/[0.03]" />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/38">
                  Behavioral read
                </p>
                <p className="mt-2 text-lg font-medium text-white">
                  Calm, consistent delivery
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/6 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/38">
                  Interview signal
                </p>
                <p className="mt-2 text-lg font-medium text-white">
                  Strong answer clarity
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-cyan-400/16 bg-white/6 p-5 shadow-[0_18px_44px_rgba(3,11,22,0.18)] backdrop-blur-sm">
            <p className="text-sm text-white/54">Confidence</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span className="text-5xl font-semibold tracking-tight text-cyan-200">
                72%
              </span>
              <span className="rounded-full border border-cyan-400/18 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                Stable signal
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/16 bg-white/6 p-5 shadow-[0_18px_44px_rgba(3,11,22,0.18)] backdrop-blur-sm">
            <p className="text-sm text-white/54">Risk</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span className="text-4xl font-semibold tracking-tight text-emerald-200">
                LOW
              </span>
              <span className="rounded-full border border-emerald-400/18 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                Green
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/6 p-5 shadow-[0_18px_44px_rgba(3,11,22,0.18)] backdrop-blur-sm">
            <p className="text-sm text-white/54">Verdict</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span className="text-4xl font-bold tracking-[0.18em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.14)]">
                HIRE
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70">
                Explainable AI
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="relative mt-8 max-w-3xl text-sm leading-6 text-white/52">
        Clear, explainable hiring decisions powered by real-time behavioral
        signals.
      </p>
    </div>
  );
}
