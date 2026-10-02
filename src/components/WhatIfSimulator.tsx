import React, { useState } from 'react';
import { Activity, ArrowRight, Gauge, SunMedium, Calendar, Sparkles } from 'lucide-react';
import { PipelineResults } from '../types/pipeline';

interface WhatIfSimulatorProps {
  results: PipelineResults;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ results }) => {
  const [currentMW, setCurrentMW] = useState<number>(2350);
  const [temp, setTemp] = useState<number>(34);
  const [humidity, setHumidity] = useState<number>(55);
  const [hour, setHour] = useState<number>(19);
  const [isWeekend, setIsWeekend] = useState<boolean>(false);
  const [isFestival, setIsFestival] = useState<boolean>(false);

  // Compute live prediction based on model coefficients and feature weights
  const hourSin = Math.sin((2 * Math.PI * hour) / 24);
  const hourCos = Math.cos((2 * Math.PI * hour) / 24);

  // Autoregressive lag-1 base
  const autoregBase = currentMW * 0.86;

  // Temperature cooling curve
  const coolingContribution = temp > 30 ? (temp - 30) * 19.5 : (30 - temp) * -4.2;

  // Humidity effect
  const humidityContribution = humidity > 70 ? (humidity - 70) * -1.8 : 0;

  // Diurnal hour curve
  const hourContribution = (hourSin * 48) - (hourCos * 32);

  // Weekend industrial drop
  const weekendContribution = isWeekend ? -65 : 45;

  // Festival effect (lighting, events, or reduced commercial)
  const festivalContribution = isFestival ? 130 : 0;

  const predictedNextMW = Math.round(
    autoregBase +
    coolingContribution +
    humidityContribution +
    hourContribution +
    weekendContribution +
    festivalContribution +
    (currentMW * 0.12) // mean reversion
  );

  const delta = predictedNextMW - currentMW;
  const deltaPct = ((delta / currentMW) * 100).toFixed(1);
  const isPeakAlert = predictedNextMW >= results.peakAnalysis.peakThreshold;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Gauge className="w-5 h-5 text-cyan-400" />
            Interactive Forecast & Grid Dispatch Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Simulate real-time operating conditions (temperature, humidity, time of day, holiday/festival) to project next-hour utility demand
          </p>
        </div>

        {isPeakAlert ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold animate-pulse">
            <Activity className="w-4 h-4" />
            GRID PEAK ALERT (&ge; {results.peakAnalysis.peakThreshold} MW)
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold">
            Normal Grid Load State
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Input Parameters */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-5 rounded-xl border border-slate-800/80">
          {/* Current Demand */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Current Demand (MW):</span>
              <span className="font-mono text-cyan-300 font-bold">{currentMW} MW</span>
            </div>
            <input
              type="range"
              min={1200}
              max={4000}
              step={25}
              value={currentMW}
              onChange={e => setCurrentMW(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1,200 MW</span>
              <span>2,500 MW</span>
              <span>4,000 MW</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                Ambient Temperature:
              </span>
              <span className="font-mono text-amber-300 font-bold">{temp} °C</span>
            </div>
            <input
              type="range"
              min={15}
              max={48}
              step={1}
              value={temp}
              onChange={e => setTemp(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>15°C (Cool)</span>
              <span>30°C (Base)</span>
              <span>48°C (Extreme Heat)</span>
            </div>
          </div>

          {/* Humidity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Relative Humidity:</span>
              <span className="font-mono text-blue-300 font-bold">{humidity} %</span>
            </div>
            <input
              type="range"
              min={20}
              max={95}
              step={1}
              value={humidity}
              onChange={e => setHumidity(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>20% (Dry)</span>
              <span>60%</span>
              <span>95% (Monsoon)</span>
            </div>
          </div>

          {/* Hour of Day */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Hour of Day (24h):</span>
              <span className="font-mono text-purple-300 font-bold">
                {String(hour).padStart(2, '0')}:00 {hour >= 18 && hour <= 22 ? '(Evening Peak)' : hour < 6 ? '(Night Valley)' : ''}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              step={1}
              value={hour}
              onChange={e => setHour(parseInt(e.target.value, 10))}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Calendar Checkboxes */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isWeekend}
                onChange={e => setIsWeekend(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Weekend (Saturday/Sunday)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isFestival}
                onChange={e => setIsFestival(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500"
              />
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Major Festival Day</span>
            </label>
          </div>
        </div>

        {/* Prediction Output Card */}
        <div className={`p-6 rounded-2xl border text-center transition-all ${
          isPeakAlert
            ? 'bg-rose-950/40 border-rose-800/80 shadow-2xl shadow-rose-950/50'
            : 'bg-cyan-950/40 border-cyan-800/80 shadow-2xl shadow-cyan-950/50'
        }`}>
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block mb-1">
            Predicted Next-Hour Demand
          </span>
          <div className="text-4xl font-extrabold font-mono text-white tracking-tight my-2">
            {predictedNextMW} <span className="text-lg font-normal text-slate-400">MW</span>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-medium my-3">
            <span className="text-slate-400">{currentMW} MW</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className={delta >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
              {delta >= 0 ? `+${delta}` : delta} MW ({delta >= 0 ? `+${deltaPct}` : `${deltaPct}`}%)
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Peak 90% Threshold:</span>
              <span className="font-mono text-slate-300">{results.peakAnalysis.peakThreshold} MW</span>
            </div>
            <div className="flex justify-between">
              <span>Expected Model MAE:</span>
              <span className="font-mono text-slate-300">&plusmn;{results.bestModel.metrics.mae} MW</span>
            </div>
            <div className="flex justify-between">
              <span>95% Confidence Interval:</span>
              <span className="font-mono text-cyan-300">
                {Math.round(predictedNextMW - results.bestModel.metrics.mae * 1.96)} -{' '}
                {Math.round(predictedNextMW + results.bestModel.metrics.mae * 1.96)} MW
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
