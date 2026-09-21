/*
  Two tiny hand-made charts (no chart library needed):
    <AreaChart>  the smooth green "Report for this week" line
    <Bars>       the maroon "users per minute" bars
*/
import { useEffect, useRef, useState } from "react";
import { cx } from "./fmt";

const PLATEAU = 0.26; // how long each day's value stays flat, as a share of the gap between days

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setWidth(Math.max(280, Math.round(el.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

export function AreaChart({
  data, // [{ label: "Sun", value: 15000, tip: "Thursday" }]
  ticks, // [0, 10000, ...] (bottom to top)
  formatTick = (t) => t,
  formatTip = (v) => v,
  active,
  onActive,
  height = 300,
  className,
}) {
  const [ref, width] = useWidth();
  const n = data.length;
  const pad = { left: 62, right: 12, top: 34, bottom: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const top = ticks[ticks.length - 1] || 1;
  const inset = plotW * 0.035;
  const step = n > 1 ? (plotW - inset * 2) / (n - 1) : 0;
  const xs = data.map((_, i) => pad.left + inset + i * step);
  const ys = data.map((d) => pad.top + plotH - (Math.max(0, d.value ?? 0) / top) * plotH);
  const w = step * PLATEAU;
  const baseY = pad.top + plotH;

  // days that haven't happened yet have value == null: the line simply stops at the last real day
  let last = data.length - 1;
  while (last > 0 && data[last].value == null) last -= 1;
  const reachesEnd = last === n - 1;
  const endX = reachesEnd ? pad.left + plotW : xs[last] + w;

  // flat stretch at each value, smooth ramp between neighbours
  let line = `M ${pad.left} ${ys[0]} L ${xs[0] + w} ${ys[0]}`;
  for (let i = 0; i < last; i += 1) {
    const x0 = xs[i] + w;
    const x1 = xs[i + 1] - w;
    const mid = (x0 + x1) / 2;
    line += ` C ${mid} ${ys[i]}, ${mid} ${ys[i + 1]}, ${x1} ${ys[i + 1]} L ${xs[i + 1] + w} ${ys[i + 1]}`;
  }
  line += ` L ${endX} ${ys[last]}`;
  const area = `${line} L ${endX} ${baseY} L ${pad.left} ${baseY} Z`;

  const idx = active ?? -1;
  const gradId = `a-area-${n}-${Math.round(top)}`;

  function pick(clientX) {
    const box = ref.current.getBoundingClientRect();
    const x = clientX - box.left;
    let best = 0;
    xs.forEach((px, i) => {
      if (Math.abs(px - x) < Math.abs(xs[best] - x)) best = i;
    });
    onActive?.(best);
  }

  return (
    <div ref={ref} className={cx("relative w-full select-none", className)} style={{ height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Chart"
        onMouseMove={(e) => pick(e.clientX)}
        onClick={(e) => pick(e.clientX)}
        className="block overflow-visible"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ea674" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#4ea674" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* left + right edges of the plot */}
        <line x1={pad.left} x2={pad.left} y1={pad.top - 8} y2={baseY} stroke="#d9dadb" />
        <line x1={pad.left + plotW} x2={pad.left + plotW} y1={pad.top - 8} y2={baseY} stroke="#d9dadb" />

        {/* y labels */}
        {ticks.map((t) => {
          const y = pad.top + plotH - (t / top) * plotH;
          return (
            <text key={t} x={pad.left - 12} y={y + 5} textAnchor="end" fontSize="14" fill="#7d9296">
              {formatTick(t)}
            </text>
          );
        })}

        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke="#4ea674" strokeWidth="2" strokeLinejoin="round" />

        {/* x labels */}
        {data.map((d, i) => (
          <text
            key={d.label}
            x={xs[i]}
            y={height - 8}
            textAnchor="middle"
            fontSize="13"
            fill={i === idx ? "#023337" : "#8b9a9d"}
            fontWeight={i === idx ? 700 : 400}
          >
            {d.label}
          </text>
        ))}

        {idx >= 0 && (
          <g className="a-pop" key={idx}>
            <line
              x1={xs[idx]}
              x2={xs[idx]}
              y1={ys[idx]}
              y2={baseY}
              stroke="#4ea674"
              strokeDasharray="3 3"
              strokeWidth="1.5"
              opacity="0.7"
            />
            <circle cx={xs[idx]} cy={ys[idx]} r="4" fill="#fff" stroke="#4ea674" strokeWidth="1.5" />
            <g transform={`translate(${Math.min(Math.max(xs[idx], pad.left + 44), pad.left + plotW - 44)}, ${Math.max(ys[idx] - 62, 2)})`}>
              <rect x="-46" y="0" width="92" height="44" rx="6" fill="#c1e6ba" stroke="#4ea674" strokeWidth="0.8" />
              <path d="M -6 44 L 0 51 L 6 44 Z" fill="#c1e6ba" stroke="#4ea674" strokeWidth="0.8" />
              <path d="M -5 43.4 L 5 43.4" stroke="#c1e6ba" strokeWidth="2" />
              <text x="0" y="19" textAnchor="middle" fontSize="13" fill="#023337">
                {data[idx].tip || data[idx].label}
              </text>
              <text x="0" y="35" textAnchor="middle" fontSize="13" fill="#023337">
                {formatTip(data[idx].value ?? 0)}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

export function Bars({ values, height = 38, className }) {
  const max = Math.max(...values, 1);
  return (
    <div className={cx("flex items-end gap-[5px]", className)} style={{ height }} aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-[1px] bg-[var(--a-maroon)]"
          style={{ height: `${Math.max(14, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
