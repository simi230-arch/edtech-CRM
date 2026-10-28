import React, { useState, useEffect, useRef } from 'react';
import { 
  CollegesAPI, 
  StartupsAPI, 
  ExportImportAPI 
} from '../services/api';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  Archive, 
  RotateCcw, 
  Eye, 
  PhoneCall, 
  AlertTriangle, 
  CheckCircle, 
  Building2, 
  ExternalLink, 
  MapPin, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  GraduationCap
} from 'lucide-react';
import { StageBadge, PriorityBadge } from '../components/Badges';
import { Modal, ConfirmModal } from '../components/Modal';

export function Colleges({ onSelectCollege, initialFilter = {} }) {
  const [colleges, setColleges] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter Options & State
  const [filterMeta, setFilterMeta] = useState({ states: [], cities: [], stages: [], priorities: [], leadSources: [], collegeTypes: [] });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [followUpFilter, setFollowUpFilter] = useState('All');
  const [archivedFilter, setArchivedFilter] = useState('0');
  const [sortBy, setSortBy] = useState('last_activity');
  const [sortDir, setSortDir] = useState('desc');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [collegeToDelete, setCollegeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Form State
  const [startupsList, setStartupsList] = useState([]);
  const [formData, setFormData] = useState(initialFormState());
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const debounceTimer = useRef(null);

  // CSV Import State
  const [csvText, setCsvText] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  function initialFormState() {
    return {
      name: '',
      type: 'Private',
      state: '',
      city: '',
      address: '',
      website: '',
      official_email: '',
      phone: '',
      student_population: '',
      relevant_branches: 'CSE, IT, ECE, AI&DS',
      target_years: '2nd, 3rd year',
      placement_contact_name: '',
      placement_contact_designation: 'Head - Corporate Relations & TPO',
      placement_contact_phone: '',
      placement_contact_email: '',
      lead_source: 'Cold Call',
      referred_by: '',
      startup_id: '',
      status: 'New Lead',
      priority: 'Medium',
      estimated_students: 60,
      notes: ''
    };
  }

  // Load Filter Metadata and Startups
  useEffect(() => {
    async function loadMeta() {
      try {
        const [filters, startupsRes] = await Promise.all([
          CollegesAPI.getFilters(),
          StartupsAPI.list()
        ]);
        setFilterMeta(filters);
        setStartupsList(startupsRes.items || []);
      } catch (err) {
        console.warn('Failed to load filter metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Colleges on change
  const fetchColleges = async (page = pagination.page) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        state: stateFilter,
        city: cityFilter,
        priority: priorityFilter,
        lead_source: sourceFilter,
        archived: archivedFilter,
        sort_by: sortBy,
        sort_dir: sortDir
      };
      if (followUpFilter !== 'All') {
        params.follow_up_filter = followUpFilter;
      }

      const res = await CollegesAPI.list(params);
      setColleges(res.items || []);
      setPagination(res.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch colleges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges(1);
  }, [search, statusFilter, stateFilter, cityFilter, priorityFilter, sourceFilter, followUpFilter, archivedFilter, sortBy, sortDir]);

  // Real-time duplicate check during form editing
  const checkDuplicate = (name, website, phone, excludeId) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if ((name && name.trim().length > 3) || (website && website.trim().length > 4) || (phone && phone.trim().length > 7)) {
        try {
          const res = await CollegesAPI.checkDuplicate({
            name: name || '',
            website: website || '',
            phone: phone || '',
            excludeId: excludeId || ''
          });
          if (res.isDuplicate) {
            setDuplicateWarning(res.duplicates[0]?.message || 'Possible duplicate found!');
          } else {
            setDuplicateWarning(null);
          }
        } catch (e) {
          // ignore check error
        }
      } else {
        setDuplicateWarning(null);
      }
    }, 500);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (name === 'name' || name === 'website' || name === 'phone') {
      checkDuplicate(
        name === 'name' ? value : updated.name,
        name === 'website' ? value : updated.website,
        name === 'phone' ? value : updated.phone,
        editingCollege?.id
      );
    }
  };

  const handleOpenAdd = () => {
    setEditingCollege(null);
    setFormData(initialFormState());
    setFormErrors({});
    setDuplicateWarning(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (college, e) => {
    if (e) e.stopPropagation();
    setEditingCollege(college);
    setFormData({
      name: college.name || '',
      type: college.type || 'Private',
      state: college.state || '',
      city: college.city || '',
      address: college.address || '',
      website: college.website || '',
      official_email: college.official_email || '',
      phone: college.phone || '',
      student_population: college.student_population || '',
      relevant_branches: college.relevant_branches || '',
      target_years: college.target_years || '',
      placement_contact_name: college.placement_contact_name || '',
      placement_contact_designation: college.placement_contact_designation || '',
      placement_contact_phone: college.placement_contact_phone || '',
      placement_contact_email: college.placement_contact_email || '',
      lead_source: college.lead_source || 'Cold Call',
      referred_by: college.referred_by || '',
      startup_id: college.startup_id || '',
      status: college.status || 'New Lead',
      priority: college.priority || 'Medium',
      estimated_students: college.estimated_students || 0,
      notes: college.notes || ''
    });
    setFormErrors({});
    setDuplicateWarning(null);
    setIsAddEditOpen(true);
  };

  const handleSaveCollege = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'College name is required.';
    if (!formData.state.trim()) errors.state = 'State is required.';
    if (!formData.city.trim()) errors.city = 'City is required.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setFormLoading(true);
      if (editingCollege) {
        await CollegesAPI.update(editingCollege.id, formData);
      } else {
        await CollegesAPI.create(formData);
      }
      setIsAddEditOpen(false);
      fetchColleges();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to save college lead.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleArchive = async (college, e) => {
    if (e) e.stopPropagation();
    try {
      await CollegesAPI.archive(college.id, college.is_archived ? 0 : 1);
      fetchColleges();
    } catch (err) {
      alert('Failed to update archive status: ' + err.message);
    }
  };

  const handleDeletePrompt = (college, e) => {
    if (e) e.stopPropagation();
    setCollegeToDelete(college);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!collegeToDelete) return;
    try {
      setDeleteLoading(true);
      await CollegesAPI.delete(collegeToDelete.id);
      setIsDeleteOpen(false);
      setCollegeToDelete(null);
      fetchColleges();
    } catch (err) {
      alert('Failed to delete college: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // CSV Export Download
  const handleExportCSV = async () => {
    try {
      const blob = await ExportImportAPI.exportColleges();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `btech_college_leads_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  // CSV Import
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleRunImport = async () => {
    if (!csvText.trim()) return;
    try {
      setImportLoading(true);
      setImportSummary(null);
      const res = await ExportImportAPI.importColleges(csvText, true);
      setImportSummary(res);
      fetchColleges();
    } catch (err) {
      alert('Import error: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Controls: Search, Filters, Add & Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by college name, city, placement head, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700/80 text-sm text-white rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="Export all college leads to CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => { setIsImportOpen(true); setImportSummary(null); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="Import colleges from CSV spreadsheet"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add College Lead</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Stage</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Stages</option>
              {(filterMeta.stages || []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">State</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All States</option>
              {(filterMeta.states || []).map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Priorities</option>
              <option value="High">🔥 High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">☕ Low</option>
            </select>
          </div>

          {/* Lead Source Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Sources</option>
              {(filterMeta.leadSources || []).map((src) => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Follow-up Due Filter */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Follow-up</label>
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Times</option>
              <option value="today">⏰ Due Today</option>
              <option value="overdue">🚨 Overdue</option>
              <option value="upcoming">📅 Upcoming</option>
            </select>
          </div>

          {/* Archive Toggle */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Status</label>
            <select
              value={archivedFilter}
              onChange={(e) => setArchivedFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="0">Active Leads</option>
              <option value="1">Archived Leads</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            Loading college records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : colleges.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-white">No college leads found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or add your first BTech college outreach contact.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Add College</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-800 select-none">
                <tr>
                  <th 
                    onClick={() => { setSortBy('name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-4 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>College Name & City</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Stage</th>
                  <th 
                    onClick={() => { setSortBy('priority'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Priority</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Placement Contact</th>
                  <th 
                    onClick={() => { setSortBy('next_follow_up'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Next Follow-up</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Activities</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {colleges.map((col) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const rawFollowUp = col.next_follow_up_date ? String(col.next_follow_up_date) : '';
                  const followUpDateStr = rawFollowUp ? rawFollowUp.split('T')[0] : null;
                  const isOverdue = followUpDateStr && followUpDateStr < todayStr && !['Won', 'Lost'].includes(col.status);
                  const isToday = followUpDateStr && followUpDateStr === todayStr;

                  return (
                    <tr 
                      key={col.id} 
                      onClick={() => onSelectCollege && onSelectCollege(col.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-medium">
                        <div className="text-white font-semibold text-sm group-hover:text-indigo-400 transition-colors">
                          {col.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {col.city}, {col.state}
                          </span>
                          {col.startup_name && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                              <Building2 className="w-2.5 h-2.5" />
                              Ref: {col.startup_name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                          {col.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <StageBadge stage={col.status} />
                      </td>

                      <td className="py-3.5 px-3">
                        <PriorityBadge priority={col.priority} />
                      </td>

                      <td className="py-3.5 px-3 text-slate-300">
                        <div className="font-medium text-white">{col.placement_contact_name || '—'}</div>
                        <div className="text-[11px] text-slate-400">{col.placement_contact_phone || col.placement_contact_email || 'No contact'}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        {rawFollowUp ? (
                          <div className={`text-[11px] font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                            isOverdue ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30' :
                            isToday ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30' :
                            'text-slate-300'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            <span>
                              {rawFollowUp.split('T')[0]} {rawFollowUp.includes('T') ? rawFollowUp.split('T')[1]?.slice(0, 5) : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">None set</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono font-medium px-1.5">
                          {col.activity_count || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSelectCollege && onSelectCollege(col.id); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="View Dossier & Log Calls"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(col, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800"
                            title="Edit College Lead"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleArchive(col, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                            title={col.is_archived ? "Restore Lead" : "Archive Lead"}
                          >
                            {col.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePrompt(col, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && colleges.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60">
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leads
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchColleges(pagination.page - 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-medium text-slate-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchColleges(pagination.page + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit College Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingCollege ? `Edit Lead: ${editingCollege.name}` : 'Add New BTech College Lead'}
        subtitle="Manage college details, TPO contact information, and target batch years"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveCollege} className="space-y-4 text-xs">
          {/* Proactive Duplicate Warning Banner */}
          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-start gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Duplicate Warning Detected</p>
                <p className="text-[11px] opacity-90">{duplicateWarning}</p>
              </div>
            </div>
          )}

          {formErrors.submit && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium">
              {formErrors.submit}
            </div>
          )}

          {/* Section: Institution Details */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Institution Details</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">College Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Dayananda Sagar College of Engineering"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
                {formErrors.name && <p className="text-rose-400 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">College Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Government">Government</option>
                  <option value="Private">Private</option>
                  <option value="Autonomous">Autonomous</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  required
                  placeholder="e.g. Karnataka, Maharashtra, Telangana"
                  value={formData.state}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
                {formErrors.state && <p className="text-rose-400 mt-1">{formErrors.state}</p>}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="e.g. Bengaluru, Pune, Hyderabad"
                  value={formData.city}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
                {formErrors.city && <p className="text-rose-400 mt-1">{formErrors.city}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Website URL</label>
                <input
                  type="text"
                  name="website"
                  placeholder="https://www.dsce.edu.in"
                  value={formData.website}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Official College Email</label>
                <input
                  type="email"
                  name="official_email"
                  placeholder="info@dsce.edu.in"
                  value={formData.official_email}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Official Desk Phone</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+91 80 4216 1700"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Campus Full Address</label>
              <textarea
                name="address"
                rows="2"
                placeholder="Full campus location address..."
                value={formData.address}
                onChange={handleFormChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section: Academic & Student Population */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Engineering Cohort Specs</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Student Population (Total)</label>
                <input
                  type="number"
                  name="student_population"
                  placeholder="e.g. 5000"
                  value={formData.student_population}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Student Years</label>
                <input
                  type="text"
                  name="target_years"
                  placeholder="e.g. 2nd, 3rd year"
                  value={formData.target_years}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Estimated Batch Students</label>
                <input
                  type="number"
                  name="estimated_students"
                  placeholder="e.g. 120"
                  value={formData.estimated_students}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Relevant BTech Branches</label>
              <input
                type="text"
                name="relevant_branches"
                placeholder="e.g. CSE, IT, ECE, AI&DS, ISE, Cyber Security"
                value={formData.relevant_branches}
                onChange={handleFormChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section: Placement Cell Contact Person */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Placement Cell (TPO) Contact</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Person Name</label>
                <input
                  type="text"
                  name="placement_contact_name"
                  placeholder="e.g. Dr. Ramesh N. Rao"
                  value={formData.placement_contact_name}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Designation</label>
                <input
                  type="text"
                  name="placement_contact_designation"
                  placeholder="Placement Head / TPO / HOD CSE"
                  value={formData.placement_contact_designation}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Mobile / Phone</label>
                <input
                  type="text"
                  name="placement_contact_phone"
                  placeholder="+91 98450 12345"
                  value={formData.placement_contact_phone}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Direct Email</label>
                <input
                  type="email"
                  name="placement_contact_email"
                  placeholder="tpo@dsce.edu.in"
                  value={formData.placement_contact_email}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Sales Strategy, Referral & Pipeline */}
          <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Pipeline & Referral Attribution</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Lead Source</label>
                <select
                  name="lead_source"
                  value={formData.lead_source}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Cold Call">Cold Call</option>
                  <option value="Referral">Referral</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Email">Email</option>
                  <option value="Event">Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Linked Startup Partner</label>
                <select
                  name="startup_id"
                  value={formData.startup_id}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None / Direct</option>
                  {startupsList.map((st) => (
                    <option key={st.id} value={st.id}>{st.name} ({st.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Referred By (Person / Org)</label>
                <input
                  type="text"
                  name="referred_by"
                  placeholder="e.g. Anand Verma (TechSprout AI)"
                  value={formData.referred_by}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Initial Pipeline Stage</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {(filterMeta.stages || []).map((stg) => (
                    <option key={stg} value={stg}>{stg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Deal Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="High">🔥 High Priority</option>
                  <option value="Medium">⚡ Medium Priority</option>
                  <option value="Low">☕ Low Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Outreach Notes & College Specific Requirements</label>
              <textarea
                name="notes"
                rows="2"
                placeholder="Specific college syllabus requirements, academic schedule notes, faculty alignment..."
                value={formData.notes}
                onChange={handleFormChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {formLoading ? 'Saving Lead...' : (editingCollege ? 'Update College Lead' : 'Save College Lead')}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import College Leads via CSV"
        subtitle="Bulk upload colleges from any CSV with automated column header detection"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 leading-relaxed text-slate-300">
            Supports CSV files containing columns like: <strong className="text-white">College Name, State, City, Contact Name, Designation, Phone, Email, Website, Lead Source, Notes</strong>.
            Duplicate colleges with existing names are safely skipped.
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Choose CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Or Paste Raw CSV Data</label>
            <textarea
              rows="6"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="College Name,State,City,Contact Name,Phone&#10;IIT Bangalore,Karnataka,Bengaluru,Dr. Rao,9845012345"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {importSummary && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>{importSummary.message}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Added: <strong className="text-white">{importSummary.importedCount}</strong> | Skipped Duplicates: <strong className="text-white">{importSummary.duplicateCount}</strong>
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsImportOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleRunImport}
              disabled={importLoading || !csvText.trim()}
              className="px-5 py-2 font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/30 disabled:opacity-50"
            >
              {importLoading ? 'Importing Leads...' : 'Run CSV Import'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete College Lead"
        message={`Are you sure you want to permanently delete "${collegeToDelete?.name}"? All associated call activities, proposals, and follow-up tasks will also be removed. This action cannot be undone.`}
        confirmText="Permanently Delete"
        confirmColor="rose"
        loading={deleteLoading}
      />
    </div>
  );
}
