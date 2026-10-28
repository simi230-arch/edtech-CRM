import React, { useState, useEffect } from 'react';
import { ProposalsAPI, ExportImportAPI } from '../services/api';
import { 
  FileText, 
  Download, 
  Search, 
  CheckCircle2, 
  TrendingUp, 
  Building2, 
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Modal } from '../components/Modal';

export function Proposals({ onSelectCollege }) {
  const [proposals, setProposals] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const PROPOSAL_STATUSES = ['Draft', 'Sent', 'Under Review', 'Revised', 'Accepted', 'Rejected'];

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await ProposalsAPI.list(params);
      setProposals(res.items || []);
      setSummary(res.summary || {});
    } catch (err) {
      setError(err.message || 'Failed to fetch proposals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [statusFilter]);

  const handleUpdateStatus = async (proposalId, newStatus) => {
    try {
      await ProposalsAPI.update(proposalId, { status: newStatus });
      fetchProposals();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await ExportImportAPI.exportProposals();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposals_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Course Proposals & Deal Pipeline</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold">
              Commercial Offers
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track student pricing quotes, batch sizing, review statuses, and closed contract revenue.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm self-start sm:self-center"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Export Proposals CSV</span>
        </button>
      </div>

      {/* Financial Pipeline Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Proposals</span>
          <span className="text-2xl font-bold text-white font-mono">{summary.total_proposals || 0}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">Active Pipeline Value</span>
          <span className="text-xl font-bold text-cyan-400 font-mono">{formatINR(summary.active_deal_value)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 bg-emerald-950/10">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Accepted Won Contracts</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">{formatINR(summary.won_deal_value)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">Total Lifetime Quoted</span>
          <span className="text-xl font-bold text-indigo-400 font-mono">{formatINR(summary.total_pipeline_value)}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStatusFilter('All')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'All' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Statuses ({proposals.length})
        </button>
        {PROPOSAL_STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              statusFilter === st ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            Loading proposals...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : proposals.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No proposals found</p>
            <p className="text-xs text-slate-400 mt-1">Open a college dossier and submit your first course proposal.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Proposal & College</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Quoted Fee / Std</th>
                <th className="py-3 px-3 text-center">Students</th>
                <th className="py-3 px-3 text-right">Total Deal Value</th>
                <th className="py-3 px-3">Next Action</th>
                <th className="py-3 px-4 text-right">Quick Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {proposals.map((prop) => (
                <tr 
                  key={prop.id}
                  onClick={() => onSelectCollege && onSelectCollege(prop.college_id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-medium">
                    <div className="text-white font-semibold text-sm hover:text-indigo-400 transition-colors">
                      {prop.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {prop.college_name} ({prop.college_city}, {prop.college_state})
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-slate-300">
                    {prop.course_name || 'Custom Package'}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      prop.status === 'Accepted' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      prop.status === 'Sent' || prop.status === 'Under Review' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                      prop.status === 'Revised' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                      prop.status === 'Rejected' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                      'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {prop.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-200">
                    {formatINR(prop.quoted_price)}
                  </td>

                  <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                    {prop.expected_students}
                  </td>

                  <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                    {formatINR(prop.total_deal_value)}
                  </td>

                  <td className="py-3.5 px-3 text-slate-300 max-w-xs truncate">
                    {prop.next_action || '—'}
                  </td>

                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={prop.status}
                      onChange={(e) => handleUpdateStatus(prop.id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-[11px] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
                    >
                      {PROPOSAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
