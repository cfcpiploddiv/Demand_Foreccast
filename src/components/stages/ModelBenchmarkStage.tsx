import React from 'react';
import { Award, Download, Layers, TrendingUp, CheckCircle, ArrowUpRight, Sparkles, Sliders, CheckSquare, Square } from 'lucide-react';
import { PipelineResults, Hyperparameters } from '../../types/pipeline';
import { exportComparisonCSV, downloadFile } from '../../utils/pythonCodeExport';
import { FeatureImportanceChart } from '../charts/FeatureImportanceChart';

interface ModelBenchmarkStageProps {
  results: PipelineResults;
  onNavigateToTuning: () => void;
  onUpdateParams: (params: Hyperparameters) => void;
}

export const ModelBenchmarkStage: React.FC<ModelBenchmarkStageProps> = ({
  results,
  onNavigateToTuning,
  onUpdateParams,
}) => {
  const { models, bestModel, featureGroupExperiments, featureImportances } = results;
  const hp = results.hyperparameters;

  const naive1 = models.find(m => m.id === 'naive_1') || models[0];

  const handleDownloadCSV = () => {
    const csv = exportComparisonCSV(results);
    downloadFile('model_comparison_leaderboard.csv', csv, 'text/csv');
  };

  const handleToggleMode = (mode: 'auto' | 'manual') => {
    const updated: Hyperparameters = {
      ...hp,
      algorithm_selection_mode: mode,
    };
    onUpdateParams(updated);
  };

  const handleToggleAlgorithm = (id: string) => {
    const currentSelected = hp.selected_algorithms || [];
    const exists = currentSelected.includes(id);
    const updatedSelected = exists
      ? currentSelected.filter(x => x !== id)
      : [...currentSelected, id];

    const updated: Hyperparameters = {
      ...hp,
      selected_algorithms: updatedSelected,
    };
    onUpdateParams(updated);
  };

  // Taxonomic ML Levels list for Manual mode checkboxes
  const mlLevels = [
    {
      title: 'Level 1: Baselines & Stats',
      color: 'border-slate-800 text-slate-300',
      items: [
        { id: 'naive_1', label: 'Naive-1 Persistence' },
        { id: 'naive_24', label: 'Seasonal Naive-24' },
        { id: 'naive_168', label: 'Seasonal Naive-168' },
        { id: 'sarimax', label: 'SARIMAX Model' },
      ],
    },
    {
      title: 'Level 2: Classical ML',
      color: 'border-blue-900/40 text-blue-300',
      items: [
        { id: 'lr', label: 'Linear Regression' },
        { id: 'ridge', label: 'Ridge Regression' },
        { id: 'lasso', label: 'Lasso Regression' },
        { id: 'dt', label: 'Decision Tree' },
        { id: 'rf', label: 'Random Forest' },
        { id: 'svr', label: 'SVR (Kernel Support Vector)' },
      ],
    },
    {
      title: 'Level 3: Advanced Boosting',
      color: 'border-cyan-900/40 text-cyan-300',
      items: [
        { id: 'xgb_base', label: 'XGBoost (Base)' },
        { id: 'xgb_tuned', label: 'XGBoost (Optimized)' },
        { id: 'lgbm', label: 'LightGBM Booster' },
        { id: 'catboost', label: 'CatBoost Regressor' },
      ],
    },
    {
      title: 'Level 4: Neural Networks / DL',
      color: 'border-purple-900/40 text-purple-300',
      items: [
        { id: 'mlp', label: 'MLP Multi-Layer' },
        { id: 'lstm', label: 'LSTM Recurrent DL' },
        { id: 'gru', label: 'GRU Recurrent DL' },
      ],
    },
  ];

  const currentSelected = hp.selected_algorithms || [];

  return (
    <div className="space-y-8">
      {/* Dynamic Algorithm Selector Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Interactive Model Selection Controller
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select which algorithms should be included and evaluated in the leaderboard comparison
            </p>
          </div>

          {/* Mode Segmented Controls */}
          <div className="flex bg-slate-950 p-1 rounded-lg text-xs border border-slate-800 shrink-0">
            <button
              onClick={() => handleToggleMode('auto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                hp.algorithm_selection_mode === 'auto'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto Selection
            </button>
            <button
              onClick={() => handleToggleMode('manual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                hp.algorithm_selection_mode === 'manual'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Manual Checkbox Selection
            </button>
          </div>
        </div>

        {/* Display options based on mode */}
        {hp.algorithm_selection_mode === 'manual' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {mlLevels.map(lvl => (
              <div key={lvl.title} className={`bg-slate-950/60 border rounded-xl p-4 space-y-3 ${lvl.color}`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-900 pb-1.5">
                  {lvl.title}
                </h4>
                <div className="space-y-2.5">
                  {lvl.items.map(item => {
                    const isChecked = currentSelected.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        onClick={() => handleToggleAlgorithm(item.id)}
                        className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none group transition-colors"
                      >
                        <span className="text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 fill-cyan-950" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </span>
                        <span className={`font-medium ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 text-xs text-slate-400 flex flex-col md:flex-row md:items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">Auto-Calibration Active</span>
              Automatically evaluating **12 recommended algorithms** across all 4 levels (Baselines, Regularized Linear, Bagging ensembles, Gradient Boosting, MLP Neural Net, and Deep Sequence LSTM/GRU) matching academic and industrial benchmarks. Toggle **Manual Selection** above to isolate specific algorithms.
            </div>
          </div>
        )}
      </div>

      {/* Stage 7: Feature Group Contribution Experiments */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              [Stage 7]
            </span>
            <h3 className="text-lg font-bold text-white">Feature Group Ablation Experiments</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantifying the marginal utility of adding weather covariates and calendar/holiday features over pure historical demand
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featureGroupExperiments.map((grp, idx) => (
            <div
              key={grp.groupName}
              className={`bg-slate-950/70 border rounded-xl p-5 space-y-3 ${
                idx === 2 ? 'border-cyan-600/80 shadow-lg shadow-cyan-950/30' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 font-mono">Set {String.fromCharCode(65 + idx)}</span>
                {grp.maeImprovementOverBaseline !== undefined && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    +{grp.maeImprovementOverBaseline}% Gain
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-white">{grp.groupName}</h4>
              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">{grp.description}</p>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">MAE:</span>
                  <span className="text-cyan-300 font-bold">{grp.metrics.mae} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RMSE:</span>
                  <span className="text-slate-300">{grp.metrics.rmse} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MAPE:</span>
                  <span className="text-slate-300">{grp.metrics.mape}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">R² Score:</span>
                  <span className="text-amber-400 font-semibold">{grp.metrics.r2}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage 8: Full Model Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                [Stage 8]
              </span>
              <h3 className="text-lg font-bold text-white">Comprehensive Model Evaluation Leaderboard</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cross-model comparison across Naive baselines, Linear Regression, Regularization, Ensembles, Boosting, and Neural Networks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Table (CSV)
            </button>

            <button
              onClick={onNavigateToTuning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-md transition-colors"
            >
              Tune Hyperparameters
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-3 px-3">Model Architecture</th>
                <th className="py-3 px-3">Class</th>
                <th className="py-3 px-3 text-right">MAE (MW)</th>
                <th className="py-3 px-3 text-right">RMSE (MW)</th>
                <th className="py-3 px-3 text-right">MAPE (%)</th>
                <th className="py-3 px-3 text-right">sMAPE (%)</th>
                <th className="py-3 px-3 text-right">R² Score</th>
                <th className="py-3 px-3 text-right">Gain vs Naive</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {models.map(m => {
                const isBest = m.id === bestModel.id;
                const gain = naive1 ? +(((naive1.metrics.mae - m.metrics.mae) / naive1.metrics.mae) * 100).toFixed(1) : 0;

                return (
                  <tr
                    key={m.id}
                    className={`transition-colors ${
                      isBest ? 'bg-cyan-950/40 font-semibold' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-3 font-sans font-medium text-slate-100 flex items-center gap-2">
                      {isBest && <Award className="w-4 h-4 text-amber-400 shrink-0" />}
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700">
                        {m.category}
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-right ${isBest ? 'text-cyan-300 font-bold text-sm' : 'text-slate-200'}`}>
                      {m.metrics.mae}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">{m.metrics.rmse}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{m.metrics.mape}%</td>
                    <td className="py-3 px-3 text-right text-slate-300">{m.metrics.smape}%</td>
                    <td className={`py-3 px-3 text-right ${isBest ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                      {m.metrics.r2}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {gain > 0 ? (
                        <span className="text-emerald-400 font-bold">+{gain}%</span>
                      ) : gain === 0 ? (
                        <span className="text-slate-400">Baseline</span>
                      ) : (
                        <span className="text-rose-400">{gain}%</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isBest ? (
                        <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] uppercase font-bold">
                          Best Model
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-sans">Benchmark</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importances Chart */}
      <FeatureImportanceChart items={featureImportances} />
    </div>
  );
};
