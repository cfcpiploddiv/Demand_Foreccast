import React from 'react';
import { PeakAnalysisResult } from '../../types/pipeline';

interface ConfusionMatrixHeatmapProps {
  peak: PeakAnalysisResult;
}

export const ConfusionMatrixHeatmap: React.FC<ConfusionMatrixHeatmapProps> = ({ peak }) => {
  const { tp, tn, fp, fn, precision, recall, f1, accuracy } = peak.classification;
  const total = tp + tn + fp + fn || 1;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">Peak Demand Classification Matrix</h4>
          <p className="text-xs text-slate-400">
            Evaluating capability to predict high stress grid conditions (&ge; {peak.peakThreshold} MW)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80">
            Peak Bias: {peak.peakBias > 0 ? `+${peak.peakBias}` : peak.peakBias} MW
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* 2x2 Matrix */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
            <div></div>
            <div className="text-slate-400">Predicted Normal</div>
            <div className="text-rose-400 font-semibold">Predicted Peak</div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center justify-end text-slate-400 font-medium pr-2">Actual Normal</div>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">True Negative (TN)</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{tn}</span>
              <span className="text-[10px] text-slate-400 block">{((tn / total) * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3 text-center">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider block">False Positive (FP)</span>
              <span className="text-lg font-bold font-mono text-amber-400">{fp}</span>
              <span className="text-[10px] text-slate-400 block">{((fp / total) * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center justify-end text-rose-400 font-semibold pr-2">Actual Peak</div>
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-3 text-center">
              <span className="text-[10px] text-rose-400 uppercase tracking-wider block">False Negative (FN)</span>
              <span className="text-lg font-bold font-mono text-rose-400">{fn}</span>
              <span className="text-[10px] text-slate-400 block">{((fn / total) * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-cyan-950/40 border border-cyan-700/60 rounded-lg p-3 text-center">
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider block">True Positive (TP)</span>
              <span className="text-lg font-bold font-mono text-cyan-300">{tp}</span>
              <span className="text-[10px] text-slate-400 block">{((tp / total) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Metrics Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Classification Accuracy</span>
            <div className="text-xl font-bold font-mono text-white mt-1">{(accuracy * 100).toFixed(1)}%</div>
            <span className="text-[11px] text-slate-400">Total correct states</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Precision (PPV)</span>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{(precision * 100).toFixed(1)}%</div>
            <span className="text-[11px] text-slate-400">True peaks in alerts</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Recall (Sensitivity)</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{(recall * 100).toFixed(1)}%</div>
            <span className="text-[11px] text-slate-400">Captured grid peaks</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">F1-Score</span>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">{(f1 * 100).toFixed(1)}%</div>
            <span className="text-[11px] text-slate-400">Harmonic mean balance</span>
          </div>
        </div>
      </div>
    </div>
  );
};
