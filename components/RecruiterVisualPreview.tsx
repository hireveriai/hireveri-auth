const waveformBars = [22, 34, 18, 44, 28, 52, 24, 36, 20, 30, 16, 40];

const stressClarityBars = [
  { stress: 28, clarity: 58 },
  { stress: 36, clarity: 64 },
  { stress: 44, clarity: 56 },
  { stress: 30, clarity: 70 },
  { stress: 48, clarity: 62 },
  { stress: 34, clarity: 74 },
  { stress: 40, clarity: 68 },
  { stress: 26, clarity: 78 },
];

const fraudSpikes = [
  { left: "17%", height: "42%" },
  { left: "39%", height: "68%" },
  { left: "63%", height: "52%" },
  { left: "82%", height: "76%" },
];

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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="pointer-events-none absolute -left-10 top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold tracking-[0.18em] text-white">
            Live AI Interview Analysis
          </h3>
          <p className="mt-1 text-xs text-white/55">
            Confidence · Risk · Fraud Signals · Verdict
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.35)]" />
          Live
        </div>
      </div>

      <div className="relative mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.95fr)]">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#050a11] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_40%)]" />

          <div className="relative flex min-h-[228px] flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-white/45">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                Candidate Live Feed
              </span>
              <span>Session 04 · 21:48</span>
            </div>

            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/65">
                  Voice cadence + gaze stability
                </p>

                <div className="mt-5 flex items-end gap-1.5">
                  {waveformBars.map((height, index) => (
                    <div
                      key={`${height}-${index}`}
                      className="w-2 rounded-full bg-gradient-to-t from-cyan-500/80 via-cyan-300/60 to-white/70"
                      style={{ height }}
                    />
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 text-[11px] text-white/52">
                  <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-2">
                    Eye lock
                    <div className="mt-1 text-sm font-medium text-white">
                      Stable
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-2">
                    Response lag
                    <div className="mt-1 text-sm font-medium text-white">
                      1.2s
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-white/5 px-3 py-2">
                    Speech drift
                    <div className="mt-1 text-sm font-medium text-white">
                      Minimal
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-auto flex h-28 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/5 shadow-[0_14px_40px_rgba(5,14,24,0.45)]">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-b from-cyan-100/20 to-white/5" />
                  <div className="h-11 w-14 rounded-t-[18px] bg-gradient-to-b from-cyan-100/12 to-white/5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-white/10 bg-white/6 p-4 shadow-[0_12px_40px_rgba(3,11,22,0.16)] backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">
              Confidence Score
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span className="text-3xl font-semibold text-white">72%</span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-100">
                +8 this round
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-sky-500 via-cyan-300 to-blue-500" />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/6 p-4 shadow-[0_12px_40px_rgba(3,11,22,0.16)] backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">
              Risk Level
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-xl font-semibold text-white">LOW</span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
                Green
              </span>
            </div>
            <p className="mt-3 text-xs text-white/52">
              Identity, screen presence, and cadence all fall within expected
              thresholds.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/6 p-4 shadow-[0_12px_40px_rgba(3,11,22,0.16)] backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">
              AI Verdict
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <span className="text-2xl font-bold tracking-[0.22em] text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.18)]">
                HIRE
              </span>
              <span className="text-xs text-white/50">Decision confidence 0.84</span>
            </div>
            <p className="mt-3 text-xs text-white/52">
              Strong delivery, low fraud exposure, and consistent composure
              under follow-up questioning.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">
            AI Timeline Analysis
          </p>
          <span className="text-[11px] text-white/35">Fraud markers surfaced in red</span>
        </div>

        <div className="relative mt-4 h-10">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-white/10 via-cyan-300/30 to-white/10" />

          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-1">
            {Array.from({ length: 11 }).map((_, index) => (
              <span
                key={index}
                className="h-2 w-px bg-white/15"
              />
            ))}
          </div>

          {fraudSpikes.map((spike, index) => (
            <div
              key={`${spike.left}-${index}`}
              className="absolute bottom-1/2 w-px -translate-x-1/2 bg-red-400/90 shadow-[0_0_12px_rgba(248,113,113,0.24)]"
              style={{ left: spike.left, height: spike.height }}
            >
              <span className="absolute -top-1.5 -left-[3px] h-2.5 w-2.5 rounded-full border border-red-300/50 bg-red-400/90" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/48">
            Stress vs Clarity
          </p>
          <div className="flex items-center gap-3 text-[11px] text-white/42">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Clarity
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400/80" />
              Stress
            </span>
          </div>
        </div>

        <div className="mt-5 flex h-28 items-end justify-between gap-2">
          {stressClarityBars.map((bar, index) => (
            <div
              key={`${bar.stress}-${bar.clarity}-${index}`}
              className="flex flex-1 items-end justify-center gap-1"
            >
              <div
                className="w-2.5 rounded-t-full bg-gradient-to-t from-rose-500/75 to-rose-300/85"
                style={{ height: `${bar.stress}%` }}
              />
              <div
                className="w-2.5 rounded-t-full bg-gradient-to-t from-cyan-500/80 to-cyan-200/95"
                style={{ height: `${bar.clarity}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <p className="relative mt-4 text-xs text-white/42">
        Real-time cognitive signals. Forensic hiring decisions.
      </p>
    </div>
  );
}
