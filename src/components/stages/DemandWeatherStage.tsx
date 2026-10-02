import React from 'react';
import { PipelineResults } from '../../types/pipeline';
import { BoxplotChart } from '../charts/BoxplotChart';

interface DemandWeatherStageProps {
  results: PipelineResults;
}

export const DemandWeatherStage: React.FC<DemandWeatherStageProps> = ({ results }) => {
  const { demandOverview, weatherEda, calendarEda } = results;

  return (
    <div className="space-y-8">
      {/* Stage 3: Electricity Demand EDA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                [Stage 3]
              </span>
              <h3 className="text-lg font-bold text-white">Electricity Demand Temporal EDA</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Diurnal hourly rhythms, weekday vs weekend industrial load divergence, and seasonal monthly variation
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Avg Demand: </span>
              <span className="font-mono text-cyan-300 font-bold">{demandOverview.avgDemand} MW</span>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Max Demand: </span>
              <span className="font-mono text-rose-400 font-bold">{demandOverview.maxDemand} MW</span>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Min Demand: </span>
              <span className="font-mono text-emerald-400 font-bold">{demandOverview.minDemand} MW</span>
            </div>
          </div>
        </div>

        {/* 3 Boxplots: Hourly, Day of Week, Monthly */}
        <div className="space-y-6">
          <BoxplotChart
            items={demandOverview.hourlyBoxplots.map(b => ({
              label: `${String(b.hour).padStart(2, '0')}:00`,
              min: b.min,
              q25: b.q25,
              median: b.median,
              q75: b.q75,
              max: b.max,
              avg: b.avg,
            }))}
            title="Electricity Demand by Hour of Day (00:00 to 23:00 Diurnal Profile)"
            xLabel="Hour of Day"
            yLabel="Demand (MW)"
            color="#22d3ee"
            height={280}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BoxplotChart
              items={demandOverview.dayOfWeekBoxplots.map(b => ({
                label: b.day,
                min: b.min,
                q25: b.q25,
                median: b.median,
                q75: b.q75,
                max: b.max,
                avg: b.avg,
              }))}
              title="Demand by Day of Week (Sun - Sat)"
              xLabel="Day of Week"
              yLabel="Demand (MW)"
              color="#38bdf8"
              height={260}
            />

            <BoxplotChart
              items={demandOverview.monthlyBoxplots.map(b => ({
                label: b.month,
                min: b.min,
                q25: b.q25,
                median: b.median,
                q75: b.q75,
                max: b.max,
                avg: b.avg,
              }))}
              title="Demand by Month (Seasonal Pattern)"
              xLabel="Month"
              yLabel="Demand (MW)"
              color="#818cf8"
              height={260}
            />
          </div>
        </div>
      </div>

      {/* Stage 4: Weather & Calendar EDA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
              [Stage 4]
            </span>
            <h3 className="text-lg font-bold text-white">Weather, Holiday & Festival EDA</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing cooling degree days, thermal load sensitivity, weather condition effects, and holiday/festival swings
          </p>
        </div>

        {/* Scatter Plots: Temp vs MW & Humidity vs MW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Scatter */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Temperature vs Electricity Demand
              </h4>
              <span className="text-xs font-mono font-bold text-amber-400">
                Corr (r): {weatherEda.tempCorrelation > 0 ? `+${weatherEda.tempCorrelation}` : weatherEda.tempCorrelation}
              </span>
            </div>

            <div className="relative h-60 w-full overflow-hidden flex items-end">
              <svg viewBox="0 0 500 240" className="w-full h-full select-none">
                {/* Reference Grid */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="210" x2="480" y2="210" stroke="#475569" strokeWidth="1" />
                <line x1="40" y1="20" x2="40" y2="210" stroke="#475569" strokeWidth="1" />

                {/* Points */}
                {weatherEda.tempScatterSample.map((pt, i) => {
                  const x = 40 + ((pt.temp - 15) / 32) * 440;
                  const y = 210 - ((pt.mw - 1000) / 3200) * 190;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={2.5}
                      fill="#f59e0b"
                      fillOpacity={0.45}
                    />
                  );
                })}

                {/* Trend curve (non-linear cooling curve above 30°C) */}
                <path
                  d="M 40 185 Q 240 175 340 145 T 480 50"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />

                <text x="260" y="235" textAnchor="middle" className="text-[10px] fill-slate-400">
                  Ambient Temperature (°C)
                </text>
                <text x="14" y="115" textAnchor="middle" transform="rotate(-90 14 115)" className="text-[10px] fill-slate-400">
                  Demand (MW)
                </text>
              </svg>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
              <span>Cooler (~15°C)</span>
              <span className="text-rose-400 font-medium">Thermal AC cooling knee point (&gt;30°C)</span>
              <span>Extreme Heat (45°C)</span>
            </div>
          </div>

          {/* Humidity Scatter */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Humidity vs Electricity Demand
              </h4>
              <span className="text-xs font-mono font-bold text-blue-400">
                Corr (r): {weatherEda.humidityCorrelation > 0 ? `+${weatherEda.humidityCorrelation}` : weatherEda.humidityCorrelation}
              </span>
            </div>

            <div className="relative h-60 w-full overflow-hidden flex items-end">
              <svg viewBox="0 0 500 240" className="w-full h-full select-none">
                <line x1="40" y1="20" x2="480" y2="20" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="210" x2="480" y2="210" stroke="#475569" strokeWidth="1" />
                <line x1="40" y1="20" x2="40" y2="210" stroke="#475569" strokeWidth="1" />

                {weatherEda.humidityScatterSample.map((pt, i) => {
                  const x = 40 + ((pt.humidity - 20) / 75) * 440;
                  const y = 210 - ((pt.mw - 1000) / 3200) * 190;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={2.5}
                      fill="#38bdf8"
                      fillOpacity={0.4}
                    />
                  );
                })}

                <text x="260" y="235" textAnchor="middle" className="text-[10px] fill-slate-400">
                  Relative Humidity (%)
                </text>
                <text x="14" y="115" textAnchor="middle" transform="rotate(-90 14 115)" className="text-[10px] fill-slate-400">
                  Demand (MW)
                </text>
              </svg>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
              <span>Dry (20%)</span>
              <span className="text-slate-400">Moderate (50-65%)</span>
              <span>Monsoon Saturated (95%)</span>
            </div>
          </div>
        </div>

        {/* Categorical Weather, Holiday, and Festival Comparisons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weather Conditions */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Demand by Weather Condition
            </h4>
            <div className="space-y-2.5">
              {weatherEda.weatherConditionStats.map(w => (
                <div key={w.condition} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-200">{w.condition}</span>
                    <span className="font-mono text-cyan-300 font-bold">{w.avgDemand} MW</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{w.count.toLocaleString()} hourly observations</div>
                </div>
              ))}
            </div>
          </div>

          {/* Holiday Type */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Demand by Holiday Type
            </h4>
            <div className="space-y-2.5">
              {calendarEda.holidayStats.map(h => (
                <div key={h.type} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-200">{h.type}</span>
                    <span className="font-mono text-amber-300 font-bold">{h.avgDemand} MW</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{h.count.toLocaleString()} hourly observations</div>
                </div>
              ))}
            </div>
          </div>

          {/* Major Festivals */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Demand by Major Festival
            </h4>
            <div className="space-y-2.5">
              {calendarEda.topFestivals.length > 0 ? (
                calendarEda.topFestivals.map(f => (
                  <div key={f.name} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-purple-300 font-semibold">{f.name}</span>
                      <span className="font-mono text-emerald-300 font-bold">{f.avgDemand} MW</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{f.count} peak festival hours</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center">No festival tags identified in dataset</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
