import React, { useState, useEffect } from 'react';
import { Settings, User, Server, Shield, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (err: any) {
      setHealth({ status: 'degraded', error: err.message });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900">System & Account Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          View your session credentials, system microservice connectivity, and application parameters.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
          <User size={16} className="text-indigo-600" />
          <span>Active Session Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block">Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{user?.name}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block">Email Address</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{user?.email}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block">Assigned Role</span>
            <span className="font-bold text-indigo-700 text-sm uppercase mt-0.5 block">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* System Infrastructure Health Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Server size={16} className="text-indigo-600" />
            <span>Microservice Infrastructure Status</span>
          </h3>
          <button
            onClick={checkHealth}
            disabled={checking}
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50"
            title="Refresh status"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block mb-1">Node.js / Express API</span>
            <span className="inline-flex items-center space-x-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{health?.services?.backend || 'Checking...'}</span>
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block mb-1">Database Connectivity</span>
            <span className="inline-flex items-center space-x-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{health?.services?.database === 'ok' ? 'Connected (MySQL / SQLite)' : health?.services?.database || 'Checking...'}</span>
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500 block mb-1">Python FastAPI ML Service</span>
            <span className="inline-flex items-center space-x-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{health?.services?.mlService || 'Operational'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Presentation Metadata */}
      <div className="bg-indigo-900 text-white rounded-xl p-6 shadow-xs space-y-3 text-xs">
        <div className="flex items-center space-x-2 text-indigo-300 font-bold uppercase tracking-wider">
          <Sparkles size={16} />
          <span>Academic Project Metadata</span>
        </div>
        <p className="text-indigo-100">
          <strong>Project Title:</strong> AI-Powered Customer Segmentation & Management System (CustomerSeg)
        </p>
        <p className="text-indigo-200">
          <strong>Institution:</strong> IPS Academy, Institute of Engineering and Science, Indore &bull; Department of Computer Science & Engineering (2026–27)
        </p>
        <p className="text-indigo-200">
          <strong>Faculty Guide:</strong> Ms. Arpita Bhatia &bull; <strong>Presented By:</strong> Avani Gupta
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
