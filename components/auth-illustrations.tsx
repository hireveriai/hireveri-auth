/**
 * Diagrams for the sign-in visual panel.
 *
 * These are deliberately not product screenshots: at this size a screenshot is
 * unreadable, and it pulls attention away from the form. Each one shows the
 * mechanism behind its slide instead. All colours come from the theme tokens,
 * so they stay in step with the rest of the app.
 */

const brand = "var(--color-brand-600)";
const brandMid = "var(--color-brand-300)";
const brandSoft = "var(--color-brand-50)";
const brandLine = "var(--color-brand-200)";
const line = "var(--color-line-strong)";
const ink = "var(--color-ink-strong)";
const inkMuted = "var(--color-ink-muted)";
const surface = "var(--color-surface)";

type ArtProps = { className?: string };

const svgProps = {
  viewBox: "0 0 320 180",
  role: "img" as const,
  "aria-hidden": true,
  preserveAspectRatio: "xMidYMid meet",
};

/** Same questions, same rubric — a matrix of candidates against questions. */
export function StructuredInterviewArt({ className = "" }: ArtProps) {
  const columns = [136, 196, 256];
  const rows = [58, 100, 142];
  const scores = [
    [3, 2, 3],
    [2, 3, 2],
    [3, 3, 2],
  ];

  return (
    <svg {...svgProps} className={className}>
      {columns.map((x, i) => (
        <text
          key={x}
          x={x + 26}
          y={32}
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill={inkMuted}
          letterSpacing="0.08em"
        >
          {`Q${i + 1}`}
        </text>
      ))}

      <line x1="24" y1="40" x2="296" y2="40" stroke={line} strokeWidth="1" />

      {rows.map((y, r) => (
        <g key={y}>
          <circle cx="38" cy={y} r="10" fill={brandSoft} stroke={brandLine} />
          <circle cx="38" cy={y - 3} r="3.2" fill={brand} />
          <path
            d={`M32.5 ${y + 6} a6 5 0 0 1 11 0`}
            fill={brand}
            opacity="0.75"
          />

          <rect x="56" y={y - 7} width="52" height="6" rx="3" fill={ink} opacity="0.72" />
          <rect x="56" y={y + 3} width="34" height="5" rx="2.5" fill={inkMuted} opacity="0.45" />

          {columns.map((x, c) => (
            <g key={x}>
              <rect
                x={x}
                y={y - 14}
                width="52"
                height="28"
                rx="7"
                fill={surface}
                stroke={brandLine}
              />
              {[0, 1, 2].map((d) => (
                <rect
                  key={d}
                  x={x + 13 + d * 9}
                  y={y - 3}
                  width="6"
                  height="6"
                  rx="1.6"
                  fill={d < scores[r][c] ? brand : brandLine}
                />
              ))}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

/** Signals raised during the interview, each one carrying its evidence. */
export function IntegritySignalArt({ className = "" }: ArtProps) {
  const marks = [
    { x: 108, risk: false },
    { x: 176, risk: true },
    { x: 244, risk: false },
  ];

  return (
    <svg {...svgProps} className={className}>
      <path
        d="M46 26 h44 a8 8 0 0 1 8 8 v18 a8 8 0 0 1-8 8 h-30 l-10 10 v-10 h-4 a8 8 0 0 1-8-8 V34 a8 8 0 0 1 8-8Z"
        fill={brandSoft}
        stroke={brandLine}
      />
      <rect x="54" y="38" width="30" height="4.5" rx="2.25" fill={brand} opacity="0.8" />
      <rect x="54" y="47" width="20" height="4.5" rx="2.25" fill={brand} opacity="0.4" />

      <line x1="24" y1="104" x2="296" y2="104" stroke={line} strokeWidth="1" strokeDasharray="3 4" />

      <path
        d="M24 104 q10-16 20 0 t20 0 q10-22 20 0 t20 0 q10-30 20 0 t20 0 q10-14 20 0 t20 0 q10-24 20 0 t20 0 q10-12 20 0 t20 0"
        fill="none"
        stroke={brandMid}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {marks.map(({ x, risk }) => (
        <g key={x}>
          <line
            x1={x}
            y1="104"
            x2={x}
            y2="134"
            stroke={risk ? "var(--color-signal-risk)" : brandLine}
            strokeWidth="1.5"
          />
          <circle
            cx={x}
            cy="104"
            r="5"
            fill={surface}
            stroke={risk ? "var(--color-signal-risk)" : brand}
            strokeWidth="2"
          />
          <rect
            x={x - 30}
            y="136"
            width="60"
            height="22"
            rx="6"
            fill={surface}
            stroke={risk ? "var(--color-signal-risk)" : brandLine}
          />
          <rect
            x={x - 21}
            y="143"
            width="30"
            height="4"
            rx="2"
            fill={risk ? "var(--color-signal-risk)" : brand}
            opacity="0.75"
          />
          <rect x={x - 21} y="150" width="18" height="3" rx="1.5" fill={inkMuted} opacity="0.45" />
        </g>
      ))}
    </svg>
  );
}

/** The reviewable record: competency scores next to the evidence behind them. */
export function EvidenceRecordArt({ className = "" }: ArtProps) {
  const competencies = [
    { label: 62, fill: 0.86 },
    { label: 48, fill: 0.64 },
    { label: 56, fill: 0.74 },
    { label: 40, fill: 0.42 },
  ];

  return (
    <svg {...svgProps} className={className}>
      <rect x="24" y="26" width="150" height="128" rx="10" fill={surface} stroke={line} />
      <rect x="38" y="42" width="46" height="5" rx="2.5" fill={ink} opacity="0.7" />

      {competencies.map((c, i) => {
        const y = 66 + i * 22;
        const trackWidth = 118;

        return (
          <g key={y}>
            <rect x="38" y={y} width={c.label} height="4" rx="2" fill={inkMuted} opacity="0.4" />
            <rect x="38" y={y + 8} width={trackWidth} height="7" rx="3.5" fill={brandSoft} />
            <rect
              x="38"
              y={y + 8}
              width={trackWidth * c.fill}
              height="7"
              rx="3.5"
              fill={i === 3 ? brandMid : brand}
            />
          </g>
        );
      })}

      <rect x="190" y="26" width="106" height="128" rx="10" fill={brandSoft} stroke={brandLine} />
      <circle cx="243" cy="62" r="18" fill={surface} stroke={brand} strokeWidth="2" />
      <path
        d="m235 62 5.5 5.5L252 56"
        fill="none"
        stroke={brand}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {[96, 110, 124, 138].map((y, i) => (
        <rect
          key={y}
          x="204"
          y={y}
          width={i % 2 === 0 ? 78 : 58}
          height="5"
          rx="2.5"
          fill={brand}
          opacity={i === 0 ? 0.55 : 0.3}
        />
      ))}
    </svg>
  );
}
