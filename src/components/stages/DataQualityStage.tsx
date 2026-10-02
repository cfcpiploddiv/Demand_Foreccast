import React from 'react';
import { CheckCircle2, AlertCircle, FileSpreadsheet, BarChart2, Sparkles, RotateCcw, Check, CheckCircle } from 'lucide-react';
import { DataQualityReport, DescriptiveStats } from '../../types/pipeline';
import { HistogramChart } from '../charts/HistogramChart';

interface DataQualityStageProps {
  quality: DataQualityReport;
  stats: DescriptiveStats[];
  correctedLogs: any[];
  onApplyCorrection: () => void;
  onUndoCorrection: () => void;
}

export const DataQualityStage: React.FC<DataQualityStageProps> = ({
  quality,
  stats,
  correctedLogs,
  onApplyCorrection,
  onUndoCorrection,
}) => {
  return (
    <div className="space-y-8">
      {/* Stage 1: Data Quality Check */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                [Stage 1]
              </span>
              <h3 className="text-lg font-bold text-white">Data Quality & Completeness Audit</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Validation of dataset dimensions, missing values per variable, duplicate rows, and datetime continuity
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Total Rows: </span>
              <span className="font-mono text-cyan-300 font-bold">{quality.totalRows.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Duplicate Rows: </span>
              <span className={`font-mono font-bold ${quality.duplicateRows > 0 || correctedLogs.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {correctedLogs.length > 0 ? '0 (Cleaned)' : quality.duplicateRows}
              </span>
            </div>
            {quality.dateRange && (
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400">Date Range: </span>
                <span className="font-mono text-slate-200">
                  {quality.dateRange.start} to {quality.dateRange.end}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Missing Values Table & Visual Representation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-x-auto">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Missing Values by Variable
            </h4>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3 font-medium">Variable</th>
                  <th className="py-2 px-3 font-medium">Data Type</th>
                  <th className="py-2 px-3 font-medium text-right">Missing Count</th>
                  <th className="py-2 px-3 font-medium text-right">Missing %</th>
                  <th className="py-2 px-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {quality.columns.map(col => {
                  const hasMissing = col.missingCount > 0;
                  const isCleaned = correctedLogs.length > 0 && hasMissing;
                  return (
                    <tr key={col.name} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-sans font-semibold text-slate-200">{col.name}</td>
                      <td className="py-2 px-3 text-slate-400">{col.dataType}</td>
                      <td className="py-2 px-3 text-right">
                        {isCleaned ? (
                          <span className="flex items-center justify-end gap-1.5 font-mono">
                            <span className="text-amber-400 font-bold">{col.missingCount}</span>
                            <span className="text-slate-500 text-[10px]">→</span>
                            <span className="text-emerald-400 font-bold">0</span>
                          </span>
                        ) : (
                          <span className={hasMissing ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                            {col.missingCount}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {isCleaned ? (
                          <span className="flex items-center justify-end gap-1.5">
                            <span className="text-amber-400 font-bold">{col.missingPercent}%</span>
                            <span className="text-slate-500 text-[10px]">→</span>
                            <span className="text-emerald-400 font-bold">0%</span>
                          </span>
                        ) : (
                          <span className={hasMissing ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                            {col.missingPercent}%
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isCleaned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            ✓ Cleansed
                          </span>
                        ) : hasMissing ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/80">
                            Imputed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
                            Complete
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Missing Values Visual Bar Plot */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Missing Values Bar Chart (Python df.isna().sum())
            </h4>
            <div className="space-y-3 my-auto">
              {quality.columns.map(col => {
                const maxMissing = Math.max(...quality.columns.map(c => c.missingCount), 1);
                const missingCount = correctedLogs.length > 0 ? 0 : col.missingCount;
                const pct = (missingCount / maxMissing) * 100;
                return (
                  <div key={col.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{col.name}</span>
                      <span className="font-mono text-slate-400">
                        {missingCount} missing ({correctedLogs.length > 0 ? '0.00' : col.missingPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          missingCount > 0 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(missingCount > 0 ? 4 : 0, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 mt-3">
              * Note: In Stage 6, numeric columns undergo forward-fill capped at limit=3 for MW, while categorical columns are filled with "Unknown" to maintain explicit absence.
            </p>
          </div>
        </div>
      </div>

      {/* NEW: Data Cleansing & Correction Workbench requested in prompt */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Automated Data Cleansing & Quality Imputation Workbench
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardize raw data, remove duplicates, resolve missing covariates, and establish quality constraints
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {correctedLogs.length > 0 ? (
              <button
                onClick={onUndoCorrection}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo Imputations / Restore Raw
              </button>
            ) : (
              <button
                onClick={onApplyCorrection}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white shadow-md shadow-cyan-950/40 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Run Automatic Data Cleansing Pipeline
              </button>
            )}
          </div>
        </div>

        {correctedLogs.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-emerald-950/20 border border-emerald-900/60 p-3.5 rounded-xl text-xs flex items-center gap-3 text-emerald-300">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block"> Cleansing Audit Successful</span>
                The raw dataset was cleaned using standardized time-series imputation rules. Autoregressive lags are now free from null gaps, dates have been aligned, and duplicates merged.
              </div>
            </div>

            {/* Before vs After audited table */}
            <div className="overflow-x-auto rounded-xl border border-slate-850">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-850 text-slate-400 font-semibold font-mono">
                    <th className="p-3">Target Feature Column</th>
                    <th className="p-3">Issue Detected (Before Correction)</th>
                    <th className="p-3">Applied Cleansing & Imputation Strategy</th>
                    <th className="p-3">Standardized Output (After Correction)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-mono">
                  {correctedLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-100 font-sans">{log.column}</td>
                      <td className="p-3 text-rose-300 font-sans text-[11px] bg-rose-950/5 border-r border-slate-900">{log.before}</td>
                      <td className="p-3 text-slate-300 font-sans text-[11px] border-r border-slate-900">{log.action}</td>
                      <td className="p-3 text-emerald-300 font-sans text-[11px] bg-emerald-950/5">{log.after}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-900">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-850 border-dashed text-center text-xs text-slate-400 space-y-1">
            <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
            <span className="font-semibold text-slate-300 block">Automatic Cleansing Waiting</span>
            <span>Raw dataset has {quality.duplicateRows} duplicate indices and blank entries in temp/humidity columns. Apply automatic cleansing to establish a continuous baseline.</span>
          </div>
        )}
      </div>

      {/* Stage 2: Descriptive Statistics & Distribution Histograms */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              [Stage 2]
            </span>
            <h3 className="text-lg font-bold text-white">Descriptive Statistics & Feature Distributions</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Summary statistics (mean, std, min, quartiles, max, skewness) and KDE distribution curves (Python df.describe())
          </p>
        </div>

        {/* Descriptive Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Variable</th>
                <th className="py-2.5 px-3 text-right">Count</th>
                <th className="py-2.5 px-3 text-right">Mean</th>
                <th className="py-2.5 px-3 text-right">Std Dev</th>
                <th className="py-2.5 px-3 text-right">Min</th>
                <th className="py-2.5 px-3 text-right">25% (Q1)</th>
                <th className="py-2.5 px-3 text-right">50% (Median)</th>
                <th className="py-2.5 px-3 text-right">75% (Q3)</th>
                <th className="py-2.5 px-3 text-right">Max</th>
                <th className="py-2.5 px-3 text-right">Skewness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stats.map(s => (
                <tr key={s.column} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-sans font-bold text-cyan-300">{s.column}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{s.count.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right text-slate-100 font-semibold">{s.mean}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{s.std}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{s.min}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{s.q25}</td>
                  <td className="py-2.5 px-3 text-right text-amber-400 font-semibold">{s.median}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{s.q75}</td>
                  <td className="py-2.5 px-3 text-right text-rose-400 font-bold">{s.max}</td>
                  <td className="py-2.5 px-3 text-right text-purple-300">{s.skewness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Numerical Distribution Histograms */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {stats.map(s => (
            <HistogramChart
              key={s.column}
              bins={s.histogram}
              title={`Distribution of ${s.column}`}
              xLabel={s.column}
              height={220}
              color={s.column.includes('Demand') ? '#22d3ee' : s.column.includes('Temp') ? '#f59e0b' : '#60a5fa'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
