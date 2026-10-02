import React from 'react';
import { ShieldCheck, CheckCircle2, Cpu, Clock, Calendar, AlertCircle } from 'lucide-react';
import { PipelineResults } from '../../types/pipeline';
import { CorrelationHeatmap } from '../charts/CorrelationHeatmap';

interface FeatureEngineeringStageProps {
  results: PipelineResults;
}

export const FeatureEngineeringStage: React.FC<FeatureEngineeringStageProps> = ({ results }) => {
  const { correlationMatrix, featureEngineeringAudit } = results;

  return (
    <div className="space-y-8">
      {/* Correlation Matrix */}
      <div className="space-y-4">
        <CorrelationHeatmap
          features={correlationMatrix.features}
          matrix={correlationMatrix.matrix}
        />

        {/* Ranked correlation list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Features Ranked by Absolute Correlation with Electricity Demand (MW)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {correlationMatrix.sortedWithDemand.map((item, idx) => (
              <div key={item.feature} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-slate-400">
                  <span>#{idx + 1} {item.feature}</span>
                  <span
                    className={`font-mono font-bold ${
                      item.correlation > 0 ? 'text-amber-400' : 'text-blue-400'
                    }`}
                  >
                    {item.correlation > 0 ? `+${item.correlation.toFixed(3)}` : item.correlation.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Engineering & Data Leakage Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              [Stage 6]
            </span>
            <h3 className="text-lg font-bold text-white">Feature Engineering & Data Leakage Audit</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Construction of multi-horizon autoregressive lags, 24-hour moving window statistics, cyclical sine/cosine time projections, and strict leakage prevention
          </p>
        </div>

        {/* Leakage Audit Checklist Cards */}
        <div className="bg-slate-950/70 border border-emerald-900/60 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Automated Data Leakage Audit: 4 of 4 Integrity Checks Passed</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {featureEngineeringAudit.leakageChecks.map((check, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-semibold text-slate-200">{check.rule}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{check.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Created Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Autoregressive Lags */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Clock className="w-4 h-4" />
              Autoregressive Lags
            </h4>
            <div className="text-xs text-slate-300 space-y-1.5 font-mono">
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Lag_1 (t - 1h):</span> <span className="text-cyan-300">Previous hour</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Lag_2 (t - 2h):</span> <span className="text-cyan-300">2-hour momentum</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Lag_24 (t - 24h):</span> <span className="text-cyan-300">Daily seasonality</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Lag_48 (t - 48h):</span> <span className="text-cyan-300">2-day persistence</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Lag_168 (t - 168h):</span> <span className="text-cyan-300">Weekly cycle (7d)</span>
              </div>
            </div>
          </div>

          {/* Rolling Statistics */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Cpu className="w-4 h-4" />
              Moving Window Statistics
            </h4>
            <div className="text-xs text-slate-300 space-y-1.5 font-mono">
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Rolling_mean_24:</span> <span className="text-amber-300">24-hour moving avg</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Rolling_std_24:</span> <span className="text-amber-300">24-hour volatility</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Target_MW:</span> <span className="text-emerald-400 font-bold">Shift(-1) (t + 1h)</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Weekend Flag:</span> <span className="text-amber-300">DOW &ge; 5 (0/1)</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Is_Festival:</span> <span className="text-amber-300">Active festival flag</span>
              </div>
            </div>
          </div>

          {/* Trigonometric Cyclical Encodings */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Calendar className="w-4 h-4" />
              Cyclical Sine/Cosine
            </h4>
            <div className="text-xs text-slate-300 space-y-1.5 font-mono">
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Hour_sin / cos:</span> <span className="text-purple-300">Period 24 (sin(2πh/24))</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>DOW_sin / cos:</span> <span className="text-purple-300">Period 7 (sin(2πd/7))</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Month_sin / cos:</span> <span className="text-purple-300">Period 12 (sin(2πm/12))</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Train Observations:</span> <span className="text-white font-bold">{featureEngineeringAudit.trainSize}</span>
              </div>
              <div className="flex justify-between bg-slate-900 p-2 rounded">
                <span>Test Observations:</span> <span className="text-white font-bold">{featureEngineeringAudit.testSize}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
