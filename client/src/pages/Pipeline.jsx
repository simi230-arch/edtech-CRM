import React, { useState, useEffect } from 'react';
import { CollegesAPI } from '../services/api';
import { 
  GitFork, 
  Layers, 
  List, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  PhoneCall, 
  Building2, 
  Plus, 
  ArrowRightLeft, 
  ShieldAlert, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StageBadge, PriorityBadge } from '../components/Badges';
import { Modal } from '../components/Modal';

export function Pipeline({ onSelectCollege }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  // Stage change modal state
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [targetStage, setTargetStage] = useState('');
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stageNotes, setStageNotes] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [wonAgreementDate, setWonAgreementDate] = useState(new Date().toISOString().split('T')[0]);
  const [wonPricing, setWonPricing] = useState(4500);
  const [wonStudentCount, setWonStudentCount] = useState(60);
  const [stageLoading, setStageLoading] = useState(false);

  const PIPELINE_STAGES = [
    { name: 'New Lead', color: 'border-slate-700 bg-slate-900/60' },
    { name: 'Contact Identified', color: 'border-sky-500/30 bg-sky-950/10' },
    { name: 'First Call Attempted', color: 'border-indigo-500/30 bg-indigo-950/10' },
    { name: 'Connected', color: 'border-cyan-500/30 bg-cyan-950/10' },
    { name: 'Interested', color: 'border-blue-500/30 bg-blue-950/10' },
    { name: 'Meeting Scheduled', color: 'border-purple-500/30 bg-purple-950/10' },
    { name: 'Demo Completed', color: 'border-violet-500/30 bg-violet-950/10' },
    { name: 'Proposal Sent', color: 'border-amber-500/30 bg-amber-950/10' },
    { name: 'Negotiation', color: 'border-fuchsia-500/30 bg-fuchsia-950/10' },
    { name: 'Won', color: 'border-emerald-500/30 bg-emerald-950/10' },
    { name: 'Lost', color: 'border-rose-500/30 bg-rose-950/10' },
    { name: 'Follow-up Later', color: 'border-yellow-500/30 bg-yellow-950/10' }
  ];

  const fetchPipelineColleges = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch all active colleges up to limit 100 for pipeline view
      const res = await CollegesAPI.list({ limit: 100, archived: '0' });
      setColleges(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineColleges();
  }, []);

  const handleOpenMoveStage = (college, newStage, e) => {
    if (e) e.stopPropagation();
    setSelectedCollege(college);
    setTargetStage(newStage);
    setStageNotes('');
    setLostReason('');
    if (newStage === 'Won') {
      setWonPricing(college.estimated_students ? (college.estimated_students * 4500) : 4500);
      setWonStudentCount(college.estimated_students || 60);
    }
    setIsStageModalOpen(true);
  };

  const handleConfirmStageChange = async (e) => {
    e.preventDefault();
    if (!selectedCollege || !targetStage) return;

    try {
      setStageLoading(true);
      await CollegesAPI.updateStage(selectedCollege.id, {
        status: targetStage,
        notes: stageNotes,
        lost_reason: targetStage === 'Lost' ? lostReason : null,
        won_agreement_date: targetStage === 'Won' ? wonAgreementDate : null,
        won_pricing: targetStage === 'Won' ? wonPricing : null,
        won_student_count: targetStage === 'Won' ? wonStudentCount : null
      });
      setIsStageModalOpen(false);
      setSelectedCollege(null);
      fetchPipelineColleges();
    } catch (err) {
      alert('Failed to change stage: ' + err.message);
    } finally {
      setStageLoading(false);
    }
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>BTech College Sales Pipeline</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
              12 Stages
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Progressive deal progression from cold identification to signed campus cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700/80 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Stage Table</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          Loading pipeline board...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-rose-400">{error}</div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board Horizontal Scrolling View */
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none">
          {PIPELINE_STAGES.map((stageObj, idx) => {
            const stageColleges = colleges.filter(c => c.status === stageObj.name);
            const totalStudents = stageColleges.reduce((acc, curr) => acc + (curr.estimated_students || 0), 0);

            return (
              <div 
                key={stageObj.name}
                className={`w-80 shrink-0 rounded-2xl border ${stageObj.color} flex flex-col max-h-[78vh] shadow-sm`}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/80 rounded-t-2xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                        {idx + 1}
                      </span>
                      {stageObj.name}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400">
                      {stageColleges.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Est. Students: <strong className="text-slate-200">{totalStudents}</strong></span>
                    {stageObj.name === 'Won' && (
                      <span className="text-emerald-400 font-bold font-mono">
                        {formatINR(stageColleges.reduce((a, b) => a + ((b.won_pricing || 0) * (b.won_student_count || 0)), 0))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Column Cards Container */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageColleges.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                      No colleges currently in this stage
                    </div>
                  ) : (
                    stageColleges.map((col) => (
                      <div
                        key={col.id}
                        onClick={() => onSelectCollege && onSelectCollege(col.id)}
                        className="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition-all shadow-sm group space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug">
                            {col.name}
                          </h4>
                          <PriorityBadge priority={col.priority} />
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {col.city}, {col.state}
                          </span>
                          <span className="font-mono text-slate-300">
                            {col.estimated_students ? `${col.estimated_students} stds` : 'Est: 0'}
                          </span>
                        </div>

                        {col.placement_contact_name && (
                          <div className="text-[11px] text-slate-300 pt-1.5 border-t border-slate-800/60">
                            <span className="font-medium text-white">{col.placement_contact_name}</span>
                            <span className="text-slate-500 block text-[10px]">{col.placement_contact_designation || 'TPO'}</span>
                          </div>
                        )}

                        {/* Move Stage Quick Picker */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-slate-500 font-medium">Move to:</span>
                          <select
                            value={col.status}
                            onChange={(e) => handleOpenMoveStage(col, e.target.value, e)}
                            className="bg-slate-800 text-[10px] text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500"
                          >
                            {PIPELINE_STAGES.map(s => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table Mode */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-3">City, State</th>
                <th className="py-3 px-3">Current Pipeline Stage</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Estimated Students</th>
                <th className="py-3 px-4 text-right">Transition Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {colleges.map((col) => (
                <tr 
                  key={col.id}
                  onClick={() => onSelectCollege && onSelectCollege(col.id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {col.name}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">
                    {col.city}, {col.state}
                  </td>
                  <td className="py-3.5 px-3">
                    <StageBadge stage={col.status} />
                  </td>
                  <td className="py-3.5 px-3">
                    <PriorityBadge priority={col.priority} />
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-300">
                    {col.estimated_students || 0}
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={col.status}
                      onChange={(e) => handleOpenMoveStage(col, e.target.value, e)}
                      className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stage Transition Modal */}
      {selectedCollege && (
        <Modal
          isOpen={isStageModalOpen}
          onClose={() => setIsStageModalOpen(false)}
          title={`Move "${selectedCollege.name}" to ${targetStage}`}
          subtitle="Enforces data integrity: Won contracts require financials; Lost deals require reasons"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmStageChange} className="space-y-4 text-xs">
            {targetStage === 'Lost' && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                <label className="block font-bold text-white">Reason Lead Was Lost *</label>
                <textarea
                  required
                  rows="3"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="e.g. Budget constraints, existing university syllabus clash, tender restrictions..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            {targetStage === 'Won' && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
                <p className="font-bold text-white">Confirmed Partnership Agreement Details</p>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Agreement Date *</label>
                  <input
                    type="date"
                    required
                    value={wonAgreementDate}
                    onChange={(e) => setWonAgreementDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Agreed Price / Student (₹) *</label>
                    <input
                      type="number"
                      required
                      value={wonPricing}
                      onChange={(e) => setWonPricing(e.target.value)}
                      placeholder="4500"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Expected Student Count *</label>
                    <input
                      type="number"
                      required
                      value={wonStudentCount}
                      onChange={(e) => setWonStudentCount(e.target.value)}
                      placeholder="60"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-medium mb-1">Stage Change Note (Optional)</label>
              <textarea
                rows="2"
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder="Reason or context for moving stage..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsStageModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={stageLoading}
                className="px-5 py-2 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {stageLoading ? 'Updating Stage...' : 'Update Stage'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
