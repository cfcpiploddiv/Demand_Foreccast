import React, { useState } from 'react';
import { ROCCurvePoint, PRCurvePoint } from '../../types/pipeline';

interface ROCCurveChartProps {
  roc: {
    points: ROCCurvePoint[];
    auc: number;
    optimalThreshold: number;
    optimalFpr: number;
    optimalTpr: number;
  };
  pr: {
    points: PRCurvePoint[];
    aucPr: number;
  };
}

export const ROCCurveChart: React.FC<ROCCurveChartProps> = ({ roc, pr }) => {
  const [mode, setMode] = useState<'roc' | 'pr'>('roc');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const size = 320;
  const padding = 45;
  const innerSize = size - padding * 2;

  // Active points based on mode
  const points = mode === 'roc'
    ? roc.points.map(p => ({ x: p.fpr, y: p.tpr, threshold: p.threshold }))
    : pr.points.map(p => ({ x: p.recall, y: p.precision, threshold: p.threshold }));

  const activeAuc = mode === 'roc' ? roc.auc : pr.aucPr;

  const getCoordX = (xVal: number) => padding + xVal * innerSize;
  const getCoordY = (yVal: number) => padding + innerSize - yVal * innerSize;

  const curvePath = points.reduce((acc, p, i) => {
    const cx = getCoordX(p.x);
    const cy = getCoordY(p.y);
    return i === 0 ? `M ${cx} ${cy}` : `${acc} L ${cx} ${cy}`;
  }, '');

  const areaPath = points.length > 0
    ? `${curvePath} L ${getCoordX(points[points.length - 1].x)} ${padding + innerSize} L ${getCoordX(points[0].x)} ${padding + innerSize} Z`
    : '';

  const hoveredPt = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">
              {mode === 'roc' ? 'Receiver Operating Characteristic (ROC)' : 'Precision-Recall (PR) Curve'}
            </h4>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80">
              {mode === 'roc' ? `AUC = ${roc.auc}` : `AUC-PR = ${pr.aucPr}`}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'roc'
              ? 'Discriminative ability for grid peak events (Top 10% demand)'
              : 'Precision vs. Recall trade-off under imbalanced peak conditions'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => {
              setMode('roc');
              setHoverIndex(null);
            }}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              mode === 'roc' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ROC Curve
          </button>
          <button
            onClick={() => {
              setMode('pr');
              setHoverIndex(null);
            }}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              mode === 'pr' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PR Curve
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="select-none"
          style={{ width: size, height: size }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Shaded Area under curve */}
          <path d={areaPath} fill="url(#rocGradient)" fillOpacity={0.25} />

          <defs>
            <linearGradient id="rocGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map(val => {
            const y = getCoordY(val);
            const x = getCoordX(val);
            return (
              <g key={val}>
                {/* Horizontal */}
                <line
                  x1={padding}
                  y1={y}
                  x2={padding + innerSize}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth={0.8}
                />
                <text x={padding - 6} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                  {val.toFixed(2)}
                </text>
                {/* Vertical */}
                <line
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={padding + innerSize}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth={0.8}
                />
                <text x={x} y={padding + innerSize + 14} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* 45-degree diagonal reference line for ROC (AUC = 0.50 random classifier) */}
          {mode === 'roc' && (
            <line
              x1={padding}
              y1={padding + innerSize}
              x2={padding + innerSize}
              y2={padding}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          )}

          {/* Main Curve */}
          <path
            d={curvePath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={2.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Optimal Youden's J Point (for ROC) */}
          {mode === 'roc' && (
            <g>
              <circle
                cx={getCoordX(roc.optimalFpr)}
                cy={getCoordY(roc.optimalTpr)}
                r={5.5}
                fill="#f59e0b"
                stroke="#0f172a"
                strokeWidth={2}
              />
              <text
                x={getCoordX(roc.optimalFpr) + 10}
                y={getCoordY(roc.optimalTpr) - 4}
                className="text-[10px] fill-amber-300 font-bold"
              >
                Optimal (J)
              </text>
            </g>
          )}

          {/* Interactive Points on Curve */}
          {points.map((p, i) => {
            const cx = getCoordX(p.x);
            const cy = getCoordY(p.y);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={hoverIndex === i ? 5 : 2.5}
                fill={hoverIndex === i ? '#ffffff' : '#38bdf8'}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding + innerSize / 2}
            y={size - 6}
            textAnchor="middle"
            className="text-[10px] fill-slate-400 uppercase tracking-wider"
          >
            {mode === 'roc' ? 'False Positive Rate (1 - Specificity)' : 'Recall (Sensitivity)'}
          </text>
          <text
            x={12}
            y={padding + innerSize / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${padding + innerSize / 2})`}
            className="text-[10px] fill-slate-400 uppercase tracking-wider"
          >
            {mode === 'roc' ? 'True Positive Rate (Sensitivity)' : 'Precision (Positive Predictive Value)'}
          </text>
        </svg>

        {/* Legend & Stats Details */}
        <div className="space-y-3 text-xs min-w-[190px]">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Metric AUC:</span>
              <span className="text-emerald-300 font-bold">{activeAuc}</span>
            </div>
            {mode === 'roc' && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Opt. Thresh:</span>
                  <span className="text-amber-300 font-semibold">{roc.optimalThreshold} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Opt. TPR:</span>
                  <span className="text-cyan-300">{(roc.optimalTpr * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Opt. FPR:</span>
                  <span className="text-slate-300">{(roc.optimalFpr * 100).toFixed(1)}%</span>
                </div>
              </>
            )}
          </div>

          {hoveredPt ? (
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-[11px] space-y-1 font-mono">
              <div className="text-cyan-300 font-bold border-b border-slate-700 pb-1 font-sans">
                Point Inspection
              </div>
              <div className="flex justify-between">
                <span>Threshold:</span> <span>{hoveredPt.threshold} MW</span>
              </div>
              <div className="flex justify-between">
                <span>{mode === 'roc' ? 'FPR:' : 'Recall:'}</span>
                <span>{(hoveredPt.x * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>{mode === 'roc' ? 'TPR:' : 'Precision:'}</span>
                <span>{(hoveredPt.y * 100).toFixed(1)}%</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Hover along the curve to inspect thresholds and operational trade-offs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
