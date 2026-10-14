import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">403 — Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2">
          Your current account role does not have authorization to view this administrative or analytical resource.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
          >
            <ArrowLeft size={15} />
            <span>Back to Safety</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
