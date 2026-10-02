import React from 'react';
import { Activity, ShieldAlert, BarChart3, ScatterChart as ScatterIcon, Layers } from 'lucide-react';
import { PipelineResults } from '../../types/pipeline';
import { ConfusionMatrixHeatmap } from '../charts/ConfusionMatrixHeatmap';
import { ScatterParityChart } from '../charts/ScatterParityChart';
import { HistogramChart } from '../charts/HistogramChart';
import { HourlyErrorChart } from '../charts/HourlyErrorChart';

interface PeakErrorStageProps {
  results: PipelineResults;
}

export const PeakErrorStage: React.FC<PeakErrorStageProps> = ({ results }) => {
  const { peakAnalysis, errorAnalysis } = results;

  return (
    <div className="space-y-8">
      {/* Stage 9 & 12.12: Peak Demand & Reliability Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                [Stage 9 & 12.12]
              </span>
              <h3 className="text-lg font-bold text-white">Peak-Demand Stress & Classification Audit</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Top 10% peak demand quantile analysis, peak forecast bias, and binary peak alert classification metrics
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Peak 90% Threshold: </span>
              <span className="font-mono text-rose-400 font-bold">{peakAnalysis.peakThreshold} MW</span>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Peak Hours: </span>
              <span className="font-mono text-slate-200">{peakAnalysis.peakObservations} hrs</span>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Peak MAE: </span>
              <span className="font-mono text-amber-300 font-bold">{peakAnalysis.peakMetrics.mae} MW</span>
            </div>
          </div>
        </div>

        {/* Confusion Matrix & Classification Stats */}
        <ConfusionMatrixHeatmap peak={peakAnalysis} />
      </div>

      {/* Stage 10 & 12.4-12.9: Residual & Diagnostic Deep-Dive */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800">
                [Stage 10 & 12]
              </span>
              <h3 className="text-lg font-bold text-white">Residual & Diagnostic Deep-Dive</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Forecast bias direction, error distribution histograms, parity scatter plots, and error slices by demand level & day type
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Mean Forecast Error (Bias): </span>
              <span className={`font-mono font-bold ${errorAnalysis.meanError >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                {errorAnalysis.meanError > 0 ? `+${errorAnalysis.meanError}` : errorAnalysis.meanError} MW ({errorAnalysis.biasPercentage}%)
              </span>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Median Error: </span>
              <span className="font-mono text-slate-200">{errorAnalysis.medianError} MW</span>
            </div>
          </div>
        </div>

        {/* Residual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error Distribution Histogram */}
          <HistogramChart
            bins={errorAnalysis.errorDistribution}
            title="Residual Error Distribution (Actual - Predicted)"
            xLabel="Error in MW (Zero = Perfect Match)"
            yLabel="Frequency"
            color="#a855f7"
            height={260}
            highlightZero={true}
          />

          {/* Actual vs Predicted Parity Scatter */}
          <ScatterParityChart
            data={errorAnalysis.scatterParitySample}
            height={260}
          />
        </div>

        {/* Hourly Error & Slice Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <HourlyErrorChart stats={errorAnalysis.hourlyErrors} />

          <div className="space-y-4">
            {/* Weekday vs Weekend Accuracy */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                Weekday vs Weekend Forecast Accuracy
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {errorAnalysis.weekdayWeekendErrors.map(item => (
                  <div key={item.type} className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs font-medium text-slate-400 block">{item.type}</span>
                    <div className="text-lg font-bold font-mono text-cyan-300 mt-1">{item.mae} MW MAE</div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Avg Demand: {item.meanDemand} MW ({item.count} hrs)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demand Level Tercile Accuracy */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                Accuracy by Demand Level (Terciles)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {errorAnalysis.demandLevelErrors.map(item => (
                  <div key={item.level} className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs font-medium text-slate-400 block">{item.level} Demand</span>
                    <div className="text-lg font-bold font-mono text-amber-300 mt-1">{item.mae} MW</div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Mean: {item.meanDemand} MW
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
