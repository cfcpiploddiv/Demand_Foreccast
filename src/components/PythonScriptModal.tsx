import React, { useState } from 'react';
import { Code, Copy, Check, Download } from 'lucide-react';
import { PipelineResults } from '../types/pipeline';
import { downloadFile, generatePythonScript } from '../utils/pythonCodeExport';

interface PythonScriptModalProps {
  results: PipelineResults;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({ results }) => {
  const [copied, setCopied] = useState(false);

  const pythonScript = generatePythonScript(results.hyperparameters);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadFile('electricity_demand_forecasting_tuned.py', pythonScript, 'text/x-python');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Code className="w-5 h-5 text-cyan-400" />
            Python Pipeline Code Export
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Complete executable Python script ready for submission or local execution
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center bg-slate-950 px-4 py-2.5 rounded-t-xl border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            electricity_demand_forecasting_tuned.py · {pythonScript.split('\n').length} lines
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Script'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-medium shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .py
            </button>
          </div>
        </div>

        <pre className="bg-slate-950 border border-t-0 border-slate-800 rounded-b-xl p-4 overflow-x-auto text-[12px] font-mono text-slate-300 leading-relaxed max-h-[440px] select-all scrollbar-thin">
          {pythonScript}
        </pre>
      </div>
    </div>
  );
};
