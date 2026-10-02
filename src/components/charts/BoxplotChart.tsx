import React, { useState } from 'react';

export interface BoxplotItem {
  label: string | number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  avg?: number;
}

interface BoxplotChartProps {
  items: BoxplotItem[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  height?: number;
}

export const BoxplotChart: React.FC<BoxplotChartProps> = ({
  items,
  title,
  xLabel,
  yLabel = 'Demand (MW)',
  color = '#38bdf8',
  height = 280,
}) => {
  const [hoveredItem, setHoveredItem] = useState<BoxplotItem | null>(null);

  if (!items || items.length === 0) {
    return <div className="p-6 text-center text-slate-500">No boxplot data</div>;
  }

  const allMin = Math.min(...items.map(d => d.min));
  const allMax = Math.max(...items.map(d => d.max));
  const minY = Math.floor(allMin * 0.96);
  const maxY = Math.ceil(allMax * 1.04);
  const rangeY = maxY - minY || 1;

  const chartWidth = Math.max(680, items.length * 36);
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 45;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const getY = (val: number) => {
    return paddingTop + innerHeight - ((val - minY) / rangeY) * innerHeight;
  };

  const slotWidth = innerWidth / items.length;
  const boxWidth = Math.min(26, Math.max(12, slotWidth * 0.55));

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = Math.round(minY + (i / 4) * rangeY);
    return { val, y: getY(val) };
  });

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
          <span className="text-xs text-slate-400">Min / Q1 / Median / Q3 / Max</span>
        </div>
      )}

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full select-none"
          style={{ minWidth: 540 }}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {/* Y Grid lines */}
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
                className="text-[10px] fill-slate-400 font-mono"
              >
                {t.val}
              </text>
            </g>
          ))}

          {/* Boxplots */}
          {items.map((item, i) => {
            const centerX = paddingLeft + (i + 0.5) * slotWidth;
            const yMin = getY(item.min);
            const yQ25 = getY(item.q25);
            const yMed = getY(item.median);
            const yQ75 = getY(item.q75);
            const yMax = getY(item.max);
            const yAvg = item.avg !== undefined ? getY(item.avg) : null;

            const isHovered = hoveredItem?.label === item.label;

            return (
              <g
                key={i}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredItem(item)}
              >
                {/* Whisker vertical line */}
                <line
                  x1={centerX}
                  y1={yMax}
                  x2={centerX}
                  y2={yMin}
                  stroke={isHovered ? '#38bdf8' : '#64748b'}
                  strokeWidth={isHovered ? 2 : 1.5}
                />

                {/* Min horizontal cap */}
                <line
                  x1={centerX - boxWidth / 2}
                  y1={yMin}
                  x2={centerX + boxWidth / 2}
                  y2={yMin}
                  stroke={isHovered ? '#38bdf8' : '#64748b'}
                  strokeWidth={1.5}
                />

                {/* Max horizontal cap */}
                <line
                  x1={centerX - boxWidth / 2}
                  y1={yMax}
                  x2={centerX + boxWidth / 2}
                  y2={yMax}
                  stroke={isHovered ? '#38bdf8' : '#64748b'}
                  strokeWidth={1.5}
                />

                {/* Box (Q25 to Q75) */}
                <rect
                  x={centerX - boxWidth / 2}
                  y={yQ75}
                  width={boxWidth}
                  height={Math.max(2, yQ25 - yQ75)}
                  fill={isHovered ? `${color}40` : `${color}25`}
                  stroke={isHovered ? '#ffffff' : color}
                  strokeWidth={isHovered ? 2 : 1.5}
                  rx={2}
                />

                {/* Median line */}
                <line
                  x1={centerX - boxWidth / 2}
                  y1={yMed}
                  x2={centerX + boxWidth / 2}
                  y2={yMed}
                  stroke="#fbbf24"
                  strokeWidth={2}
                />

                {/* Mean Diamond */}
                {yAvg !== null && (
                  <circle
                    cx={centerX}
                    cy={yAvg}
                    r={2.5}
                    fill="#34d399"
                    stroke="#0f172a"
                    strokeWidth={1}
                  />
                )}

                {/* X Axis Label */}
                <text
                  x={centerX}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    isHovered ? 'fill-cyan-300 font-bold' : 'fill-slate-400'
                  }`}
                >
                  {item.label}
                </text>
              </g>
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

        {hoveredItem && (
          <div className="absolute top-2 right-4 bg-slate-800/95 border border-slate-700 backdrop-blur rounded-lg p-2.5 shadow-xl text-xs space-y-1 pointer-events-none z-10">
            <div className="font-semibold text-cyan-300 border-b border-slate-700 pb-1">
              Category: {hoveredItem.label}
            </div>
            <div className="flex justify-between gap-4 text-slate-300">
              <span>Max:</span> <span className="font-mono text-slate-200">{hoveredItem.max} MW</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-300">
              <span>Q3 (75%):</span> <span className="font-mono text-slate-200">{hoveredItem.q75} MW</span>
            </div>
            <div className="flex justify-between gap-4 text-amber-300 font-medium">
              <span>Median (50%):</span> <span className="font-mono">{hoveredItem.median} MW</span>
            </div>
            {hoveredItem.avg !== undefined && (
              <div className="flex justify-between gap-4 text-emerald-300">
                <span>Mean:</span> <span className="font-mono">{hoveredItem.avg} MW</span>
              </div>
            )}
            <div className="flex justify-between gap-4 text-slate-300">
              <span>Q1 (25%):</span> <span className="font-mono text-slate-200">{hoveredItem.q25} MW</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-300">
              <span>Min:</span> <span className="font-mono text-slate-200">{hoveredItem.min} MW</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
