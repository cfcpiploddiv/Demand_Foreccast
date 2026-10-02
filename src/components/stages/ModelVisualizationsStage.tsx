import React, { useState } from 'react';
import {
  Activity,
  Layers,
  LineChart,
  BarChart3,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { PipelineResults } from '../../types/pipeline';
import { ROCCurveChart } from '../charts/ROCCurveChart';
import { ConfusionMatrixHeatmap } from '../charts/ConfusionMatrixHeatmap';
import { EnhancedFeatureImportanceChart } from '../charts/EnhancedFeatureImportanceChart';
import { LearningCurveChart } from '../charts/LearningCurveChart';
import { ResidualDiagnosticsChart } from '../charts/ResidualDiagnosticsChart';
import { ScatterParityChart } from '../charts/ScatterParityChart';
import { HistogramChart } from '../charts/HistogramChart';

interface ModelVisualizationsStageProps {
  results: PipelineResults;
  onNavigateToTuning: () => void;
}

export const ModelVisualizationsStage: React.FC<ModelVisualizationsStageProps> = ({
  results,
  onNavigateToTuning,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'roc' | 'confusion' | 'importance' | 'learning' | 'residuals'>('all');
  const { modelVisualizations, bestModel, peakAnalysis, errorAnalysis, featureImportances } = results;

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Visual Analytics Hub
              </span>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-cyan-400" />
                Post-Training Model Visualizations
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visual evaluation of discriminative performance, confusion matrices, ROC/PR curves, feature gains, learning trajectories, and residual diagnostics
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onNavigateToTuning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-md transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              Tune & Retrain Model
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'All Visualizations' },
            { id: 'roc', label: 'ROC & PR Curves (AUC: ' + modelVisualizations.rocCurve.auc + ')' },
            { id: 'confusion', label: 'Confusion Matrix (Grid Peak Stress)' },
            { id: 'importance', label: 'Feature Importance & Pareto' },
            { id: 'learning', label: 'Convergence & Learning Curve' },
            { id: 'residuals', label: 'Residuals & Q-Q Diagnostics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === tab.id
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: ROC & PR CURVES */}
      {(activeSubTab === 'all' || activeSubTab === 'roc') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              1. Discriminative ROC & Precision-Recall Curves
            </h4>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <ROCCurveChart roc={modelVisualizations.rocCurve} pr={modelVisualizations.prCurve} />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Operating Point Summary
                </h5>
                <div className="space-y-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400 font-sans">AUC-ROC Metric:</span>
                    <span className="text-emerald-400 font-bold">{modelVisualizations.rocCurve.auc}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400 font-sans">AUC-PR Metric:</span>
                    <span className="text-cyan-300 font-bold">{modelVisualizations.prCurve.aucPr}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400 font-sans">Youden's Cutoff:</span>
                    <span className="text-amber-400 font-bold">{modelVisualizations.rocCurve.optimalThreshold} MW</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400 font-sans">Sensitivity (TPR):</span>
                    <span className="text-white">{(modelVisualizations.rocCurve.optimalTpr * 100).toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between">
                    <span className="text-slate-400 font-sans">False Alarm (FPR):</span>
                    <span className="text-white">{(modelVisualizations.rocCurve.optimalFpr * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-950/40 border border-cyan-800/60 p-3 rounded-lg text-xs text-slate-300">
                <span className="font-semibold text-cyan-300 block mb-0.5">Engineering Insight:</span>
                An AUC of {modelVisualizations.rocCurve.auc} indicates the model successfully anticipates 90th-percentile grid strain events with minimal false dispatches.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: CONFUSION MATRIX */}
      {(activeSubTab === 'all' || activeSubTab === 'confusion') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              2. Grid Reliability Confusion Matrix & Classification Metrics
            </h4>
          </div>
          <ConfusionMatrixHeatmap peak={peakAnalysis} />
        </section>
      )}

      {/* SECTION 3: FEATURE IMPORTANCE & SHAP */}
      {(activeSubTab === 'all' || activeSubTab === 'importance') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              3. Feature Importance, Pareto Distribution & Physical Influence
            </h4>
          </div>
          <EnhancedFeatureImportanceChart items={featureImportances} />
        </section>
      )}

      {/* SECTION 4: LEARNING & LOSS CONVERGENCE */}
      {(activeSubTab === 'all' || activeSubTab === 'learning') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              4. Boosting Rounds Learning & Loss Trajectory
            </h4>
          </div>
          <LearningCurveChart
            iterations={modelVisualizations.learningCurve.iterations}
            bestIter={modelVisualizations.learningCurve.bestIter}
          />
        </section>
      )}

      {/* SECTION 5: RESIDUAL DIAGNOSTICS & Q-Q */}
      {(activeSubTab === 'all' || activeSubTab === 'residuals') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              5. Residual Errors (Fitted vs. Residuals & Normal Q-Q Plot)
            </h4>
          </div>
          <ResidualDiagnosticsChart
            residualsVsFitted={modelVisualizations.residualsVsFitted.points}
            qqPlot={modelVisualizations.qqPlot.points}
          />
        </section>
      )}
    </div>
  );
};
