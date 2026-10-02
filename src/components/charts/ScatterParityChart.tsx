import React, { useState } from 'react';

interface ScatterParityChartProps {
  data: { actual: number; predicted: number }[];
  title?: string;
  height?: number;
}

export const ScatterParityChart: React.FC<ScatterParityChartProps> = ({
  data,
  title = 'Actual vs Predicted Electricity Demand (Parity Plot)',
  height = 300,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ actual: number; predicted: number } | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-slate-500">No scatter data</div>;
  }

  const allVals = data.flatMap(d => [d.actual, d.predicted]);
  const minVal = Math.floor(Math.min(...allVals) * 0.95);
  const maxVal = Math.ceil(Math.max(...allVals) * 1.05);
  const range = maxVal - minVal || 1;

  const size = Math.min(460, height);
  const padding = 45;
  const innerSize = size - padding * 2;

  const getCoord = (val: number) => {
    return padding + innerSize - ((val - minVal) / range) * innerSize;
  };

  const ticks = [minVal, Math.round(minVal + range * 0.33), Math.round(minVal + range * 0.66), maxVal];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
        <span className="text-xs text-amber-400 font-mono">Dashed Line: y = x (Ideal)</span>
      </div>

      <div className="flex justify-center relative">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="select-none"
          style={{ width: size, height: size }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Grid lines */}
          {ticks.map(t => {
            const pos = getCoord(t);
            return (
              <g key={t}>
                {/* Horizontal */}
                <line
                  x1={padding}
                  y1={pos}
                  x2={padding + innerSize}
                  y2={pos}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <text
                  x={padding - 6}
                  y={pos + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {t}
                </text>
                {/* Vertical */}
                <line
                  x1={pos}
                  y1={padding}
                  x2={pos}
                  y2={padding + innerSize}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <text
                  x={pos}
                  y={padding + innerSize + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* 45-degree reference line */}
          <line
            x1={padding}
            y1={padding + innerSize}
            x2={padding + innerSize}
            y2={padding}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={1.8}
          />

          {/* Scatter points */}
          {data.map((pt, i) => {
            const cx = padding + ((pt.actual - minVal) / range) * innerSize;
            const cy = getCoord(pt.predicted);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={3}
                fill="#38bdf8"
                fillOpacity={0.6}
                stroke="#0284c7"
                strokeWidth={0.5}
                className="hover:scale-150 transition-transform cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
              />
            );
          })}

          {/* Axis Titles */}
          <text
            x={padding + innerSize / 2}
            y={size - 6}
            textAnchor="middle"
            className="text-[10px] fill-slate-400 uppercase tracking-wider"
          >
            Actual Demand (MW)
          </text>
          <text
            x={12}
            y={padding + innerSize / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${padding + innerSize / 2})`}
            className="text-[10px] fill-slate-400 uppercase tracking-wider"
          >
            Predicted Demand (MW)
          </text>
        </svg>

        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-slate-800/95 border border-slate-700 backdrop-blur rounded-lg p-2 text-xs shadow-xl pointer-events-none">
            <div className="text-cyan-300">
              Actual: <span className="font-mono font-bold">{hoveredPoint.actual} MW</span>
            </div>
            <div className="text-amber-300">
              Predicted: <span className="font-mono font-bold">{hoveredPoint.predicted} MW</span>
            </div>
            <div className="text-slate-300">
              Diff:{' '}
              <span className="font-mono font-semibold">
                {(hoveredPoint.actual - hoveredPoint.predicted).toFixed(1)} MW
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
