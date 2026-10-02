import React, { useState } from 'react';

interface LearningCurveChartProps {
  iterations: { iter: number; trainLoss: number; valLoss: number }[];
  bestIter?: number;
  height?: number;
}

export const LearningCurveChart: React.FC<LearningCurveChartProps> = ({
  iterations,
  bestIter,
  height = 280,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!iterations || iterations.length === 0) return null;

  const allLosses = iterations.flatMap(it => [it.trainLoss, it.valLoss]);
  const minLoss = Math.floor(Math.min(...allLosses) * 0.9);
  const maxLoss = Math.ceil(Math.max(...allLosses) * 1.05);
  const rangeLoss = maxLoss - minLoss || 1;

  const chartWidth = 560;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const getX = (idx: number) => paddingLeft + (idx / (iterations.length - 1)) * innerWidth;
  const getY = (val: number) => paddingTop + innerHeight - ((val - minLoss) / rangeLoss) * innerHeight;

  const trainPath = iterations.reduce((acc, it, i) => {
    const x = getX(i);
    const y = getY(it.trainLoss);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const valPath = iterations.reduce((acc, it, i) => {
    const x = getX(i);
    const y = getY(it.valLoss);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const hoveredIt = hoverIndex !== null && iterations[hoverIndex] ? iterations[hoverIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-white">Learning & Convergence Curve</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Train RMSE vs. Validation RMSE over boosting iterations ($n\_estimators$)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 inline-block"></span>
            <span className="text-slate-300">Training Loss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-amber-400 inline-block"></span>
            <span className="text-slate-300">Validation Loss</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full select-none"
          style={{ minWidth: 460 }}
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * chartWidth;
            if (relX >= paddingLeft && relX <= paddingLeft + innerWidth) {
              const idx = Math.round(
                ((relX - paddingLeft) / innerWidth) * (iterations.length - 1)
              );
              setHoverIndex(Math.max(0, Math.min(iterations.length - 1, idx)));
            }
          }}
        >
          {/* Y Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const val = Math.round(minLoss + pct * rangeLoss);
            const y = getY(val);
            return (
              <g key={pct}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + innerWidth}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth={0.8}
                />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Train Path */}
          <path d={trainPath} fill="none" stroke="#22d3ee" strokeWidth={2.4} strokeLinecap="round" />

          {/* Validation Path */}
          <path d={valPath} fill="none" stroke="#fbbf24" strokeWidth={2.4} strokeLinecap="round" />

          {/* Hover indicator */}
          {hoverIndex !== null && hoveredIt && (
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
              <circle cx={getX(hoverIndex)} cy={getY(hoveredIt.trainLoss)} r={4.5} fill="#22d3ee" />
              <circle cx={getX(hoverIndex)} cy={getY(hoveredIt.valLoss)} r={4.5} fill="#fbbf24" />
            </g>
          )}

          {/* X Axis Ticks */}
          {iterations.map((it, i) => {
            if (i % 4 !== 0 && i !== iterations.length - 1) return null;
            return (
              <text
                key={it.iter}
                x={getX(i)}
                y={height - 12}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {it.iter}
              </text>
            );
          })}

          <text
            x={paddingLeft + innerWidth / 2}
            y={height - 1}
            textAnchor="middle"
            className="text-[10px] fill-slate-400 uppercase tracking-wider"
          >
            Boosting Iteration Round
          </text>
          <text
            x={12}
            y={paddingTop + innerHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${paddingTop + innerHeight / 2})`}
            className="text-[10px] fill-slate-400 uppercase tracking-wider"
          >
            RMSE Loss (MW)
          </text>
        </svg>

        {hoveredIt && (
          <div className="absolute top-2 right-4 bg-slate-800/95 border border-slate-700 backdrop-blur rounded-lg p-2.5 shadow-xl text-xs space-y-1 font-mono pointer-events-none">
            <div className="text-slate-200 font-bold border-b border-slate-700 pb-1">
              Iteration {hoveredIt.iter}
            </div>
            <div className="text-cyan-300">
              Train RMSE: <span className="font-bold">{hoveredIt.trainLoss} MW</span>
            </div>
            <div className="text-amber-300">
              Val RMSE: <span className="font-bold">{hoveredIt.valLoss} MW</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
