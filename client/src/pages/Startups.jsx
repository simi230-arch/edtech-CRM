import React, { useState, useEffect } from 'react';
import { StartupsAPI, ExportImportAPI } from '../services/api';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  ExternalLink, 
  PhoneCall, 
  Mail, 
  User, 
  Download, 
  CheckCircle, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Modal, ConfirmModal } from '../components/Modal';

export function Startups({ onSelectCollege }) {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [strengthFilter, setStrengthFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Add / Edit Modal
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingStartup, setEditingStartup] = useState(null);
  const [formData, setFormData] = useState(initialFormState());
  const [formLoading, setFormLoading] = useState(false);

  // View Details Modal
  const [selectedStartupDetails, setSelectedStartupDetails] = useState(null);

  const COLLABORATION_TYPES = [
    'Guest Lectures',
    'Industry Mentors',
    'Course Design',
    'Projects',
    'Internships',
    'Hiring Partnerships',
    'Referrals'
  ];

  function initialFormState() {
    return {
      name: '',
      industry: '',
      website: '',
      city: '',
      contact_name: '',
      contact_designation: '',
      email: '',
      phone: '',
      relationship_strength: 'Warm',
      last_interaction_date: '',
      collaboration_types: ['Guest Lectures', 'Industry Mentors'],
      collaboration_status: 'Exploring',
      follow_up_date: '',
      notes: ''
    };
  }

  const fetchStartups = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (strengthFilter !== 'All') params.strength = strengthFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await StartupsAPI.list(params);
      setStartups(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch startups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, [search, strengthFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingStartup(null);
    setFormData(initialFormState());
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (st, e) => {
    if (e) e.stopPropagation();
    setEditingStartup(st);
    setFormData({
      name: st.name || '',
      industry: st.industry || '',
      website: st.website || '',
      city: st.city || '',
      contact_name: st.contact_name || '',
      contact_designation: st.contact_designation || '',
      email: st.email || '',
      phone: st.phone || '',
      relationship_strength: st.relationship_strength || 'Warm',
      last_interaction_date: st.last_interaction_date || '',
      collaboration_types: Array.isArray(st.collaboration_types) ? st.collaboration_types : [],
      collaboration_status: st.collaboration_status || 'Exploring',
      follow_up_date: st.follow_up_date || '',
      notes: st.notes || ''
    });
    setIsAddEditOpen(true);
  };

  const handleSaveStartup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.industry.trim() || !formData.contact_name.trim()) {
      alert('Please fill out Startup Name, Industry, and Contact Person.');
      return;
    }
    try {
      setFormLoading(true);
      if (editingStartup) {
        await StartupsAPI.update(editingStartup.id, formData);
      } else {
        await StartupsAPI.create(formData);
      }
      setIsAddEditOpen(false);
      fetchStartups();
    } catch (err) {
      alert('Failed to save startup: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleCollabType = (type) => {
    const list = formData.collaboration_types || [];
    if (list.includes(type)) {
      setFormData({ ...formData, collaboration_types: list.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, collaboration_types: [...list, type] });
    }
  };

  const handleOpenDetails = async (st) => {
    try {
      const details = await StartupsAPI.get(st.id);
      setSelectedStartupDetails(details);
    } catch (e) {
      alert('Failed to fetch details');
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await ExportImportAPI.exportStartups();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `startup_network_${new Date().toISOString().split('T')[0]}.csv`;
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
            <span>Startup Connections & Referral Network</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
              Industry Partners
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Founder's industry network providing guest lectures, mentors, projects, and warm BTech college introductions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Startup Connection</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search startup name, industry, city, contact person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div>
            <select
              value={strengthFilter}
              onChange={(e) => setStrengthFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Strengths</option>
              <option value="Strong">⭐ Strong Bond</option>
              <option value="Warm">🔥 Warm Network</option>
              <option value="Acquaintance">🤝 Acquaintance</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active Partner">Active Partner</option>
              <option value="Exploring">Exploring</option>
              <option value="On Hold">On Hold</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Startup Cards */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          Loading startup network...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-rose-400">{error}</div>
      ) : startups.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">No startup connections found</p>
          <p className="text-xs text-slate-400 mt-1">Add founders and tech leaders who introduce your training programs to colleges.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {startups.map((st) => (
            <div
              key={st.id}
              onClick={() => handleOpenDetails(st)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition-all shadow-sm space-y-3.5 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                    {st.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-slate-300">{st.industry}</span>
                    {st.city && <span>• {st.city}</span>}
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  st.relationship_strength === 'Strong' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' :
                  st.relationship_strength === 'Warm' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {st.relationship_strength}
                </span>
              </div>

              {/* Contact Person */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{st.contact_name}</span>
                </div>
                {st.contact_designation && (
                  <p className="text-[11px] text-slate-400 ml-5">{st.contact_designation}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 ml-5">
                  {st.phone && <span className="text-emerald-400 font-mono">{st.phone}</span>}
                  {st.email && <span className="truncate">{st.email}</span>}
                </div>
              </div>

              {/* Collaboration Offerings / Types */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Collaboration Types</span>
                <div className="flex flex-wrap gap-1">
                  {(st.collaboration_types || []).map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Referral Metrics Strip */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="text-slate-400">
                  Introduced: <strong className="text-white">{st.referred_colleges_count || 0} colleges</strong>
                </div>
                {st.won_colleges_count > 0 && (
                  <div className="text-emerald-400 font-bold font-mono">
                    {st.won_colleges_count} Won ({formatINR(st.total_won_revenue)})
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Startup Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingStartup ? `Edit Connection: ${editingStartup.name}` : 'Add Startup Network Connection'}
        subtitle="Manage industry partnerships, mentor agreements, and college referral introductions"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveStartup} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Startup Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. TechSprout AI Labs"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Industry / Domain *</label>
              <input
                type="text"
                required
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. AI / LLMs, Cloud DevOps, FinTech"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">City Hub</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bengaluru, Pune, Hyderabad, Gurugram"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Website URL</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://techsproutai.example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs">Primary Startup Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="e.g. Anand Verma"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.contact_designation}
                  onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
                  placeholder="Co-Founder & VP Engineering / CTO"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Mobile / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98450 12345"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Work Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="anand@techsproutai.example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Relationship Strength</label>
              <select
                value={formData.relationship_strength}
                onChange={(e) => setFormData({ ...formData, relationship_strength: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Strong">⭐ Strong Bond (Close friend / Alumni)</option>
                <option value="Warm">🔥 Warm Network (Prior colleague / Advisor)</option>
                <option value="Acquaintance">🤝 Acquaintance (Event connection)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Current Collaboration Status</label>
              <select
                value={formData.collaboration_status}
                onChange={(e) => setFormData({ ...formData, collaboration_status: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Active Partner">Active Partner</option>
                <option value="Exploring">Exploring</option>
                <option value="On Hold">On Hold</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Agreed Collaboration Types (Check all that apply)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COLLABORATION_TYPES.map((type) => {
                const isChecked = (formData.collaboration_types || []).includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleToggleCollabType(type)}
                    className={`p-2 rounded-lg text-left text-xs font-medium border transition-colors flex items-center justify-between ${
                      isChecked
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{type}</span>
                    {isChecked && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Founder Notes & Engagement Details</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How we know the founder, specific domains they are passionate about..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30"
            >
              {formLoading ? 'Saving...' : (editingStartup ? 'Update Connection' : 'Save Connection')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Startup Details & Linked Colleges Modal */}
      {selectedStartupDetails && (
        <Modal
          isOpen={!!selectedStartupDetails}
          onClose={() => setSelectedStartupDetails(null)}
          title={selectedStartupDetails.startup.name}
          subtitle={`${selectedStartupDetails.startup.industry} • ${selectedStartupDetails.startup.city || 'India'}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm">{selectedStartupDetails.startup.contact_name}</span>
                  <span className="text-slate-400 block">{selectedStartupDetails.startup.contact_designation}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-400 font-bold block">{selectedStartupDetails.startup.phone || 'No phone'}</span>
                  <span className="text-slate-400 block">{selectedStartupDetails.startup.email}</span>
                </div>
              </div>
              {selectedStartupDetails.startup.notes && (
                <p className="text-slate-300 italic pt-2 border-t border-slate-700/60">
                  "{selectedStartupDetails.startup.notes}"
                </p>
              )}
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                BTech Colleges Introduced by this Startup ({selectedStartupDetails.linkedColleges?.length || 0})
              </h4>

              {selectedStartupDetails.linkedColleges?.length === 0 ? (
                <p className="text-slate-400 text-xs p-4 bg-slate-800/40 rounded-xl text-center">
                  No colleges linked to this referral yet. You can link this startup when creating or editing a college lead.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedStartupDetails.linkedColleges.map((col) => (
                    <div
                      key={col.id}
                      onClick={() => {
                        setSelectedStartupDetails(null);
                        onSelectCollege && onSelectCollege(col.id);
                      }}
                      className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-bold text-white">{col.name}</span>
                        <span className="text-slate-400 text-[11px] block">{col.city}, {col.state}</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-700">
                          {col.status}
                        </span>
                        {col.status === 'Won' && (
                          <span className="text-emerald-400 font-bold font-mono text-[11px] block mt-0.5">
                            Won: {formatINR((col.won_pricing || 0) * (col.won_student_count || 0))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
