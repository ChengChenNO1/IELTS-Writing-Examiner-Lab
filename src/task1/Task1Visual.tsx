import {
  BarVisual,
  ImageVisual,
  LineVisual,
  MapVisual,
  PieVisual,
  ProcessVisual,
  TableVisual,
  Task1VisualSpec
} from "./types";

const W = 520;
const H = 300;
const PAD = { top: 36, right: 24, bottom: 48, left: 52 };

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
}

function LineChart({ visual }: { visual: LineVisual }) {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxY = Math.max(...visual.series.flatMap((s) => s.values)) * 1.1;
  const minY = 0;
  const xStep = innerW / Math.max(visual.xLabels.length - 1, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="task1-chart-svg" role="img" aria-label={visual.title}>
      <text x={W / 2} y={20} textAnchor="middle" className="chart-title">
        {visual.title}
      </text>
      {visual.yLabel && (
        <text x={14} y={H / 2} textAnchor="middle" className="chart-axis-label" transform={`rotate(-90 14 ${H / 2})`}>
          {visual.yLabel}
        </text>
      )}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} className="chart-axis" />
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} className="chart-axis" />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD.top + innerH * (1 - t);
        const val = Math.round(minY + (maxY - minY) * t);
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} className="chart-grid" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="chart-tick">
              {val}
            </text>
          </g>
        );
      })}
      {visual.xLabels.map((label, i) => (
        <text key={label} x={PAD.left + i * xStep} y={H - PAD.bottom + 22} textAnchor="middle" className="chart-tick">
          {label}
        </text>
      ))}
      {visual.series.map((series) => {
        const points = series.values.map((v, i) => {
          const x = PAD.left + i * xStep;
          const y = PAD.top + innerH * (1 - (v - minY) / (maxY - minY));
          return `${x},${y}`;
        });
        return (
          <g key={series.name}>
            <polyline points={points.join(" ")} fill="none" stroke={series.color} strokeWidth={2.5} />
            {series.values.map((v, i) => {
              const x = PAD.left + i * xStep;
              const y = PAD.top + innerH * (1 - (v - minY) / (maxY - minY));
              return <circle key={`${series.name}-${i}`} cx={x} cy={y} r={4} fill={series.color} />;
            })}
          </g>
        );
      })}
      <g transform={`translate(${PAD.left} ${PAD.top - 8})`}>
        {visual.series.map((series, i) => (
          <g key={series.name} transform={`translate(${i * 130} 0)`}>
            <rect width={12} height={12} fill={series.color} rx={2} />
            <text x={18} y={11} className="chart-legend">
              {series.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function BarChart({ visual }: { visual: BarVisual }) {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom - 24;
  const maxY = Math.max(...visual.groups.flatMap((g) => g.values)) * 1.15;
  const groupCount = visual.groups.length;
  const barW = innerW / (groupCount * visual.categories.length + groupCount + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="task1-chart-svg" role="img" aria-label={visual.title}>
      <text x={W / 2} y={20} textAnchor="middle" className="chart-title">
        {visual.title}
      </text>
      <line x1={PAD.left} y1={PAD.top + 8} x2={PAD.left} y2={H - PAD.bottom} className="chart-axis" />
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} className="chart-axis" />
      {visual.groups.map((group, gi) =>
        group.values.map((value, ci) => {
          const x = PAD.left + gi * (visual.categories.length + 1) * barW + ci * barW + barW;
          const h = (value / maxY) * innerH;
          const y = H - PAD.bottom - h;
          const colors = ["#256f5b", "#80ad72", "#4a5568", "#9bb89a"];
          return <rect key={`${group.label}-${ci}`} x={x} y={y} width={barW * 0.85} height={h} fill={colors[ci % colors.length]} rx={2} />;
        })
      )}
      {visual.groups.map((group, gi) => {
        const x = PAD.left + gi * (visual.categories.length + 1) * barW + (visual.categories.length * barW) / 2;
        return (
          <text key={group.label} x={x} y={H - PAD.bottom + 18} textAnchor="middle" className="chart-tick chart-tick-small">
            {group.label.replace(" · ", "\n")}
          </text>
        );
      })}
      <g transform={`translate(${PAD.left} ${PAD.top})`}>
        {visual.categories.map((cat, i) => (
          <g key={cat} transform={`translate(${i * 72} 0)`}>
            <rect width={10} height={10} fill={["#256f5b", "#80ad72", "#4a5568", "#9bb89a"][i]} rx={2} />
            <text x={14} y={10} className="chart-legend">
              {cat}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function PieCharts({ visual }: { visual: PieVisual }) {
  const pieW = (W - 40) / visual.pies.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="task1-chart-svg" role="img" aria-label={visual.title}>
      <text x={W / 2} y={20} textAnchor="middle" className="chart-title">
        {visual.title}
      </text>
      {visual.pies.map((pie, index) => {
        const cx = 40 + pieW * index + pieW / 2;
        const cy = H / 2 + 10;
        const r = 72;
        let angle = 0;
        return (
          <g key={pie.year}>
            <text x={cx} y={48} textAnchor="middle" className="chart-subtitle">
              {pie.year}
            </text>
            {pie.slices.map((slice) => {
              const sweep = (slice.value / 100) * 360;
              const path = arcPath(cx, cy, r, angle, angle + sweep);
              angle += sweep;
              return <path key={slice.label} d={path} fill={slice.color} stroke="#fff" strokeWidth={1} />;
            })}
            <g transform={`translate(${cx - 55} ${cy + r + 18})`}>
              {pie.slices.map((slice, i) => (
                <g key={slice.label} transform={`translate(0 ${i * 16})`}>
                  <rect width={10} height={10} fill={slice.color} rx={2} />
                  <text x={14} y={10} className="chart-legend">
                    {slice.label} ({slice.value}%)
                  </text>
                </g>
              ))}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function DataTable({ visual }: { visual: TableVisual }) {
  return (
    <div className="task1-table-wrap">
      <h3 className="chart-heading">{visual.title}</h3>
      <table className="task1-table">
        <thead>
          <tr>
            {visual.headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visual.rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MapCompare({ visual }: { visual: MapVisual }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="task1-chart-svg" role="img" aria-label={visual.title}>
      <text x={W / 2} y={20} textAnchor="middle" className="chart-title">
        {visual.title}
      </text>
      {[0, 1].map((side) => {
        const x = side === 0 ? 30 : W / 2 + 10;
        const label = side === 0 ? visual.beforeLabel : visual.afterLabel;
        const features = side === 0 ? visual.beforeFeatures : visual.afterFeatures;
        return (
          <g key={label}>
            <text x={x + 110} y={44} textAnchor="middle" className="chart-subtitle">
              {label}
            </text>
            <rect x={x} y={56} width={220} height={180} rx={8} className="map-frame" />
            {features.map((f, i) => (
              <g key={f}>
                <rect x={x + 16} y={72 + i * 28} width={12} height={12} fill={side === 0 ? "#9bb89a" : "#256f5b"} rx={2} />
                <text x={x + 36} y={83 + i * 28} className="chart-legend">
                  {f}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function ProcessFlow({ visual }: { visual: ProcessVisual }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="task1-chart-svg" role="img" aria-label={visual.title}>
      <text x={W / 2} y={20} textAnchor="middle" className="chart-title">
        {visual.title}
      </text>
      {visual.steps.map((step, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 40 + col * 160;
        const y = 56 + row * 88;
        return (
          <g key={step}>
            <rect x={x} y={y} width={140} height={52} rx={8} className="process-box" />
            <text x={x + 70} y={y + 30} textAnchor="middle" className="chart-legend">
              {step}
            </text>
            {i < visual.steps.length - 1 && col < 2 && (
              <text x={x + 148} y={y + 30} className="process-arrow">
                →
              </text>
            )}
            {i < visual.steps.length - 1 && col === 2 && row === 0 && (
              <text x={x + 70} y={y + 68} textAnchor="middle" className="process-arrow">
                ↓
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ExternalImage({ visual }: { visual: ImageVisual }) {
  return (
    <figure className="task1-image-wrap">
      <img src={visual.src} alt={visual.alt} loading="lazy" referrerPolicy="no-referrer" />
      {visual.source && <figcaption>Source: {visual.source}</figcaption>}
    </figure>
  );
}

export function Task1Visual({ visual }: { visual: Task1VisualSpec }) {
  switch (visual.kind) {
    case "line":
      return <LineChart visual={visual} />;
    case "bar":
      return <BarChart visual={visual} />;
    case "pie":
      return <PieCharts visual={visual} />;
    case "table":
      return <DataTable visual={visual} />;
    case "map":
      return <MapCompare visual={visual} />;
    case "process":
      return <ProcessFlow visual={visual} />;
    case "image":
      return <ExternalImage visual={visual} />;
    default:
      return null;
  }
}
