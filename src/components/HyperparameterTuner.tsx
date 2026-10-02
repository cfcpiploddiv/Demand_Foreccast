import React, { useState } from 'react';
import { Sliders, Zap, Check, RotateCcw, Sparkles, TrendingUp, Download } from 'lucide-react';
import { Hyperparameters, ModelComparisonRow } from '../types/pipeline';

interface HyperparameterTunerProps {
  currentParams: Hyperparameters;
  onUpdateParams: (newParams: Hyperparameters) => void;
  isTraining: boolean;
  models: ModelComparisonRow[];
  onNavigateToExport?: () => void;
}

export const HyperparameterTuner: React.FC<HyperparameterTunerProps> = ({
  currentParams,
  onUpdateParams,
  isTraining,
  models,
  onNavigateToExport,
}) => {
  const [params, setParams] = useState<Hyperparameters>(currentParams);
  const [isSearching, setIsSearching] = useState(false);

  const tunedModel = models.find(m => m.id === 'xgb_tuned') || models[models.length - 1];
  const naiveModel = models.find(m => m.id === 'naive_1') || models[0];

  const maeImprovement = naiveModel && tunedModel
    ? +(((naiveModel.metrics.mae - tunedModel.metrics.mae) / naiveModel.metrics.mae) * 100).toFixed(2)
    : 0;

  const rmseImprovement = naiveModel && tunedModel
    ? +(((naiveModel.metrics.rmse - tunedModel.metrics.rmse) / naiveModel.metrics.rmse) * 100).toFixed(2)
    : 0;

  const handleLagToggle = (lag: number) => {
    const exists = params.selected_lags.includes(lag);
    const updated = exists
      ? params.selected_lags.filter(l => l !== lag)
      : [...params.selected_lags, lag].sort((a, b) => a - b);
    setParams({ ...params, selected_lags: updated });
  };

  const handleApply = () => {
    onUpdateParams(params);
  };

  const handleReset = () => {
    const defaults: Hyperparameters = {
      n_estimators: 100,
      max_depth: 5,
      learning_rate: 0.08,
      subsample: 0.9,
      colsample_bytree: 0.85,
      min_child_weight: 3,
      train_split: 0.8,
      use_weather: true,
      use_calendar: true,
      use_cyclic: true,
      selected_lags: [1, 2, 24, 168],
      selected_algorithms: params.selected_algorithms,
      algorithm_selection_mode: params.algorithm_selection_mode,
    };
    setParams(defaults);
    onUpdateParams(defaults);
  };

  const handleAutoSearch = () => {
    setIsSearching(true);
    // Emulate RandomizedSearchCV(TimeSeriesSplit) finding an optimal configuration
    setTimeout(() => {
      const bestDiscovered: Hyperparameters = {
        n_estimators: 180,
        max_depth: 6,
        learning_rate: 0.05,
        subsample: 0.92,
        colsample_bytree: 0.9,
        min_child_weight: 2,
        train_split: 0.8,
        use_weather: true,
        use_calendar: true,
        use_cyclic: true,
        selected_lags: [1, 2, 3, 24, 48, 168],
        selected_algorithms: params.selected_algorithms,
        algorithm_selection_mode: params.algorithm_selection_mode,
      };
      setParams(bestDiscovered);
      onUpdateParams(bestDiscovered);
      setIsSearching(false);
    }, 600);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            Hyperparameter Tuning & Retraining Workbench
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Fine-tune Gradient Boosted / XGBoost hyperparameters and retrain in real-time to optimize MAE, RMSE, and R²
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={isTraining || isSearching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={handleAutoSearch}
            disabled={isTraining || isSearching}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isSearching ? 'Evaluating Folds...' : 'Auto-Tune (TimeSeries CV)'}
          </button>

          <button
            onClick={handleApply}
            disabled={isTraining || isSearching}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            {isTraining ? 'Training Model...' : 'Train & Improve Model'}
          </button>

          {onNavigateToExport && (
            <button
              onClick={onNavigateToExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 border border-emerald-800/80 transition-colors shadow-sm"
              title="Download trained model as .onnx, .pkl, or .json"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export Model (.onnx/.pkl)
            </button>
          )}
        </div>
      </div>

      {/* Model Improvement Summary Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Tuned Test MAE</span>
          <span className="text-xl font-bold font-mono text-cyan-300">{tunedModel?.metrics.mae} MW</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">vs Naive {naiveModel?.metrics.mae} MW</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">MAE Improvement</span>
          <div className="flex items-center gap-1 text-xl font-bold font-mono text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            {maeImprovement > 0 ? `+${maeImprovement}%` : `${maeImprovement}%`}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Error reduction</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Variance Explained (R²)</span>
          <span className="text-xl font-bold font-mono text-amber-300">{tunedModel?.metrics.r2}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Test set goodness of fit</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">RMSE Improvement</span>
          <span className="text-xl font-bold font-mono text-purple-300">
            {rmseImprovement > 0 ? `+${rmseImprovement}%` : `${rmseImprovement}%`}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Tuned RMSE: {tunedModel?.metrics.rmse} MW</span>
        </div>
      </div>

      {/* Tuning Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Core Tree Architecture */}
        <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            1. Boosting Tree Hyperparameters
          </h4>

          {/* n_estimators */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">n_estimators (Number of Trees):</span>
              <span className="font-mono text-cyan-300 font-bold">{params.n_estimators}</span>
            </div>
            <input
              type="range"
              min={20}
              max={300}
              step={10}
              value={params.n_estimators}
              onChange={e => setParams({ ...params, n_estimators: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>20</span>
              <span>150</span>
              <span>300</span>
            </div>
          </div>

          {/* max_depth */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">max_depth (Tree Depth):</span>
              <span className="font-mono text-cyan-300 font-bold">{params.max_depth}</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              step={1}
              value={params.max_depth}
              onChange={e => setParams({ ...params, max_depth: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>2 (Shallow)</span>
              <span>6</span>
              <span>10 (Deep)</span>
            </div>
          </div>

          {/* learning_rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">learning_rate (Shrinkage η):</span>
              <span className="font-mono text-cyan-300 font-bold">{params.learning_rate.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.01}
              max={0.3}
              step={0.01}
              value={params.learning_rate}
              onChange={e => setParams({ ...params, learning_rate: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.01 (Conservative)</span>
              <span>0.15</span>
              <span>0.30 (Aggressive)</span>
            </div>
          </div>
        </div>

        {/* Column 2: Regularization & Sampling */}
        <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            2. Regularization & Subsampling
          </h4>

          {/* subsample */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">subsample (Row Sampling):</span>
              <span className="font-mono text-amber-300 font-bold">{params.subsample.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.0}
              step={0.05}
              value={params.subsample}
              onChange={e => setParams({ ...params, subsample: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.50</span>
              <span>0.75</span>
              <span>1.00 (Full)</span>
            </div>
          </div>

          {/* colsample_bytree */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">colsample_bytree (Feature Sampling):</span>
              <span className="font-mono text-amber-300 font-bold">{params.colsample_bytree.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.0}
              step={0.05}
              value={params.colsample_bytree}
              onChange={e => setParams({ ...params, colsample_bytree: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.50</span>
              <span>0.75</span>
              <span>1.00 (All Features)</span>
            </div>
          </div>

          {/* train_split */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Chronological Split Ratio:</span>
              <span className="font-mono text-amber-300 font-bold">
                {(params.train_split * 100).toFixed(0)}% Train / {((1 - params.train_split) * 100).toFixed(0)}% Test
              </span>
            </div>
            <input
              type="range"
              min={0.6}
              max={0.9}
              step={0.05}
              value={params.train_split}
              onChange={e => setParams({ ...params, train_split: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>60 / 40</span>
              <span>80 / 20 (Standard)</span>
              <span>90 / 10</span>
            </div>
          </div>
        </div>

        {/* Column 3: Feature Engineering Selection */}
        <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            3. Feature Switches & Lag Selection
          </h4>

          {/* Lags selection */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Historical Demand Lags:</label>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 24, 48, 72, 168].map(lag => {
                const isSelected = params.selected_lags.includes(lag);
                return (
                  <button
                    key={lag}
                    type="button"
                    onClick={() => handleLagToggle(lag)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    Lag_{lag}h
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feature toggles */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={params.use_weather}
                onChange={e => setParams({ ...params, use_weather: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Include Weather Features (Temp, Humidity)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={params.use_calendar}
                onChange={e => setParams({ ...params, use_calendar: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Include Calendar & Festival Indicators</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={params.use_cyclic}
                onChange={e => setParams({ ...params, use_cyclic: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Cyclical Sine/Cosine Encoding (Hour, DOW, Month)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
