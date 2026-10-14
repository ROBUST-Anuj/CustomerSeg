import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/datasets');
      setDatasets(res.data.datasets || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a CSV file to upload.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    if (customName) formData.append('name', customName);

    try {
      await api.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('Dataset successfully uploaded, validated, and ingested into database!');
      setShowUploadModal(false);
      setFile(null);
      setCustomName('');
      fetchDatasets();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = async () => {
    setLoadingSample(true);
    setErrorMsg(null);
    try {
      await api.post('/datasets/load-sample');
      setSuccessMsg('Sample benchmark dataset successfully loaded!');
      fetchDatasets();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete dataset "${name}"? Dependent customers and segmentation runs will also be deleted.`)) {
      return;
    }

    try {
      await api.delete(`/datasets/${id}`);
      setSuccessMsg(`Dataset "${name}" deleted successfully.`);
      fetchDatasets();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Datasets Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest, audit, and manage customer CSV datasets for segmentation pipelines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleLoadSample}
            disabled={loadingSample}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles size={14} />
            <span>{loadingSample ? 'Loading Benchmark...' : 'Load Sample Benchmark Data'}</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus size={15} />
            <span>Upload New CSV</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Datasets Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Dataset Name</th>
                <th className="py-3 px-4">Original File</th>
                <th className="py-3 px-4">Row Count</th>
                <th className="py-3 px-4">Columns</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Ingested At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading datasets...</td>
                </tr>
              ) : datasets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No datasets found. Upload a CSV file to get started.</td>
                </tr>
              ) : (
                datasets.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span>{d.name}</span>
                        {d.is_sample && (
                          <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                            Sample
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{d.original_filename}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.row_count.toLocaleString()} rows</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="truncate max-w-xs" title={d.columns?.join(', ')}>
                        {d.columns?.join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ready
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to="/segmentation"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        <span>Segment</span>
                        <ArrowRight size={12} />
                      </Link>
                      <button
                        onClick={() => handleDelete(d.id, d.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                        title="Delete dataset"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowUploadModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Upload Customer CSV Dataset</h3>
            <p className="text-xs text-slate-500">
              Provide a comma-separated values file (.csv). Minimum 2 columns (e.g. CustomerID, AnnualIncome, SpendingScore). Maximum file size: 15MB.
            </p>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Dataset Name (Optional):</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Q3 Customer Behavioral Cohort"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">CSV File:</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-60 flex items-center space-x-1"
                >
                  <span>{uploading ? 'Ingesting...' : 'Upload & Process'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetsPage;
