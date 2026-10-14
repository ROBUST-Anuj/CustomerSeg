import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowUpDown,
  X,
  CreditCard,
  Mail,
  Calendar,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Customer inspection drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: {
          search,
          segment_id: segmentFilter,
          gender: genderFilter,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          limit
        }
      });
      setCustomers(res.data.customers || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCount(res.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, segmentFilter, genderFilter, sortBy, sortOrder, page, limit]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const openCustomerDetail = async (id: number) => {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomerDetail(res.data);
    } catch (err) {
      console.error('Failed to get customer detail', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('customerseg_token') || sessionStorage.getItem('customerseg_token');
    const url = `/api/v1/customers/export?segment_id=${segmentFilter}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    // Trigger download via direct fetch with Authorization
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `customers_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customer Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View, search, filter, and inspect assigned customer profiles ({totalCount.toLocaleString()} total)
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <Download size={15} />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by ID, name, or email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Segment filter */}
          <select
            value={segmentFilter}
            onChange={(e) => { setSegmentFilter(e.target.value); setPage(1); }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Segments</option>
            <option value="0">Segment 1</option>
            <option value="1">Segment 2</option>
            <option value="2">Segment 3</option>
            <option value="3">Segment 4</option>
            <option value="4">Segment 5</option>
          </select>

          {/* Gender filter */}
          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Genders</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>

          {/* Page size */}
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th onClick={() => handleSort('customer_id_code')} className="py-3 px-4 cursor-pointer hover:text-slate-800">
                  <div className="flex items-center space-x-1">
                    <span>Customer ID</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('name')} className="py-3 px-4 cursor-pointer hover:text-slate-800">
                  <div className="flex items-center space-x-1">
                    <span>Customer Name</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('age')} className="py-3 px-4 cursor-pointer hover:text-slate-800">
                  <div className="flex items-center space-x-1">
                    <span>Age / Gender</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('annual_income')} className="py-3 px-4 cursor-pointer hover:text-slate-800">
                  <div className="flex items-center space-x-1">
                    <span>Annual Income</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('spending_score')} className="py-3 px-4 cursor-pointer hover:text-slate-800">
                  <div className="flex items-center space-x-1">
                    <span>Spend Score</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th onClick={() => handleSort('total_spend')} className="py-3 px-4 cursor-pointer hover:text-slate-800">
                  <div className="flex items-center space-x-1">
                    <span>Total Spend</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3 px-4">Assigned Segment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No customers match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{c.customer_id_code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{c.name || 'Unnamed Customer'}</div>
                      {c.email && <div className="text-[11px] text-slate-400">{c.email}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.age ? `${c.age} yrs` : 'N/A'}{c.gender ? ` • ${c.gender}` : ''}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {c.annual_income !== null ? `$${c.annual_income}k` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.spending_score >= 70 ? 'bg-emerald-50 text-emerald-700' :
                        c.spending_score <= 35 ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.spending_score !== null ? `${c.spending_score} / 100` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {c.total_spend !== null ? `$${c.total_spend.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {c.segment_name ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {c.segment_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openCustomerDetail(c.id)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-700">{customers.length}</strong> of <strong className="text-slate-700">{totalCount}</strong> results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1.5 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Inspection Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={() => setSelectedCustomerId(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {customerDetail?.customer?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{customerDetail?.customer?.name || 'Customer Details'}</h3>
                  <p className="text-xs font-mono text-slate-500">{customerDetail?.customer?.customer_id_code}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomerId(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {loadingDetail ? (
                <div className="text-center py-12 text-slate-400">Loading profile data...</div>
              ) : customerDetail?.customer ? (
                <>
                  {/* Segment Badge */}
                  {customerDetail.assignments?.length > 0 && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                      <div className="flex items-center space-x-1.5 text-xs text-indigo-700 font-bold uppercase tracking-wider">
                        <Sparkles size={14} />
                        <span>Active Segment Assignment</span>
                      </div>
                      <p className="font-bold text-slate-900 text-base mt-1">
                        {customerDetail.assignments[0].segment_name}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Distance to centroid: <strong>{customerDetail.assignments[0].distance_to_center}</strong> (PCA: x={customerDetail.assignments[0].pca_x}, y={customerDetail.assignments[0].pca_y})
                      </p>
                    </div>
                  )}

                  {/* Attributes */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Attributes</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block">Annual Income</span>
                        <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                          ${customerDetail.customer.annual_income}k
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block">Spending Score</span>
                        <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                          {customerDetail.customer.spending_score} / 100
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block">Total Spend</span>
                        <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                          ${customerDetail.customer.total_spend || 0}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block">Orders / Frequency</span>
                        <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                          {customerDetail.customer.purchase_frequency || 0} purchases
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Demographics */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demographics</h4>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-medium text-slate-900">{customerDetail.customer.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gender:</span>
                        <span className="font-medium text-slate-900">{customerDetail.customer.gender || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Age:</span>
                        <span className="font-medium text-slate-900">{customerDetail.customer.age || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recency (Days):</span>
                        <span className="font-medium text-slate-900">{customerDetail.customer.recency_days !== null ? `${customerDetail.customer.recency_days} days` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
