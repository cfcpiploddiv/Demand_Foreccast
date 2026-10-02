# ⚡ Electricity Demand Forecasting Studio & ML Pipeline Workbench

An enterprise-grade, high-fidelity end-to-end forecasting workbench designed for power distribution utilities and energy analysts. This application automates data ingestion, exploratory profiling, features curation, multi-algorithm training, hyperparameter optimization, and grid dispatch diagnostics, delivering serialized production-ready model artifacts.

---

## 🚀 Key Architectural Capabilities

### 1. Zero-Data Safe Landing & Upload-First Flow
*   **Secure Ingestion Workspace**: Starts completely blank with no pre-populated sample or mock metrics, enforcing data privacy guidelines.
*   **Intuitive Steerage**: Core dashboard and analytical panels are securely locked and dim-styled until a valid `.csv` demand dataset is explicitly uploaded and aligned.
*   **Automatic Handshake**: Uploading immediately runs the compiled background ML pipeline and auto-navigates the operator to the central Overview Dashboard.

### 2. Automated Data Quality & Imputation Workbench
*   **One-Click Standardisation**: Cleans and validates raw telemetry, resolving duplicate indices, categorical string discrepancies, and missing weather measurements.
*   **Audited Side-by-Side Ledger**: Renders a complete **Quality Imputation Ledger** documenting exactly:
    *   **Variable Column**: Target telemetry column being verified.
    *   **Anomalous State (Before)**: Original missing counts and malformed entries (e.g., `18 missing`, `14 duplicates`).
    *   **Correction Strategy**: Applied mathematical or structural imputation rule (e.g., forward-rolling mean interpolation, duplicate index averaging).
    *   **Cleaned State (After)**: Real-time transition of telemetry values (e.g., `18 → 0` and `0.08% → 0%`).

### 3. Interactive Custom Dispatch Load Predictor Form
*   **Explicit Parameters Insert Box**: Enter custom weather, holidays, and seasonal parameters using explicit numeric fields for **Temperature (°C)** and **Relative Humidity (%)**.
*   **Real-Time Simulation**: Uses the currently active tuned model weights to estimate the next-hour distribution demand in Megawatts (`load_MW`).
*   **Grid Dispatch Advice**: Triggers automated operator recommendations (such as Baseload Dispatch, Spinning Reserves Activation, or battery-storage Peak Alarms) based on critical grid load thresholds.

### 4. Advanced Model Leaderboard & Hyperparameter Tuning
*   **17 Candidate Models**: Real-time evaluation of `XGBoost (Base & Tuned)`, `LightGBM`, `CatBoost`, `LSTM`, `GRU`, `SARIMAX`, `Ridge`, `Lasso`, `MLP Neural Networks`, and standard persistence baselines.
*   **Interactive Hyperparameter Tuning**: Dynamically adjust training factors (`n_estimators`, `max_depth`, `learning_rate`, `subsample`, `selected_lags`) to trigger background pipeline retraining and watch performance metrics adjust instantly.
*   **Model Diagnostics & Plots**: High-fidelity chart visualizations of ROC curves, Precision-Recall curves, residuals distributions, and hourly error terciles.

### 5. Production Code Export & Serialized Deployment
*   **Python Pipeline Generator**: One-click generation of fully commented, production-grade `.py` code reproducing feature extractions, XGBoost scaling, and evaluation loops.
*   **Serialized Download**: Export your trained model weights directly in serialized **ONNX (.onnx)** or **Pickle (.pkl)** formats for direct local integration.

---

## 🛠️ Stack & Technologies

*   **Runtime Framework**: React 18 SPA (Vite)
*   **Language**: TypeScript (Strict typing enabled)
*   **Styling**: Tailwind CSS (Modern modular tokens)
*   **Icons**: Lucide React
*   **Compilation & Quality**: ESLint, tsc compiler checks

---

## 📂 Project Structure

```bash
├── src
│   ├── components           # UI Components
│   │   ├── charts           # High-fidelity rendering charts (KDE, Histograms, ROC)
│   │   ├── stages           # Step-by-step pipeline stages (Overview, Quality, Tuning)
│   │   ├── DatasetUploader  # Robust CSV parser and mapper
│   │   └── Header           # Sticky global toolbar with Reset & Run actions
│   ├── types                # Strict TypeScript typings for ML pipeline outputs
│   ├── utils                # Core mathematical & prediction engines
│   │   ├── mlEngine.ts      # Multi-model benchmarking engine
│   │   ├── sampleData.ts    # Climatology and demand default values
│   │   └── pythonCodeExport # Commentary and ONNX generation helper
│   ├── App.tsx              # Application hub & state manager
│   └── main.tsx             # React entry mount
├── package.json             # Package configuration
└── vite.config.ts           # Vite Bundler settings
```

---

## 💻 Local Development Setup

To run the Electricity Demand Forecasting Studio locally:

### 1. Clone & Install Dependencies
Ensure you have [Node.js](https://nodejs.org/) installed:
```bash
npm install
```

### 2. Launch Development Server
Starts the Vite server locally (hot-reloading enabled):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 3. Lint Validation
Verify code quality and type consistency:
```bash
npm run lint
```

### 4. Production Compile
Build optimized static assets:
```bash
npm run build
```
The compiled output will be generated inside the `dist/` directory, ready to be deployed on any server.
