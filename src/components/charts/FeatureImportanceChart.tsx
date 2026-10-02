import React from 'react';
import { FeatureImportanceItem } from '../../types/pipeline';

interface FeatureImportanceChartProps {
  items: FeatureImportanceItem[];
  title?: string;
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  items,
  title = 'Top Feature Importances (Tuned XGBoost)',
}) => {
  if (!items || items.length === 0) {
    return <div className="p-4 text-center text-slate-500">No feature importances</div>;
  }

  const maxVal = Math.max(...items.map(it => it.importance), 0.001);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
          <p className="text-xs text-slate-400">Relative contribution & split gain to demand forecasting</p>
        </div>
        <span className="text-xs text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded">
          Top {items.length} Features
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const widthPct = (item.importance / maxVal) * 100;
          const isTop3 = idx < 3;

          return (
            <div key={item.feature} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-[11px] w-5">#{idx + 1}</span>
                  <span className={`font-medium ${isTop3 ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>
                    {item.feature}
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[11px]">{item.percentage}%</span>
                  <span className="font-mono text-slate-200 text-xs w-14 text-right">
                    {item.importance.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    idx === 0
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      : idx === 1
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                      : idx === 2
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-400'
                      : 'bg-slate-500'
                  }`}
                  style={{ width: `${Math.max(2, widthPct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
