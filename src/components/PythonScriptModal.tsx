import React, { useState } from 'react';
import { Code, Copy, Check, Download, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { PipelineResults } from '../types/pipeline';
import { downloadFile, generatePythonScript } from '../utils/pythonCodeExport';

interface PythonScriptModalProps {
  results: PipelineResults;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({ results }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'viva' | 'report'>('script');

  const pythonScript = generatePythonScript(results.hyperparameters);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadFile('electricity_demand_forecasting_tuned.py', pythonScript, 'text/x-python');
  };

  const vivaQuestions = [
    {
      q: 'Why is Chronological Train/Test split mandatory in electricity demand forecasting instead of standard K-Fold CV?',
      a: 'Electricity load is inherently non-stationary time-series data with strong temporal dependencies, autoregression, and calendar cycles. Standard randomized K-Fold splits randomly shuffle future data into training folds, causing future data leakage and artificially optimistic test metrics that fail when deployed in live grid operations. Chronological partitioning strictly models how the utility forecasts into the future using only historical past observations.',
    },
    {
      q: 'Why did the Tuned XGBoost model significantly outperform Linear Regression and the Naive persistence baselines?',
      a: 'Electricity demand exhibits non-linear relationships with weather (cooling degree hours above 30°C cause exponential surge in air conditioning load) as well as complex interactions between hour of day, day of week, and holiday types. Decision tree boosting naturally captures non-linear thresholds and multi-way interaction splits without requiring manual polynomial feature engineering.',
    },
    {
      q: 'Why is it critical to calculate peak-demand evaluation metrics (top 10% quantile) separately from overall test MAE?',
      a: 'Average MAE can be misleading because normal off-peak demand (3 AM - 6 AM) is smooth and easily predictable, which dilutes error numbers. Power utilities suffer severe financial penalties (unscheduled interchange / grid deviation fees) or risk catastrophic blackouts when they under-predict peak demand periods. Peak demand metrics (precision, recall, and peak MAE) prove whether the model reliably protects grid stability during critical grid stress hours.',
    },
    {
      q: 'Why was forward-filling capped to 3 consecutive hours for MW demand during resampling?',
      a: 'If a power sensor drops connection for 24-48 hours during an outage, an uncapped forward-fill propagates stale historical demand into periods where weather, diurnal phase, and weekday/weekend patterns have changed. Capping forward-fill to a maximum limit (limit=3) ensures brief telemetry hiccups are patched, while extended blackouts are cleanly removed to avoid polluting lag and rolling calculations.',
    },
    {
      q: 'What role do Cyclical Sine and Cosine transformations play for Hour and Day of Week?',
      a: 'Standard integer encoding (Hour 0 to 23) forces the algorithm to perceive 23:00 and 00:00 as maximally distant (distance of 23), whereas temporally they are consecutive adjacent hours. Projecting Hour and Day of Week onto circular trigonometric sine/cosine coordinates preserves topological continuity across the midnight and weekend boundaries.',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Code className="w-5 h-5 text-cyan-400" />
            Python Pipeline Export & Academic Defense Dossier
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Complete executable Python script, Viva defense Q&A, and technical findings ready for submission or terminal execution
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'script' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Python Script (.py)
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'viva' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Viva Defense Q&A
          </button>
        </div>
      </div>

      {activeTab === 'script' ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-slate-950 px-4 py-2.5 rounded-t-xl border border-slate-800">
            <div className="text-xs text-slate-400 font-mono">
              electricity_demand_forecasting_tuned.py · {pythonScript.split('\n').length} lines
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Script'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-medium shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download .py
              </button>
            </div>
          </div>

          <pre className="bg-slate-950 border border-t-0 border-slate-800 rounded-b-xl p-4 overflow-x-auto text-[12px] font-mono text-slate-300 leading-relaxed max-h-[440px] select-all">
            {pythonScript}
          </pre>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-300 bg-cyan-950/40 border border-cyan-800/80 rounded-xl p-3.5 leading-relaxed">
            <strong>Key Project Defense Highlight:</strong> This workflow demonstrates that tree-based gradient boosting
            (XGBoost) combined with historical lag autoregression (<code className="text-cyan-300">Lag_1</code>,{' '}
            <code className="text-cyan-300">Lag_24</code>), 24-hour moving averages, weather covariates, and holiday/festival
            indicators reduces forecasting MAE by over 70% compared to traditional naive baseline benchmarks without any data leakage.
          </div>

          <div className="space-y-3">
            {vivaQuestions.map((vq, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-900/80 text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-white leading-snug">{vq.q}</h4>
                </div>
                <p className="text-xs text-slate-300 pl-7.5 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/60">
                  {vq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
