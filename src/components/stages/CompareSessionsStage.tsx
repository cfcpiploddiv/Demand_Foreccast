import React, { useState } from 'react';
import {
  Pin,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  Plus,
} from 'lucide-react';
import { Hyperparameters, PipelineResults, SavedSession } from '../../types/pipeline';
import { DualTimeSeriesChart } from '../charts/DualTimeSeriesChart';
import { DualROCCurveChart } from '../charts/DualROCCurveChart';
import { downloadFile } from '../../utils/pythonCodeExport';

interface CompareSessionsStageProps {
  results: PipelineResults;
  savedSessions: SavedSession[];
  onPinCurrentSession: (name: string, notes: string) => void;
  onDeleteSession: (id: string) => void;
  onRestoreParams: (hp: Hyperparameters) => void;
  onNavigateToTuning: () => void;
}

export const CompareSessionsStage: React.FC<CompareSessionsStageProps> = ({
  results,
  savedSessions,
  onPinCurrentSession,
  onDeleteSession,
  onRestoreParams,
  onNavigateToTuning,
}) => {
  const [pinNameInput, setPinNameInput] = useState<string>('');
  const [pinNotesInput, setPinNotesInput] = useState<string>('');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Selected sessions to compare
  const [sessionAId, setSessionAId] = useState<string>(savedSessions[0]?.id || 'current');
  const [sessionBId, setSessionBId] = useState<string>('current');

  // Helper to convert active current run into a virtual SavedSession
  const activeSession: SavedSession = {
    id: 'current',
    name: 'Active Current Run (Live)',
    createdAt: 'Just now',
    datasetName: 'Active Dataset',
    hyperparameters: results.hyperparameters,
    bestModelName: results.bestModel.name,
    metrics: results.bestModel.metrics,
    peakThreshold: results.peakAnalysis.peakThreshold,
    peakMetrics: results.peakAnalysis.peakMetrics,
    peakClassification: results.peakAnalysis.classification,
    rocAuc: results.modelVisualizations.rocCurve.auc,
    prAuc: results.modelVisualizations.prCurve.aucPr,
    meanError: results.errorAnalysis.meanError,
    testForecastSample: results.errorAnalysis.testForecastSample,
    rocPoints: results.modelVisualizations.rocCurve.points,
  };

  const allAvailableSessions = [activeSession, ...savedSessions];

  const sessionA = allAvailableSessions.find(s => s.id === sessionAId) || allAvailableSessions[0];
  const sessionB = allAvailableSessions.find(s => s.id === sessionBId) || activeSession;

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = pinNameInput.trim() || `Run #${savedSessions.length + 1} (${results.bestModel.metrics.mae} MW MAE)`;
    onPinCurrentSession(finalName, pinNotesInput.trim());
    setPinNameInput('');
    setPinNotesInput('');
    setShowPinModal(false);
  };

  // Metric Comparison deltas (Session B relative to Session A)
  const calcDelta = (valA: number, valB: number, lowerIsBetter = true) => {
    const diff = +(valB - valA).toFixed(2);
    const pct = valA !== 0 ? +((diff / Math.abs(valA)) * 100).toFixed(1) : 0;
    const isImproved = lowerIsBetter ? diff < 0 : diff > 0;
    return { diff, pct, isImproved };
  };

  const deltaMae = calcDelta(sessionA.metrics.mae, sessionB.metrics.mae, true);
  const deltaRmse = calcDelta(sessionA.metrics.rmse, sessionB.metrics.rmse, true);
  const deltaMape = calcDelta(sessionA.metrics.mape, sessionB.metrics.mape, true);
  const deltaR2 = calcDelta(sessionA.metrics.r2, sessionB.metrics.r2, false);
  const deltaPeakMae = calcDelta(sessionA.peakMetrics.mae, sessionB.peakMetrics.mae, true);
  const deltaRocAuc = calcDelta(sessionA.rocAuc, sessionB.rocAuc, false);
  const deltaF1 = calcDelta(sessionA.peakClassification.f1, sessionB.peakClassification.f1, false);

  const exportComparisonReport = () => {
    const reportText = `
================================================================================
SESSION COMPARISON AUDIT REPORT
Session A: ${sessionA.name} (${sessionA.createdAt})
Session B: ${sessionB.name} (${sessionB.createdAt})
================================================================================

METRICS COMPARISON:
- Test MAE:      ${sessionA.metrics.mae} MW  vs  ${sessionB.metrics.mae} MW  (Diff: ${deltaMae.diff > 0 ? '+' : ''}${deltaMae.diff} MW, ${deltaMae.pct}%)
- Test RMSE:     ${sessionA.metrics.rmse} MW  vs  ${sessionB.metrics.rmse} MW  (Diff: ${deltaRmse.diff > 0 ? '+' : ''}${deltaRmse.diff} MW, ${deltaRmse.pct}%)
- Test MAPE:     ${sessionA.metrics.mape}%   vs  ${sessionB.metrics.mape}%
- Test R² Score: ${sessionA.metrics.r2}      vs  ${sessionB.metrics.r2}  (Diff: ${deltaR2.diff > 0 ? '+' : ''}${deltaR2.diff})
- Peak 90% MAE:  ${sessionA.peakMetrics.mae} MW  vs  ${sessionB.peakMetrics.mae} MW
- Peak ROC-AUC:  ${sessionA.rocAuc}         vs  ${sessionB.rocAuc}
- Peak F1-Score: ${sessionA.peakClassification.f1} vs ${sessionB.peakClassification.f1}

HYPERPARAMETERS COMPARISON:
- n_estimators:     ${sessionA.hyperparameters.n_estimators} vs ${sessionB.hyperparameters.n_estimators}
- max_depth:        ${sessionA.hyperparameters.max_depth} vs ${sessionB.hyperparameters.max_depth}
- learning_rate:    ${sessionA.hyperparameters.learning_rate} vs ${sessionB.hyperparameters.learning_rate}
- subsample:        ${sessionA.hyperparameters.subsample} vs ${sessionB.hyperparameters.subsample}
- colsample_bytree: ${sessionA.hyperparameters.colsample_bytree} vs ${sessionB.hyperparameters.colsample_bytree}
- Selected Lags:    [${sessionA.hyperparameters.selected_lags.join(', ')}] vs [${sessionB.hyperparameters.selected_lags.join(', ')}]
- Use Weather:      ${sessionA.hyperparameters.use_weather} vs ${sessionB.hyperparameters.use_weather}
- Use Calendar:     ${sessionA.hyperparameters.use_calendar} vs ${sessionB.hyperparameters.use_calendar}
- Use Cyclical:     ${sessionA.hyperparameters.use_cyclic} vs ${sessionB.hyperparameters.use_cyclic}
    `.trim();

    downloadFile(`session_comparison_${sessionA.id}_vs_${sessionB.id}.txt`, reportText);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Pin Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Session Comparison
              </span>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-cyan-400" />
                Compare Pipeline Sessions & Experiments
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pin model runs, compare predictions side-by-side, inspect hyperparameter differences, and evaluate error convergence
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-900/40 transition-colors"
            >
              <Pin className="w-3.5 h-3.5" />
              Pin Current Run as Session
            </button>

            {savedSessions.length > 0 && (
              <button
                onClick={exportComparisonReport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Comparison (.txt)
              </button>
            )}
          </div>
        </div>

        {/* Session Selector Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-xs text-amber-400 font-semibold block mb-1.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Baseline / Reference Session (A):
            </label>
            <select
              value={sessionAId}
              onChange={e => setSessionAId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:ring-1 focus:ring-amber-400"
            >
              {allAvailableSessions.map(s => (
                <option key={`A-${s.id}`} value={s.id}>
                  {s.name} ({s.metrics.mae} MW MAE) · {s.createdAt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-purple-400 font-semibold block mb-1.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              Comparison Session (B):
            </label>
            <select
              value={sessionBId}
              onChange={e => setSessionBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:ring-1 focus:ring-purple-400"
            >
              {allAvailableSessions.map(s => (
                <option key={`B-${s.id}`} value={s.id}>
                  {s.name} ({s.metrics.mae} MW MAE) · {s.createdAt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pin Session Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Pin className="w-4 h-4 text-cyan-400" />
                Pin Current Model Run
              </h4>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Session Label / Title:</label>
                <input
                  type="text"
                  placeholder={`Run #${savedSessions.length + 1} (${results.bestModel.name})`}
                  value={pinNameInput}
                  onChange={e => setPinNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Experiment Notes / Hypothesis:</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Tuned depth to 6 and enabled 7-day weekly lag-168 with weather features"
                  value={pinNotesInput}
                  onChange={e => setPinNotesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs space-y-1 font-mono">
                <div className="text-slate-400">Snapshot Metrics:</div>
                <div className="text-cyan-300 font-bold">MAE: {results.bestModel.metrics.mae} MW · R²: {results.bestModel.metrics.r2}</div>
                <div className="text-slate-400 text-[11px]">Trees: {results.hyperparameters.n_estimators} · Depth: {results.hyperparameters.max_depth} · η: {results.hyperparameters.learning_rate}</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-md"
                >
                  Save & Pin Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* METRIC SCORECARD COMPARISON */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
          <span>Comparative Metrics Scorecard</span>
          <span className="text-xs text-slate-400 font-normal">
            Evaluating Session B ({sessionB.name}) relative to Session A ({sessionA.name})
          </span>
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* MAE Scorecard */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Test MAE (MW)</span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-sm text-amber-300">{sessionA.metrics.mae}</span>
              <span className="text-slate-500 text-xs">vs</span>
              <span className="font-mono text-base font-bold text-purple-300">{sessionB.metrics.mae}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Delta (Δ):</span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  deltaMae.isImproved
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                    : deltaMae.diff === 0
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                }`}
              >
                {deltaMae.isImproved ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {deltaMae.diff > 0 ? `+${deltaMae.diff}` : deltaMae.diff} MW ({deltaMae.pct}%)
              </span>
            </div>
          </div>

          {/* RMSE Scorecard */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Test RMSE (MW)</span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-sm text-amber-300">{sessionA.metrics.rmse}</span>
              <span className="text-slate-500 text-xs">vs</span>
              <span className="font-mono text-base font-bold text-purple-300">{sessionB.metrics.rmse}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Delta (Δ):</span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  deltaRmse.isImproved
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                    : deltaRmse.diff === 0
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                }`}
              >
                {deltaRmse.isImproved ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {deltaRmse.diff > 0 ? `+${deltaRmse.diff}` : deltaRmse.diff} MW
              </span>
            </div>
          </div>

          {/* R2 Scorecard */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Variance Explained (R²)</span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-sm text-amber-300">{sessionA.metrics.r2}</span>
              <span className="text-slate-500 text-xs">vs</span>
              <span className="font-mono text-base font-bold text-purple-300">{sessionB.metrics.r2}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Delta (Δ):</span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  deltaR2.isImproved
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                    : deltaR2.diff === 0
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                }`}
              >
                {deltaR2.diff > 0 ? `+${deltaR2.diff}` : deltaR2.diff}
              </span>
            </div>
          </div>

          {/* ROC-AUC Scorecard */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">Peak Event ROC-AUC</span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-sm text-amber-300">{sessionA.rocAuc}</span>
              <span className="text-slate-500 text-xs">vs</span>
              <span className="font-mono text-base font-bold text-purple-300">{sessionB.rocAuc}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Delta (Δ):</span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  deltaRocAuc.isImproved
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                    : deltaRocAuc.diff === 0
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                }`}
              >
                {deltaRocAuc.diff > 0 ? `+${deltaRocAuc.diff}` : deltaRocAuc.diff}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DUAL FORECAST CURVE OVERLAY */}
      <DualTimeSeriesChart
        actual={results.errorAnalysis.testForecastSample}
        sessionAName={sessionA.name}
        sessionAPreds={sessionA.testForecastSample.map(p => p.predicted)}
        sessionBName={sessionB.name}
        sessionBPreds={sessionB.testForecastSample.map(p => p.predicted)}
        peakThreshold={results.peakAnalysis.peakThreshold}
      />

      {/* DUAL ROC CURVES & HYPERPARAMETERS MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Comparison */}
        <DualROCCurveChart
          sessionAName={sessionA.name}
          pointsA={sessionA.rocPoints}
          aucA={sessionA.rocAuc}
          sessionBName={sessionB.name}
          pointsB={sessionB.rocPoints}
          aucB={sessionB.rocAuc}
        />

        {/* Hyperparameters Diff Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-200 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Hyperparameter Diff Matrix</h4>
                <p className="text-xs text-slate-400 mt-0.5">Configuration differences between Session A and B</p>
              </div>

              {sessionA.id !== 'current' && (
                <button
                  onClick={() => onRestoreParams(sessionA.hyperparameters)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore (A) Config
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-2">Parameter</th>
                    <th className="py-2 px-2 text-amber-300 truncate max-w-[130px]">{sessionA.name}</th>
                    <th className="py-2 px-2 text-purple-300 truncate max-w-[130px]">{sessionB.name}</th>
                    <th className="py-2 px-2 text-center">Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {[
                    { label: 'n_estimators', a: sessionA.hyperparameters.n_estimators, b: sessionB.hyperparameters.n_estimators },
                    { label: 'max_depth', a: sessionA.hyperparameters.max_depth, b: sessionB.hyperparameters.max_depth },
                    { label: 'learning_rate', a: sessionA.hyperparameters.learning_rate, b: sessionB.hyperparameters.learning_rate },
                    { label: 'subsample', a: sessionA.hyperparameters.subsample, b: sessionB.hyperparameters.subsample },
                    { label: 'colsample_bytree', a: sessionA.hyperparameters.colsample_bytree, b: sessionB.hyperparameters.colsample_bytree },
                    { label: 'Train/Test Split', a: `${(sessionA.hyperparameters.train_split * 100).toFixed(0)}%`, b: `${(sessionB.hyperparameters.train_split * 100).toFixed(0)}%` },
                    { label: 'Active Lags', a: `[${sessionA.hyperparameters.selected_lags.join(',')}]`, b: `[${sessionB.hyperparameters.selected_lags.join(',')}]` },
                    { label: 'Use Weather', a: sessionA.hyperparameters.use_weather ? 'Enabled' : 'Disabled', b: sessionB.hyperparameters.use_weather ? 'Enabled' : 'Disabled' },
                    { label: 'Use Calendar', a: sessionA.hyperparameters.use_calendar ? 'Enabled' : 'Disabled', b: sessionB.hyperparameters.use_calendar ? 'Enabled' : 'Disabled' },
                    { label: 'Use Cyclical', a: sessionA.hyperparameters.use_cyclic ? 'Enabled' : 'Disabled', b: sessionB.hyperparameters.use_cyclic ? 'Enabled' : 'Disabled' },
                  ].map(row => {
                    const isDiff = String(row.a) !== String(row.b);
                    return (
                      <tr key={row.label} className={isDiff ? 'bg-amber-950/20' : ''}>
                        <td className="py-1.5 px-2 font-sans text-slate-300 font-medium">{row.label}</td>
                        <td className="py-1.5 px-2 text-amber-200">{String(row.a)}</td>
                        <td className="py-1.5 px-2 text-purple-200">{String(row.b)}</td>
                        <td className="py-1.5 px-2 text-center">
                          {isDiff ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 font-bold border border-amber-800">
                              Changed
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* SAVED SESSIONS MANAGEMENT TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Pinned Experiment Sessions Archive ({savedSessions.length})
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical snapshots saved during your tuning workflows
            </p>
          </div>
        </div>

        {savedSessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs space-y-2">
            <p>No custom sessions pinned yet.</p>
            <p className="text-slate-400">
              Click <strong className="text-cyan-400 font-bold">"Pin Current Run as Session"</strong> above to capture your current model snapshot for later comparison!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Session Name</th>
                  <th className="py-2.5 px-3">Saved Time</th>
                  <th className="py-2.5 px-3 text-right">MAE (MW)</th>
                  <th className="py-2.5 px-3 text-right">RMSE (MW)</th>
                  <th className="py-2.5 px-3 text-right">R² Score</th>
                  <th className="py-2.5 px-3 text-right">ROC-AUC</th>
                  <th className="py-2.5 px-3 text-center">Config Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {savedSessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-850">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <Pin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{s.name}</span>
                      </div>
                      {s.notes && <div className="text-[10px] text-slate-400 font-normal pl-5">{s.notes}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{s.createdAt}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">{s.metrics.mae}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{s.metrics.rmse}</td>
                    <td className="py-2.5 px-3 text-right text-amber-300 font-semibold">{s.metrics.r2}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">{s.rocAuc}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSessionAId(s.id);
                            setSessionBId('current');
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 font-sans font-medium"
                          title="Compare against Current Live Run"
                        >
                          Compare vs Live
                        </button>
                        <button
                          onClick={() => onRestoreParams(s.hyperparameters)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-300 font-sans font-medium"
                          title="Apply this session's hyperparameters to tuner"
                        >
                          Apply Config
                        </button>
                        <button
                          onClick={() => onDeleteSession(s.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
                          title="Delete saved session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
