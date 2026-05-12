// Multi-line trend chart for the four scores: stress, anxiety, depressive
// load, presence. Plain SVG, no library. Width fills the parent (viewBox).
// To change the lines or colours, edit SCORE_SPEC at the top.

import { numericSeries } from "../lib/kpi";

const W = 320;
const H = 160;
const PAD_L = 24;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 18;

type Spec = {
  kpiId: string;
  label: string;
  stroke: string;
  legendBg: string;
  legendText: string;
};

const SCORE_SPEC: Spec[] = [
  { kpiId: "stress_score", label: "Stress", stroke: "#be123c", legendBg: "bg-rose-100", legendText: "text-rose-800" },
  { kpiId: "anxiety_score", label: "Anxiety", stroke: "#b45309", legendBg: "bg-amber-100", legendText: "text-amber-800" },
  { kpiId: "depressive_load", label: "Depressive load", stroke: "#6b21a8", legendBg: "bg-purple-100", legendText: "text-purple-800" },
  { kpiId: "presence_score", label: "Presence", stroke: "#047857", legendBg: "bg-emerald-100", legendText: "text-emerald-800" },
];

export function ScoreChart({ windowSize = 28 }: { windowSize?: number }) {
  // Gather all data points; bail out empty if nothing logged.
  const series = SCORE_SPEC.map((s) => {
    const all = numericSeries(s.kpiId);
    const recent = all.slice(Math.max(0, all.length - windowSize));
    return { spec: s, points: recent };
  });

  const hasAny = series.some((s) => s.points.length > 0);
  if (!hasAny) {
    return (
      <div className="text-sm text-stone-500 px-3 py-6 text-center border border-stone-200 rounded bg-stone-50">
        No score data yet. Add a bi-daily log to start the trend.
      </div>
    );
  }

  // X axis spans windowSize indices (we plot by entry order, not by date,
  // because entries are roughly evenly spaced and gaps would distort lines).
  const maxLen = Math.max(...series.map((s) => s.points.length), 2);
  const yMin = 1;
  const yMax = 10;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  function xAt(i: number, n: number) {
    if (n <= 1) return PAD_L + innerW / 2;
    return PAD_L + (i / (n - 1)) * innerW;
  }
  function yAt(v: number) {
    return PAD_T + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  }

  // Reference lines at y=3,5,7
  const refY = [3, 5, 7];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        {/* Reference lines */}
        {refY.map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yAt(v)} y2={yAt(v)} stroke="#e7e5e4" strokeWidth="0.5" />
            <text x={4} y={yAt(v) + 3} fontSize="8" fill="#a8a29e">
              {v}
            </text>
          </g>
        ))}
        {/* Y axis edges */}
        <line x1={PAD_L} x2={W - PAD_R} y1={yAt(yMin)} y2={yAt(yMin)} stroke="#d6d3d1" strokeWidth="0.5" />
        <line x1={PAD_L} x2={W - PAD_R} y1={yAt(yMax)} y2={yAt(yMax)} stroke="#d6d3d1" strokeWidth="0.5" />
        <text x={4} y={yAt(yMin) + 3} fontSize="8" fill="#a8a29e">{yMin}</text>
        <text x={4} y={yAt(yMax) + 3} fontSize="8" fill="#a8a29e">{yMax}</text>

        {/* X axis label */}
        <text x={PAD_L} y={H - 4} fontSize="8" fill="#a8a29e">
          oldest
        </text>
        <text x={W - PAD_R} y={H - 4} fontSize="8" fill="#a8a29e" textAnchor="end">
          latest
        </text>

        {/* Lines */}
        {series.map(({ spec, points }) => {
          if (!points.length) return null;
          const pts = points
            .map((p, i) => `${xAt(i, points.length).toFixed(1)},${yAt(p.value).toFixed(1)}`)
            .join(" ");
          return (
            <g key={spec.kpiId}>
              {points.length > 1 ? (
                <polyline fill="none" stroke={spec.stroke} strokeWidth="1.4" points={pts} />
              ) : null}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={xAt(i, points.length)}
                  cy={yAt(p.value)}
                  r="1.6"
                  fill={spec.stroke}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend with latest values */}
      <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs">
        {series.map(({ spec, points }) => {
          const last = points.length ? points[points.length - 1].value : null;
          return (
            <div
              key={spec.kpiId}
              className={"flex items-center justify-between px-2 py-1 rounded " + spec.legendBg}
            >
              <span className={"flex items-center gap-1.5 " + spec.legendText}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: spec.stroke }} />
                {spec.label}
              </span>
              <span className={"font-mono " + spec.legendText}>{last ?? "—"}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-stone-500 mt-2">
        x-axis is entry order, last {maxLen} bi-daily log{maxLen === 1 ? "" : "s"} · y-axis 1–10 peak.
      </p>
    </div>
  );
}
