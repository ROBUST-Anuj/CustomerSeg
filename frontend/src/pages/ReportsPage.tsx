import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Database,
  BarChart2,
  Printer
} from 'lucide-react';
import api from '../services/api';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/summary');
      setReport(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleDownloadCsv = () => {
    const token = localStorage.getItem('customerseg_token') || sessionStorage.getItem('customerseg_token');
    const url = '/api/v1/reports/export-csv';
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `executive_segment_report_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Compiling executive intelligence report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl text-xs">
        {error || 'No active dataset or segmentation report available.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Executive Segmentation Report</h2>
            <span className="text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified Analysis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dataset: <strong className="text-slate-700">{report.dataset?.name}</strong> &bull; Generated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Download size={14} />
            <span>Export CSV Summary</span>
          </button>
        </div>
      </div>

      {/* Model Evaluation & Data Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Evaluation */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <BrainCircuit size={16} />
            <span>Clustering Architecture & Evaluation</span>
          </div>
          <div className="text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Algorithm:</span>
              <span className="font-bold text-slate-900 uppercase">{report.segmentationRun?.algorithm || 'K-Means'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Number of Clusters (k):</span>
              <span className="font-bold text-slate-900">{report.segmentationRun?.nClusters || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Silhouette Score:</span>
              <span className="font-bold text-emerald-600">{report.segmentationRun?.silhouetteScore || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Davies-Bouldin Index:</span>
              <span className="font-bold text-slate-900">{report.segmentationRun?.daviesBouldin || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Features Ingested:</span>
              <span className="font-semibold text-indigo-700">{report.segmentationRun?.features?.join(', ') || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Data Quality */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Dataset Integrity & Quality Audit</span>
          </div>
          <div className="text-xs space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Total Customer Records:</span>
              <span className="font-bold text-slate-900">{report.dataQuality?.totalRecords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Data Completeness Rate:</span>
              <span className="font-bold text-emerald-600">{report.dataQuality?.completenessRate}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Missing Income Entries:</span>
              <span className="font-medium text-slate-900">{report.dataQuality?.missingIncome} rows</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Missing Spending Indices:</span>
              <span className="font-medium text-slate-900">{report.dataQuality?.missingSpendingScore} rows</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Audit Status:</span>
              <span className="font-semibold text-emerald-700">Validated for Machine Learning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Segment Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Segment Population Breakdown & Quantitative Profiles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Segment Name</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Share</th>
                <th className="py-3 px-4">Feature Centroids</th>
                <th className="py-3 px-4">Strategic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.profiles?.map((p: any) => (
                <tr key={p.segment_id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{p.name}</span>
                    <span className="text-[11px] text-slate-500">{p.description}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.count} customers</td>
                  <td className="py-3 px-4 font-semibold text-indigo-600">{p.percentage}%</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {Object.entries(p.feature_means || {}).map(([f, val]) => `${f}: ${val}`).join(' | ')}
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs">{p.recommended_strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Observations Derived from Statistics */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
          <TrendingUp size={16} className="text-indigo-600" />
          <span>Objective Business Observations & Implications</span>
        </h3>
        <div className="space-y-3">
          {report.businessObservations?.map((obs: any, idx: number) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-indigo-900">{obs.topic}</span>
              <p className="text-slate-700">{obs.insight}</p>
              <p className="text-slate-500 text-[11px]"><strong>Strategic Implication:</strong> {obs.implication}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
