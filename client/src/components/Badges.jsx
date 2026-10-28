import React from 'react';

export function StageBadge({ stage, size = 'sm' }) {
  const sizeClasses = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  const styles = {
    'New Lead': 'bg-slate-700/60 text-slate-300 border-slate-600',
    'Contact Identified': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    'First Call Attempted': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    'Connected': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'Interested': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Meeting Scheduled': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Demo Completed': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    'Proposal Sent': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Negotiation': 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
    'Won': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold',
    'Lost': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    'Follow-up Later': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  };

  const styleClass = styles[stage] || 'bg-slate-700/60 text-slate-300 border-slate-600';

  return (
    <span className={`inline-flex items-center rounded-full border ${styleClass} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {stage}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  if (priority === 'High') {
    return (
      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        🔥 High
      </span>
    );
  }
  if (priority === 'Medium') {
    return (
      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
        ⚡ Medium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded font-normal bg-slate-700/40 text-slate-400 border border-slate-700">
      ☕ Low
    </span>
  );
}

export function OutcomeBadge({ outcome }) {
  const styles = {
    'Connected': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Interested': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Meeting Scheduled': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Callback Requested': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'No Answer': 'bg-slate-700/50 text-slate-400 border-slate-600',
    'Busy': 'bg-slate-700/50 text-slate-400 border-slate-600',
    'Not Interested': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    'Wrong Number': 'bg-red-950 text-red-400 border-red-800'
  };

  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border ${styles[outcome] || 'bg-slate-800 text-slate-300'}`}>
      {outcome}
    </span>
  );
}
