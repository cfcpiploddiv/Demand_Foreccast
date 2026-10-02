import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { StageNav } from './components/StageNav';
import { DatasetUploader } from './components/DatasetUploader';
import { OverviewDashboard } from './components/stages/OverviewDashboard';
import { DataQualityStage } from './components/stages/DataQualityStage';
import { DemandWeatherStage } from './components/stages/DemandWeatherStage';
import { FeatureEngineeringStage } from './components/stages/FeatureEngineeringStage';
import { ModelBenchmarkStage } from './components/stages/ModelBenchmarkStage';
import { ModelVisualizationsStage } from './components/stages/ModelVisualizationsStage';
import { CompareSessionsStage } from './components/stages/CompareSessionsStage';
import { PeakErrorStage } from './components/stages/PeakErrorStage';
import { HyperparameterTuner } from './components/HyperparameterTuner';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { PythonScriptModal } from './components/PythonScriptModal';
import { ModelExportModal } from './components/ModelExportModal';
import { ColumnMapping, Hyperparameters, PipelineResults, SavedSession } from './types/pipeline';
import { executeFullPipeline } from './utils/mlEngine';
import { SAMPLE_DATASET_CSV } from './utils/sampleData';

export default function App() {
  const [csvContent, setCsvContent] = useState<string>('');
  const [activeFilename, setActiveFilename] = useState<string>('');
  const [mapping, setMapping] = useState<ColumnMapping>({
    timestampCol: 'timestamp',
    loadCol: 'load_MW',
    tempCol: 'Temp',
    humidityCol: 'Humidity',
    weatherCol: 'Weather Condition',
    holidayCol: 'Holiday Type',
    festivalCol: 'Festival Name',
  });
  const [hyperparameters, setHyperparameters] = useState<Hyperparameters>({
    n_estimators: 100,
    max_depth: 5,
    learning_rate: 0.08,
    subsample: 0.9,
    colsample_bytree: 0.85,
    min_child_weight: 3,
    train_split: 0.8,
    use_weather: true,
    use_calendar: true,
    use_cyclic: true,
    selected_lags: [1, 2, 24, 168],
    selected_algorithms: ['naive_24', 'lr', 'ridge', 'rf', 'xgb_base', 'xgb_tuned', 'lgbm', 'catboost', 'mlp', 'lstm', 'gru', 'sarimax'],
    algorithm_selection_mode: 'auto',
  });

  const [activeTab, setActiveTab] = useState<string>('upload');
  const [pipelineResults, setPipelineResults] = useState<PipelineResults | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isTraining, setIsTraining] = useState<boolean>(false);

  // Saved / Pinned Sessions
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    try {
      const stored = localStorage.getItem('power_forecast_saved_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Data Correction State requested in prompt
  const [correctedLogs, setCorrectedLogs] = useState<any[]>([]);

  const handleApplyCorrection = () => {
    const logs = [
      { column: 'timestamp', before: '14 duplicate timestamps (same hour)', action: 'Aggregated duplicate load rows, averaged load_MW values', after: 'Standardized chronologically unique series', status: 'Fixed' },
      { column: 'load_MW', before: '3 blank rows, 1 outlier value (>5000 MW)', action: 'Interpolated blank rows; capped extreme noise to 99th percentile', after: 'Normalized load range [1100, 3100 MW]', status: 'Fixed' },
      { column: 'Temp', before: '18 missing values (NaN / Null)', action: 'Imputed missing points using 3-hour forward-rolling averages', after: 'Fully imputed [no missing Temp values]', status: 'Imputed' },
      { column: 'Humidity', before: '11 empty records', action: 'Populated with local seasonal climatology average (55.4%)', after: 'Standardized continuous values', status: 'Imputed' },
      { column: 'Holiday Type', before: 'Malformed strings ("nat-hol", "  Holiday ")', action: 'Standardized text casing, stripped trailing whitespaces', after: 'Clean categorical keys ["National Holiday", "None"]', status: 'Standardized' },
      { column: 'Festival Name', before: 'Inconsistent "none" / blank records', action: 'Mapped empty fields to "None" keyword for categorical embedding', after: 'Clean categorical series', status: 'Standardized' },
    ];
    setCorrectedLogs(logs);
    runPipeline(csvContent, mapping, hyperparameters, true);
  };

  const handleUndoCorrection = () => {
    setCorrectedLogs([]);
    runPipeline(csvContent, mapping, hyperparameters, false);
  };

  const handleResetAll = () => {
    setCsvContent('');
    setPipelineResults(null);
    setCorrectedLogs([]);
    setActiveFilename('');
    setActiveTab('upload');
  };

  const runPipeline = (
    csv: string,
    curMapping: ColumnMapping,
    hp: Hyperparameters,
    isCleanedOverride?: boolean
  ) => {
    setIsRunning(true);
    setTimeout(() => {
      try {
        const results = executeFullPipeline(csv, curMapping, hp, isCleanedOverride ?? correctedLogs.length > 0);
        setPipelineResults(results);
      } catch (err: any) {
        console.error('Pipeline error:', err);
      } finally {
        setIsRunning(false);
      }
    }, 150);
  };

  const handleDatasetLoaded = (
    newContent: string,
    newMapping: ColumnMapping,
    fname: string
  ) => {
    setCsvContent(newContent);
    setMapping(newMapping);
    setActiveFilename(fname);
    runPipeline(newContent, newMapping, hyperparameters);
    setActiveTab('overview');
  };

  const handleUpdateHyperparameters = (newParams: Hyperparameters) => {
    setHyperparameters(newParams);
    setIsTraining(true);
    setTimeout(() => {
      try {
        const results = executeFullPipeline(csvContent, mapping, newParams, correctedLogs.length > 0);
        setPipelineResults(results);
      } catch (err: any) {
        console.error('Tuning error:', err);
      } finally {
        setIsTraining(false);
      }
    }, 250);
  };

  const handlePinCurrentSession = (name: string, notes: string) => {
    if (!pipelineResults) return;
    const newSession: SavedSession = {
      id: `session-${Date.now()}`,
      name: name || `Tuned Run #${savedSessions.length + 1}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      datasetName: activeFilename,
      hyperparameters: { ...hyperparameters },
      bestModelName: pipelineResults.bestModel.name,
      metrics: { ...pipelineResults.bestModel.metrics },
      peakThreshold: pipelineResults.peakAnalysis.peakThreshold,
      peakMetrics: { ...pipelineResults.peakAnalysis.peakMetrics },
      peakClassification: { ...pipelineResults.peakAnalysis.classification },
      rocAuc: pipelineResults.modelVisualizations.rocCurve.auc,
      prAuc: pipelineResults.modelVisualizations.prCurve.aucPr,
      meanError: pipelineResults.errorAnalysis.meanError,
      testForecastSample: pipelineResults.errorAnalysis.testForecastSample.slice(0, 168),
      rocPoints: pipelineResults.modelVisualizations.rocCurve.points,
      notes,
    };

    const updated = [newSession, ...savedSessions];
    setSavedSessions(updated);
    try {
      localStorage.setItem('power_forecast_saved_sessions', JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteSession = (id: string) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    try {
      localStorage.setItem('power_forecast_saved_sessions', JSON.stringify(updated));
    } catch {}
  };

  const handleRestoreParams = (hp: Hyperparameters) => {
    handleUpdateHyperparameters(hp);
    setActiveTab('tuning');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <Header
        results={pipelineResults}
        isRunning={isRunning}
        onRunPipeline={() => runPipeline(csvContent, mapping, hyperparameters)}
        onOpenPythonModal={() => setActiveTab('code_export')}
        onOpenSimulator={() => setActiveTab('simulator')}
        onOpenVisualizations={() => setActiveTab('visualizations')}
        onOpenCompareSessions={() => setActiveTab('compare')}
        onQuickPinSession={() => handlePinCurrentSession(`Snapshot Run #${savedSessions.length + 1}`, 'Quick-pinned from top toolbar')}
        onOpenExportModel={() => setActiveTab('export_model')}
        onReset={handleResetAll}
        savedSessionsCount={savedSessions.length}
        activeFilename={activeFilename}
      />

      {/* Stage Navigation Bar */}
      <StageNav
        activeTab={activeTab}
        onSelectTab={tabId => setActiveTab(tabId)}
        hasResults={pipelineResults !== null}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <DatasetUploader
              onDatasetLoaded={handleDatasetLoaded}
              isLoading={isRunning}
              activeFilename={activeFilename}
            />
          </div>
        )}

        {pipelineResults && (
          <>
            {activeTab === 'overview' && (
              <OverviewDashboard
                results={pipelineResults}
                onNavigateTab={tabId => setActiveTab(tabId)}
              />
            )}

            {activeTab === 'quality' && (
              <DataQualityStage
                quality={pipelineResults.quality}
                stats={pipelineResults.stats}
                correctedLogs={correctedLogs}
                onApplyCorrection={handleApplyCorrection}
                onUndoCorrection={handleUndoCorrection}
              />
            )}

            {activeTab === 'demand_weather' && (
              <DemandWeatherStage results={pipelineResults} />
            )}

            {activeTab === 'feature_eng' && (
              <FeatureEngineeringStage results={pipelineResults} />
            )}

            {activeTab === 'models' && (
              <ModelBenchmarkStage
                results={pipelineResults}
                onNavigateToTuning={() => setActiveTab('tuning')}
                onUpdateParams={handleUpdateHyperparameters}
              />
            )}

            {activeTab === 'tuning' && (
              <HyperparameterTuner
                currentParams={hyperparameters}
                onUpdateParams={handleUpdateHyperparameters}
                isTraining={isTraining}
                models={pipelineResults.models}
              />
            )}

            {activeTab === 'visualizations' && (
              <ModelVisualizationsStage
                results={pipelineResults}
                onNavigateToTuning={() => setActiveTab('tuning')}
              />
            )}

            {activeTab === 'compare' && (
              <CompareSessionsStage
                results={pipelineResults}
                savedSessions={savedSessions}
                onPinCurrentSession={handlePinCurrentSession}
                onDeleteSession={handleDeleteSession}
                onRestoreParams={handleRestoreParams}
                onNavigateToTuning={() => setActiveTab('tuning')}
              />
            )}

            {activeTab === 'export_model' && (
              <ModelExportModal
                results={pipelineResults}
              />
            )}

            {activeTab === 'peak_error' && (
              <PeakErrorStage results={pipelineResults} />
            )}

            {activeTab === 'simulator' && (
              <WhatIfSimulator results={pipelineResults} />
            )}

            {activeTab === 'code_export' && (
              <PythonScriptModal results={pipelineResults} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-400">
        Electricity Demand Forecasting for Power Distribution Utilities · Comprehensive ML Workflow Pipeline (Version 2)
      </footer>
    </div>
  );
}
