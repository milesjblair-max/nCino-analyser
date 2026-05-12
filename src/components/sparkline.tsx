// Tiny inline SVG sparkline. No library. Pass numeric values; we scale
// to width × height. If <2 points, render a dot.

type Props = {
  values: number[];
  width?: number;
  height?: number;
  min?: number;
  max?: number;
};

export function Sparkline({ values, width = 120, height = 28, min, max }: Props) {
  if (!values.length) {
    return <span className="text-stone-400 text-xs">no data</span>;
  }
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const range = hi - lo || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - lo) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="inline-block align-middle">
      {values.length > 1 ? (
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
        />
      ) : (
        <circle cx={width / 2} cy={height / 2} r="2" fill="currentColor" />
      )}
    </svg>
  );
}
