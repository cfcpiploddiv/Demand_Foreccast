import React, { useState } from 'react';
import { TrendingUp, ArrowDownRight, ArrowUpRight, HelpCircle } from 'lucide-react';
import { FeatureImportanceItem } from '../../types/pipeline';

interface EnhancedFeatureImportanceChartProps {
  items: FeatureImportanceItem[];
}

export const EnhancedFeatureImportanceChart: React.FC<EnhancedFeatureImportanceChartProps> = ({ items }) => {
  const [viewMode, setViewMode] = useState<'bars' | 'pareto' | 'impact'>('bars');

  if (!items || items.length === 0) return null;

  const maxVal = Math.max(...items.map(it => it.importance), 0.001);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Feature Importance & Directional Impact Analysis
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Tree split gains, cumulative Pareto distribution, and physical influence on grid demand
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('bars')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'bars' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ranked Gain
          </button>
          <button
            onClick={() => setViewMode('pareto')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'pareto' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cumulative Pareto (80/20)
          </button>
          <button
            onClick={() => setViewMode('impact')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              viewMode === 'impact' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Physical Influence
          </button>
        </div>
      </div>

      {viewMode === 'bars' && (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const widthPct = (item.importance / maxVal) * 100;
            const isTop3 = idx < 3;

            return (
              <div key={item.feature} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 text-[11px] w-5">#{idx + 1}</span>
                    <span className={`font-medium ${isTop3 ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
                      {item.feature}
                    </span>
                    {item.direction && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          item.direction === 'positive'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : item.direction === 'negative'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.direction === 'positive' ? '+ Positive' : item.direction === 'negative' ? '- Negative' : 'Non-Linear'}
                      </span>
                    )}
                  </div>
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
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${Math.max(2, widthPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'pareto' && (
        <div className="space-y-4">
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>
              <strong>Pareto Principle:</strong> The top 3 features (Lag_1, Lag_24, Rolling_mean_24) account for{' '}
              <span className="text-cyan-300 font-bold font-mono">
                {items[2]?.cumulativePercentage || 75}%
              </span>{' '}
              of the model's total forecasting power.
            </span>
          </div>

          <div className="space-y-2.5">
            {items.map((item, idx) => {
              const cum = item.cumulativePercentage || 0;
              const isOver80 = cum >= 80;

              return (
                <div key={item.feature} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-slate-400 w-6">#{idx + 1}</span>
                  <span className="w-32 font-medium text-slate-200 truncate">{item.feature}</span>
                  <div className="flex-1 bg-slate-800/90 rounded-full h-3 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver80 ? 'bg-purple-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      }`}
                      style={{ width: `${cum}%` }}
                    />
                    {/* 80% guide marker */}
                    <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-rose-500 opacity-60"></div>
                  </div>
                  <span className="font-mono text-xs w-14 text-right text-slate-300 font-semibold">
                    {cum}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'impact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.feature} className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{item.feature}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
                    item.direction === 'positive'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : item.direction === 'negative'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.direction === 'positive' ? (
                    <>
                      <ArrowUpRight className="w-3 h-3" /> Increases Demand
                    </>
                  ) : item.direction === 'negative' ? (
                    <>
                      <ArrowDownRight className="w-3 h-3" /> Lowers Demand
                    </>
                  ) : (
                    'Cyclical / Non-Linear'
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {item.impactDescription || 'Covariate contribution in tree splitting logic.'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
