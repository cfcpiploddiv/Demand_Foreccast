import { Hyperparameters, PipelineResults } from '../types/pipeline';

export function generatePythonScript(hp: Hyperparameters): string {
  return `"""
================================================================================
Electricity Demand Forecasting for Power Distribution Utilities
Fully Automated ML Pipeline with EDA, Feature Engineering & Tuned XGBoost
Generated directly from AI Studio Forecasting Workbench
================================================================================
"""

import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV

warnings.filterwarnings("ignore")

# ============================================================
# 1. EVALUATION METRICS
# ============================================================
def calc_metrics(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
    smape = np.mean(2 * np.abs(y_true - y_pred) / (np.abs(y_true) + np.abs(y_pred))) * 100
    r2 = r2_score(y_true, y_pred)
    return mae, rmse, mape, smape, r2

# ============================================================
# 2. COMPREHENSIVE PIPELINE EXECUTION
# ============================================================
def run_comprehensive_pipeline(file_path="load_data.csv"):
    print("=" * 80)
    print("   ELECTRICITY DEMAND FORECASTING WORKFLOW (UTILITY SCALE)")
    print("=" * 80)

    # Step 1: Load Data
    try:
        df = pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"File {file_path} not found. Please provide a valid CSV.")
        return

    exact_map = {
        'Timestamp': 'timestamp', 'Date': 'timestamp', 'Datetime': 'timestamp',
        'Load_MW': 'MW', 'load_MW': 'MW', 'Demand': 'MW', 'Power': 'MW',
        'Weather Condition': 'Weather_Condition', 'Holiday Type': 'Holiday_Type',
        'Festival Name': 'Festival_Name', 'Temp': 'Temp', 'Humidity': 'Humidity'
    }
    df.rename(columns=exact_map, inplace=True)
    if 'timestamp' not in df.columns:
        df['timestamp'] = df.iloc[:, 0]

    df['Datetime'] = pd.to_datetime(df['timestamp'], dayfirst=True, format='mixed', errors='coerce')
    df = df.dropna(subset=['Datetime']).sort_values('Datetime').set_index('Datetime').drop(columns=['timestamp'])

    # Hourly Resampling & Capped Imputation
    df = df.resample("1h").asfreq()
    if 'MW' in df.columns:
        df['MW'] = df['MW'].ffill(limit=3)

    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    for col in numeric_cols:
        if col != 'MW':
            df[col] = df[col].ffill()

    categorical_cols = df.select_dtypes(exclude=np.number).columns.tolist()
    for col in categorical_cols:
        df[col] = df[col].fillna("Unknown")

    df = df.dropna(subset=["MW"])

    # Step 2: Feature Engineering
    df["Hour"] = df.index.hour
    df["Day_of_Week"] = df.index.dayofweek
    df["Month"] = df.index.month
    df["Weekend"] = (df["Day_of_Week"] >= 5).astype(int)

    # Cyclical Features
    df["Hour_sin"] = np.sin(2 * np.pi * df["Hour"] / 24)
    df["Hour_cos"] = np.cos(2 * np.pi * df["Hour"] / 24)
    df["DOW_sin"] = np.sin(2 * np.pi * df["Day_of_Week"] / 7)
    df["DOW_cos"] = np.cos(2 * np.pi * df["Day_of_Week"] / 7)
    df["Month_sin"] = np.sin(2 * np.pi * df["Month"] / 12)
    df["Month_cos"] = np.cos(2 * np.pi * df["Month"] / 12)

    # Lags & Rolling Statistics
    df["Lag_1"] = df["MW"].shift(1)
    df["Lag_2"] = df["MW"].shift(2)
    df["Lag_3"] = df["MW"].shift(3)
    df["Lag_24"] = df["MW"].shift(24)
    df["Lag_48"] = df["MW"].shift(48)
    df["Lag_72"] = df["MW"].shift(72)
    df["Lag_168"] = df["MW"].shift(168)
    df["Rolling_mean_24"] = df["MW"].shift(1).rolling(window=24).mean()
    df["Rolling_std_24"] = df["MW"].shift(1).rolling(window=24).std()

    if 'Festival_Name' in df.columns:
        fest_text = df['Festival_Name'].astype(str).str.strip().str.lower()
        df['Is_Festival'] = (df['Festival_Name'].notna() & ~fest_text.isin(['none', 'nan', '', 'unknown'])).astype(int)
        df.drop(columns=['Festival_Name'], inplace=True)

    # Next-Hour Target (Shifted -1)
    df["Target_MW"] = df["MW"].shift(-1)
    df = df.dropna()

    # Step 3: Chronological Train/Test Partition (No Data Leakage)
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
    df_encoded = pd.get_dummies(df, columns=cat_cols, drop_first=True)

    split_ratio = ${hp.train_split}
    split_idx = int(len(df_encoded) * split_ratio)
    train, test = df_encoded.iloc[:split_idx], df_encoded.iloc[split_idx:]

    features = [c for c in df_encoded.columns if c != "Target_MW"]
    X_tr, y_tr = train[features], train['Target_MW']
    X_te, y_te = test[features], test['Target_MW']

    print(f"Total Rows: {len(df_encoded)}, Train Size: {len(train)}, Test Size: {len(test)}")

    # Step 4: Baselines
    pred_naive_1 = test['MW']
    res_naive_1 = calc_metrics(y_te, pred_naive_1)

    pred_naive_24 = test['Lag_24']
    res_naive_24 = calc_metrics(y_te, pred_naive_24)

    # Step 5: Linear Regression with StandardScaler
    lr_pipe = Pipeline([('scaler', StandardScaler()), ('lr', LinearRegression())])
    lr_pipe.fit(X_tr, y_tr)
    pred_lr = lr_pipe.predict(X_te)
    res_lr = calc_metrics(y_te, pred_lr)

    # Step 6: Decision Tree & Random Forest
    dt = DecisionTreeRegressor(max_depth=10, random_state=42).fit(X_tr, y_tr)
    pred_dt = dt.predict(X_te)
    res_dt = calc_metrics(y_te, pred_dt)

    rf = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1).fit(X_tr, y_tr)
    pred_rf = rf.predict(X_te)
    res_rf = calc_metrics(y_te, pred_rf)

    # Step 7: XGBoost Model with User-Tuned Hyperparameters
    tuned_params = {
        'n_estimators': ${hp.n_estimators},
        'max_depth': ${hp.max_depth},
        'learning_rate': ${hp.learning_rate},
        'subsample': ${hp.subsample},
        'colsample_bytree': ${hp.colsample_bytree},
        'min_child_weight': ${hp.min_child_weight},
        'random_state': 42,
        'n_jobs': -1
    }
    print(f"\\nTraining Tuned XGBoost with parameters: {tuned_params}")

    xgb_model = XGBRegressor(**tuned_params)
    xgb_model.fit(X_tr, y_tr)
    pred_xgb = xgb_model.predict(X_te)
    res_xgb = calc_metrics(y_te, pred_xgb)

    # Step 8: Comparison Table
    leaderboard = pd.DataFrame([
        {'Model': 'Naive-1 Persistence', 'MAE': res_naive_1[0], 'RMSE': res_naive_1[1], 'MAPE': res_naive_1[2], 'sMAPE': res_naive_1[3], 'R2': res_naive_1[4]},
        {'Model': 'Seasonal Naive-24', 'MAE': res_naive_24[0], 'RMSE': res_naive_24[1], 'MAPE': res_naive_24[2], 'sMAPE': res_naive_24[3], 'R2': res_naive_24[4]},
        {'Model': 'Linear Regression', 'MAE': res_lr[0], 'RMSE': res_lr[1], 'MAPE': res_lr[2], 'sMAPE': res_lr[3], 'R2': res_lr[4]},
        {'Model': 'Decision Tree', 'MAE': res_dt[0], 'RMSE': res_dt[1], 'MAPE': res_dt[2], 'sMAPE': res_dt[3], 'R2': res_dt[4]},
        {'Model': 'Random Forest', 'MAE': res_rf[0], 'RMSE': res_rf[1], 'MAPE': res_rf[2], 'sMAPE': res_rf[3], 'R2': res_rf[4]},
        {'Model': 'XGBoost (Tuned)', 'MAE': res_xgb[0], 'RMSE': res_xgb[1], 'MAPE': res_xgb[2], 'sMAPE': res_xgb[3], 'R2': res_xgb[4]},
    ])
    print("\\n--- MODEL EVALUATION LEADERBOARD ---")
    print(leaderboard.to_string(index=False))

    # Step 9: Peak Demand Analysis (Top 10%)
    peak_threshold = y_te.quantile(0.90)
    peak_mask = y_te >= peak_threshold
    peak_res = calc_metrics(y_te[peak_mask], pred_xgb[peak_mask])
    print(f"\\nTop 10% Peak Demand (> {peak_threshold:.1f} MW):")
    print(f"Peak MAE: {peak_res[0]:.2f} MW, Peak RMSE: {peak_res[1]:.2f} MW, Peak MAPE: {peak_res[2]:.2f}%")

    # Step 10: Improvement Calculation
    mae_improvement = ((res_naive_1[0] - res_xgb[0]) / res_naive_1[0]) * 100
    print(f"\\nMAE Improvement over Naive Persistence: {mae_improvement:.2f}%")

    return leaderboard, xgb_model

if __name__ == "__main__":
    run_comprehensive_pipeline()
`;
}

export function downloadFile(filename: string, content: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportComparisonCSV(results: PipelineResults): string {
  const rows = [
    ['Model', 'Category', 'MAE (MW)', 'RMSE (MW)', 'MAPE (%)', 'sMAPE (%)', 'R2'],
    ...results.models.map(m => [
      m.name,
      m.category,
      m.metrics.mae.toString(),
      m.metrics.rmse.toString(),
      m.metrics.mape.toString(),
      m.metrics.smape.toString(),
      m.metrics.r2.toString(),
    ]),
  ];
  return rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}
