import React, { useRef, useState } from 'react';
import { Upload, FileText, Database, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { ColumnMapping } from '../types/pipeline';
import { autoDetectColumnMapping, parseCSVData } from '../utils/mlEngine';
import { SAMPLE_DATASET_CSV } from '../utils/sampleData';
import { downloadFile } from '../utils/pythonCodeExport';

interface DatasetUploaderProps {
  onDatasetLoaded: (csvContent: string, mapping: ColumnMapping, filename: string) => void;
  isLoading: boolean;
  activeFilename: string;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({
  onDatasetLoaded,
  isLoading,
  activeFilename,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [csvPreview, setCsvPreview] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState<number>(0);
  const [currentMapping, setCurrentMapping] = useState<ColumnMapping>({
    timestampCol: 'timestamp',
    loadCol: 'load_MW',
    tempCol: 'Temp',
    humidityCol: 'Humidity',
    weatherCol: 'Weather Condition',
    holidayCol: 'Holiday Type',
    festivalCol: 'Festival Name',
  });
  const [tempFilename, setTempFilename] = useState<string>('load_data.csv');

  const handleProcessRawCSV = (content: string, fname: string) => {
    try {
      const { data, headers: detectedHeaders } = parseCSVData(content);
      if (detectedHeaders.length === 0 || data.length === 0) {
        alert('Could not parse valid tabular data from the uploaded file.');
        return;
      }
      const mapping = autoDetectColumnMapping(detectedHeaders);
      setHeaders(detectedHeaders);
      setRowCount(data.length);
      setCurrentMapping(mapping);
      setCsvPreview(content);
      setTempFilename(fname);

      // Automatically launch pipeline
      onDatasetLoaded(content, mapping, fname);
    } catch (err: any) {
      alert(`Error reading CSV: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (text) {
        handleProcessRawCSV(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        const text = evt.target?.result as string;
        if (text) {
          handleProcessRawCSV(text, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const loadSample = () => {
    handleProcessRawCSV(SAMPLE_DATASET_CSV, 'load_data.csv (90-Day Sample)');
  };

  const handleApplyMapping = () => {
    if (csvPreview) {
      onDatasetLoaded(csvPreview, currentMapping, tempFilename);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Database className="w-5 h-5 text-cyan-400" />
            Dataset Ingestion & Pipeline Configuration
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload power distribution hourly load data, run all 12 pipeline stages, and tune models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadFile('load_data.csv', SAMPLE_DATASET_CSV, 'text/csv')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
            title="Download sample dataset with timestamp, load_MW, weather, holidays, and festivals"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Download Sample CSV
          </button>

          <button
            onClick={loadSample}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-900/40 transition-all disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Load Sample Dataset
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-800/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.tsv"
          className="hidden"
          onChange={handleFileUpload}
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <span className="font-semibold text-white text-sm">
              Click to upload or drag & drop your dataset CSV
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Supports `.csv`, `.tsv` (e.g. timestamp, load_MW, Weather Condition, Holiday Type, Festival Name, Temp, Humidity)
            </p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full">
            Active Dataset: <span className="text-cyan-300 font-mono font-medium">{activeFilename}</span>
          </div>
        </div>
      </div>

      {/* Column Mapping Adjuster (visible once data is loaded or available) */}
      {headers.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">
                Column Mapping ({rowCount} rows detected, {headers.length} columns)
              </span>
            </div>
            <button
              onClick={handleApplyMapping}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors disabled:opacity-50"
            >
              Re-run Pipeline with Mapped Columns
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Timestamp / Date:</label>
              <select
                value={currentMapping.timestampCol}
                onChange={e => setCurrentMapping({ ...currentMapping, timestampCol: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500"
              >
                {headers.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Electricity Demand (MW):</label>
              <select
                value={currentMapping.loadCol}
                onChange={e => setCurrentMapping({ ...currentMapping, loadCol: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500"
              >
                {headers.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Temperature (°C):</label>
              <select
                value={currentMapping.tempCol || ''}
                onChange={e => setCurrentMapping({ ...currentMapping, tempCol: e.target.value || undefined })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">(None / Exclude)</option>
                {headers.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Humidity (%):</label>
              <select
                value={currentMapping.humidityCol || ''}
                onChange={e => setCurrentMapping({ ...currentMapping, humidityCol: e.target.value || undefined })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">(None / Exclude)</option>
                {headers.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Weather Condition:</label>
              <select
                value={currentMapping.weatherCol || ''}
                onChange={e => setCurrentMapping({ ...currentMapping, weatherCol: e.target.value || undefined })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">(None / Exclude)</option>
                {headers.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Holiday Type:</label>
              <select
                value={currentMapping.holidayCol || ''}
                onChange={e => setCurrentMapping({ ...currentMapping, holidayCol: e.target.value || undefined })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">(None / Exclude)</option>
                {headers.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-medium">Festival Name:</label>
              <select
                value={currentMapping.festivalCol || ''}
                onChange={e => setCurrentMapping({ ...currentMapping, festivalCol: e.target.value || undefined })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500"
              >
                <option value="">(None / Exclude)</option>
                {headers.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
