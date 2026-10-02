import React from 'react';

interface ResidualDiagnosticsChartProps {
  residualsVsFitted: { fitted: number; residual: number }[];
  qqPlot: { theoretical: number; sample: number }[];
  height?: number;
}

export const ResidualDiagnosticsChart: React.FC<ResidualDiagnosticsChartProps> = ({
  residualsVsFitted,
  qqPlot,
  height = 280,
}) => {
  const size = 300;
  const padding = 42;
  const innerSize = size - padding * 2;

  // 1. Residuals vs Fitted bounds
  const allFitted = residualsVsFitted.map(p => p.fitted);
  const minFitted = Math.min(...allFitted);
  const maxFitted = Math.max(...allFitted);
  const rangeFitted = maxFitted - minFitted || 1;

  const allRes = residualsVsFitted.map(p => p.residual);
  const maxAbsRes = Math.max(...allRes.map(r => Math.abs(r)), 10);
  const minRes = -maxAbsRes;
  const maxRes = maxAbsRes;
  const rangeRes = maxRes - minRes || 1;

  // 2. Q-Q Plot bounds
  const minQ = -3.2;
  const maxQ = 3.2;
  const rangeQ = maxQ - minQ;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-white">Advanced Residual Diagnostics</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Homoscedasticity inspection (Residuals vs Fitted) and Gaussian normality verification (Normal Q-Q Plot)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-items-center">
        {/* Plot 1: Residuals vs Fitted */}
        <div className="w-full flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-300 mb-1">
            Residuals vs Fitted Values (Homoscedasticity)
          </span>
          <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }} className="select-none">
            {/* Grid */}
            <line
              x1={padding}
              y1={padding + innerSize / 2}
              x2={padding + innerSize}
              y2={padding + innerSize / 2}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {[-maxAbsRes, 0, maxAbsRes].map((rVal, idx) => {
              const y = padding + innerSize - ((rVal - minRes) / rangeRes) * innerSize;
              return (
                <text key={idx} x={padding - 6} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                  {rVal.toFixed(0)}
                </text>
              );
            })}

            {/* Points */}
            {residualsVsFitted.map((pt, i) => {
              const cx = padding + ((pt.fitted - minFitted) / rangeFitted) * innerSize;
              const cy = padding + innerSize - ((pt.residual - minRes) / rangeRes) * innerSize;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={2.5}
                  fill="#38bdf8"
                  fillOpacity={0.65}
                />
              );
            })}

            <text x={padding + innerSize / 2} y={size - 6} textAnchor="middle" className="text-[10px] fill-slate-400 uppercase">
              Fitted (Predicted) MW
            </text>
            <text x={12} y={padding + innerSize / 2} textAnchor="middle" transform={`rotate(-90 12 ${padding + innerSize / 2})`} className="text-[10px] fill-slate-400 uppercase">
              Residual Error (MW)
            </text>
          </svg>
        </div>

        {/* Plot 2: Normal Q-Q Plot */}
        <div className="w-full flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-300 mb-1">
            Normal Q-Q Plot (Residual Normality)
          </span>
          <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }} className="select-none">
            {/* 45-degree diagonal reference line */}
            <line
              x1={padding}
              y1={padding + innerSize}
              x2={padding + innerSize}
              y2={padding}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Grid Ticks */}
            {[-3, -1.5, 0, 1.5, 3].map(q => {
              const pos = padding + ((q - minQ) / rangeQ) * innerSize;
              return (
                <g key={q}>
                  <text x={padding - 6} y={padding + innerSize - ((q - minQ) / rangeQ) * innerSize + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                    {q}
                  </text>
                  <text x={pos} y={padding + innerSize + 14} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">
                    {q}
                  </text>
                </g>
              );
            })}

            {/* Points */}
            {qqPlot.map((pt, i) => {
              const cx = padding + ((pt.theoretical - minQ) / rangeQ) * innerSize;
              const cy = padding + innerSize - ((pt.sample - minQ) / rangeQ) * innerSize;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={2.5}
                  fill="#a855f7"
                  fillOpacity={0.7}
                />
              );
            })}

            <text x={padding + innerSize / 2} y={size - 6} textAnchor="middle" className="text-[10px] fill-slate-400 uppercase">
              Theoretical Quantiles (Z)
            </text>
            <text x={12} y={padding + innerSize / 2} textAnchor="middle" transform={`rotate(-90 12 ${padding + innerSize / 2})`} className="text-[10px] fill-slate-400 uppercase">
              Sample Quantiles (Standardized)
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
