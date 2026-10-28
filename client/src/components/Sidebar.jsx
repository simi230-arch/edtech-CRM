import React from 'react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  GitFork, 
  CalendarCheck, 
  Building2, 
  BookOpen, 
  FileText, 
  Settings, 
  LogOut, 
  X,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ currentView, setView, mobileOpen, setMobileOpen, taskCounts = {} }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'colleges', label: 'College Leads', icon: GraduationCap },
    { id: 'pipeline', label: 'Sales Pipeline', icon: GitFork },
    { 
      id: 'followups', 
      label: 'Follow-ups', 
      icon: CalendarCheck,
      badge: (taskCounts.overdue || 0) + (taskCounts.today || 0) > 0 ? (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          {(taskCounts.overdue || 0) + (taskCounts.today || 0)}
        </span>
      ) : null
    },
    { id: 'startups', label: 'Startup Network', icon: Building2 },
    { id: 'courses', label: 'Course Catalogue', icon: BookOpen },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'settings', label: 'Settings & Data', icon: Settings }
  ];

  const handleNavClick = (id) => {
    setView(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Branding */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">EdTech CRM</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">BTech</span>
              </div>
              <p className="text-xs text-slate-400">College Sales & Outreach</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Startup Mission Banner */}
        <div className="mx-4 my-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mission 2026-27</span>
          </div>
          <p className="text-slate-400 leading-snug">
            Partnering with Indian BTech colleges for industry-oriented IT labs & cohort training.
          </p>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge}
              </button>
            );
          })}
        </div>

        {/* Current User Snapshot & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Account'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
