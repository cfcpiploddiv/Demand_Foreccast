import React, { useState } from 'react';
import { ROCCurvePoint } from '../../types/pipeline';

interface DualROCCurveChartProps {
  sessionAName: string;
  pointsA: ROCCurvePoint[];
  aucA: number;
  sessionBName: string;
  pointsB: ROCCurvePoint[];
  aucB: number;
}

export const DualROCCurveChart: React.FC<DualROCCurveChartProps> = ({
  sessionAName,
  pointsA,
  aucA,
  sessionBName,
  pointsB,
  aucB,
}) => {
  const size = 300;
  const padding = 45;
  const innerSize = size - padding * 2;

  const getCoordX = (xVal: number) => padding + xVal * innerSize;
  const getCoordY = (yVal: number) => padding + innerSize - yVal * innerSize;

  const pathA = pointsA.reduce((acc, p, i) => {
    const cx = getCoordX(p.fpr);
    const cy = getCoordY(p.tpr);
    return i === 0 ? `M ${cx} ${cy}` : `${acc} L ${cx} ${cy}`;
  }, '');

  const pathB = pointsB.reduce((acc, p, i) => {
    const cx = getCoordX(p.fpr);
    const cy = getCoordY(p.tpr);
    return i === 0 ? `M ${cx} ${cy}` : `${acc} L ${cx} ${cy}`;
  }, '');

  const deltaAuc = +(aucB - aucA).toFixed(3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-white">Dual ROC Curve Comparison</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Receiver Operating Characteristic overlay comparing peak load discrimination
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              deltaAuc >= 0
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}
          >
            Δ AUC: {deltaAuc >= 0 ? `+${deltaAuc}` : deltaAuc}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }} className="select-none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map(val => {
            const y = getCoordY(val);
            const x = getCoordX(val);
            return (
              <g key={val}>
                <line x1={padding} y1={y} x2={padding + innerSize} y2={y} stroke="#334155" strokeDasharray="3 3" strokeWidth={0.8} />
                <text x={padding - 6} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                  {val.toFixed(2)}
                </text>
                <line x1={x} y1={padding} x2={x} y2={padding + innerSize} stroke="#334155" strokeDasharray="3 3" strokeWidth={0.8} />
                <text x={x} y={padding + innerSize + 14} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* 45-degree diagonal reference line */}
          <line
            x1={padding}
            y1={padding + innerSize}
            x2={padding + innerSize}
            y2={padding}
            stroke="#64748b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />

          {/* Curve A (Amber) */}
          <path d={pathA} fill="none" stroke="#fbbf24" strokeWidth={2.4} strokeLinecap="round" />

          {/* Curve B (Purple) */}
          <path d={pathB} fill="none" stroke="#c084fc" strokeWidth={2.6} strokeLinecap="round" strokeDasharray="5 2" />

          <text x={padding + innerSize / 2} y={size - 6} textAnchor="middle" className="text-[10px] fill-slate-400 uppercase">
            False Positive Rate
          </text>
          <text x={12} y={padding + innerSize / 2} textAnchor="middle" transform={`rotate(-90 12 ${padding + innerSize / 2})`} className="text-[10px] fill-slate-400 uppercase">
            True Positive Rate
          </text>
        </svg>

        {/* Legend */}
        <div className="space-y-3 text-xs min-w-[180px]">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 font-mono">
            <div className="flex items-center justify-between text-amber-300">
              <span className="font-sans font-medium flex items-center gap-1.5 truncate max-w-[110px]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                {sessionAName}
              </span>
              <span className="font-bold">AUC: {aucA}</span>
            </div>

            <div className="flex items-center justify-between text-purple-300 border-t border-slate-800 pt-2">
              <span className="font-sans font-medium flex items-center gap-1.5 truncate max-w-[110px]">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span>
                {sessionBName}
              </span>
              <span className="font-bold">AUC: {aucB}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            {aucB > aucA
              ? `${sessionBName} provides higher peak discriminative power (+${((aucB - aucA) * 100).toFixed(1)}% AUC).`
              : aucB < aucA
              ? `${sessionAName} retained higher discriminative power.`
              : 'Both sessions achieve identical peak discrimination.'}
          </div>
        </div>
      </div>
    </div>
  );
};
