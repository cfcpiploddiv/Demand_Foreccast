import React, { useState } from 'react';
import {
  Download,
  FileCode,
  Layers,
  Cpu,
  Check,
  Copy,
  Server,
  Terminal,
  ShieldCheck,
  Box,
  Share2,
} from 'lucide-react';
import { PipelineResults } from '../types/pipeline';
import {
  generateONNXBinary,
  generatePickleBinary,
  generateXGBoostModelJSON,
  generateInferenceScript,
  downloadBinaryFile,
} from '../utils/modelSerializer';
import { downloadFile } from '../utils/pythonCodeExport';

interface ModelExportModalProps {
  results: PipelineResults;
  onClose?: () => void;
}

export const ModelExportModal: React.FC<ModelExportModalProps> = ({ results, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<'onnx' | 'pickle' | 'xgboost' | 'curl'>('onnx');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const features = results.featureEngineeringAudit.featuresList;
  const bestModel = results.bestModel;
  const hp = results.hyperparameters;

  const handleDownloadONNX = () => {
    const binary = generateONNXBinary(results);
    downloadBinaryFile('electricity_demand_model.onnx', binary, 'application/octet-stream');
  };

  const handleDownloadPickle = () => {
    const binary = generatePickleBinary(results);
    downloadBinaryFile('model.pkl', binary, 'application/octet-stream');
  };

  const handleDownloadJSON = () => {
    const jsonStr = generateXGBoostModelJSON(results);
    downloadFile('xgboost_model.json', jsonStr, 'application/json');
  };

  const handleDownloadInferenceScript = () => {
    const script = generateInferenceScript(results);
    downloadFile('inference.py', script, 'text/x-python');
  };

  const handleDownloadRequirements = () => {
    const reqs = `onnxruntime>=1.16.0\nnumpy>=1.24.0\nxgboost>=2.0.0\nscikit-learn>=1.3.0\nfastapi>=0.100.0\nuvicorn>=0.23.0\npydantic>=2.0.0\n`;
    downloadFile('requirements.txt', reqs, 'text/plain');
  };

  const handleDownloadAllBundle = () => {
    handleDownloadONNX();
    setTimeout(handleDownloadPickle, 200);
    setTimeout(handleDownloadJSON, 400);
    setTimeout(handleDownloadInferenceScript, 600);
    setTimeout(handleDownloadRequirements, 800);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const codeSnippets = {
    onnx: `import onnxruntime as ort
import numpy as np

# 1. Load trained ONNX model
session = ort.InferenceSession("electricity_demand_model.onnx")
input_name = session.get_inputs()[0].name

# 2. Prepare input feature vector (shape: [batch_size, ${features.length}])
# Features: ${features.slice(0, 5).join(', ')}...
sample_input = np.array([[
    2350.5,  # MW / Lag_1
    2290.0,  # Lag_24
    2310.0,  # Lag_168
    2320.0,  # Rolling_mean_24
    34.0,    # Temp
    50.0,    # Humidity
    0.866,   # Hour_sin
    -0.5,    # Hour_cos
    0,       # Weekend
    0,       # Is_Festival
    0, 0, 0, 0
]], dtype=np.float32)

# Ensure correct width
if sample_input.shape[1] < ${features.length}:
    sample_input = np.pad(sample_input, ((0, 0), (0, ${features.length} - sample_input.shape[1])))

# 3. Predict next hour electricity demand (MW)
predictions = session.run(None, {input_name: sample_input})[0]
predicted_MW = float(predictions[0][0]) if predictions.ndim > 1 else float(predictions[0])

print(f"Predicted Next-Hour Demand: {predicted_MW:.2f} MW")`,

    pickle: `import pickle
import numpy as np

# 1. Deserialize model package
with open("model.pkl", "rb") as f:
    model_pkg = pickle.load(f)

print(f"Loaded: {model_pkg['model_name']} (Trained MAE: {model_pkg['metrics']['mae']} MW)")
print(f"Required Features: {len(model_pkg['feature_names'])} columns")

# 2. Inspect hyperparameters
print("Model Hyperparameters:", model_pkg["hyperparameters"])`,

    xgboost: `import xgboost as xgb
import json

# 1. Load native XGBoost model JSON
booster = xgb.Booster()
booster.load_model("xgboost_model.json")

print(f"Loaded Booster with {booster.num_features()} features.")

# 2. Predict on DMatrix
# dtest = xgb.DMatrix(X_test)
# preds = booster.predict(dtest)`,

    curl: `# Run local server first:
# uvicorn inference:app --host 0.0.0.0 --port 8000

curl -X POST "http://localhost:8000/predict" \\
     -H "Content-Type: application/json" \\
     -d '{
       "current_MW": 2450.0,
       "lag_24": 2380.0,
       "lag_168": 2400.0,
       "rolling_mean_24": 2410.0,
       "hour": 19,
       "day_of_week": 3,
       "month": 6,
       "temperature": 36.0,
       "humidity": 48.0,
       "is_weekend": 0,
       "is_festival": 0
     }'`,
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Production Export
            </span>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Download Trained Model Artifacts
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Export serialized model files (.onnx, .pkl, .json) and inference microservices for local grid deployment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAllBundle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all"
          >
            <Box className="w-4 h-4" />
            Download Complete Deployment Package
          </button>
        </div>
      </div>

      {/* Model Contract & Metadata Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Model Architecture</span>
          <div className="text-base font-bold font-mono text-cyan-300 mt-1">{bestModel.name}</div>
          <span className="text-[11px] text-slate-400 block">XGBoost / Gradient Boosting</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Production Accuracy</span>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
            MAE: {bestModel.metrics.mae} MW
          </div>
          <span className="text-[11px] text-slate-400 block">R² Score: {bestModel.metrics.r2}</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Input Tensor Signature</span>
          <div className="text-base font-bold font-mono text-amber-300 mt-1">
            float32[?, {features.length}]
          </div>
          <span className="text-[11px] text-slate-400 block">{features.length} required covariates</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Output Target</span>
          <div className="text-base font-bold font-mono text-purple-300 mt-1">Target_MW (float32)</div>
          <span className="text-[11px] text-slate-400 block">Next hour demand in MW</span>
        </div>
      </div>

      {/* Export Format Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: ONNX */}
        <div className="bg-slate-950/70 border border-cyan-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-cyan-600 transition-colors shadow-lg shadow-cyan-950/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                .onnx
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Recommended</span>
            </div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              ONNX Model File
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard Open Neural Network Exchange binary format. Optimized for ultra-low latency inference using{' '}
              <code className="text-cyan-300">onnxruntime</code> in C++, Python, Rust, C#, Go, and edge SCADA microcontrollers.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Domain: ai.onnx.ml</span>
              <span>Opset: 19</span>
            </div>
            <button
              onClick={handleDownloadONNX}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .onnx Model
            </button>
          </div>
        </div>

        {/* Card 2: Python Pickle */}
        <div className="bg-slate-950/70 border border-amber-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-600 transition-colors shadow-lg shadow-amber-950/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                .pkl
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Python Scikit</span>
            </div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              Python Pickle Artifact
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Serialized Python object containing booster state, hyperparameters, feature order, and metadata dictionary. Loadable with standard <code className="text-amber-300">pickle.load()</code> or <code className="text-amber-300">joblib.load()</code>.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Protocol: 4</span>
              <span>Framework: XGBoost</span>
            </div>
            <button
              onClick={handleDownloadPickle}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .pkl Artifact
            </button>
          </div>
        </div>

        {/* Card 3: Native XGBoost JSON */}
        <div className="bg-slate-950/70 border border-purple-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-purple-600 transition-colors shadow-lg shadow-purple-950/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                .json
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Native XGBoost</span>
            </div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              XGBoost Model JSON
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Official native model specification format compatible with <code className="text-purple-300">xgb.Booster.load_model('model.json')</code> across Python, C++, R, and Go.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Format: Universal</span>
              <span>Trees: {hp.n_estimators}</span>
            </div>
            <button
              onClick={handleDownloadJSON}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Model .json
            </button>
          </div>
        </div>
      </div>

      {/* Production Server Scripts Section */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Production Deployment Code & Microservice Server
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy or download the complete FastAPI inference service and client test runner
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadInferenceScript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Download inference.py
            </button>
            <button
              onClick={handleDownloadRequirements}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              Download requirements.txt
            </button>
          </div>
        </div>

        {/* Code Snippet Tabs */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg text-xs">
              {[
                { id: 'onnx', label: '1. ONNX Runtime Inference (Python)' },
                { id: 'pickle', label: '2. Pickle/Joblib Loading' },
                { id: 'xgboost', label: '3. Native XGBoost Loading' },
                { id: 'curl', label: '4. REST API cURL Request' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFormat(tab.id as any)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    selectedFormat === tab.id
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => copyToClipboard(codeSnippets[selectedFormat], selectedFormat)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors"
            >
              {copiedTab === selectedFormat ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto text-[12px] font-mono text-cyan-300 leading-relaxed max-h-72 select-all">
            {codeSnippets[selectedFormat]}
          </pre>
        </div>
      </div>

      {/* Ordered Features Signature Reference */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Model Feature Order Contract ({features.length} columns)
        </h4>
        <p className="text-xs text-slate-400">
          When passing inputs to the downloaded model, the vector must strictly follow this exact feature ordering:
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {features.map((feat, idx) => (
            <span
              key={feat}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
            >
              <span className="text-slate-500 mr-1">#{idx}:</span>
              {feat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
