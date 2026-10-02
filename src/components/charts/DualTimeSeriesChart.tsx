import React, { useState } from 'react';
import { ForecastPoint } from '../../types/pipeline';

interface DualTimeSeriesChartProps {
  actual: ForecastPoint[];
  sessionAName: string;
  sessionAPreds: number[];
  sessionBName: string;
  sessionBPreds: number[];
  peakThreshold?: number;
  height?: number;
}

export const DualTimeSeriesChart: React.FC<DualTimeSeriesChartProps> = ({
  actual,
  sessionAName,
  sessionAPreds,
  sessionBName,
  sessionBPreds,
  peakThreshold,
  height = 340,
}) => {
  const [sliceLength, setSliceLength] = useState<number>(72);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!actual || actual.length === 0) return null;

  const n = Math.min(actual.length, sessionAPreds.length, sessionBPreds.length, sliceLength);
  const subActual = actual.slice(0, n);
  const subA = sessionAPreds.slice(0, n);
  const subB = sessionBPreds.slice(0, n);

  const allVals = [
    ...subActual.map(p => p.actual),
    ...subA,
    ...subB,
  ];
  if (peakThreshold) allVals.push(peakThreshold);

  const minY = Math.floor(Math.min(...allVals) * 0.95);
  const maxY = Math.ceil(Math.max(...allVals) * 1.05);
  const rangeY = maxY - minY || 1;

  const chartWidth = 900;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const getX = (idx: number) => paddingLeft + (idx / Math.max(1, n - 1)) * innerWidth;
  const getY = (val: number) => paddingTop + innerHeight - ((val - minY) / rangeY) * innerHeight;

  const actualPath = subActual.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.actual);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const pathA = subA.reduce((acc, val, i) => {
    const x = getX(i);
    const y = getY(val);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const pathB = subB.reduce((acc, val, i) => {
    const x = getX(i);
    const y = getY(val);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = Math.round(minY + (i / 4) * rangeY);
    return { val, y: getY(val) };
  });

  const hoveredIdx = hoverIndex !== null && hoverIndex < n ? hoverIndex : null;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-cyan-400 rounded-full inline-block"></span>
            <span className="text-slate-300 font-medium">Actual Demand</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-amber-400 border-b border-dashed border-amber-400 inline-block"></span>
            <span className="text-amber-300 font-medium truncate max-w-[180px]">
              {sessionAName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-purple-400 border-b border-dashed border-purple-400 inline-block"></span>
            <span className="text-purple-300 font-medium truncate max-w-[180px]">
              {sessionBName}
            </span>
          </div>
          {peakThreshold && (
            <div className="flex items-center gap-2 text-rose-400">
              <span className="w-3.5 h-0.5 bg-rose-500 inline-block"></span>
              <span>Peak 90% ({peakThreshold.toFixed(0)} MW)</span>
            </div>
          )}
        </div>

        {/* Horizon selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg text-xs border border-slate-800">
          <span className="text-slate-500 px-2 font-mono">Window:</span>
          {[24, 48, 72, 120, 168].map(cnt => (
            <button
              key={cnt}
              onClick={() => setSliceLength(cnt)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                sliceLength === cnt
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cnt === 24 ? '24h' : cnt === 48 ? '48h' : cnt === 72 ? '3d' : cnt === 168 ? '7d' : `${cnt}h`}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full select-none"
          style={{ minWidth: 640 }}
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * chartWidth;
            if (relX >= paddingLeft && relX <= paddingLeft + innerWidth) {
              const idx = Math.round(((relX - paddingLeft) / innerWidth) * (n - 1));
              setHoverIndex(Math.max(0, Math.min(n - 1, idx)));
            }
          }}
        >
          {/* Y-axis grid */}
          {yTicks.map(t => (
            <g key={t.val}>
              <line
                x1={paddingLeft}
                y1={t.y}
                x2={paddingLeft + innerWidth}
                y2={t.y}
                stroke="#334155"
                strokeDasharray="4 4"
                strokeWidth={0.8}
              />
              <text x={paddingLeft - 8} y={t.y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                {t.val}
              </text>
            </g>
          ))}

          {/* Peak Threshold */}
          {peakThreshold && (
            <line
              x1={paddingLeft}
              y1={getY(peakThreshold)}
              x2={paddingLeft + innerWidth}
              y2={getY(peakThreshold)}
              stroke="#ef4444"
              strokeDasharray="5 3"
              strokeWidth={1.2}
            />
          )}

          {/* Actual line */}
          <path d={actualPath} fill="none" stroke="#22d3ee" strokeWidth={2.4} strokeLinecap="round" />

          {/* Session A prediction line */}
          <path
            d={pathA}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={1.8}
            strokeDasharray="5 3"
            strokeLinecap="round"
          />

          {/* Session B prediction line */}
          <path
            d={pathB}
            fill="none"
            stroke="#c084fc"
            strokeWidth={2}
            strokeDasharray="3 2"
            strokeLinecap="round"
          />

          {/* Hover Crosshair */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={paddingTop}
                x2={getX(hoveredIdx)}
                y2={paddingTop + innerHeight}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth={1.5}
              />
              <circle cx={getX(hoveredIdx)} cy={getY(subActual[hoveredIdx].actual)} r={4.5} fill="#22d3ee" />
              <circle cx={getX(hoveredIdx)} cy={getY(subA[hoveredIdx])} r={4.5} fill="#fbbf24" />
              <circle cx={getX(hoveredIdx)} cy={getY(subB[hoveredIdx])} r={4.5} fill="#c084fc" />
            </g>
          )}

          {/* X axis labels */}
          {subActual.map((pt, i) => {
            const step = Math.max(1, Math.floor(n / 6));
            if (i % step !== 0 && i !== n - 1) return null;
            return (
              <text key={i} x={getX(i)} y={height - 12} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">
                {pt.datetime.slice(5, 16)}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredIdx !== null && (
          <div className="absolute top-2 right-4 bg-slate-800/95 border border-slate-700 backdrop-blur rounded-lg p-3 text-xs space-y-1.5 font-mono shadow-2xl pointer-events-none z-10">
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 font-sans">
              Time: {subActual[hoveredIdx].datetime}
            </div>
            <div className="flex justify-between gap-4 text-cyan-300">
              <span className="font-sans">Actual Demand:</span>
              <span className="font-bold">{subActual[hoveredIdx].actual.toFixed(1)} MW</span>
            </div>
            <div className="flex justify-between gap-4 text-amber-300">
              <span className="font-sans truncate max-w-[120px]">{sessionAName}:</span>
              <span className="font-bold">{subA[hoveredIdx].toFixed(1)} MW</span>
            </div>
            <div className="flex justify-between gap-4 text-purple-300">
              <span className="font-sans truncate max-w-[120px]">{sessionBName}:</span>
              <span className="font-bold">{subB[hoveredIdx].toFixed(1)} MW</span>
            </div>
            <div className="border-t border-slate-700/80 pt-1 text-[11px] flex justify-between gap-4 text-slate-400 font-sans">
              <span>Diff (|A| vs |B| Error):</span>
              <span
                className={`font-mono font-bold ${
                  Math.abs(subActual[hoveredIdx].actual - subB[hoveredIdx]) <
                  Math.abs(subActual[hoveredIdx].actual - subA[hoveredIdx])
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {sessionBName} was{' '}
                {Math.abs(
                  Math.abs(subActual[hoveredIdx].actual - subA[hoveredIdx]) -
                  Math.abs(subActual[hoveredIdx].actual - subB[hoveredIdx])
                ).toFixed(1)}{' '}
                MW closer
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
