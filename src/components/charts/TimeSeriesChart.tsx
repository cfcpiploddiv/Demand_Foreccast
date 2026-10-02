import React, { useState } from 'react';
import { ForecastPoint } from '../../types/pipeline';

interface TimeSeriesChartProps {
  data: ForecastPoint[];
  peakThreshold?: number;
  height?: number;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  peakThreshold,
  height = 320,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-400">No time series data available</div>;
  }

  // Always show all data as requested
  const visibleData = data;

  // Determine min & max Y
  const allY = visibleData.flatMap(d => [d.actual, d.predicted]);
  if (peakThreshold) allY.push(peakThreshold);
  
  const minVal = Math.min(...allY);
  const maxVal = Math.max(...allY);
  
  // Provide enough vertical breathing room
  const minY = Math.floor(minVal * 0.95);
  const maxY = Math.ceil(maxVal * 1.1);
  const rangeY = maxY - minY || 1;

  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 45;
  const chartWidth = 900;
  const chartHeight = height;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (visibleData.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (visibleData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return paddingTop + innerHeight - ((val - minY) / rangeY) * innerHeight;
  };

  // Build SVG Path strings
  const actualPath = visibleData.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.actual);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const predictedPath = visibleData.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.predicted);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = Math.round(minY + (i / 4) * rangeY);
    return { val, y: getY(val) };
  });

  const hoveredPoint = hoverIndex !== null && visibleData[hoverIndex] ? visibleData[hoverIndex] : null;

  // X-axis label formatter for "All Data" view
  const formatXLabel = (dateStr: string) => {
    // format expected: "YYYY-MM-DD HH:mm" or "DD-MM-YYYY HH:mm"
    const parts = dateStr.split(' ');
    const date = parts[0];
    const dateParts = date.split(/[-/]/);
    
    let day, month, year;
    if (dateParts[0].length === 4) {
      // YYYY-MM-DD
      year = dateParts[0];
      month = dateParts[1];
      day = dateParts[2];
    } else {
      // DD-MM-YYYY
      day = dateParts[0];
      month = dateParts[1];
      year = dateParts[2];
    }
    return `${day}/${month}/${year.slice(-2)}`;
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3.5 h-1 bg-cyan-400 rounded-full inline-block"></span>
            <span className="text-slate-300 font-medium">Actual Demand (MW)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3.5 h-1 bg-amber-400 border-b border-dashed border-amber-400 inline-block"></span>
            <span className="text-slate-300 font-medium">Predicted (Tuned XGBoost)</span>
          </div>
          {peakThreshold && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3.5 h-0.5 bg-rose-500 inline-block"></span>
              <span className="text-rose-300 font-medium">Peak 90% ({peakThreshold.toFixed(0)} MW)</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full select-none"
          style={{ minWidth: 640 }}
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * chartWidth;
            if (relX >= paddingLeft && relX <= paddingLeft + innerWidth) {
              const idx = Math.round(
                ((relX - paddingLeft) / innerWidth) * (visibleData.length - 1)
              );
              setHoverIndex(Math.max(0, Math.min(visibleData.length - 1, idx)));
            }
          }}
        >
          {/* Background Grid */}
          {yTicks.map(t => (
            <g key={t.val}>
              <line
                x1={paddingLeft}
                y1={t.y}
                x2={paddingLeft + innerWidth}
                y2={t.y}
                stroke="#334155"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 8}
                y={t.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono tabular-nums"
              >
                {t.val}
              </text>
            </g>
          ))}

          {/* Peak Threshold Line */}
          {peakThreshold && (
            <line
              x1={paddingLeft}
              y1={getY(peakThreshold)}
              x2={paddingLeft + innerWidth}
              y2={getY(peakThreshold)}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={1.5}
            />
          )}

          {/* Actual Line */}
          <path
            d={actualPath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Predicted Line */}
          <path
            d={predictedPath}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={1.2}
            strokeDasharray="3 2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Hover Crosshair & Details */}
          {hoverIndex !== null && hoveredPoint && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={paddingTop + innerHeight}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth={1.5}
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(hoveredPoint.actual)}
                r={4}
                fill="#22d3ee"
                stroke="#0f172a"
                strokeWidth={2}
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(hoveredPoint.predicted)}
                r={4}
                fill="#fbbf24"
                stroke="#0f172a"
                strokeWidth={2}
              />
            </g>
          )}

          {/* Time axis labels */}
          {visibleData.map((d, i) => {
            const labelCount = 8;
            const step = Math.max(1, Math.floor(visibleData.length / (labelCount - 1)));
            if (i % step !== 0 && i !== visibleData.length - 1) return null;
            
            // Avoid overlapping the last label if it's too close
            if (i !== visibleData.length - 1 && (visibleData.length - 1 - i) < step * 0.5) return null;

            return (
              <text
                key={i}
                x={getX(i)}
                y={chartHeight - 12}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {formatXLabel(d.datetime)}
              </text>
            );
          })}
        </svg>

        {hoveredPoint && (
          <div
            className="absolute top-2 right-4 bg-slate-800/95 border border-slate-700 backdrop-blur rounded-lg p-3 shadow-xl text-xs space-y-1 pointer-events-none"
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700/80 pb-1">
              Time: {hoveredPoint.datetime}
            </div>
            <div className="flex justify-between gap-4 text-cyan-300">
              <span>Actual:</span>
              <span className="font-mono font-bold">{hoveredPoint.actual.toFixed(2)} MW</span>
            </div>
            <div className="flex justify-between gap-4 text-amber-300">
              <span>Predicted:</span>
              <span className="font-mono font-bold">{hoveredPoint.predicted.toFixed(2)} MW</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-300">
              <span>Error (Act - Pred):</span>
              <span className={`font-mono ${hoveredPoint.error > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {hoveredPoint.error > 0 ? `+${hoveredPoint.error}` : hoveredPoint.error} MW
              </span>
            </div>
            {hoveredPoint.isPeak && (
              <div className="text-[11px] text-rose-400 font-medium bg-rose-950/60 px-2 py-0.5 rounded text-center">
                Top 10% Peak Period
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
