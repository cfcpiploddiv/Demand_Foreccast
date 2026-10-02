import React from 'react';
import { Zap, Download, Code, Play, RefreshCw, BarChart2, LineChart, GitCompare, Pin, RotateCcw } from 'lucide-react';
import { PipelineResults } from '../types/pipeline';
import { exportComparisonCSV, downloadFile } from '../utils/pythonCodeExport';

interface HeaderProps {
  results: PipelineResults | null;
  isRunning: boolean;
  onRunPipeline: () => void;
  onOpenPythonModal: () => void;
  onOpenSimulator: () => void;
  onOpenVisualizations: () => void;
  onOpenCompareSessions: () => void;
  onQuickPinSession: () => void;
  onOpenExportModel: () => void;
  onReset: () => void;
  savedSessionsCount: number;
  activeFilename: string;
}

export const Header: React.FC<HeaderProps> = ({
  results,
  isRunning,
  onRunPipeline,
  onOpenPythonModal,
  onOpenSimulator,
  onOpenVisualizations,
  onOpenCompareSessions,
  onQuickPinSession,
  onOpenExportModel,
  onReset,
  savedSessionsCount,
  activeFilename,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">
              Electricity Demand Forecasting Studio
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              v2.0 ML Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Automated .py ML Pipeline · Exploratory Analysis · Hyperparameter Tuning · Peak Grid Reliability
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2.5">
        {results && (
          <>
            <button
              onClick={onOpenExportModel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900/90 text-xs font-bold text-emerald-300 border border-emerald-800/80 transition-colors shadow-sm"
              title="Download trained model as serialized ONNX (.onnx) or Pickle (.pkl) for local production"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Model (.onnx/.pkl)</span>
            </button>

            <button
              onClick={onQuickPinSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-slate-700 transition-colors shadow-sm"
              title="Pin current results as an experiment snapshot"
            >
              <Pin className="w-3.5 h-3.5 text-amber-400" />
              <span>Pin Run</span>
              {savedSessionsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-400 text-[10px] font-mono border border-amber-800">
                  {savedSessionsCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCompareSessions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900/80 text-xs font-semibold text-purple-300 border border-purple-800/80 transition-colors shadow-sm"
            >
              <GitCompare className="w-3.5 h-3.5 text-purple-400" />
              <span>Compare Sessions</span>
            </button>

            <button
              onClick={onOpenVisualizations}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-xs font-semibold text-cyan-300 border border-cyan-800/80 transition-colors shadow-sm"
            >
              <LineChart className="w-3.5 h-3.5 text-cyan-400" />
              <span>Model Plots</span>
            </button>

            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>What-If</span>
            </button>

            <button
              onClick={onOpenPythonModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span>Python & Viva</span>
            </button>
          </>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-rose-300 border border-rose-950 hover:border-rose-900 transition-colors shadow-sm"
          title="Reset all models, custom hyperparameters, column mappings, and loaded datasets to default"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>Reset Studio</span>
        </button>

        <button
          onClick={onRunPipeline}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/40 transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Full Pipeline</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
