import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Upload,
  CheckCircle2,
  Sliders,
  Play,
  BarChart2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ArrowLeft,
  Download,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Database
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const SegmentationStudioPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | string>('');
  const [activeDataset, setActiveDataset] = useState<any>(null);

  // Feature selection
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Preprocessing config
  const [missingStrategy, setMissingStrategy] = useState<'mean' | 'median' | 'drop'>('mean');
  const [scalerType, setScalerType] = useState<'standard' | 'minmax' | 'robust'>('standard');

  // Algorithm config
  const [nClusters, setNClusters] = useState<number>(4);
  const [randomState, setRandomState] = useState<number>(42);

  // Elbow evaluation preview
  const [loadingElbow, setLoadingElbow] = useState(false);
  const [elbowData, setElbowData] = useState<any>(null);

  // Execution & results
  const [runningModel, setRunningModel] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [createdRunId, setCreatedRunId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load existing datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await api.get('/datasets');
        setDatasets(res.data.datasets || []);
        if (res.data.datasets?.length > 0) {
          const first = res.data.datasets[0];
          setSelectedDatasetId(first.id);
          setActiveDataset(first);
          setupColumns(first.columns || []);
        }
      } catch (err) {
        console.error('Failed to load datasets', err);
      }
    };
    fetchDatasets();
  }, []);

  const setupColumns = (cols: string[]) => {
    setAvailableColumns(cols);
    // Auto select numeric-sounding columns for clustering
    const autoFeatures = cols.filter(c =>
      !/id|name|email|phone|address|date|raw/i.test(c) &&
      /income|spend|score|age|frequency|orders|recency|monetary/i.test(c)
    );
    setSelectedFeatures(autoFeatures.length >= 2 ? autoFeatures : cols.slice(0, 3));
  };

  const handleDatasetSelect = (id: string | number) => {
    setSelectedDatasetId(id);
    const found = datasets.find(d => String(d.id) === String(id));
    if (found) {
      setActiveDataset(found);
      setupColumns(found.columns || []);
    }
  };

  const toggleFeature = (col: string) => {
    if (selectedFeatures.includes(col)) {
      if (selectedFeatures.length <= 1) {
        alert('You must select at least 1 feature column for clustering.');
        return;
      }
      setSelectedFeatures(selectedFeatures.filter(f => f !== col));
    } else {
      setSelectedFeatures([...selectedFeatures, col]);
    }
  };

  // Run Elbow & Silhouette preview
  const handleCalculateElbow = async () => {
    setLoadingElbow(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/segmentation/preview', {
        dataset_id: selectedDatasetId,
        feature_columns: selectedFeatures,
        min_k: 2,
        max_k: 8,
        scaler: scalerType,
        missing_strategy: missingStrategy
      });
      setElbowData(res.data);
      if (res.data.recommended_k) {
        setNClusters(res.data.recommended_k);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Elbow calculation failed.');
    } finally {
      setLoadingElbow(false);
    }
  };

  // Run real K-Means Segmentation
  const handleExecuteSegmentation = async () => {
    setRunningModel(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/segmentation/run', {
        dataset_id: selectedDatasetId,
        run_name: `K-Means (k=${nClusters}) - ${activeDataset?.name || 'Dataset'}`,
        feature_columns: selectedFeatures,
        n_clusters: nClusters,
        scaler: scalerType,
        missing_strategy: missingStrategy,
        random_state: randomState,
        run_decision_tree: true
      });

      setRunResult(res.data.result);
      setCreatedRunId(res.data.runId);
      setCurrentStep(6); // Move to visualization
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Segmentation execution failed.');
    } finally {
      setRunningModel(false);
    }
  };

  const handleDownloadAssignments = () => {
    if (!createdRunId) return;
    const token = localStorage.getItem('customerseg_token') || sessionStorage.getItem('customerseg_token');
    const url = `/api/v1/segmentation/runs/${createdRunId}/export`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `segmentation_assignments_run_${createdRunId}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  const steps = [
    { num: 1, label: 'Select Dataset' },
    { num: 2, label: 'Configure Columns' },
    { num: 3, label: 'Data Preprocessing' },
    { num: 4, label: 'Algorithm & Tuning' },
    { num: 5, label: 'Execute Model' },
    { num: 6, label: 'Visual Analytics' },
    { num: 7, label: 'Profiles & Rules' },
    { num: 8, label: 'Export Results' },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">AI Segmentation Studio</h2>
            <span className="text-[11px] font-bold uppercase bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Scikit-learn Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure preprocessing, evaluate cluster metrics (Elbow & Silhouette), and execute real-time K-Means segmentation.
          </p>
        </div>

        {activeDataset && (
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            Active Dataset: <strong className="text-slate-800">{activeDataset.name}</strong> ({activeDataset.row_count} rows)
          </div>
        )}
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => {
                  if (s.num <= 5 || runResult) setCurrentStep(s.num);
                }}
                className={`flex items-center space-x-2 text-xs font-semibold ${
                  currentStep === s.num
                    ? 'text-indigo-600'
                    : currentStep > s.num
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    currentStep === s.num
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : currentStep > s.num
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </span>
                <span>{s.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > s.num ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Select Dataset */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 1: Choose Dataset for Segmentation</h3>
            <p className="text-xs text-slate-500 mt-1">Select from previously ingested datasets or inspect dataset attributes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {datasets.map((d) => (
              <div
                key={d.id}
                onClick={() => handleDatasetSelect(d.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  String(selectedDatasetId) === String(d.id)
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{d.name}</h4>
                  {d.is_sample && (
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Sample Data
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-500 space-y-1">
                  <p>Records: <strong className="text-slate-700">{d.row_count} customers</strong> &bull; Columns: <strong className="text-slate-700">{d.col_count}</strong></p>
                  <p>Filename: <span className="font-mono">{d.original_filename}</span></p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs"
            >
              <span>Next: Configure Columns</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configure Columns */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 2: Feature Selection & Column Mapping</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select numerical features to include in K-Means clustering. Identifiers (names, IDs, emails) are excluded to prevent bias.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Available Columns in Dataset (Click to toggle feature)
            </span>
            <div className="flex flex-wrap gap-2">
              {availableColumns.map((col) => {
                const isSelected = selectedFeatures.includes(col);
                const isId = /id|name|email/i.test(col);
                return (
                  <button
                    key={col}
                    onClick={() => toggleFeature(col)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : isId
                        ? 'bg-slate-100 text-slate-400 border-slate-200'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>{col}</span>
                    {isSelected && <span className="text-indigo-200 text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />
            <span>Currently selected <strong>{selectedFeatures.length}</strong> active features: <strong>{selectedFeatures.join(', ')}</strong></span>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs"
            >
              <span>Next: Data Preprocessing</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Data Preprocessing */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 3: Data Cleaning & Feature Scaling</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select mathematical transformation rules for missing value handling and standardization before distance calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Missing Value Strategy */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Missing Values Imputation Strategy
              </label>
              <div className="space-y-2">
                {[
                  { id: 'mean', title: 'Mean Imputation (Recommended)', desc: 'Replaces null numerical values with column arithmetic mean.' },
                  { id: 'median', title: 'Median Imputation', desc: 'Replaces null values with median; robust against outliers.' },
                  { id: 'drop', title: 'Drop Incomplete Records', desc: 'Discards rows containing missing values in active features.' }
                ].map((opt) => (
                  <label key={opt.id} className="flex items-start space-x-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="missing"
                      value={opt.id}
                      checked={missingStrategy === opt.id}
                      onChange={() => setMissingStrategy(opt.id as any)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{opt.title}</span>
                      <span className="text-[11px] text-slate-500">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Feature Scaler */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Feature Scaling (Standardization)
              </label>
              <div className="space-y-2">
                {[
                  { id: 'standard', title: 'StandardScaler (z = (x - μ) / σ)', desc: 'Standardizes features to zero mean and unit variance. Ideal for K-Means Euclidean distance.' },
                  { id: 'minmax', title: 'MinMaxScaler ([0, 1] range)', desc: 'Normalizes features to fixed [0, 1] interval preserving relative zero.' },
                  { id: 'robust', title: 'RobustScaler (IQR based)', desc: 'Scales features using median and interquartile range; resistant to extreme outliers.' }
                ].map((opt) => (
                  <label key={opt.id} className="flex items-start space-x-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="scaler"
                      value={opt.id}
                      checked={scalerType === opt.id}
                      onChange={() => setScalerType(opt.id as any)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{opt.title}</span>
                      <span className="text-[11px] text-slate-500">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs"
            >
              <span>Next: Algorithm & Tuning</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Algorithm & Tuning */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 4: K-Means Hyperparameters & Elbow Evaluation</h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure the cluster count (k) or run automated Elbow-method & Silhouette score evaluation to determine optimal partitioning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cluster Slider & Seed */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-800">Cluster Count (k):</label>
                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    k = {nClusters}
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={nClusters}
                  onChange={(e) => setNClusters(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>2 clusters</span>
                  <span>5 clusters</span>
                  <span>10 clusters</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Random State (Seed for Reproducibility):</label>
                <input
                  type="number"
                  value={randomState}
                  onChange={(e) => setRandomState(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ensures deterministic cluster centers and reproducible assignments.
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCalculateElbow}
                  disabled={loadingElbow}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs disabled:opacity-60"
                >
                  <BarChart2 size={15} />
                  <span>{loadingElbow ? 'Calculating Elbow & Silhouette Curve...' : 'Compute Elbow & Silhouette Curve'}</span>
                </button>
              </div>
            </div>

            {/* Elbow Method Chart */}
            <div className="p-4 border border-slate-200 rounded-xl flex flex-col">
              <h4 className="text-xs font-bold text-slate-800 mb-1">Elbow Evaluation (WCSS vs. k)</h4>
              <p className="text-[11px] text-slate-400 mb-2">Within-Cluster Sum of Squares (Inertia) curve</p>

              <div className="flex-1 min-h-[200px] flex items-center justify-center">
                {elbowData?.points ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={elbowData.points} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="k" label={{ value: 'Clusters (k)', position: 'insideBottom', offset: -5, fontSize: 10 }} tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="wcss" name="WCSS" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center">
                    Click "Compute Elbow & Silhouette Curve" to visualize WCSS across k=2 to k=8.
                  </p>
                )}
              </div>

              {elbowData?.recommended_k && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 text-center font-medium">
                  Recommended k = {elbowData.recommended_k} (highest silhouette score: {elbowData.points.find((p: any) => p.k === elbowData.recommended_k)?.silhouette})
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs"
            >
              <span>Next: Execute Model</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Execute Model */}
      {currentStep === 5 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 5: Run K-Means Clustering</h3>
            <p className="text-xs text-slate-500 mt-1">Review the confirmed configuration before running the Python ML pipeline.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Target Dataset:</span>
              <span className="font-bold text-slate-900">{activeDataset?.name} ({activeDataset?.row_count} rows)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Clustering Features:</span>
              <span className="font-bold text-indigo-700">{selectedFeatures.join(', ')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Number of Clusters (k):</span>
              <span className="font-bold text-slate-900">{nClusters}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Scaling Technique:</span>
              <span className="font-bold text-slate-900 uppercase">{scalerType}Scaler</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Missing Strategy:</span>
              <span className="font-bold text-slate-900 uppercase">{missingStrategy}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Reproducibility Seed:</span>
              <span className="font-mono text-slate-700">{randomState}</span>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleExecuteSegmentation}
              disabled={runningModel}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center space-x-2 disabled:opacity-60 transition-all"
            >
              <Play size={16} fill="white" />
              <span>{runningModel ? 'Executing Machine Learning Pipeline...' : 'Run Segmentation Now'}</span>
            </button>
          </div>

          <div className="flex justify-start pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Visual Analytics (PCA & Metrics) */}
      {currentStep === 6 && runResult && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 6: Cluster Visualization & Evaluation Metrics</h3>
                <p className="text-xs text-slate-500 mt-0.5">Results computed from real dataset values via Python FastAPI service.</p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600">Silhouette Score:</span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-mono font-bold text-xs">
                  {runResult.silhouette_score}
                </span>
              </div>
            </div>

            {/* Evaluation Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold">Silhouette Score</span>
                <span className="text-xl font-bold text-slate-900 block mt-1">{runResult.silhouette_score}</span>
                <span className="text-[11px] text-emerald-600 mt-1 block">Higher indicates distinct boundaries</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold">Davies-Bouldin Index</span>
                <span className="text-xl font-bold text-slate-900 block mt-1">{runResult.davies_bouldin_index}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Lower indicates tighter cluster cohesion</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold">Calinski-Harabasz Score</span>
                <span className="text-xl font-bold text-slate-900 block mt-1">{runResult.calinski_harabasz_score}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Variance ratio criterion</span>
              </div>
            </div>

            {/* 2D PCA Scatter Plot */}
            <div className="p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800">2D PCA Dimensionality Projection</h4>
                <span className="text-[11px] text-slate-400">PCA Variance Explained: {runResult.pca_explained_variance_ratio?.join(', ')}</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="pca_x" name="Principal Component 1" tick={{ fontSize: 10 }} />
                    <YAxis type="number" dataKey="pca_y" name="Principal Component 2" tick={{ fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Customers" data={runResult.assignments} fill="#4f46e5" shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(5)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
              >
                <ArrowLeft size={14} />
                <span>Rerun</span>
              </button>
              <button
                onClick={() => setCurrentStep(7)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs"
              >
                <span>Next: Segment Profiles & Rules</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 7: Profiles & Decision Tree Rules */}
      {currentStep === 7 && runResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 7: Interpretable Profiles & Decision Tree Partition Rules</h3>
            <p className="text-xs text-slate-500 mt-1">
              Data-backed segment profiles derived from cluster centroids, along with white-box decision tree classification rules.
            </p>
          </div>

          {/* Segment Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {runResult.profiles?.map((p: any) => (
              <div key={p.segment_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {p.count} customers ({p.percentage}%)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Feature Averages:</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    {Object.entries(p.feature_means || {}).map(([feat, val]: [string, any]) => (
                      <span key={feat}><strong>{feat}:</strong> {val}</span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/70">
                  <strong className="block mb-0.5">Recommended Marketing Strategy:</strong>
                  <span>{p.recommended_strategy}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Decision Tree White-Box Rules */}
          {runResult.decision_tree_rules && runResult.decision_tree_rules.length > 0 && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Decision Tree Classification Rules (White-Box Logic)
                </span>
                <span className="text-[11px] font-mono text-slate-400">Scikit-learn DecisionTreeClassifier</span>
              </div>
              <pre className="text-xs font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto text-emerald-400 leading-relaxed">
                {runResult.decision_tree_rules.join('\n')}
              </pre>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(6)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setCurrentStep(8)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs"
            >
              <span>Next: Export Results</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 8: Export */}
      {currentStep === 8 && runResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center max-w-2xl mx-auto space-y-6">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Segmentation Successfully Completed!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your customer records have been assigned to clusters, evaluated with statistical metrics, and saved in the relational database.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Run ID:</span>
              <span className="font-mono font-bold text-slate-900">#{createdRunId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Customers Partitioned:</span>
              <span className="font-bold text-slate-900">{runResult.assignments?.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Silhouette Score:</span>
              <span className="font-bold text-emerald-600">{runResult.silhouette_score}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownloadAssignments}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 shadow-xs transition-colors"
            >
              <Download size={15} />
              <span>Download Customer Assignments CSV</span>
            </button>
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Start New Run
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentationStudioPage;
