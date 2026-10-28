import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExportImportAPI } from '../services/api';
import { 
  Settings as SettingsIcon, 
  Download, 
  Database, 
  User, 
  ShieldCheck, 
  Smartphone, 
  Laptop, 
  LogOut, 
  HardDrive, 
  FileSpreadsheet,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export function Settings() {
  const { user, logout } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const downloadFile = async (fn, filename) => {
    try {
      setDownloading(true);
      const blob = await fn();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download error: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Settings, Data Backup & Device Access</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
            System & Security
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your account credentials, export spreadsheets, download binary database backups, and connect mobile devices.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Active User Session</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">User Name</span>
            <span className="font-semibold text-white text-sm">{user?.name || 'Administrator'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email Address</span>
            <span className="font-semibold text-white text-sm truncate block">{user?.email || 'N/A'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Account Role</span>
            <span className="font-semibold text-emerald-400 uppercase tracking-wider">{user?.role || 'Admin'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Session stored securely in persistent storage. Passwords encrypted using bcrypt salt rounds.
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Data Export & Backup Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Data Persistence & Backup Downloads</span>
          </h3>
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>SQLite WAL Mode Active</span>
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          All leads, calls, tasks, proposals, and startup partner data are permanently written to your disk file (<code className="text-indigo-400 font-mono">crm.sqlite</code>).
          You can download a full binary database snapshot or export individual spreadsheets at any time.
        </p>

        {/* Database Binary Backup */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-white text-xs">Full SQLite Database File (.sqlite)</h4>
            <p className="text-[11px] text-slate-400">
              Download complete binary database with all tables, relations, and foreign keys. Compatible with DBeaver & DB Browser for SQLite.
            </p>
          </div>
          <button
            disabled={downloading}
            onClick={() => downloadFile(ExportImportAPI.downloadDatabaseBackup, `crm_backup_${todayStr}.sqlite`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 shrink-0"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Download Database Backup</span>
          </button>
        </div>

        {/* Individual CSV Exports */}
        <div>
          <h4 className="font-bold text-slate-300 text-xs mb-2.5">Spreadsheet Exports (CSV)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            <button
              onClick={() => downloadFile(ExportImportAPI.exportColleges, `college_leads_${todayStr}.csv`)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors group"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400 mb-1" />
              <span className="font-semibold text-white block text-xs group-hover:text-indigo-400">Colleges</span>
              <span className="text-[10px] text-slate-400">All lead attributes</span>
            </button>

            <button
              onClick={() => downloadFile(ExportImportAPI.exportActivities, `call_logs_${todayStr}.csv`)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors group"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="font-semibold text-white block text-xs group-hover:text-emerald-400">Call Logs</span>
              <span className="text-[10px] text-slate-400">All interactions</span>
            </button>

            <button
              onClick={() => downloadFile(ExportImportAPI.exportFollowUps, `follow_ups_${todayStr}.csv`)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors group"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400 mb-1" />
              <span className="font-semibold text-white block text-xs group-hover:text-amber-400">Follow-ups</span>
              <span className="text-[10px] text-slate-400">All tasks & dates</span>
            </button>

            <button
              onClick={() => downloadFile(ExportImportAPI.exportStartups, `startups_${todayStr}.csv`)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors group"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-400 mb-1" />
              <span className="font-semibold text-white block text-xs group-hover:text-purple-400">Startups</span>
              <span className="text-[10px] text-slate-400">Founder network</span>
            </button>

            <button
              onClick={() => downloadFile(ExportImportAPI.exportProposals, `proposals_${todayStr}.csv`)}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors group"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="font-semibold text-white block text-xs group-hover:text-cyan-400">Proposals</span>
              <span className="text-[10px] text-slate-400">Quotes & values</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Device & Mobile Access Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Access on Android Phones, Tablets & Other Laptops</span>
        </h3>

        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 leading-relaxed text-slate-300 space-y-2">
          <p>
            The backend server binds to <code className="text-emerald-400 font-mono">0.0.0.0:5000</code>. This means any device on your local Wi-Fi or office network can access the CRM directly in their browser without installing any app:
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-300">
            <li>Find your host computer's Local IP address by running <code className="text-indigo-400 font-mono">ipconfig</code> in PowerShell (e.g. <code className="text-indigo-400 font-mono">192.168.1.45</code>).</li>
            <li>On your Android phone or second laptop browser, navigate to: <code className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">http://192.168.1.45:5000</code></li>
            <li>Sign in using your account credentials to view all leads, log calls while on the go, and manage follow-ups!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
