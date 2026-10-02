import React, { useState } from 'react';

interface HistogramChartProps {
  bins: { binStart: number; binEnd: number; count: number }[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  height?: number;
  highlightZero?: boolean;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
  bins,
  title,
  xLabel,
  yLabel = 'Frequency',
  color = '#38bdf8',
  height = 240,
  highlightZero = false,
}) => {
  const [hoveredBin, setHoveredBin] = useState<{ binStart: number; binEnd: number; count: number } | null>(null);

  if (!bins || bins.length === 0) {
    return <div className="p-4 text-center text-slate-500">No histogram data</div>;
  }

  const maxCount = Math.max(...bins.map(b => b.count), 1);
  const chartWidth = 640;
  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const slotWidth = innerWidth / bins.length;
  const barWidth = Math.max(3, slotWidth - 2);

  // Y-axis ticks
  const yTicks = [0, Math.round(maxCount * 0.5), maxCount];

  // Zero position for error plots
  let zeroX: number | null = null;
  if (highlightZero) {
    const minVal = bins[0].binStart;
    const maxVal = bins[bins.length - 1].binEnd;
    if (minVal <= 0 && maxVal >= 0) {
      zeroX = paddingLeft + ((0 - minVal) / (maxVal - minVal)) * innerWidth;
    }
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
          <span className="text-xs text-slate-400">Total samples: {bins.reduce((a, b) => a + b.count, 0)}</span>
        </div>
      )}

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full select-none"
          style={{ minWidth: 480 }}
          onMouseLeave={() => setHoveredBin(null)}
        >
          {/* Y ticks & grid */}
          {yTicks.map((val, idx) => {
            const y = paddingTop + innerHeight - (val / maxCount) * innerHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + innerWidth}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Zero bias line if applicable */}
          {zeroX !== null && (
            <g>
              <line
                x1={zeroX}
                y1={paddingTop}
                x2={zeroX}
                y2={paddingTop + innerHeight}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              <text
                x={zeroX}
                y={paddingTop - 6}
                textAnchor="middle"
                className="text-[9px] fill-rose-400 font-semibold"
              >
                0 Error (Ideal)
              </text>
            </g>
          )}

          {/* Histogram Bars */}
          {bins.map((b, i) => {
            const barH = (b.count / maxCount) * innerHeight;
            const x = paddingLeft + i * slotWidth + 1;
            const y = paddingTop + innerHeight - barH;
            const isHovered = hoveredBin === b;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredBin(b)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(1, barH)}
                  fill={isHovered ? '#38bdf8' : color}
                  fillOpacity={isHovered ? 0.95 : 0.75}
                  rx={2}
                />
              </g>
            );
          })}

          {/* X axis labels (sparse) */}
          {bins.map((b, i) => {
            const step = Math.max(1, Math.floor(bins.length / 6));
            if (i % step !== 0 && i !== bins.length - 1) return null;
            const x = paddingLeft + i * slotWidth + barWidth / 2;
            return (
              <text
                key={`lbl-${i}`}
                x={x}
                y={height - 12}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {b.binStart}
              </text>
            );
          })}

          {xLabel && (
            <text
              x={paddingLeft + innerWidth / 2}
              y={height - 1}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 uppercase tracking-wider"
            >
              {xLabel}
            </text>
          )}

          {yLabel && (
            <text
              x={14}
              y={paddingTop + innerHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90 14 ${paddingTop + innerHeight / 2})`}
              className="text-[10px] fill-slate-400 uppercase tracking-wider"
            >
              {yLabel}
            </text>
          )}
        </svg>

        {hoveredBin && (
          <div className="absolute top-2 right-4 bg-slate-800/95 border border-slate-700 backdrop-blur rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none">
            <div className="text-slate-400">
              Bin Range: <span className="font-mono text-cyan-300 font-bold">{hoveredBin.binStart}</span> to{' '}
              <span className="font-mono text-cyan-300 font-bold">{hoveredBin.binEnd}</span>
            </div>
            <div className="text-slate-300">
              Count: <span className="font-mono font-bold text-white">{hoveredBin.count}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
