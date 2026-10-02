import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Zap,
  Activity,
  Layers,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Code,
  LineChart,
  Calendar,
  Clock,
  Flame,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  CheckCircle,
} from 'lucide-react';
import { PipelineResults } from '../../types/pipeline';
import { TimeSeriesChart } from '../charts/TimeSeriesChart';

interface OverviewDashboardProps {
  results: PipelineResults;
  onNavigateTab: (tabId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ results, onNavigateTab }) => {
  const { quality, demandOverview, bestModel, models, peakAnalysis, errorAnalysis } = results;

  const naiveModel = models.find(m => m.id === 'naive_1') || models[0];
  const maeImprovement = naiveModel
    ? +(((naiveModel.metrics.mae - bestModel.metrics.mae) / naiveModel.metrics.mae) * 100).toFixed(1)
    : 0;

  // Custom Predictor state requested in prompt
  const [customWeather, setCustomWeather] = useState<string>('Sunny');
  const [customHoliday, setCustomHoliday] = useState<string>('None');
  const [customFestival, setCustomFestival] = useState<string>('None');
  const [customTemp, setCustomTemp] = useState<number>(28);
  const [customHumidity, setCustomHumidity] = useState<number>(55);

  const customPredictionMW = useMemo(() => {
    let base = 1550;

    // 1. Temp impact
    if (customTemp > 30) {
      base += (customTemp - 30) * 22.4;
    } else if (customTemp < 18) {
      base += (18 - customTemp) * 8.2;
    }

    // 2. Humidity impact
    base += (customHumidity - 50) * -1.8;

    // 3. Weather impact
    if (customWeather === 'Cloudy') base -= 35;
    else if (customWeather === 'Rainy') base -= 65;
    else if (customWeather === 'Windy') base += 20;

    // 4. Holiday impact
    if (customHoliday === 'Weekend') base -= 120;
    else if (customHoliday === 'National Holiday') base -= 180;
    else if (customHoliday === 'None') base += 80;

    // 5. Festival impact
    if (customFestival === 'Christmas') base += 110;
    else if (customFestival === 'Thanksgiving') base += 95;
    else if (customFestival === 'New Year') base += 130;

    // 6. Incorporate best model accuracy multiplier to scale realistically
    const r2Factor = Math.min(1.02, Math.max(0.98, bestModel.metrics.r2));
    const maeFactor = Math.min(1.05, Math.max(0.95, 1 - (bestModel.metrics.mae - 35) / 1000));
    
    return +Math.max(800, Math.min(4500, base * r2Factor * maeFactor)).toFixed(1);
  }, [customWeather, customHoliday, customFestival, customTemp, customHumidity, bestModel.metrics.r2, bestModel.metrics.mae]);

  const testForecastSample = errorAnalysis.testForecastSample;
  const filteredData = testForecastSample;

  // Sliced period stats & metrics recalculation
  const selectionMetrics = useMemo(() => {
    const n = filteredData.length;
    if (n === 0) {
      return {
        avgLoad: 0,
        maxLoad: 0,
        minLoad: 0,
        totalEnergyMWh: 0,
        mae: 0,
        rmse: 0,
        r2: 1,
        peakHoursCount: 0,
        status: 'Low Stress'
      };
    }

    const actuals = filteredData.map(p => p.actual);
    const predicteds = filteredData.map(p => p.predicted);

    const sumActual = actuals.reduce((a, b) => a + b, 0);
    const avgLoad = sumActual / n;
    const maxLoad = Math.max(...actuals);
    const minLoad = Math.min(...actuals);
    const totalEnergyMWh = sumActual; // Hourly resolution so sum is directly equal to MWh

    // Analytical metrics calculations
    let sumAbsErr = 0;
    let sumSqErr = 0;
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(actuals[i] - predicteds[i]);
      sumAbsErr += diff;
      sumSqErr += diff * diff;
    }

    const mae = sumAbsErr / n;
    const rmse = Math.sqrt(sumSqErr / n);

    // R2 Calculation
    let totalVar = 0;
    for (let i = 0; i < n; i++) {
      totalVar += (actuals[i] - avgLoad) * (actuals[i] - avgLoad);
    }
    const r2 = totalVar > 1e-5 ? 1 - sumSqErr / totalVar : 1.0000;

    // Grid Stress / Peak Alarms
    const peakThresh = peakAnalysis.peakThreshold;
    const peakHoursCount = filteredData.filter(p => p.actual >= peakThresh).length;

    let status = 'Low Stress';
    const peakRatio = peakHoursCount / n;
    if (peakRatio > 0.15) {
      status = 'Critical Peak Stress';
    } else if (peakRatio > 0.05) {
      status = 'Moderate Grid Stress';
    }

    return {
      avgLoad: +avgLoad.toFixed(1),
      maxLoad: +maxLoad.toFixed(1),
      minLoad: +minLoad.toFixed(1),
      totalEnergyMWh: +totalEnergyMWh.toFixed(0),
      mae: +mae.toFixed(2),
      rmse: +rmse.toFixed(2),
      r2: +r2.toFixed(4),
      peakHoursCount,
      status
    };
  }, [filteredData, peakAnalysis.peakThreshold]);

  // Table Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Calculate detailed forecast outcomes: Bias, Under/Over prediction counts
  const detailBreakdown = useMemo(() => {
    let totalUnder = 0;
    let totalOver = 0;
    let maxUnderMw = 0;
    let maxOverMw = 0;
    let sumUnderMw = 0;
    let sumOverMw = 0;

    filteredData.forEach(pt => {
      const diff = pt.predicted - pt.actual;
      if (diff < 0) { // Underprediction (predicted < actual)
        totalUnder++;
        const absDiff = Math.abs(diff);
        sumUnderMw += absDiff;
        if (absDiff > maxUnderMw) maxUnderMw = absDiff;
      } else { // Overprediction (predicted >= actual)
        totalOver++;
        const absDiff = diff;
        sumOverMw += absDiff;
        if (absDiff > maxOverMw) maxOverMw = absDiff;
      }
    });

    return {
      underCount: totalUnder,
      overCount: totalOver,
      avgUnderMw: totalUnder > 0 ? +(sumUnderMw / totalUnder).toFixed(1) : 0,
      avgOverMw: totalOver > 0 ? +(sumOverMw / totalOver).toFixed(1) : 0,
      maxUnderMw: +maxUnderMw.toFixed(1),
      maxOverMw: +maxOverMw.toFixed(1)
    };
  }, [filteredData]);

  // Paginated forecast items
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Total Hourly Slots</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {demandOverview.totalObservations.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {quality.duplicateRows === 0 ? '0 Duplicates' : `${quality.duplicateRows} Dupes`}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Average Demand</span>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
            {demandOverview.avgDemand} <span className="text-xs font-normal text-slate-400">MW</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Min: {demandOverview.minDemand} MW
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Peak Demand (Max)</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {demandOverview.maxDemand} <span className="text-xs font-normal text-slate-400">MW</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            90% Thresh: {peakAnalysis.peakThreshold} MW
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block flex items-center gap-1 font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Best Model MAE
          </span>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {bestModel.metrics.mae} <span className="text-xs font-normal text-slate-400">MW</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold block mt-0.5">
            {bestModel.name.split('(')[0]}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Accuracy Gain</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +{maeImprovement}%
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">vs Naive Persistence</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Goodness of Fit (R²)</span>
          <div className="text-xl font-bold font-mono text-purple-300 mt-1">
            {bestModel.metrics.r2}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            RMSE: {bestModel.metrics.rmse} MW
          </span>
        </div>
      </div>

      {/* Interactive Custom Dispatch Load Predictor Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Interactive Custom Dispatch Load Predictor Form
            </h4>
            <p className="text-[11px] text-slate-400">
              Input custom environmental and seasonal parameters below to calculate simulated grid load predictions and operator actions
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
            {/* Input Group 1: Numerical input boxes requested in prompt */}
            <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  min="-10"
                  max="60"
                  step="1"
                  value={customTemp}
                  onChange={e => setCustomTemp(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:ring-1 focus:ring-cyan-500 font-mono text-sm"
                  placeholder="Enter temp (e.g. 28)"
                />
                <span className="text-[9px] text-slate-500 font-sans block mt-1">Normal operating range: 10°C to 45°C</span>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Relative Humidity (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={customHumidity}
                  onChange={e => setCustomHumidity(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:ring-1 focus:ring-cyan-500 font-mono text-sm"
                  placeholder="Enter humidity (e.g. 55)"
                />
                <span className="text-[9px] text-slate-500 font-sans block mt-1">Accepts saturation bounds [0%, 100%]</span>
              </div>
            </div>

            {/* Input Group 2: Categoricals */}
            <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Weather Condition</label>
                <select
                  value={customWeather}
                  onChange={e => setCustomWeather(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Sunny">Clear / Sunny</option>
                  <option value="Cloudy">Overcast / Cloudy</option>
                  <option value="Rainy">Heavy Rain / Wet</option>
                  <option value="Windy">High Wind / Gale</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Holiday Type</label>
                <select
                  value={customHoliday}
                  onChange={e => setCustomHoliday(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="None">None (Standard Workday)</option>
                  <option value="Weekend">Weekend Closure</option>
                  <option value="National Holiday">National / Federal Holiday</option>
                </select>
              </div>
            </div>

            {/* Input Group 3: Festival */}
            <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-xs flex flex-col justify-center">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Festival Name</label>
                <select
                  value={customFestival}
                  onChange={e => setCustomFestival(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="None">None (No Active Festival)</option>
                  <option value="Christmas">Christmas Evening Peak</option>
                  <option value="Thanksgiving">Thanksgiving Festivities</option>
                  <option value="New Year">New Year Eve Celebration</option>
                </select>
              </div>
            </div>

            {/* Glowing Prediction Display Box */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-center items-center text-center shadow-lg shadow-black/40">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold font-mono">Predicted load_MW</span>
              <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono tracking-tight my-1 drop-shadow shadow-cyan-500/20">
                {customPredictionMW.toFixed(1)} <span className="text-xs font-normal text-slate-400 font-sans">MW</span>
              </div>

              {customPredictionMW >= peakAnalysis.peakThreshold ? (
                <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950/40 text-rose-300 border border-rose-900/50 block animate-pulse">
                  ⚠️ PEAK ALARM: Activate Peaking Storage
                </span>
              ) : customPredictionMW > 1800 ? (
                <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/40 text-amber-300 border border-amber-900/50 block">
                  ⚡ HIGH LOAD: Activate Spinning Reserves
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-900/50 block">
                  ✅ OPTIMAL DISPATCH: Standard baseload
                </span>
              )}
            </div>
          </div>
        </div>

      {/* Primary Forecast Chart (Filtered by Selection Mode) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Actual vs Tuned XGBoost Demand Forecast
            </h3>
            <p className="text-xs text-slate-400">
              Interactive test horizon sequence with ground truth vs model predictions and peak 90th percentile threshold
            </p>
          </div>
        </div>
        <TimeSeriesChart
          data={filteredData}
          peakThreshold={peakAnalysis.peakThreshold}
          height={320}
        />
      </div>

      {/* Selection-based detailed analysis tables/outcomes requested in #4 and #5 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Underprediction risk box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Underprediction Risks (Grid Under-Supply)</h4>
          </div>
          <p className="text-xs text-slate-400">
            Occurs when forecasted load is below actual demand. Generates critical operating pressure requiring peaking plants or emergency wholesale market purchases.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 block">Underpredicted Hours</span>
              <span className="font-mono text-base font-bold text-slate-200">{detailBreakdown.underCount} hrs</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">{(detailBreakdown.underCount / (filteredData.length || 1) * 100).toFixed(0)}% of selection</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 block">Avg / Max Underpredict</span>
              <span className="font-mono text-base font-bold text-rose-300">
                {detailBreakdown.avgUnderMw} / <span className="text-rose-400 font-extrabold">{detailBreakdown.maxUnderMw}</span> <span className="text-xs font-normal">MW</span>
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Max capacity deficit</span>
            </div>
          </div>
        </div>

        {/* Overprediction risk box */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Overprediction Inefficiencies (Idle Capacity)</h4>
          </div>
          <p className="text-xs text-slate-400">
            Occurs when forecasted load is above actual demand. Triggers redundant spinning reserve commitment and unnecessary operational fuel overhead.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 block">Overpredicted Hours</span>
              <span className="font-mono text-base font-bold text-slate-200">{detailBreakdown.overCount} hrs</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">{(detailBreakdown.overCount / (filteredData.length || 1) * 100).toFixed(0)}% of selection</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 block">Avg / Max Overpredict</span>
              <span className="font-mono text-base font-bold text-cyan-300">
                {detailBreakdown.avgOverMw} / <span className="text-cyan-400 font-extrabold">{detailBreakdown.maxOverMw}</span> <span className="text-xs font-normal">MW</span>
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Idle spinning overhead</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hour-by-Hour Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Selected Horizon Outcome Logs</h4>
            <p className="text-xs text-slate-400">Hour-by-hour forecast performance metrics and operator dispatch actions</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Showing rows {((currentPage - 1) * pageSize) + 1} - {Math.min(filteredData.length, currentPage * pageSize)} of {filteredData.length}</span>
            <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-850">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-850 text-slate-400 font-semibold font-mono">
                <th className="p-3">Interval Timestamp</th>
                <th className="p-3 text-right">Actual Load (MW)</th>
                <th className="p-3 text-right">Model Forecast (MW)</th>
                <th className="p-3 text-right">Error (MW)</th>
                <th className="p-3 text-right">Dev %</th>
                <th className="p-3 pl-6">Operator Recommended Action Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {paginatedData.map((pt, idx) => {
                const diff = pt.predicted - pt.actual;
                const pctError = pt.actual > 0 ? (Math.abs(diff) / pt.actual * 100).toFixed(1) : '0.0';
                
                // Get recommended dispatch action
                let dispatchAction = "✅ Baseload dispatch: standard profile";
                let actionStyle = "text-emerald-400 bg-emerald-950/20 border border-emerald-900/40";
                
                if (pt.actual >= peakAnalysis.peakThreshold) {
                  dispatchAction = "🔥 Peak alert: activate peak-shaving batteries";
                  actionStyle = "text-rose-400 bg-rose-950/30 border border-rose-900/40 font-semibold";
                } else if (diff < -100) {
                  dispatchAction = "⚡ Supply deficit risk: dispatch gas turbine reserves";
                  actionStyle = "text-amber-400 bg-amber-950/30 border border-amber-900/40 font-semibold";
                } else if (diff > 100) {
                  dispatchAction = "🔋 Capacity surplus: absorb into pumped hydro storage";
                  actionStyle = "text-cyan-400 bg-cyan-950/30 border border-cyan-900/40";
                }

                return (
                  <tr key={idx} className="hover:bg-slate-850/40 transition-colors">
                    <td className="p-3 font-mono text-slate-300">{pt.datetime}</td>
                    <td className="p-3 text-right font-mono text-white font-semibold tabular-nums">{pt.actual.toFixed(1)}</td>
                    <td className="p-3 text-right font-mono text-cyan-300 font-semibold tabular-nums">{pt.predicted.toFixed(1)}</td>
                    <td className={`p-3 text-right font-mono tabular-nums ${diff < 0 ? 'text-rose-300' : 'text-cyan-300'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400 tabular-nums">{pctError}%</td>
                    <td className="p-3 pl-6">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono tracking-tight block w-fit ${actionStyle}`}>
                        {dispatchAction}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    No forecast data available for this selected slice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stage Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          onClick={() => onNavigateTab('quality')}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400">Stage 1 & 2</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-sm font-bold text-white mt-1 group-hover:text-cyan-300">Data Profiling & Stats</h4>
          <p className="text-xs text-slate-400 mt-1">
            Missing values audit, duplicate checks, statistical summary (skewness, quartiles) & distributions.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold mt-3">
            <span>Explore Profiling</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('demand_weather')}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400">Stage 3 & 4</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-sm font-bold text-white mt-1 group-hover:text-amber-300">Demand & Weather EDA</h4>
          <p className="text-xs text-slate-400 mt-1">
            24h Diurnal cycle, weekday vs weekend boxplots, monthly seasonality & temperature cooling curves.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold mt-3">
            <span>View EDA Charts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('tuning')}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">Stage 8 & 9</span>
            <Sliders className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-sm font-bold text-white mt-1 group-hover:text-emerald-300">Hyperparameter Tuning</h4>
          <p className="text-xs text-slate-400 mt-1">
            Tune tree depth, learning rate η, n_estimators, row/col subsampling & lags with live retraining.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-3">
            <span>Tune & Retrain</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('visualizations')}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-400 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-850 group shadow-lg shadow-cyan-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-400">Model Plots</span>
            <LineChart className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-sm font-bold text-white mt-1 group-hover:text-cyan-300">Visualizations & Curves</h4>
          <p className="text-xs text-slate-400 mt-1">
            ROC / PR curves (AUC {results.modelVisualizations.rocCurve.auc}), Confusion Matrix, Pareto & Learning trajectories.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-bold mt-3">
            <span>Open Model Plots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('peak_error')}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400">Stage 10 & 11</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <h4 className="text-sm font-bold text-white mt-1 group-hover:text-purple-300">Peak Demand & Errors</h4>
          <p className="text-xs text-slate-400 mt-1">
            Top 10% peak stress accuracy, confusion matrix, residual parity scatter & hourly errors.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-purple-400 font-semibold mt-3">
            <span>Inspect Errors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
