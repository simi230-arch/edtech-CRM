import React, { useState, useEffect } from 'react';
import { FollowUpsAPI, ExportImportAPI } from '../services/api';
import { 
  CalendarCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Calendar, 
  PhoneCall, 
  Download, 
  Building2, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PriorityBadge, StageBadge } from '../components/Badges';
import { Modal } from '../components/Modal';

export function FollowUps({ onSelectCollege }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' (grouped) or 'completed'
  const [data, setData] = useState({ overdue: [], today: [], upcoming: [], completed: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reschedule Modal
  const [reschedulingTask, setReschedulingTask] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await FollowUpsAPI.list();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load follow-up tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleToggleComplete = async (task) => {
    try {
      await FollowUpsAPI.toggleComplete(task.id, !task.is_completed);
      fetchFollowUps();
    } catch (err) {
      alert('Failed to update task: ' + err.message);
    }
  };

  const handleOpenReschedule = (task) => {
    setReschedulingTask(task);
    setRescheduleDate(task.due_date);
    setRescheduleReason('');
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    try {
      setRescheduleLoading(true);
      await FollowUpsAPI.reschedule(reschedulingTask.id, {
        due_date: rescheduleDate,
        reason: rescheduleReason
      });
      setReschedulingTask(null);
      fetchFollowUps();
    } catch (err) {
      alert('Failed to reschedule task: ' + err.message);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await ExportImportAPI.exportFollowUps();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `follow_ups_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const renderTaskCard = (task, isOverdue = false, isDueToday = false) => (
    <div
      key={task.id}
      className={`p-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        task.is_completed
          ? 'bg-slate-900/40 border-slate-800 opacity-60'
          : isOverdue
          ? 'bg-rose-500/5 border-rose-500/40 shadow-sm'
          : isDueToday
          ? 'bg-amber-500/5 border-amber-500/40 shadow-sm'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => handleToggleComplete(task)}
          className={`mt-0.5 p-1 rounded-lg border transition-colors shrink-0 ${
            task.is_completed
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-600 hover:border-emerald-500 text-transparent hover:text-emerald-500'
          }`}
          title={task.is_completed ? 'Re-open task' : 'Mark task complete'}
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              onClick={() => onSelectCollege && onSelectCollege(task.college_id)}
              className="font-bold text-white text-sm hover:text-indigo-400 cursor-pointer transition-colors"
            >
              {task.college_name}
            </span>
            <span className="text-[11px] text-slate-400">({task.college_city}, {task.college_state})</span>
            <PriorityBadge priority={task.priority} />
            <StageBadge stage={task.college_status} size="xs" />
          </div>

          <p className="text-slate-200 font-medium text-xs">
            {task.title}
          </p>

          {task.description && (
            <p className="text-slate-400 text-[11px] whitespace-pre-line leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
            <span className="flex items-center gap-1 font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Due: {task.due_date ? task.due_date.replace('T', ' ').slice(0, 16) : ''}
            </span>

            {task.contact_person && (
              <span className="text-slate-400">
                Contact: <strong className="text-white">{task.contact_person}</strong>
              </span>
            )}

            {task.placement_contact_phone && (
              <a
                href={`tel:${task.placement_contact_phone}`}
                className="inline-flex items-center gap-1 text-emerald-400 hover:underline font-mono"
              >
                <PhoneCall className="w-3 h-3" />
                {task.placement_contact_phone}
              </a>
            )}

            {task.rescheduled_from && (
              <span className="text-amber-400/80 text-[10px]">
                (Rescheduled from {String(task.rescheduled_from).split('T')[0]})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {!task.is_completed && (
          <button
            onClick={() => handleOpenReschedule(task)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
          >
            Reschedule
          </button>
        )}
        <button
          onClick={() => onSelectCollege && onSelectCollege(task.college_id)}
          className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-semibold flex items-center gap-1"
          title="Open College Dossier"
        >
          <span>Dossier</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Follow-up & Task Management</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
              Action Hub
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Never drop a promised callback, proposal review, or curriculum follow-up.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Tasks CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">Overdue</span>
            <span className="text-2xl font-bold text-rose-400">{data.counts?.overdue || 0}</span>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-400 opacity-60" />
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Due Today</span>
            <span className="text-2xl font-bold text-amber-400">{data.counts?.today || 0}</span>
          </div>
          <Clock className="w-6 h-6 text-amber-400 opacity-60" />
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">Upcoming</span>
            <span className="text-2xl font-bold text-indigo-400">{data.counts?.upcoming || 0}</span>
          </div>
          <Calendar className="w-6 h-6 text-indigo-400 opacity-60" />
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Completed</span>
            <span className="text-2xl font-bold text-emerald-400">{data.counts?.completed || 0}</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-60" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'active' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Active Follow-ups</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-indigo-400 text-[10px] font-mono font-bold">
            {(data.counts?.overdue || 0) + (data.counts?.today || 0) + (data.counts?.upcoming || 0)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'completed' ? 'border-indigo-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Completed History</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
            {data.counts?.completed || 0}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          Loading follow-up tasks...
        </div>
      ) : activeTab === 'active' ? (
        <div className="space-y-6">
          {/* Section: Overdue */}
          {data.overdue && data.overdue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Overdue Follow-ups ({data.overdue.length})</span>
              </div>
              <div className="space-y-2.5">
                {data.overdue.map(t => renderTaskCard(t, true, false))}
              </div>
            </div>
          )}

          {/* Section: Today */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Clock className="w-4 h-4" />
              <span>Due Today ({data.today ? data.today.length : 0})</span>
            </div>
            {data.today && data.today.length > 0 ? (
              <div className="space-y-2.5">
                {data.today.map(t => renderTaskCard(t, false, true))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                All clear! No follow-up tasks due today.
              </div>
            )}
          </div>

          {/* Section: Upcoming */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Calendar className="w-4 h-4" />
              <span>Upcoming Scheduled ({data.upcoming ? data.upcoming.length : 0})</span>
            </div>
            {data.upcoming && data.upcoming.length > 0 ? (
              <div className="space-y-2.5">
                {data.upcoming.map(t => renderTaskCard(t, false, false))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                No upcoming follow-ups scheduled yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Completed Section */
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Recently Completed Follow-ups ({data.completed ? data.completed.length : 0})</span>
          </div>
          {data.completed && data.completed.length > 0 ? (
            <div className="space-y-2.5">
              {data.completed.map(t => renderTaskCard(t, false, false))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
              No completed tasks yet.
            </div>
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingTask && (
        <Modal
          isOpen={!!reschedulingTask}
          onClose={() => setReschedulingTask(null)}
          title="Reschedule Follow-up Task"
          subtitle={`College: ${reschedulingTask.college_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReschedule} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">New Due Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Reason for Rescheduling</label>
              <textarea
                rows="2"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Placement office busy with semester exams; callback requested next Tuesday."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReschedulingTask(null)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rescheduleLoading}
                className="px-5 py-2 font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-600/30"
              >
                {rescheduleLoading ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
