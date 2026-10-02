import React from 'react';
import { HourlyErrorStat } from '../../types/pipeline';

interface HourlyErrorChartProps {
  stats: HourlyErrorStat[];
}

export const HourlyErrorChart: React.FC<HourlyErrorChartProps> = ({ stats }) => {
  if (!stats || stats.length === 0) return null;

  const maxMAE = Math.max(...stats.map(s => s.mae), 1);
  const chartWidth = 640;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  const barWidth = Math.max(8, innerWidth / stats.length - 4);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-200">Forecast MAE by Hour of Day</h4>
        <span className="text-xs text-slate-400">Peak inaccuracy periods (00:00 to 23:00)</span>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full select-none" style={{ minWidth: 480 }}>
          {/* Grid lines */}
          {[0, 0.5, 1].map((pct, i) => {
            const y = paddingTop + innerHeight - pct * innerHeight;
            const val = Math.round(pct * maxMAE);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + innerWidth}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="4 4"
                />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {stats.map((s, i) => {
            const h = (s.mae / maxMAE) * innerHeight;
            const x = paddingLeft + i * (innerWidth / stats.length) + 2;
            const y = paddingTop + innerHeight - h;
            const isEveningPeak = s.hour >= 18 && s.hour <= 22;

            return (
              <g key={s.hour} className="group cursor-pointer">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(2, h)}
                  fill={isEveningPeak ? '#f43f5e' : '#38bdf8'}
                  fillOpacity={0.85}
                  rx={2}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400 font-mono"
                >
                  {s.hour}
                </text>
              </g>
            );
          })}

          <text
            x={paddingLeft + innerWidth / 2}
            y={height - 1}
            textAnchor="middle"
            className="text-[10px] fill-slate-400 uppercase tracking-wider"
          >
            Hour of Day (24-Hour Cycle)
          </text>
        </svg>
      </div>
    </div>
  );
};
