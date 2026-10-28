import React, { useState } from 'react';
import { Menu, Search, Plus, PhoneCall, Bell } from 'lucide-react';

export function Navbar({ 
  title, 
  subtitle, 
  onOpenMobileSidebar, 
  onQuickAddCollege, 
  onQuickLogCall,
  onGlobalSearch,
  urgentCount = 0
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onGlobalSearch) {
      onGlobalSearch(searchTerm);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Header */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-400 hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search colleges, cities, placement heads, phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (onGlobalSearch) onGlobalSearch(e.target.value);
              }}
              className="w-full bg-slate-800/80 border border-slate-700/80 text-sm text-slate-200 placeholder-slate-400 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </form>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {urgentCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              <Bell className="w-3.5 h-3.5 animate-pulse" />
              <span>{urgentCount} Follow-up{urgentCount > 1 ? 's' : ''} Due</span>
            </div>
          )}

          {onQuickLogCall && (
            <button
              onClick={onQuickLogCall}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors shadow-sm"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Log Call</span>
            </button>
          )}

          {onQuickAddCollege && (
            <button
              onClick={onQuickAddCollege}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add College</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
