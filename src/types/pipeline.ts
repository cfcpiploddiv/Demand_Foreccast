export interface RawDataRow {
  timestamp: string;
  load_MW: number | string;
  weather_condition?: string;
  holiday_type?: string;
  festival_name?: string;
  temp?: number | string;
  humidity?: number | string;
  [key: string]: any;
}

export interface ColumnMapping {
  timestampCol: string;
  loadCol: string;
  tempCol?: string;
  humidityCol?: string;
  weatherCol?: string;
  holidayCol?: string;
  festivalCol?: string;
}

export interface DataQualityReport {
  totalRows: number;
  duplicateRows: number;
  dateRange: { start: string; end: string } | null;
  columns: {
    name: string;
    missingCount: number;
    missingPercent: number;
    dataType: string;
  }[];
  temporalGapsFilled?: number;
  totalImputedPoints?: number;
}

export interface DescriptiveStats {
  column: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  skewness: number;
  histogram: { binStart: number; binEnd: number; count: number }[];
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
  smape: number;
  r2: number;
}

export interface ModelComparisonRow {
  id: string;
  name: string;
  category: 'Baseline' | 'Linear' | 'Tree' | 'Ensemble' | 'Tuned';
  metrics: ModelMetrics;
  isBest?: boolean;
}

export interface FeatureGroupResult {
  groupName: string;
  description: string;
  featuresUsed: string[];
  metrics: ModelMetrics;
  maeImprovementOverBaseline?: number;
}

export interface Hyperparameters {
  n_estimators: number;
  max_depth: number;
  learning_rate: number;
  subsample: number;
  colsample_bytree: number;
  min_child_weight: number;
  train_split: number; // e.g. 0.8
  use_weather: boolean;
  use_calendar: boolean;
  use_cyclic: boolean;
  selected_lags: number[]; // e.g. [1, 24, 168]
  selected_algorithms: string[]; // e.g. ['naive_24', 'lr', 'xgb_tuned']
  algorithm_selection_mode: 'auto' | 'manual';
}

export interface PeakAnalysisResult {
  peakThreshold: number;
  peakObservations: number;
  peakMetrics: ModelMetrics;
  peakBias: number;
  classification: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
    precision: number;
    recall: number;
    f1: number;
    accuracy: number;
  };
}

export interface HourlyErrorStat {
  hour: number;
  mae: number;
  meanDemand: number;
  count: number;
}

export interface DemandLevelStat {
  level: 'Low' | 'Medium' | 'High';
  mae: number;
  meanDemand: number;
  count: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  percentage: number;
  cumulativePercentage?: number;
  direction?: 'positive' | 'negative' | 'mixed';
  impactDescription?: string;
}

export interface ROCCurvePoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

export interface PRCurvePoint {
  recall: number;
  precision: number;
  threshold: number;
}

export interface ModelVisualizations {
  rocCurve: {
    points: ROCCurvePoint[];
    auc: number;
    optimalThreshold: number;
    optimalFpr: number;
    optimalTpr: number;
  };
  prCurve: {
    points: PRCurvePoint[];
    aucPr: number;
  };
  learningCurve: {
    iterations: { iter: number; trainLoss: number; valLoss: number }[];
    bestIter: number;
  };
  residualsVsFitted: {
    points: { fitted: number; residual: number }[];
  };
  qqPlot: {
    points: { theoretical: number; sample: number }[];
  };
  confusionMatrixDetailed: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
    total: number;
    sensitivity: number; // Recall
    specificity: number;
    precision: number;
    npv: number; // Negative Predictive Value
    f1: number;
    accuracy: number;
    threshold: number;
  };
}

export interface ForecastPoint {
  datetime: string;
  actual: number;
  predicted: number;
  error: number;
  isPeak: boolean;
}

export interface PipelineResults {
  quality: DataQualityReport;
  stats: DescriptiveStats[];
  demandOverview: {
    avgDemand: number;
    maxDemand: number;
    minDemand: number;
    totalObservations: number;
    hourlyBoxplots: { hour: number; min: number; q25: number; median: number; q75: number; max: number; avg: number }[];
    dayOfWeekBoxplots: { day: string; min: number; q25: number; median: number; q75: number; max: number; avg: number }[];
    monthlyBoxplots: { month: string; min: number; q25: number; median: number; q75: number; max: number; avg: number }[];
  };
  weatherEda: {
    tempCorrelation: number;
    humidityCorrelation: number;
    weatherConditionStats: { condition: string; avgDemand: number; count: number }[];
    tempScatterSample: { temp: number; mw: number }[];
    humidityScatterSample: { humidity: number; mw: number }[];
  };
  calendarEda: {
    holidayStats: { type: string; avgDemand: number; count: number }[];
    topFestivals: { name: string; avgDemand: number; count: number }[];
  };
  correlationMatrix: {
    features: string[];
    matrix: number[][];
    sortedWithDemand: { feature: string; correlation: number }[];
  };
  featureEngineeringAudit: {
    totalFeatures: number;
    featuresList: string[];
    leakageChecks: { rule: string; passed: boolean; note: string }[];
    trainSize: number;
    testSize: number;
  };
  featureGroupExperiments: FeatureGroupResult[];
  models: ModelComparisonRow[];
  bestModel: ModelComparisonRow;
  hyperparameters: Hyperparameters;
  peakAnalysis: PeakAnalysisResult;
  errorAnalysis: {
    meanError: number; // bias
    medianError: number;
    biasPercentage: number;
    hourlyErrors: HourlyErrorStat[];
    weekdayWeekendErrors: { type: string; mae: number; meanDemand: number; count: number }[];
    demandLevelErrors: DemandLevelStat[];
    errorDistribution: { binStart: number; binEnd: number; count: number }[];
    testForecastSample: ForecastPoint[];
    scatterParitySample: { actual: number; predicted: number }[];
  };
  featureImportances: FeatureImportanceItem[];
  modelVisualizations: ModelVisualizations;
}

export interface SavedSession {
  id: string;
  name: string;
  createdAt: string;
  datasetName: string;
  hyperparameters: Hyperparameters;
  bestModelName: string;
  metrics: ModelMetrics;
  peakThreshold: number;
  peakMetrics: ModelMetrics;
  peakClassification: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
  };
  rocAuc: number;
  prAuc: number;
  meanError: number;
  testForecastSample: ForecastPoint[];
  rocPoints: ROCCurvePoint[];
  notes?: string;
}

