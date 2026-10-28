import React, { useState, useEffect } from 'react';
import { CoursesAPI } from '../services/api';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Clock, 
  Layers, 
  Award, 
  Users, 
  FileCheck, 
  ShieldCheck, 
  ExternalLink,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { Modal, ConfirmModal } from '../components/Modal';

export function Courses({ onSelectCourseForProposal }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState(initialFormState());
  const [formLoading, setFormLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const CATEGORIES = [
    'Full Stack Web Development',
    'AI & Machine Learning',
    'Data Science & Analytics',
    'Cloud & DevOps',
    'Cyber Security',
    'Mobile App Development',
    'Core CS & DSA',
    'Other'
  ];

  function initialFormState() {
    return {
      name: '',
      category: 'Full Stack Web Development',
      description: '',
      duration: '60 Hours (8 Weeks)',
      delivery_format: 'Hybrid',
      syllabus_link: '',
      certificate_details: 'Certificate of Industry Mastery in Advanced Web Engineering',
      course_fee: 4500,
      fee_model: 'Per Student',
      min_batch_size: 60,
      placement_guidance: 'Resume ATS screening, mock interviews by senior engineers, and GitHub repo reviews.',
      approved_claims: '100% hands-on project portfolio; 4 real-world repo submissions; no unverified job placement guarantees.',
      is_active: 1
    };
  }

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (categoryFilter !== 'All') params.category = categoryFilter;
      const res = await CoursesAPI.list(params);
      setCourses(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch course catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [categoryFilter]);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData(initialFormState());
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (crs, e) => {
    if (e) e.stopPropagation();
    setEditingCourse(crs);
    setFormData({
      name: crs.name || '',
      category: crs.category || 'Full Stack Web Development',
      description: crs.description || '',
      duration: crs.duration || '',
      delivery_format: crs.delivery_format || 'Hybrid',
      syllabus_link: crs.syllabus_link || '',
      certificate_details: crs.certificate_details || '',
      course_fee: crs.course_fee || 0,
      fee_model: crs.fee_model || 'Per Student',
      min_batch_size: crs.min_batch_size || 30,
      placement_guidance: crs.placement_guidance || '',
      approved_claims: crs.approved_claims || '',
      is_active: crs.is_active !== undefined ? crs.is_active : 1
    });
    setIsAddEditOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Course name and description are required.');
      return;
    }
    try {
      setFormLoading(true);
      if (editingCourse) {
        await CoursesAPI.update(editingCourse.id, formData);
      } else {
        await CoursesAPI.create(formData);
      }
      setIsAddEditOpen(false);
      fetchCourses();
    } catch (err) {
      alert('Failed to save course: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await CoursesAPI.delete(courseToDelete.id);
      setIsDeleteOpen(false);
      setCourseToDelete(null);
      fetchCourses();
    } catch (err) {
      alert('Failed to delete course: ' + err.message);
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
            <span>IT Training Course Catalogue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
              Industry Standardized
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified technical modules, fee structures, minimum batch sizes, and approved claims for BTech engineering colleges.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setCategoryFilter('All')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
            categoryFilter === 'All' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Domains ({courses.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              categoryFilter === cat ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          Loading course specifications...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-sm text-rose-400">{error}</div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">No courses in this category</p>
          <p className="text-xs text-slate-400 mt-1">Create your first industry-grade IT curriculum.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((crs) => (
            <div
              key={crs.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                      {crs.category}
                    </span>
                    <h3 className="font-bold text-white text-base leading-tight mt-0.5">
                      {crs.name}
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                    {formatINR(crs.course_fee)} / std
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {crs.description}
                </p>

                {/* Key Spec Badges */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 text-[11px] text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Duration</span>
                    <strong className="text-white font-mono">{crs.duration}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Delivery Format</span>
                    <strong className="text-white">{crs.delivery_format}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Min Batch Size</span>
                    <strong className="text-white font-mono">{crs.min_batch_size} students</strong>
                  </div>
                </div>

                {/* Certification & Guidance */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Certification:</strong> {crs.certificate_details}
                    </div>
                  </div>

                  {crs.placement_guidance && (
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Placement Guidance:</strong> {crs.placement_guidance}
                      </div>
                    </div>
                  )}

                  {crs.approved_claims && (
                    <div className="p-2 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-[11px] text-indigo-300 flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-indigo-200">Approved Claims & Limitations:</strong> {crs.approved_claims}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {crs.syllabus_link && (
                    <a
                      href={crs.syllabus_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:underline text-[11px]"
                    >
                      <span>View Syllabus</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <span className="text-slate-500 text-[11px]">
                    {crs.proposals_count || 0} proposals sent
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleOpenEdit(crs, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Edit Course"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setCourseToDelete(crs); setIsDeleteOpen(true); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingCourse ? `Edit Course: ${editingCourse.name}` : 'Add Industry IT Course'}
        subtitle="Standardize pricing, delivery requirements, and placement commitments"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveCourse} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Applied Generative AI & Machine Learning with Python"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Technology Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Delivery Format</label>
              <select
                value={formData.delivery_format}
                onChange={(e) => setFormData({ ...formData, delivery_format: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Hybrid">Hybrid (Hands-on Lab + Virtual)</option>
                <option value="Online Live">Online Live</option>
                <option value="Offline Bootcamp">Offline Bootcamp (On-Campus)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Course Curriculum Description *</label>
            <textarea
              required
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed tech stack covered, capstone projects, lab architecture..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Duration *</label>
              <input
                type="text"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g. 60 Hours (8 Weeks)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Course Fee / Student (₹) *</label>
              <input
                type="number"
                required
                value={formData.course_fee}
                onChange={(e) => setFormData({ ...formData, course_fee: e.target.value })}
                placeholder="4500"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Min Batch Size</label>
              <input
                type="number"
                value={formData.min_batch_size}
                onChange={(e) => setFormData({ ...formData, min_batch_size: e.target.value })}
                placeholder="60"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Certificate Issuer & Credentials *</label>
            <input
              type="text"
              required
              value={formData.certificate_details}
              onChange={(e) => setFormData({ ...formData, certificate_details: e.target.value })}
              placeholder="e.g. Certificate of Mastery co-issued with TechSprout AI Labs"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Included Placement Guidance</label>
            <textarea
              rows="2"
              value={formData.placement_guidance}
              onChange={(e) => setFormData({ ...formData, placement_guidance: e.target.value })}
              placeholder="Mock technical interviews, resume ATS screening, company referrals..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Approved Claims & Limitations</label>
            <textarea
              rows="2"
              value={formData.approved_claims}
              onChange={(e) => setFormData({ ...formData, approved_claims: e.target.value })}
              placeholder="Never make fake promises of 100% placement guarantees..."
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
              {formLoading ? 'Saving...' : (editingCourse ? 'Update Course' : 'Save Course')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        message={`Are you sure you want to delete "${courseToDelete?.name}"?`}
        confirmText="Delete Course"
        confirmColor="rose"
      />
    </div>
  );
}
