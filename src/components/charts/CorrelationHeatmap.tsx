import React, { useState } from 'react';

interface CorrelationHeatmapProps {
  features: string[];
  matrix: number[][];
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ features, matrix }) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; val: number } | null>(null);

  if (!features || features.length === 0 || !matrix || matrix.length === 0) {
    return <div className="p-4 text-center text-slate-500">No correlation data</div>;
  }

  const cellSize = 64;
  const paddingLeft = 110;
  const paddingTop = 90;
  const n = features.length;
  const width = paddingLeft + n * cellSize + 20;
  const height = paddingTop + n * cellSize + 20;

  const getColor = (val: number) => {
    // -1 (blue) to 0 (slate-900) to +1 (amber/red)
    if (val >= 0) {
      const alpha = Math.min(1, Math.max(0.1, val));
      return `rgba(249, 115, 22, ${alpha})`;
    } else {
      const alpha = Math.min(1, Math.max(0.1, Math.abs(val)));
      return `rgba(59, 130, 246, ${alpha})`;
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Correlation Matrix (Pearson r)</h4>
          <p className="text-xs text-slate-400">Pairwise correlation between features and electricity demand</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
            <span className="text-slate-400">Negative (-1.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block"></span>
            <span className="text-slate-400">Neutral (0.0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500 inline-block"></span>
            <span className="text-slate-400">Positive (+1.0)</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width }} className="select-none">
          {/* Column labels (rotated 45 deg) */}
          {features.map((f, j) => {
            const x = paddingLeft + (j + 0.5) * cellSize;
            const y = paddingTop - 10;
            return (
              <text
                key={`col-${f}`}
                x={x}
                y={y}
                transform={`rotate(-40 ${x} ${y})`}
                textAnchor="start"
                className="text-[11px] fill-slate-300 font-medium"
              >
                {f}
              </text>
            );
          })}

          {/* Row labels & Cells */}
          {features.map((rowName, i) => {
            const y = paddingTop + (i + 0.5) * cellSize;
            return (
              <g key={`row-${rowName}`}>
                <text
                  x={paddingLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[11px] fill-slate-300 font-medium"
                >
                  {rowName}
                </text>

                {features.map((colName, j) => {
                  const val = matrix[i]?.[j] !== undefined ? matrix[i][j] : 0;
                  const cellX = paddingLeft + j * cellSize;
                  const cellY = paddingTop + i * cellSize;
                  const isHovered = hoveredCell?.row === rowName && hoveredCell?.col === colName;

                  return (
                    <g
                      key={`cell-${i}-${j}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredCell({ row: rowName, col: colName, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <rect
                        x={cellX + 1}
                        y={cellY + 1}
                        width={cellSize - 2}
                        height={cellSize - 2}
                        fill={getColor(val)}
                        stroke={isHovered ? '#ffffff' : '#1e293b'}
                        strokeWidth={isHovered ? 2 : 1}
                        rx={4}
                      />
                      <text
                        x={cellX + cellSize / 2}
                        y={cellY + cellSize / 2 + 4}
                        textAnchor="middle"
                        className={`text-[11px] font-mono font-semibold ${
                          Math.abs(val) > 0.4 ? 'fill-white' : 'fill-slate-300'
                        }`}
                      >
                        {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {hoveredCell && (
          <div className="absolute bottom-2 right-4 bg-slate-800/95 border border-slate-700 backdrop-blur rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none">
            <span className="text-slate-400">Corr(</span>
            <span className="text-cyan-300 font-semibold">{hoveredCell.row}</span>
            <span className="text-slate-400">, </span>
            <span className="text-amber-300 font-semibold">{hoveredCell.col}</span>
            <span className="text-slate-400">) = </span>
            <span className="font-mono font-bold text-white ml-1">
              {hoveredCell.val > 0 ? `+${hoveredCell.val.toFixed(3)}` : hoveredCell.val.toFixed(3)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
