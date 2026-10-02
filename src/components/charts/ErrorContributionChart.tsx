import React, { useState } from 'react';
import { Sparkles, BarChart3, HelpCircle, Activity, Info } from 'lucide-react';

interface FeatureImportanceItem {
  feature: string;
  label: string;
  permutationScore: number; // Mean Increase in Test RMSE (%) if permuted
  shapScore: number;        // Mean Absolute SHAP Value (MW impact)
  errorContribution: number; // Percent contribution to prediction residuals
  description: string;
}

export const ErrorContributionChart: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<'permutation' | 'shap'>('permutation');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const importanceData: FeatureImportanceItem[] = [
    {
      feature: 'Temp',
      label: 'Temp (Dry Bulb Temperature)',
      permutationScore: 28.4,
      shapScore: 165.2,
      errorContribution: 31.2,
      description: 'Sudden high temperature surges or heatwaves trigger exponential air conditioning demands. This non-linear transition is the hardest to fit perfectly, contributing the most to sudden residuals.',
    },
    {
      feature: 'Lag_1h',
      label: 'Lag_1h (Autoregressive demand, t-1)',
      permutationScore: 21.6,
      shapScore: 124.5,
      errorContribution: 22.4,
      description: 'Sensor transmission failures, grid dispatch drops, or rapid weather front shifts cause rapid t-1 demand deviations. Disruptions in short-term lag directly spike prediction errors.',
    },
    {
      feature: 'Lag_24h',
      label: 'Lag_24h (Autoregressive daily demand, t-24)',
      permutationScore: 14.8,
      shapScore: 92.1,
      errorContribution: 15.6,
      description: 'Measures daily pattern shifts. If weather, industrial demand, or grid configurations diverge sharply from yesterday, this daily reference introduces structural prediction lags.',
    },
    {
      feature: 'Humidity',
      label: 'Humidity (Relative Humidity %)',
      permutationScore: 10.5,
      shapScore: 58.4,
      errorContribution: 11.2,
      description: 'Influences heat-index comfort. High humidity at moderate temperatures often causes unanticipated cooling spikes, making relative humidity a key exogenous contributor to residuals.',
    },
    {
      feature: 'Is_Festival',
      label: 'Is_Festival (Festival Name flag)',
      permutationScore: 8.2,
      shapScore: 49.3,
      errorContribution: 8.5,
      description: 'Festivals introduce sudden, large structural demand drop-offs (factory closures, religious gatherings). If misaligned or active during normal load phases, it spikes prediction residuals.',
    },
    {
      feature: 'Rolling_mean_24h',
      label: 'Rolling_mean_24h (24h Window Average)',
      permutationScore: 7.1,
      shapScore: 38.6,
      errorContribution: 7.4,
      description: 'Captures baseline thermodynamic inertia. If the utility undergoes sudden load shedding or industrial ramp-downs, the 24-hour baseline average lags behind, causing transient errors.',
    },
    {
      feature: 'Holiday_National',
      label: 'Holiday_National (Calendar profile)',
      permutationScore: 4.8,
      shapScore: 24.1,
      errorContribution: 4.9,
      description: 'Triggers weekend-like load profiles on mid-week days. Minor timing discrepancies or business activity differences on commercial feeders cause localized residual spikes.',
    },
    {
      feature: 'Hour_sin / cos',
      label: 'Hour_sin / cos (Cyclical Time Projection)',
      permutationScore: 3.1,
      shapScore: 15.3,
      errorContribution: 3.2,
      description: 'Daily morning ramp-up (6 AM) and evening lighting peaks (7 PM) are prone to minor phase errors where the predicted curve shifts slightly left or right of the true grid load.',
    },
    {
      feature: 'Lag_168h',
      label: 'Lag_168h (Weekly cyclical load, t-168)',
      permutationScore: 2.2,
      shapScore: 11.8,
      errorContribution: 2.3,
      description: 'Weekly autoregressive reference. Helps separate weekdays from weekends, but carries low residual risk unless major holiday sequences occur exactly 7 days apart.',
    },
  ];

  // Sort by active score
  const sortedData = [...importanceData].sort((a, b) => {
    return activeMetric === 'permutation' ? b.permutationScore - a.permutationScore : b.shapScore - a.shapScore;
  });

  const maxVal = Math.max(...sortedData.map(d => activeMetric === 'permutation' ? d.permutationScore : d.shapScore));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Error Contribution & Interpretability Workbench
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Analyze variable impact on prediction residuals using Model-Agnostic Permutation Importance & SHAP (SHapley Additive exPlanations)
          </p>
        </div>

        {/* Toggle Controls */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveMetric('permutation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeMetric === 'permutation'
                ? 'bg-amber-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Permutation Error Increase (%)
          </button>
          <button
            onClick={() => setActiveMetric('shap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeMetric === 'shap'
                ? 'bg-cyan-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            SHAP Residual Impact (MW)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Horizontal Bar Chart (SVG-less high-fidelity layout) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider font-mono">
            <span>Feature Name</span>
            <span>{activeMetric === 'permutation' ? 'RMSE Increase % if Shuffled' : 'Mean Absolute |SHAP| (MW)'}</span>
          </div>

          <div className="space-y-3.5">
            {sortedData.map((d, index) => {
              const currentScore = activeMetric === 'permutation' ? d.permutationScore : d.shapScore;
              const widthPct = (currentScore / maxVal) * 100;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={d.feature}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="space-y-1 group cursor-pointer"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                      {d.label}
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {activeMetric === 'permutation' ? `+${currentScore.toFixed(1)}%` : `${currentScore.toFixed(1)} MW`}
                    </span>
                  </div>

                  {/* Bar Background container */}
                  <div className="h-6 bg-slate-950 rounded-lg relative overflow-hidden border border-slate-800/60 group-hover:border-slate-700 transition-colors">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className={`h-full absolute left-0 top-0 transition-all duration-500 ease-out rounded-r-md ${
                        activeMetric === 'permutation'
                          ? 'bg-gradient-to-r from-amber-600/70 to-rose-600/90'
                          : 'bg-gradient-to-r from-cyan-600/70 to-indigo-600/90'
                      }`}
                    />
                    
                    {/* Inner highlight during hover */}
                    {isHovered && (
                      <div className="absolute inset-0 bg-white/[0.04] transition-all" />
                    )}

                    {/* Left overlay badge for ranking */}
                    <div className="absolute left-2.5 top-1 font-mono text-[9px] font-bold text-slate-400">
                      RANK #{index + 1}
                    </div>

                    {/* Percentage contribution label inside the bar */}
                    <div className="absolute right-2.5 top-1 font-mono text-[9px] text-slate-400 group-hover:text-white transition-colors">
                      Residual Contrib: {d.errorContribution.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informative Diagnostic Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2 border-b border-slate-900 pb-2.5">
                <Info className="w-4 h-4 text-cyan-400" />
                Error Diagnostics & Physics of Grid Load
              </h4>

              {hoveredIndex !== null ? (
                <div className="space-y-2.5 animate-fadeIn">
                  <div className="text-xs font-bold text-amber-300">
                    Diagnostics for {sortedData[hoveredIndex].feature}:
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg">
                    {sortedData[hoveredIndex].description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/30 p-2.5 rounded border border-slate-900">
                    <div className="text-[10px]">
                      <span className="text-slate-400 uppercase tracking-wider block">Permutation Impact</span>
                      <span className="text-xs font-bold text-white font-mono">+{sortedData[hoveredIndex].permutationScore.toFixed(1)}% RMSE</span>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-slate-400 uppercase tracking-wider block">Mean SHAP Force</span>
                      <span className="text-xs font-bold text-white font-mono">{sortedData[hoveredIndex].shapScore.toFixed(1)} MW</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hover over any variable bar on the left to see the **underlying physics of grid load dynamics** and understand why that feature contributes to forecasting errors.
                  </p>
                  <div className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2 items-start">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-slate-300 font-medium">
                        How is Permutation Importance computed?
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed pl-6">
                      The values of a feature are randomly shuffled in the test set, destroying its relationship with the load. The model is re-evaluated, and the percentage increase in RMSE represents the variable's direct error-mitigation value.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900/60 border border-cyan-950 text-cyan-300 rounded-lg p-3 text-[11px] leading-relaxed">
              <strong>Key Takeaway:</strong> Temperature and Short-term lag (<code className="text-amber-200">Lag_1h</code>) are overwhelmingly the primary drivers of residuals, explaining why hyperparameter optimization of tree models (which handle thermal nonlinearity and lag thresholds) directly minimizes peak grid deviations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
