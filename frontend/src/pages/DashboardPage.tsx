import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Layers,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  Info,
  Filter,
  RefreshCw,
  BrainCircuit,
  ArrowRight,
  Database
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import api from '../services/api';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | string>('');
  const [summary, setSummary] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = async () => {
    try {
      const res = await api.get('/datasets');
      setDatasets(res.data.datasets || []);
      if (res.data.datasets?.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(res.data.datasets[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch datasets', err);
    }
  };

  const loadDashboardData = async (datasetId?: number | string) => {
    setLoading(true);
    setError(null);
    try {
      const params = datasetId ? { dataset_id: datasetId } : {};
      const [sumRes, chartRes] = await Promise.all([
        api.get('/dashboard/summary', { params }),
        api.get('/dashboard/charts', { params }),
      ]);
      setSummary(sumRes.data);
      setCharts(chartRes.data);
      if (sumRes.data.activeDatasetId && !selectedDatasetId) {
        setSelectedDatasetId(sumRes.data.activeDatasetId);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId !== undefined) {
      loadDashboardData(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDatasetId(e.target.value);
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">Calculating dataset metrics & cluster analytics...</p>
      </div>
    );
  }

  // Empty state if no customers in system
  if (!summary || summary.totalCustomers === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-4">
          <Database size={28} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Datasets Uploaded Yet</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Upload a customer CSV dataset or load the built-in benchmark dataset to unlock real-time segmentation and visual analytics.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/segmentation"
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <span>Launch Segmentation Studio</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            to="/datasets"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Manage Datasets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls: Dataset selector & Refresh */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Overview Dashboard</h2>
            {summary.isSample && (
              <span className="text-[11px] font-semibold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                Sample Benchmark Data
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time quantitative metrics derived from: <strong className="text-slate-700">{summary.datasetName}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <Filter size={15} className="text-slate-400" />
            <select
              value={selectedDatasetId}
              onChange={handleDatasetChange}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.row_count} rows)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadDashboardData(selectedDatasetId)}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Customers</span>
            <Users size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.totalCustomers.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Verified records in dataset</p>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Customers</span>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.activeCustomers.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {((summary.activeCustomers / summary.totalCustomers) * 100).toFixed(1)}% activity rate
          </p>
        </div>

        {/* Number of Segments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Segments</span>
            <Layers size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.numberOfSegments}</p>
          <p className="text-[11px] text-indigo-600 font-medium mt-1">K-Means Partitions</p>
        </div>

        {/* High-Value Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">High-Value Cohort</span>
            <TrendingUp size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.highValueCustomers.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {((summary.highValueCustomers / summary.totalCustomers) * 100).toFixed(1)}% of total
          </p>
        </div>

        {/* At-Risk Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">At-Risk Cohort</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.atRiskCustomers.toLocaleString()}</p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">
            Dormant or Low Engagement
          </p>
        </div>

        {/* Average Customer Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Customer Value</span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {summary.avgCustomerValue !== null ? `$${summary.avgCustomerValue.toLocaleString()}` : 'N/A'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.avgCustomerValue !== null ? 'Cumulative spend' : 'Dataset lacks spend col'}
          </p>
        </div>
      </div>

      {/* Row 1 Charts: Segment Distribution & Revenue by Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Distribution by Segment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer Distribution by Segment</h3>
              <p className="text-xs text-slate-500">Proportion of customer records assigned to each cluster</p>
            </div>
            <Link to="/segmentation" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1">
              <span>Studio</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="h-72 w-full">
            {charts?.segmentDistribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.segmentDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ name, percentage }) => `${percentage}%`}
                  >
                    {charts.segmentDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} customers`, 'Count']} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Run segmentation to view distribution
              </div>
            )}
          </div>
        </div>

        {/* Revenue Contribution by Segment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Segment Spending & Revenue Contribution</h3>
              <p className="text-xs text-slate-500">Cumulative total spend generated per customer segment</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {charts?.revenueBySegment?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.revenueBySegment} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip formatter={(val: any) => [`$${val.toLocaleString()}`, 'Total Spend']} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Revenue metrics not supported by current dataset
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Segment Comparison & 2D PCA Cluster Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Comparison Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Multi-Feature Segment Comparison</h3>
              <p className="text-xs text-slate-500">Average Annual Income vs. Spending Index across segments</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {charts?.segmentComparison?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.segmentComparison} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="segment" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="avgIncome" name="Avg Income ($k)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgSpendingScore" name="Avg Spending Score (1-100)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Segment averages unavailable
              </div>
            )}
          </div>
        </div>

        {/* 2D PCA Cluster Projection Scatter */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">2D PCA Cluster Projection</h3>
              <p className="text-xs text-slate-500">Principal Component Analysis projection of high-dimensional feature space</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Dim 1 vs Dim 2</span>
          </div>

          <div className="h-72 w-full">
            {charts?.pcaScatter?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" name="PCA 1" tick={{ fontSize: 10 }} />
                  <YAxis type="number" dataKey="y" name="PCA 2" tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val, name) => [val, name]} />
                  <Scatter name="Customers" data={charts.pcaScatter} fill="#4f46e5" shape="circle" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Run clustering in Segmentation Studio to generate PCA projection
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Purchasing Frequency & Spending Brackets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Frequency Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Purchase Frequency Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Histogram of customer order cadence</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.frequencyDistribution || []} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Customers" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Brackets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Customer Value & Spending Tiers</h3>
          <p className="text-xs text-slate-500 mb-4">Customer population grouped into spend brackets</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.spendingDistribution || []} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="customers" name="Customers" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
