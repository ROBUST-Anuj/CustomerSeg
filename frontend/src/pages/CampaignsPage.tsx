import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Mail,
  MessageSquare,
  Users,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Eye
} from 'lucide-react';
import api from '../services/api';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [segmentId, setSegmentId] = useState<string>('all');
  const [channel, setChannel] = useState<'email' | 'sms' | 'push'>('email');
  const [subject, setSubject] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [calculatingAudience, setCalculatingAudience] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data.campaigns || []);
    } catch (err: any) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Dynamically calculate eligible audience count
  const calculateAudience = async (segId: string) => {
    setCalculatingAudience(true);
    try {
      const res = await api.post('/campaigns/calculate-audience', {
        segment_id: segId
      });
      setAudienceCount(res.data.audienceCount || 0);
    } catch (err) {
      console.error('Failed to calculate audience', err);
    } finally {
      setCalculatingAudience(false);
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      calculateAudience(segmentId);
    }
  }, [segmentId, showCreateModal]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !messageTemplate) {
      alert('Campaign name and message template are required.');
      return;
    }

    try {
      await api.post('/campaigns', {
        name,
        objective,
        segment_id: segmentId === 'all' ? null : parseInt(segmentId, 10),
        segment_name: segmentId === 'all' ? 'All Segments' : `Segment ${parseInt(segmentId, 10) + 1}`,
        channel,
        subject,
        message_template: messageTemplate
      });

      setSuccessMsg('Campaign draft successfully created and registered in the workspace.');
      setShowCreateModal(false);
      resetForm();
      fetchCampaigns();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign draft?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchCampaigns();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const resetForm = () => {
    setName('');
    setObjective('');
    setSegmentId('all');
    setChannel('email');
    setSubject('');
    setMessageTemplate('');
  };

  const renderPersonalizedPreview = (template: string) => {
    return template
      .replace(/{{CustomerName}}/g, 'Aarav Sharma')
      .replace(/{{CustomerID}}/g, 'CUST-1001')
      .replace(/{{SegmentName}}/g, 'Affluent High-Spenders');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Campaign Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Design targeted marketing campaigns using validated customer segments and live audience sizing.
          </p>
        </div>

        <button
          onClick={() => { setShowCreateModal(true); setMessageTemplate('Dear {{CustomerName}},\n\nBased on your active customer tier with us, we are excited to extend an exclusive personalized promotion...'); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
        >
          <Plus size={15} />
          <span>New Campaign Draft</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Campaign Name & Objective</th>
                <th className="py-3 px-4">Target Segment</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Eligible Audience</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading campaign drafts...</td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No marketing campaigns drafted yet. Click "New Campaign Draft" to connect segment insights with marketing actions.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.objective || 'No objective specified'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {c.segment_name || 'All Segments'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 capitalize font-medium text-slate-700">
                        {c.channel === 'email' ? <Mail size={13} className="text-indigo-500" /> : <MessageSquare size={13} className="text-emerald-500" />}
                        <span>{c.channel}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {c.audience_count} customers
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteCampaign(c.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                        title="Delete draft"
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

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Create Campaign Draft</h3>
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Draft Mode (No live sends triggered)
              </span>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Campaign Name:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Autumn VIP Concierge Drop"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Objective:</label>
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="e.g. Drive luxury catalog pre-orders"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Customer Segment:</label>
                  <select
                    value={segmentId}
                    onChange={(e) => setSegmentId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="all">All Segments (Entire Customer Base)</option>
                    <option value="0">Segment 1</option>
                    <option value="1">Segment 2</option>
                    <option value="2">Segment 3</option>
                    <option value="3">Segment 4</option>
                    <option value="4">Segment 5</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Channel:</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="email">Email Campaign</option>
                    <option value="sms">SMS Text Alert</option>
                    <option value="push">Mobile Push Notification</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Audience Counter */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-900 font-semibold">
                  <Users size={16} className="text-indigo-600" />
                  <span>Calculated Eligible Audience Reach:</span>
                </div>
                <span className="font-bold text-sm text-indigo-700">
                  {calculatingAudience ? 'Calculating...' : `${audienceCount} customers`}
                </span>
              </div>

              {channel === 'email' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Subject Line:</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Exclusive Invitation: Your Curated Autumn Edit"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Message Template:</label>
                  <span className="text-[11px] text-slate-400">Placeholders: &#123;&#123;CustomerName&#125;&#125;, &#123;&#123;SegmentName&#125;&#125;</span>
                </div>
                <textarea
                  rows={4}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              {/* Dynamic Preview */}
              {messageTemplate && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider">
                    Personalization Preview (Sample Customer: Aarav Sharma)
                  </span>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap bg-white p-2.5 rounded border border-slate-200">
                    {renderPersonalizedPreview(messageTemplate)}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Campaign Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
