import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  PhoneCall, 
  Users, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  MapPin, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  PhoneForwarded,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { DashboardAPI } from '../services/api';
import { StageBadge, PriorityBadge } from '../components/Badges';

export function Dashboard({ onNavigateToColleges, onNavigateToFollowups, onSelectCollege }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await DashboardAPI.getMetrics();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading calculated CRM analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="px-3 py-1 bg-rose-500/20 rounded-lg hover:bg-rose-500/30 font-medium">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { cards = {}, charts = {}, urgentFollowUps = [] } = data || {};

  // Formatter for Indian Rupees
  const formatINR = (val) => {
    if (!val) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome / Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Sales & Outreach Overview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
              Live DB Records
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pipeline analytics for Indian BTech college IT course partnerships.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            Conversion Rate: {cards.conversionRate || 0}%
          </div>
        </div>
      </div>

      {/* Welcome Banner when account is brand new */}
      {cards.totalColleges === 0 && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/30 border border-indigo-500/30 rounded-2xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">Welcome to your Brand New Sales CRM!</h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto mb-4 leading-relaxed">
            Your account is completely clean and ready to use. Start adding target BTech engineering colleges, recording outreach calls, and tracking curriculum proposals.
          </p>
          <button
            onClick={onNavigateToColleges}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First College Lead</span>
          </button>
        </div>
      )}

      {/* 10 Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Colleges */}
        <div 
          onClick={onNavigateToColleges}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Colleges</span>
            <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{cards.totalColleges || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Colleges in CRM</div>
        </div>

        {/* 2. New Leads */}
        <div 
          onClick={onNavigateToColleges}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>New Leads</span>
            <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-sky-600/20 group-hover:text-sky-400 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-sky-400">{cards.newLeads || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting 1st outreach</div>
        </div>

        {/* 3. Calls Made */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Calls Made</span>
            <div className="p-1.5 rounded-lg bg-slate-800 text-indigo-400">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{cards.callsMade || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total logged interactions</div>
        </div>

        {/* 4. Connected Calls */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Connected Calls</span>
            <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400">
              <PhoneForwarded className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400">{cards.connectedCalls || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {cards.callsMade ? `${Math.round((cards.connectedCalls / cards.callsMade) * 100)}% connection rate` : '0%'}
          </div>
        </div>

        {/* 5. Meetings Scheduled */}
        <div 
          onClick={onNavigateToColleges}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Meetings Scheduled</span>
            <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-purple-600/20 group-hover:text-purple-400 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-400">{cards.meetingsScheduled || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Demos / Curriculum talks</div>
        </div>

        {/* 6. Proposals Sent */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Proposals Sent</span>
            <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">{cards.proposalsSent || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Formal commercial offers</div>
        </div>

        {/* 7. Interested Colleges */}
        <div 
          onClick={onNavigateToColleges}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Interested</span>
            <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-400">{cards.interestedColleges || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active evaluation</div>
        </div>

        {/* 8. Converted Customers (Won) */}
        <div 
          onClick={onNavigateToColleges}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-600/40 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Won Customers</span>
            <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-600/20 group-hover:text-emerald-400 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{cards.convertedCustomers || 0}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1 font-medium">{formatINR(cards.totalWonRevenue)} Closed</div>
        </div>

        {/* 9. Follow-ups Due Today */}
        <div 
          onClick={onNavigateToFollowups}
          className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group ${
            cards.followUpsDueToday > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Follow-ups Today</span>
            <div className={`p-1.5 rounded-lg ${cards.followUpsDueToday > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${cards.followUpsDueToday > 0 ? 'text-amber-400' : 'text-white'}`}>
            {cards.followUpsDueToday || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled for today</div>
        </div>

        {/* 10. Overdue Follow-ups */}
        <div 
          onClick={onNavigateToFollowups}
          className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg group ${
            cards.overdueFollowUps > 0 ? 'border-rose-500/50 bg-rose-500/5 animate-pulse' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Overdue Follow-ups</span>
            <div className={`p-1.5 rounded-lg ${cards.overdueFollowUps > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${cards.overdueFollowUps > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {cards.overdueFollowUps || 0}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1 font-medium">Needs immediate action</div>
        </div>
      </div>

      {/* Urgent Action Row (Follow-ups needing attention) */}
      {urgentFollowUps.length > 0 && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-white">
                Urgent Follow-Ups Needing Immediate Calling
              </h3>
            </div>
            <button
              onClick={onNavigateToFollowups}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>View All Tasks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentFollowUps.map((task) => {
              const isOverdue = new Date(task.due_date) < new Date();
              return (
                <div 
                  key={task.id}
                  onClick={() => onSelectCollege && onSelectCollege(task.college_id)}
                  className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-white truncate">
                      {task.college_name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      isOverdue ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {isOverdue ? 'Overdue' : 'Due Today'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1 mb-2 font-medium">
                    {task.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                    <span>{task.college_city}</span>
                    <span className="text-emerald-400 font-mono">{task.placement_contact_phone || 'No phone'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Leads by Status (Visual Distribution) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Leads by Pipeline Stage</h3>
              <p className="text-xs text-slate-400">Current status breakdown across all 12 pipeline stages</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {cards.totalColleges} total leads
            </span>
          </div>

          <div className="space-y-2.5">
            {(charts.leadsByStatus || []).map((item) => {
              const pct = cards.totalColleges > 0 ? Math.round((item.count / cards.totalColleges) * 100) : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.status}</span>
                    <span className="text-slate-400 font-mono">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Conversion Funnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Lead Conversion Funnel</h3>
              <p className="text-xs text-slate-400">Progressive conversion from contact to paid partnership</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {cards.conversionRate}% Win Rate
            </span>
          </div>

          <div className="space-y-3">
            {(charts.funnelStages || []).map((step, idx) => {
              const baseCount = charts.funnelStages[0]?.count || 1;
              const funnelPct = Math.round((step.count / baseCount) * 100) || 0;
              return (
                <div key={step.stage} className="p-3 rounded-xl bg-slate-800/60 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-mono">
                        {idx + 1}
                      </span>
                      {step.stage}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-bold">{step.count}</span>
                      <span className="text-slate-400 text-[11px]">({funnelPct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 4 ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.max(2, funnelPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Outreach Activity Over Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Calls & Outreach Activity (30 Days)</h3>
              <p className="text-xs text-slate-400">Total calls and connected conversation volume</p>
            </div>
            <span className="text-xs font-medium text-slate-400 font-mono">
              {cards.callsMade} Total Logs
            </span>
          </div>

          {(charts.activityOverTime || []).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No calls logged in the last 30 days yet.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800 overflow-x-auto">
                {charts.activityOverTime.map((d) => {
                  const maxCalls = Math.max(...charts.activityOverTime.map(x => x.total_calls), 1);
                  const heightPct = Math.round((d.total_calls / maxCalls) * 100);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative min-w-[32px]">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-white whitespace-nowrap pointer-events-none z-10 border border-slate-700">
                        {d.date}: {d.total_calls} calls ({d.connected_calls} connected)
                      </div>
                      <div 
                        className="w-full bg-indigo-600 group-hover:bg-indigo-500 rounded-t-sm transition-all"
                        style={{ height: `${Math.max(12, heightPct)}%` }}
                      />
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        {d.date.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span>
                  Calls Logged
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chart 4: Geographic Reach (State & City) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Geographic Footprint across India</h3>
              <p className="text-xs text-slate-400">Concentration of engineering colleges by State & City</p>
            </div>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Top States</h4>
              <div className="space-y-2">
                {(charts.leadsByState || []).map((s) => (
                  <div key={s.state} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 text-xs">
                    <span className="text-slate-200 font-medium">{s.state}</span>
                    <span className="font-mono text-indigo-400 font-bold">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Top Tech Hub Cities</h4>
              <div className="space-y-2">
                {(charts.leadsByCity || []).map((c) => (
                  <div key={c.city} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 text-xs">
                    <span className="text-slate-200 font-medium">{c.city}</span>
                    <span className="font-mono text-cyan-400 font-bold">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral & Lead Source Performance */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Lead Sources & Startup Referral Efficiency</h3>
            <p className="text-xs text-slate-400">Tracking how different outreach channels and founder network partners convert</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Channel breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">By Acquisition Channel</h4>
            {(charts.leadsBySource || []).map((src) => (
              <div key={src.lead_source} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 text-xs">
                <div>
                  <span className="font-semibold text-white block">{src.lead_source}</span>
                  <span className="text-[11px] text-slate-400">{src.won_count || 0} won deals</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-indigo-400 block">{src.count} leads</span>
                  <span className="text-[10px] text-slate-400">
                    {src.count ? Math.round(((src.won_count || 0) / src.count) * 100) : 0}% win
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Top Referral Startups */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Top Startup Partner Introductions</h4>
            {(charts.startupReferralPerformance || []).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No startup partner referrals logged yet. Link a startup when adding a college lead!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-2">Startup Partner</th>
                      <th className="pb-2 text-center">Colleges Introduced</th>
                      <th className="pb-2 text-center">Won Partnerships</th>
                      <th className="pb-2 text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {charts.startupReferralPerformance.map((item) => (
                      <tr key={item.startup_name} className="hover:bg-slate-800/40">
                        <td className="py-2.5 font-medium text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{item.startup_name}</span>
                        </td>
                        <td className="py-2.5 text-center font-mono text-slate-300">{item.leads_referred}</td>
                        <td className="py-2.5 text-center font-mono text-emerald-400 font-bold">{item.deals_won}</td>
                        <td className="py-2.5 text-right font-mono text-emerald-400 font-bold">{formatINR(item.revenue_won)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
