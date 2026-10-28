import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Colleges } from './pages/Colleges';
import { CollegeDetail } from './pages/CollegeDetail';
import { Pipeline } from './pages/Pipeline';
import { FollowUps } from './pages/FollowUps';
import { Startups } from './pages/Startups';
import { Courses } from './pages/Courses';
import { Proposals } from './pages/Proposals';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { FollowUpsAPI, CollegesAPI, ActivitiesAPI } from './services/api';
import { Modal } from './components/Modal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto mt-12 bg-slate-900 border border-slate-800 rounded-2xl text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
            !
          </div>
          <h3 className="text-base font-bold text-white mb-2">Notice Loading View</h3>
          <p className="text-xs text-slate-400 mb-4">
            {this.state.error?.message || 'An unexpected display error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
          >
            Return to Leads
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCollegeId, setSelectedCollegeId] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [taskCounts, setTaskCounts] = useState({ overdue: 0, today: 0 });

  // Quick Action Modals from Navbar
  const [isQuickAddCollegeOpen, setIsQuickAddCollegeOpen] = useState(false);
  const [isQuickLogCallOpen, setIsQuickLogCallOpen] = useState(false);
  const [collegesListForCall, setCollegesListForCall] = useState([]);
  const [quickCallForm, setQuickCallForm] = useState({
    college_id: '',
    channel: 'Phone',
    contact_person: '',
    call_outcome: 'Connected',
    notes: '',
    next_action: '',
    next_follow_up_date: '',
    create_task: true
  });
  const [quickCallLoading, setQuickCallLoading] = useState(false);

  // Quick Add College Lead Form State
  const [quickCollegeForm, setQuickCollegeForm] = useState({
    name: '',
    type: 'Private',
    state: '',
    city: '',
    phone: '',
    placement_contact_name: '',
    status: 'New Lead',
    priority: 'Medium'
  });
  const [quickCollegeLoading, setQuickCollegeLoading] = useState(false);

  // Refresh badges
  const refreshTaskCounts = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await FollowUpsAPI.list();
      setTaskCounts(res.counts || { overdue: 0, today: 0 });
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshTaskCounts();
      CollegesAPI.list({ limit: 100 }).then(res => setCollegesListForCall(res.items || [])).catch(() => {});
    }
  }, [isAuthenticated, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Securing session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const navigateToCollegeDetail = (collegeId) => {
    setSelectedCollegeId(collegeId);
    setCurrentView('college-detail');
  };

  const handleGlobalSearch = (term) => {
    if (currentView !== 'colleges') {
      setCurrentView('colleges');
    }
  };

  const handleQuickCallSubmit = async (e) => {
    e.preventDefault();
    if (!quickCallForm.college_id || !quickCallForm.notes.trim()) {
      alert('Please select a college and enter conversation notes.');
      return;
    }
    try {
      setQuickCallLoading(true);
      await ActivitiesAPI.log(quickCallForm);
      setIsQuickLogCallOpen(false);
      setQuickCallForm({
        college_id: '',
        channel: 'Phone',
        contact_person: '',
        call_outcome: 'Connected',
        notes: '',
        next_action: '',
        next_follow_up_date: '',
        create_task: true
      });
      refreshTaskCounts();
      alert('Call interaction logged successfully!');
    } catch (err) {
      alert('Error logging call: ' + err.message);
    } finally {
      setQuickCallLoading(false);
    }
  };

  const handleQuickAddCollegeSubmit = async (e) => {
    e.preventDefault();
    if (!quickCollegeForm.name.trim() || !quickCollegeForm.state.trim() || !quickCollegeForm.city.trim()) {
      alert('College Name, State, and City are required.');
      return;
    }
    try {
      setQuickCollegeLoading(true);
      const res = await CollegesAPI.create(quickCollegeForm);
      setIsQuickAddCollegeOpen(false);
      setQuickCollegeForm({
        name: '',
        type: 'Private',
        state: '',
        city: '',
        phone: '',
        placement_contact_name: '',
        status: 'New Lead',
        priority: 'Medium'
      });
      CollegesAPI.list({ limit: 100 }).then(r => setCollegesListForCall(r.items || [])).catch(() => {});
      if (res.college?.id) {
        navigateToCollegeDetail(res.college.id);
      }
    } catch (err) {
      alert('Error adding college: ' + err.message);
    } finally {
      setQuickCollegeLoading(false);
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return { title: 'Executive Sales Dashboard', subtitle: 'Live BTech institutional outreach & conversion metrics' };
      case 'colleges': return { title: 'BTech College Lead Management', subtitle: 'Targeted institutional accounts across India' };
      case 'college-detail': return { title: 'College Account Dossier', subtitle: 'Chronological communication timeline, proposals & follow-ups' };
      case 'pipeline': return { title: 'Sales Pipeline (12 Stages)', subtitle: 'Progress deals from initial call to signed student cohort' };
      case 'followups': return { title: 'Follow-ups & Task Calendar', subtitle: 'Active callback schedules, upcoming meetings & overdue alerts' };
      case 'startups': return { title: 'Startup Network & Referral Tracker', subtitle: 'Founder industry network connections and intro attribution' };
      case 'courses': return { title: 'Course Catalogue & Syllabi', subtitle: 'Standardized IT engineering courses and approved specs' };
      case 'proposals': return { title: 'Course Proposals & Deal Pipeline', subtitle: 'Formal commercial agreements and revenue forecasting' };
      case 'settings': return { title: 'Settings & Data Export', subtitle: 'Database snapshot downloads, CSV exports and mobile sync' };
      default: return { title: 'EdTech Sales CRM', subtitle: '' };
    }
  };

  const pageMeta = getPageTitle();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setView={(v) => {
          setCurrentView(v);
          if (v !== 'college-detail') setSelectedCollegeId(null);
        }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        taskCounts={taskCounts}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Navbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onQuickAddCollege={() => setIsQuickAddCollegeOpen(true)}
          onQuickLogCall={() => setIsQuickLogCallOpen(true)}
          onGlobalSearch={handleGlobalSearch}
          urgentCount={(taskCounts.overdue || 0) + (taskCounts.today || 0)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary onReset={() => { setSelectedCollegeId(null); setCurrentView('colleges'); }}>
            {currentView === 'dashboard' && (
              <Dashboard
                onNavigateToColleges={() => setCurrentView('colleges')}
                onNavigateToFollowups={() => setCurrentView('followups')}
                onSelectCollege={navigateToCollegeDetail}
              />
            )}

            {currentView === 'colleges' && (
              <Colleges
                onSelectCollege={navigateToCollegeDetail}
              />
            )}

            {currentView === 'college-detail' && (
              selectedCollegeId ? (
                <CollegeDetail
                  collegeId={selectedCollegeId}
                  onBack={() => setCurrentView('colleges')}
                />
              ) : (
                <Colleges onSelectCollege={navigateToCollegeDetail} />
              )
            )}

            {currentView === 'pipeline' && (
              <Pipeline
                onSelectCollege={navigateToCollegeDetail}
              />
            )}

            {currentView === 'followups' && (
              <FollowUps
                onSelectCollege={navigateToCollegeDetail}
              />
            )}

            {currentView === 'startups' && (
              <Startups
                onSelectCollege={navigateToCollegeDetail}
              />
            )}

            {currentView === 'courses' && (
              <Courses
                onSelectCourseForProposal={(course) => setCurrentView('proposals')}
              />
            )}

            {currentView === 'proposals' && (
              <Proposals
                onSelectCollege={navigateToCollegeDetail}
              />
            )}

            {currentView === 'settings' && (
              <Settings />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Quick Add College Modal */}
      <Modal
        isOpen={isQuickAddCollegeOpen}
        onClose={() => setIsQuickAddCollegeOpen(false)}
        title="Quick Add College Lead"
        subtitle="Quickly record an outreach opportunity"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleQuickAddCollegeSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">College Name *</label>
            <input
              type="text"
              required
              value={quickCollegeForm.name}
              onChange={(e) => setQuickCollegeForm({ ...quickCollegeForm, name: e.target.value })}
              placeholder="e.g. BMS College of Engineering"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">State *</label>
              <input
                type="text"
                required
                value={quickCollegeForm.state}
                onChange={(e) => setQuickCollegeForm({ ...quickCollegeForm, state: e.target.value })}
                placeholder="Karnataka"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">City *</label>
              <input
                type="text"
                required
                value={quickCollegeForm.city}
                onChange={(e) => setQuickCollegeForm({ ...quickCollegeForm, city: e.target.value })}
                placeholder="Bengaluru"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Placement Head (TPO)</label>
              <input
                type="text"
                value={quickCollegeForm.placement_contact_name}
                onChange={(e) => setQuickCollegeForm({ ...quickCollegeForm, placement_contact_name: e.target.value })}
                placeholder="Dr. Placement Officer"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Contact Phone</label>
              <input
                type="text"
                value={quickCollegeForm.phone}
                onChange={(e) => setQuickCollegeForm({ ...quickCollegeForm, phone: e.target.value })}
                placeholder="+91 98450 00000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickAddCollegeOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={quickCollegeLoading}
              className="px-5 py-2 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30"
            >
              {quickCollegeLoading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Log Call Modal */}
      <Modal
        isOpen={isQuickLogCallOpen}
        onClose={() => setIsQuickLogCallOpen(false)}
        title="Quick Log Call / Outreach"
        subtitle="Log interaction with any saved college"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleQuickCallSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Select College Lead *</label>
            <select
              required
              value={quickCallForm.college_id}
              onChange={(e) => {
                const col = collegesListForCall.find(c => String(c.id) === e.target.value);
                setQuickCallForm({
                  ...quickCallForm,
                  college_id: e.target.value,
                  contact_person: col ? (col.placement_contact_name || '') : ''
                });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select a college...</option>
              {collegesListForCall.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.city}, {c.state})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Communication Channel</label>
              <select
                value={quickCallForm.channel}
                onChange={(e) => setQuickCallForm({ ...quickCallForm, channel: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Call Outcome</label>
              <select
                value={quickCallForm.call_outcome}
                onChange={(e) => setQuickCallForm({ ...quickCallForm, call_outcome: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Connected">Connected</option>
                <option value="Interested">Interested</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Callback Requested">Callback Requested</option>
                <option value="Busy">Busy</option>
                <option value="No Answer">No Answer</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Conversation Notes *</label>
            <textarea
              required
              rows="3"
              value={quickCallForm.notes}
              onChange={(e) => setQuickCallForm({ ...quickCallForm, notes: e.target.value })}
              placeholder="Summary of conversation, objections or questions..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Next Action</label>
              <input
                type="text"
                value={quickCallForm.next_action}
                onChange={(e) => setQuickCallForm({ ...quickCallForm, next_action: e.target.value })}
                placeholder="Follow up on curriculum"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Next Follow-up Date</label>
              <input
                type="datetime-local"
                value={quickCallForm.next_follow_up_date}
                onChange={(e) => setQuickCallForm({ ...quickCallForm, next_follow_up_date: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickLogCallOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={quickCallLoading}
              className="px-5 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30"
            >
              {quickCallLoading ? 'Saving...' : 'Save Call Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
