import React from 'react';
import {
  LayoutDashboard,
  Database,
  CheckCircle,
  SunMedium,
  Cpu,
  Layers,
  Sliders,
  Activity,
  Gauge,
  Code,
  LineChart,
  GitCompare,
  Download,
  Lock,
} from 'lucide-react';

interface StageNavProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  hasResults: boolean;
}

export const StageNav: React.FC<StageNavProps> = ({ activeTab, onSelectTab, hasResults }) => {
  const tabs = [
    { id: 'upload', label: '1. Dataset Upload', icon: Database, badge: 'Required' },
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard, badge: 'Home' },
    { id: 'quality', label: '2. Data Quality & Profiling', icon: CheckCircle, badge: 'EDA' },
    { id: 'demand_weather', label: '3 & 4. Demand & Weather EDA', icon: SunMedium, badge: 'EDA' },
    { id: 'feature_eng', label: '5 & 6. Features & Leakage Audit', icon: Cpu, badge: 'Prep' },
    { id: 'models', label: '7 & 8. Model Leaderboard', icon: Layers, badge: 'Compare' },
    { id: 'tuning', label: '9. Hyperparameter Tuning', icon: Sliders, badge: 'Interactive' },
    { id: 'visualizations', label: 'Model Visualizations', icon: LineChart, badge: 'Plots' },
    { id: 'compare', label: 'Compare Sessions', icon: GitCompare, badge: 'Diff' },
    { id: 'export_model', label: 'Export Model (.onnx/.pkl)', icon: Download, badge: 'Deploy' },
    { id: 'peak_error', label: '10-12. Peak & Residuals', icon: Activity, badge: 'Diagnostics' },
    { id: 'simulator', label: 'What-If Simulator', icon: Gauge, badge: 'Tool' },
    { id: 'code_export', label: 'Python', icon: Code, badge: '.py' },
  ];

  return (
    <div className="bg-slate-950 border-b border-slate-800 px-4 lg:px-8 py-2 overflow-x-auto scrollbar-thin">
      <div className="flex items-center gap-1.5 min-w-max">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          const isDisabled = !hasResults && t.id !== 'upload';

          return (
            <button
              key={t.id}
              disabled={isDisabled}
              onClick={() => onSelectTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isDisabled
                  ? 'opacity-35 cursor-not-allowed text-slate-500 hover:text-slate-500'
                  : isActive
                  ? 'bg-cyan-600 text-white font-semibold shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title={isDisabled ? 'Please upload a dataset first' : ''}
            >
              {isDisabled ? (
                <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              ) : (
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'} shrink-0`} />
              )}
              <span>{t.label}</span>
              {t.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isDisabled
                      ? 'bg-slate-950 text-slate-600'
                      : isActive
                      ? 'bg-cyan-700/80 text-cyan-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDisabled ? 'Lock' : t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
