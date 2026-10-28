import React, { useState, useEffect } from 'react';
import { 
  CollegesAPI, 
  ActivitiesAPI, 
  FollowUpsAPI, 
  ProposalsAPI, 
  CoursesAPI 
} from '../services/api';
import { 
  ArrowLeft, 
  PhoneCall, 
  Mail, 
  Globe, 
  Building2, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  RotateCcw, 
  Trash2, 
  MessageSquare, 
  FileText, 
  AlertTriangle,
  History,
  HelpCircle,
  ShieldAlert,
  FileCheck,
  Send,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { StageBadge, PriorityBadge, OutcomeBadge } from '../components/Badges';
import { Modal, ConfirmModal } from '../components/Modal';

export function CollegeDetail({ collegeId, onBack, onOpenEdit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('activities'); // 'activities', 'followups', 'proposals', 'history'

  // Log Call Modal State
  const [isLogCallOpen, setIsLogCallOpen] = useState(false);
  const [callForm, setCallForm] = useState(initialCallState());
  const [callLoading, setCallLoading] = useState(false);

  // Stage Transition / Won / Lost Modals
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState('');
  const [stageNotes, setStageNotes] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [wonAgreementDate, setWonAgreementDate] = useState(new Date().toISOString().split('T')[0]);
  const [wonPricing, setWonPricing] = useState('');
  const [wonStudentCount, setWonStudentCount] = useState('');
  const [stageLoading, setStageLoading] = useState(false);

  // New Follow-up Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskLoading, setTaskLoading] = useState(false);

  // Reschedule Task Modal State
  const [reschedulingTask, setReschedulingTask] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Proposal Modal State
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [coursesList, setCoursesList] = useState([]);
  const [proposalData, setProposalData] = useState({
    title: '',
    course_id: '',
    quoted_price: '',
    expected_students: '',
    total_deal_value: '',
    date_sent: new Date().toISOString().split('T')[0],
    status: 'Sent',
    next_action: 'Follow up on proposal review',
    notes: ''
  });
  const [proposalLoading, setProposalLoading] = useState(false);

  function initialCallState() {
    return {
      channel: 'Phone',
      contact_person: '',
      call_outcome: 'Connected',
      notes: '',
      questions_asked: '',
      objections_raised: '',
      promised_documents: '',
      next_action: '',
      next_follow_up_date: '',
      create_task: true
    };
  }

  const fetchCollegeDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await CollegesAPI.get(collegeId);
      setData(res);
      // Pre-fill contact person for call logging
      if (res.college?.placement_contact_name) {
        setCallForm(prev => ({ ...prev, contact_person: res.college.placement_contact_name }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load college details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeDetails();
    // Load courses for proposal creator
    CoursesAPI.list().then(res => setCoursesList(res.items || [])).catch(() => {});
  }, [collegeId]);

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        Loading college dossier...
      </div>
    );
  }

  if (error || !data?.college) {
    return (
      <div className="p-8">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error || 'College not found.'}
        </div>
      </div>
    );
  }

  const { college, activities = [], stageHistory = [], followUps = [], proposals = [] } = data;

  const PIPELINE_STAGES = [
    'New Lead',
    'Contact Identified',
    'First Call Attempted',
    'Connected',
    'Interested',
    'Meeting Scheduled',
    'Demo Completed',
    'Proposal Sent',
    'Negotiation',
    'Won',
    'Lost',
    'Follow-up Later'
  ];

  // Initiate Stage Change
  const handleStageSelect = (newStage) => {
    if (newStage === college.status) return;
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
    try {
      setStageLoading(true);
      await CollegesAPI.updateStage(college.id, {
        status: targetStage,
        notes: stageNotes,
        lost_reason: targetStage === 'Lost' ? lostReason : null,
        won_agreement_date: targetStage === 'Won' ? wonAgreementDate : null,
        won_pricing: targetStage === 'Won' ? wonPricing : null,
        won_student_count: targetStage === 'Won' ? wonStudentCount : null
      });
      setIsStageModalOpen(false);
      fetchCollegeDetails();
    } catch (err) {
      alert('Failed to change stage: ' + err.message);
    } finally {
      setStageLoading(false);
    }
  };

  // Submit Call Interaction
  const handleLogCallSubmit = async (e) => {
    e.preventDefault();
    if (!callForm.notes.trim()) {
      alert('Please enter conversation notes.');
      return;
    }
    try {
      setCallLoading(true);
      await ActivitiesAPI.log({
        college_id: college.id,
        ...callForm
      });
      setIsLogCallOpen(false);
      setCallForm(initialCallState());
      fetchCollegeDetails();
    } catch (err) {
      alert('Failed to log activity: ' + err.message);
    } finally {
      setCallLoading(false);
    }
  };

  // Submit Manual Follow-up Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDueDate) {
      alert('Task title and due date are required.');
      return;
    }
    try {
      setTaskLoading(true);
      await FollowUpsAPI.create({
        college_id: college.id,
        title: taskTitle,
        description: taskDescription,
        due_date: taskDueDate,
        priority: taskPriority,
        contact_person: college.placement_contact_name
      });
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      fetchCollegeDetails();
    } catch (err) {
      alert('Failed to create task: ' + err.message);
    } finally {
      setTaskLoading(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId, isCompleted) => {
    try {
      await FollowUpsAPI.toggleComplete(taskId, !isCompleted);
      fetchCollegeDetails();
    } catch (err) {
      alert('Failed to update task: ' + err.message);
    }
  };

  // Open Reschedule Modal
  const handleOpenReschedule = (task) => {
    setReschedulingTask(task);
    setRescheduleDate(task.due_date);
    setRescheduleReason('');
  };

  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    try {
      setRescheduleLoading(false);
      await FollowUpsAPI.reschedule(reschedulingTask.id, {
        due_date: rescheduleDate,
        reason: rescheduleReason
      });
      setReschedulingTask(null);
      fetchCollegeDetails();
    } catch (err) {
      alert('Failed to reschedule: ' + err.message);
    }
  };

  // Submit Course Proposal
  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!proposalData.title.trim()) {
      alert('Please provide a proposal title.');
      return;
    }
    try {
      setProposalLoading(true);
      await ProposalsAPI.create({
        college_id: college.id,
        ...proposalData
      });
      setIsProposalModalOpen(false);
      fetchCollegeDetails();
    } catch (err) {
      alert('Failed to create proposal: ' + err.message);
    } finally {
      setProposalLoading(false);
    }
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All College Leads</span>
        </button>
      </div>

      {/* College Dossier Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {college.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {college.type} College
              </span>
              <PriorityBadge priority={college.priority} />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap mt-1">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {college.city}, {college.state}
              </span>
              {college.startup_name && (
                <span className="inline-flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  <Building2 className="w-3 h-3" />
                  Introduced by: {college.startup_name}
                </span>
              )}
              {college.lead_source && (
                <span className="text-slate-500">
                  Source: <strong className="text-slate-300">{college.lead_source}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Pipeline Stage Selector & Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Change Stage</span>
              <select
                value={college.status}
                onChange={(e) => handleStageSelect(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs font-semibold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                {PIPELINE_STAGES.map((stg) => (
                  <option key={stg} value={stg}>{stg}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsLogCallOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-colors mt-auto"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Log Interaction</span>
            </button>

            {onOpenEdit && (
              <button
                onClick={() => onOpenEdit(college)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors mt-auto"
              >
                <span>Edit Lead</span>
              </button>
            )}
          </div>
        </div>

        {/* Won or Lost Highlights if applicable */}
        {college.status === 'Won' && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex flex-wrap items-center justify-between gap-3 text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-bold text-sm text-white">Closed Partnership (Won Deal)</span>
                <p className="text-[11px] text-emerald-400/90">
                  Signed Agreement Date: {college.won_agreement_date || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase text-emerald-400/80 block">Agreed Fee / Student</span>
                <span className="font-mono font-bold text-white text-sm">{formatINR(college.won_pricing)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-emerald-400/80 block">Batch Students</span>
                <span className="font-mono font-bold text-white text-sm">{college.won_student_count || 0}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-emerald-400/80 block">Total Contract Value</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatINR((college.won_pricing || 0) * (college.won_student_count || 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        {college.status === 'Lost' && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-white">Deal Marked as Lost</span>
              <p className="text-[11px] text-rose-300/90 mt-0.5">
                Reason Recorded: {college.lost_reason || 'No specific reason entered.'}
              </p>
            </div>
          </div>
        )}

        {/* Contact Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Placement Cell Head</span>
            <span className="font-semibold text-white block">{college.placement_contact_name || 'Not identified'}</span>
            <span className="text-[11px] text-slate-400 block">{college.placement_contact_designation || 'TPO'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Contact Phone & WhatsApp</span>
            {college.placement_contact_phone || college.phone ? (
              <div className="flex items-center gap-2 mt-1">
                <a
                  href={`tel:${college.placement_contact_phone || college.phone}`}
                  className="inline-flex items-center gap-1 font-mono text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  {college.placement_contact_phone || college.phone}
                </a>
                <a
                  href={`https://wa.me/${String(college.placement_contact_phone || college.phone || '').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/30"
                >
                  WhatsApp
                </a>
              </div>
            ) : (
              <span className="text-slate-500">No phone recorded</span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Official / Contact Email</span>
            {college.placement_contact_email || college.official_email ? (
              <a
                href={`mailto:${college.placement_contact_email || college.official_email}`}
                className="text-indigo-400 hover:text-indigo-300 font-medium truncate block mt-1"
              >
                {college.placement_contact_email || college.official_email}
              </a>
            ) : (
              <span className="text-slate-500">No email recorded</span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Website & Student Population</span>
            <div className="flex items-center justify-between mt-1">
              {college.website ? (
                <a
                  href={college.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:underline text-xs"
                >
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-slate-500">No URL</span>
              )}
              <span className="text-slate-300 font-mono">
                {college.student_population ? `${college.student_population.toLocaleString()} Students` : 'Pop. unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Extended notes and branch targets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target BTech Branches & Years</span>
            <p className="text-slate-200">
              <strong className="text-white">Branches:</strong> {college.relevant_branches || 'All Engineering'} | <strong className="text-white">Years:</strong> {college.target_years || '2nd & 3rd year'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Internal College Notes & Syllabus Needs</span>
            <p className="text-slate-300 italic">{college.notes || 'No specific notes recorded.'}</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('activities')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'activities'
              ? 'border-indigo-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>Call & Outreach History</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
            {activities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('followups')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'followups'
              ? 'border-indigo-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Tasks & Follow-ups</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
            {followUps.filter(f => !f.is_completed).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('proposals')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'proposals'
              ? 'border-indigo-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Proposals & Offers</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
            {proposals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-indigo-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4 text-purple-400" />
          <span>Pipeline Stage Audit Trail</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
            {stageHistory.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Activities (Chronological feed) */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Chronological Communication History</h3>
              <p className="text-xs text-slate-400">All phone calls, meetings, WhatsApp notes, questions asked, and objections</p>
            </div>
            <button
              onClick={() => setIsLogCallOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Interaction</span>
            </button>
          </div>

          {activities.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <PhoneCall className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">No calls or outreach logged yet</p>
              <p className="text-xs text-slate-400 mt-1">Log your first call to establish an interaction history.</p>
              <button
                onClick={() => setIsLogCallOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Log First Call</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {activities.map((act) => (
                <div key={act.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-xs space-y-3 shadow-sm hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">
                        {act.channel} interaction with {act.contact_person || 'Contact'}
                      </span>
                      <OutcomeBadge outcome={act.call_outcome} />
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {act.date_time ? act.date_time.replace('T', ' ').slice(0, 16) : ''}
                    </span>
                  </div>

                  <div className="text-slate-200 leading-relaxed text-sm bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <strong className="text-xs uppercase text-slate-400 block mb-1">Conversation Notes:</strong>
                    {act.notes}
                  </div>

                  {/* High Value Specific CRM Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    {act.questions_asked && (
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1 mb-1">
                          <HelpCircle className="w-3 h-3" /> Questions Asked by TPO
                        </span>
                        <p className="text-slate-300">{act.questions_asked}</p>
                      </div>
                    )}

                    {act.objections_raised && (
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3" /> Objections Raised
                        </span>
                        <p className="text-slate-300">{act.objections_raised}</p>
                      </div>
                    )}

                    {act.promised_documents && (
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1 mb-1">
                          <FileCheck className="w-3 h-3" /> Promised Documents / Info
                        </span>
                        <p className="text-slate-300">{act.promised_documents}</p>
                      </div>
                    )}
                  </div>

                  {(act.next_action || act.next_follow_up_date) && (
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-400">
                      <div>
                        {act.next_action && (
                          <span>Next Action: <strong className="text-slate-200">{act.next_action}</strong></span>
                        )}
                      </div>
                      {act.next_follow_up_date && (
                        <div className="text-amber-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Follow-up: {String(act.next_follow_up_date).replace('T', ' ').slice(0, 16)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Follow-ups */}
      {activeTab === 'followups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Tasks & Follow-up Calendar for {college.name}</h3>
              <p className="text-xs text-slate-400">Ensure no promised callback or document delivery is dropped</p>
            </div>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Follow-up Task</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {followUps.map((task) => {
              const isOverdue = new Date(task.due_date) < new Date() && !task.is_completed;
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs flex items-start justify-between gap-3 ${
                    task.is_completed
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : isOverdue
                      ? 'bg-rose-500/5 border-rose-500/40 shadow-sm'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id, task.is_completed)}
                      className={`mt-0.5 p-1 rounded-lg border transition-colors ${
                        task.is_completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-600 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${task.is_completed ? 'line-through text-slate-400' : 'text-white text-sm'}`}>
                          {task.title}
                        </span>
                        <PriorityBadge priority={task.priority} />
                        {isOverdue && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                            Overdue
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-slate-300 mt-1 whitespace-pre-line">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Due: {task.due_date ? String(task.due_date).replace('T', ' ').slice(0, 16) : 'Not set'}
                        </span>
                        {task.rescheduled_from && (
                          <span className="text-amber-400/80">
                            (Rescheduled from {String(task.rescheduled_from).split('T')[0]})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!task.is_completed && (
                    <button
                      onClick={() => handleOpenReschedule(task)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium shrink-0"
                    >
                      Reschedule
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Proposals */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Course Proposals & Commercial Offers</h3>
              <p className="text-xs text-slate-400">Formal syllabi proposals submitted to {college.name}</p>
            </div>
            <button
              onClick={() => setIsProposalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Proposal</span>
            </button>
          </div>

          {proposals.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">No formal proposal created yet</p>
              <p className="text-xs text-slate-400 mt-1">Submit a structured IT course proposal with pricing and student count.</p>
              <button
                onClick={() => setIsProposalModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Create Proposal</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposals.map((prop) => (
                <div key={prop.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{prop.title}</h4>
                      <p className="text-indigo-400 text-xs mt-0.5">{prop.course_name || 'Custom Course Package'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {prop.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 font-mono text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans uppercase">Quoted / Student</span>
                      <span className="font-bold text-white">{formatINR(prop.quoted_price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans uppercase">Students</span>
                      <span className="font-bold text-white">{prop.expected_students}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans uppercase">Deal Value</span>
                      <span className="font-bold text-emerald-400">{formatINR(prop.total_deal_value)}</span>
                    </div>
                  </div>

                  {prop.next_action && (
                    <div className="text-slate-300">
                      <strong className="text-slate-400 uppercase text-[10px] block">Next Action:</strong>
                      {prop.next_action}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Sent: {prop.date_sent || 'Draft'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Stage History Audit Trail */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Pipeline Stage Audit Trail</h3>
            <p className="text-xs text-slate-400">Complete record of pipeline stage movements and timestamps</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            {stageHistory.map((h, idx) => (
              <div key={h.id} className="flex items-start gap-3 relative pb-4 last:pb-0">
                {idx !== stageHistory.length - 1 && (
                  <div className="absolute left-3 top-5 bottom-0 w-0.5 bg-slate-800" />
                )}
                <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-xs shrink-0 z-10">
                  •
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">
                      {h.from_stage ? `${h.from_stage} → ${h.to_stage}` : `Initial stage: ${h.to_stage}`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {h.changed_at ? h.changed_at.replace('T', ' ').slice(0, 16) : ''}
                    </span>
                  </div>
                  {h.notes && <p className="text-slate-300 mt-1">{h.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Call Modal */}
      <Modal
        isOpen={isLogCallOpen}
        onClose={() => setIsLogCallOpen(false)}
        title={`Log Interaction: ${college.name}`}
        subtitle="Every call activity is saved chronologically and never overwrites prior records"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleLogCallSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Communication Channel *</label>
              <select
                value={callForm.channel}
                onChange={(e) => setCallForm({ ...callForm, channel: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Meeting">Meeting (In-person / Virtual)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Contact Person</label>
              <input
                type="text"
                value={callForm.contact_person}
                onChange={(e) => setCallForm({ ...callForm, contact_person: e.target.value })}
                placeholder="e.g. Dr. Ramesh N. Rao"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Call Outcome *</label>
              <select
                value={callForm.call_outcome}
                onChange={(e) => setCallForm({ ...callForm, call_outcome: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Connected">Connected</option>
                <option value="Interested">Interested</option>
                <option value="Meeting Scheduled">Meeting Scheduled</option>
                <option value="Callback Requested">Callback Requested</option>
                <option value="Busy">Busy</option>
                <option value="No Answer">No Answer</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Wrong Number">Wrong Number</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Brief Conversation Notes *</label>
            <textarea
              required
              rows="3"
              value={callForm.notes}
              onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
              placeholder="What was discussed? College reactions, semester timing, current training vendors..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Questions Asked by TPO</label>
              <textarea
                rows="2"
                value={callForm.questions_asked}
                onChange={(e) => setCallForm({ ...callForm, questions_asked: e.target.value })}
                placeholder="Lab slots, reports..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Objections Raised</label>
              <textarea
                rows="2"
                value={callForm.objections_raised}
                onChange={(e) => setCallForm({ ...callForm, objections_raised: e.target.value })}
                placeholder="Price, academic calendar..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Promised Documents</label>
              <textarea
                rows="2"
                value={callForm.promised_documents}
                onChange={(e) => setCallForm({ ...callForm, promised_documents: e.target.value })}
                placeholder="Brochure, syllabus mapping..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Next Action</label>
              <input
                type="text"
                value={callForm.next_action}
                onChange={(e) => setCallForm({ ...callForm, next_action: e.target.value })}
                placeholder="e.g. Follow up on proposal, send curriculum syllabus"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Next Follow-up Date & Time</label>
              <input
                type="datetime-local"
                value={callForm.next_follow_up_date}
                onChange={(e) => setCallForm({ ...callForm, next_follow_up_date: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="create_task"
              checked={callForm.create_task}
              onChange={(e) => setCallForm({ ...callForm, create_task: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="create_task" className="text-slate-300 cursor-pointer">
              Automatically create a follow-up task on my task calendar for this date
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsLogCallOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={callLoading}
              className="px-5 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              {callLoading ? 'Saving...' : 'Save Interaction Log'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stage Transition Modal (Handles Won & Lost details) */}
      <Modal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        title={`Move Lead Stage to "${targetStage}"`}
        subtitle="Preserves previous stage history and enforces required fields"
        maxWidth="max-w-lg"
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
                placeholder="e.g. Budget constraints, existing legacy vendor contract, government procurement tender restrictions..."
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
                    placeholder="120"
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
              placeholder="Why was the stage transitioned?"
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
              {stageLoading ? 'Saving Stage...' : 'Confirm Stage Change'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create Follow-up Task"
        subtitle={`Schedule an action item for ${college.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Send revised timetable for Saturday lab slots"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Due Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Priority</label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="High">🔥 High</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">☕ Low</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description / Action Plan</label>
            <textarea
              rows="2"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Additional details..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={taskLoading}
              className="px-5 py-2 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30"
            >
              {taskLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Task Modal */}
      {reschedulingTask && (
        <Modal
          isOpen={!!reschedulingTask}
          onClose={() => setReschedulingTask(null)}
          title="Reschedule Follow-up Task"
          subtitle={`Current due: ${reschedulingTask.due_date}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmReschedule} className="space-y-3 text-xs">
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
                placeholder="e.g. Placement dean requested callback after campus internal examinations..."
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
                Reschedule
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Proposal Modal */}
      <Modal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        title={`Create Proposal for ${college.name}`}
        subtitle="Link an IT training course and record commercial quote"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateProposal} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Proposal Title *</label>
            <input
              type="text"
              required
              value={proposalData.title}
              onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
              placeholder="e.g. Full Stack MERN Campus Cohort 2026 - 120 Students"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Course from Catalogue</label>
              <select
                value={proposalData.course_id}
                onChange={(e) => {
                  const selectedCourse = coursesList.find(c => String(c.id) === e.target.value);
                  const price = selectedCourse ? selectedCourse.course_fee : proposalData.quoted_price;
                  const students = proposalData.expected_students || 60;
                  setProposalData({
                    ...proposalData,
                    course_id: e.target.value,
                    quoted_price: price,
                    expected_students: students,
                    total_deal_value: (price || 0) * (students || 0)
                  });
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select course...</option>
                {coursesList.map((crs) => (
                  <option key={crs.id} value={crs.id}>{crs.name} ({formatINR(crs.course_fee)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Proposal Status</label>
              <select
                value={proposalData.status}
                onChange={(e) => setProposalData({ ...proposalData, status: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Under Review">Under Review</option>
                <option value="Revised">Revised</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Quoted Price / Student (₹)</label>
              <input
                type="number"
                value={proposalData.quoted_price}
                onChange={(e) => {
                  const p = parseFloat(e.target.value) || 0;
                  setProposalData({
                    ...proposalData,
                    quoted_price: e.target.value,
                    total_deal_value: p * (parseInt(proposalData.expected_students, 10) || 0)
                  });
                }}
                placeholder="4500"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Expected Students</label>
              <input
                type="number"
                value={proposalData.expected_students}
                onChange={(e) => {
                  const s = parseInt(e.target.value, 10) || 0;
                  setProposalData({
                    ...proposalData,
                    expected_students: e.target.value,
                    total_deal_value: (parseFloat(proposalData.quoted_price) || 0) * s
                  });
                }}
                placeholder="60"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Total Deal Value (₹)</label>
              <input
                type="number"
                value={proposalData.total_deal_value}
                onChange={(e) => setProposalData({ ...proposalData, total_deal_value: e.target.value })}
                placeholder="270000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Next Action Required</label>
            <input
              type="text"
              value={proposalData.next_action}
              onChange={(e) => setProposalData({ ...proposalData, next_action: e.target.value })}
              placeholder="e.g. Follow up on academic committee approval"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsProposalModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={proposalLoading}
              className="px-5 py-2 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30"
            >
              {proposalLoading ? 'Saving...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
