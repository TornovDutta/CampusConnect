import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Globe,
  Building,
  Check,
  ChevronRight,
  X,
  Video,
  FileText,
  Calendar,
  MessageSquare,
  Bell,
  Star,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function StudentDashboard() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [eligibilityJob, setEligibilityJob] = useState<any | null>(null);
  const [activeJobTab, setActiveJobTab] = useState<'all' | 'drives' | 'saved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Application Modal state
  const [applyingJob, setApplyingJob] = useState<any | null>(null);
  const [coverNote, setCoverNote] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['studentDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/student/dashboard-stats');
      return response.data;
    }
  });

  // Eligibility check query
  const { data: eligibilityData, isLoading: loadingEligibility } = useQuery({
    queryKey: ['jobEligibility', eligibilityJob?.id],
    queryFn: async () => {
      if (!eligibilityJob?.id) return null;
      const res = await api.get(`/student/eligibility-check/${eligibilityJob.id}`);
      return res.data;
    },
    enabled: !!eligibilityJob?.id
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async ({ jobId, note }: { jobId: string; note: string }) => {
      await api.post(`/student/apply/${jobId}`, {
        cover_note: note,
        resume_url: data?.has_resume ? data.resume_url : undefined,
        resume_filename: data?.resume_filename || 'Master_Resume.pdf'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['studentApplications'] });
      alert('Application submitted successfully! Recruiter and placement cell have been notified.');
      setApplyingJob(null);
      setCoverNote('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to apply for this job');
    }
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await api.post(`/student/jobs/${jobId}/bookmark`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
        Failed to load dashboard data.
      </div>
    );
  }

  const stats = data?.stats || {
    total_applications: 0,
    in_review: 0,
    shortlisted: 0,
    rejected: 0,
    interviews_scheduled: 0,
    offers_received: 0,
    bookmarked_jobs: 0
  };

  const recommended_jobs = data?.recommended_jobs || [];
  const recent_applications = data?.recent_applications || [];
  const upcomingInterview = data?.upcoming_interview;
  const isApproved = data?.is_college_approved;

  if (!isApproved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 flex items-center justify-center rounded-full mb-6">
          <Clock size={40} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Waiting for College Approval</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Your account has been created successfully, but your college placement cell must review and approve your profile before you can apply to campus drives and view confidential job criteria.
        </p>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md w-full space-y-2">
          <p className="text-sm font-semibold text-slate-700">
            Institutional Status: <span className="text-orange-600">Pending Review</span>
          </p>
          <p className="text-xs text-slate-500">
            You can still update your resume and practice with mock interview questions!
          </p>
        </div>
        <div className="mt-6 flex gap-3">
          <Link
            to="/dashboard/student/resume"
            className="px-4 py-2 bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-sm"
          >
            Upload Resume
          </Link>
          <Link
            to="/dashboard/student/interviews"
            className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
          >
            Practice Mock Interviews
          </Link>
        </div>
      </div>
    );
  }

  // Filter jobs by tab & search query
  const filteredJobs = recommended_jobs.filter((j: any) => {
    if (activeJobTab === 'drives' && j.visibility !== 'requested_college') return false;
    if (activeJobTab === 'saved' && !j.is_bookmarked) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (j.title || '').toLowerCase().includes(q) ||
      (j.company_name || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Upcoming Interview Alert */}
      {upcomingInterview && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold">
              <Video size={13} />
              Upcoming Live Interview
            </div>
            <h3 className="text-lg font-bold">
              {upcomingInterview.job_title} at {upcomingInterview.company_name}
            </h3>
            <p className="text-xs text-purple-200 flex items-center gap-3">
              <span>Date: <strong>{upcomingInterview.interview_date}</strong></span>
              <span>Time: <strong>{upcomingInterview.interview_time || '10:00 AM'}</strong></span>
              <span>Mode: <strong>{upcomingInterview.interview_mode}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {upcomingInterview.interview_link && (
              <a
                href={upcomingInterview.interview_link}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
              >
                <Video size={15} />
                Join Virtual Meeting
              </a>
            )}
            <Link
              to="/dashboard/student/interviews"
              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-300/30 text-white font-semibold text-xs rounded-xl"
            >
              View Room & Tips
            </Link>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link
          to="/dashboard/student/applications"
          className="card p-5 hover:-translate-y-1 transition-transform border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Apps</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stats.total_applications}</p>
        </Link>

        <Link
          to="/dashboard/student/applications?status=In%20Review"
          className="card p-5 hover:-translate-y-1 transition-transform border-l-4 border-amber-500"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Review</p>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{stats.in_review}</p>
        </Link>

        <Link
          to="/dashboard/student/interviews"
          className="card p-5 hover:-translate-y-1 transition-transform border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Interviews</p>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Video size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{stats.interviews_scheduled}</p>
        </Link>

        <Link
          to="/dashboard/student/applications?status=Offer%20Sent"
          className="card p-5 hover:-translate-y-1 transition-transform border-l-4 border-emerald-500"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Job Offers</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{stats.offers_received}</p>
        </Link>

        <div
          onClick={() => setActiveJobTab('saved')}
          className="card p-5 hover:-translate-y-1 transition-transform border-l-4 border-yellow-500 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Saved Jobs</p>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Star size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-yellow-600 mt-2">{stats.bookmarked_jobs}</p>
        </div>
      </div>

      {/* Student Services Quick Launcher Grid */}
      <div className="card p-5 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Student Placement Services Hub
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Link
            to="/dashboard/student/applications"
            className="p-3 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <Briefcase size={20} className="mx-auto text-brand-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Track Pipeline</p>
            <span className="text-[10px] text-slate-400 block">{stats.total_applications} Active</span>
          </Link>

          <Link
            to="/dashboard/student/interviews"
            className="p-3 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <Video size={20} className="mx-auto text-purple-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Interview Room</p>
            <span className="text-[10px] text-slate-400 block">Mock Practice</span>
          </Link>

          <Link
            to="/dashboard/student/resume"
            className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <FileText size={20} className="mx-auto text-emerald-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Resume & ATS</p>
            <span className="text-[10px] text-slate-400 block">
              {data.has_resume ? 'Verified' : 'Upload Required'}
            </span>
          </Link>

          <Link
            to="/dashboard/student/calendar"
            className="p-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <Calendar size={20} className="mx-auto text-blue-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Deadlines & Cal</p>
            <span className="text-[10px] text-slate-400 block">Sync to iCal</span>
          </Link>

          <Link
            to="/dashboard/student/messages"
            className="p-3 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group relative"
          >
            {data.unread_messages_count > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
            )}
            <MessageSquare size={20} className="mx-auto text-amber-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Message College</p>
            <span className="text-[10px] text-slate-400 block">Placement Desk</span>
          </Link>

          <Link
            to="/dashboard/student/notifications"
            className="p-3 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group relative"
          >
            {data.unread_notifications_count > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
            )}
            <Bell size={20} className="mx-auto text-rose-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Notifications</p>
            <span className="text-[10px] text-slate-400 block">
              {data.unread_notifications_count} New Alerts
            </span>
          </Link>
        </div>
      </div>

      {/* Main Content Area: Left (Jobs Catalog) + Right (Pipeline Snippet) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Available Opportunities */}
        <div className="lg:col-span-2 card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Campus Drives & Opportunities</h2>
              <p className="text-xs text-slate-500">Filtered specifically to match your college and profile criteria.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveJobTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeJobTab === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({recommended_jobs.length})
              </button>
              <button
                onClick={() => setActiveJobTab('drives')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeJobTab === 'drives'
                    ? 'bg-white text-purple-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Campus Drives
              </button>
              <button
                onClick={() => setActiveJobTab('saved')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeJobTab === 'saved'
                    ? 'bg-white text-yellow-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Saved ⭐
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search drives by role, skills, or company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Jobs Listing */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm space-y-2">
                <Briefcase className="mx-auto text-slate-300" size={36} />
                <p className="font-semibold text-slate-700">No matching jobs found</p>
                <p className="text-xs text-slate-400">Try adjusting your search terms or filter tab.</p>
              </div>
            ) : (
              filteredJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="p-4 border border-slate-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition-all bg-white flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {job.employment_type || 'Full-time'}
                        </span>

                        {job.visibility === 'requested_college' ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 inline-flex items-center gap-1">
                            <Building size={11} /> Campus Drive
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                            <Globe size={11} /> Public Opportunity
                          </span>
                        )}
                      </div>

                      {/* Bookmark Button */}
                      <button
                        onClick={() => bookmarkMutation.mutate(job.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          job.is_bookmarked
                            ? 'text-yellow-500 bg-yellow-50'
                            : 'text-slate-300 hover:text-yellow-500 hover:bg-slate-50'
                        }`}
                        title={job.is_bookmarked ? 'Remove from saved' : 'Save job'}
                      >
                        <Star size={16} fill={job.is_bookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {job.company_name || 'Tech Company'} • {job.location}
                    </p>

                    {job.stipend && (
                      <p className="text-xs font-bold text-emerald-600 mt-1">
                        💰 {job.stipend}
                      </p>
                    )}

                    {/* Criteria Tags */}
                    {Array.isArray(job.college_criteria_tags) && job.college_criteria_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.college_criteria_tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEligibilityJob(job)}
                        className="text-xs font-semibold text-slate-600 hover:text-brand-600 flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        Check Criteria
                      </button>
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="text-xs font-semibold text-brand-600 flex items-center gap-0.5"
                      >
                        Details <ChevronRight size={13} />
                      </button>
                    </div>

                    {job.has_applied ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg flex items-center gap-1">
                        <Check size={13} /> Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => setApplyingJob(job)}
                        className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-sm"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Applications & Pipeline Highlights */}
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Recent Applications</h3>
              <Link
                to="/dashboard/student/applications"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
              >
                View Tracker <ArrowRight size={13} />
              </Link>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {recent_applications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  You haven't submitted any applications yet. Choose an opportunity on the left to apply!
                </div>
              ) : (
                recent_applications.map((app: any) => (
                  <div
                    key={app.id || app._id}
                    className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-slate-900">{app.job_title}</h4>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          app.status === 'Shortlisted' || app.status === 'Offer Sent' || app.status === 'Selected'
                            ? 'bg-emerald-100 text-emerald-700'
                            : app.status === 'Interview Scheduled'
                            ? 'bg-purple-100 text-purple-700'
                            : app.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status || 'In Review'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">{app.company_name}</p>

                    {app.interview_date && (
                      <div className="pt-1 text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                        <Clock size={12} /> Interview: {app.interview_date}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedJob.visibility === 'requested_college' ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 inline-flex items-center gap-1">
                      <Building size={12} /> Campus Drive (Requested College)
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                      <Globe size={12} /> Public Opportunity (Open to all students)
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{selectedJob.title}</h3>
                <p className="text-slate-600 font-medium">{selectedJob.company_name || 'Company'} • {selectedJob.location}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="py-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Employment Type</span>
                  <span className="font-bold text-slate-700">{selectedJob.employment_type || 'Full-time'} ({selectedJob.job_type || 'Paid'})</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Compensation / Stipend</span>
                  <span className="font-bold text-emerald-600">{selectedJob.stipend || 'Competitive'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">About the Role</h4>
                <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{selectedJob.description}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              {!selectedJob.has_applied ? (
                <button
                  onClick={() => {
                    const j = selectedJob;
                    setSelectedJob(null);
                    setApplyingJob(j);
                  }}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Apply for this Role
                </button>
              ) : (
                <span className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1">
                  <Check size={14} /> Already Applied
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ELIGIBILITY CHECK MODAL */}
      {eligibilityJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-brand-600" />
                Eligibility Breakdown
              </h3>
              <button onClick={() => setEligibilityJob(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {loadingEligibility ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-brand-600" size={28} />
              </div>
            ) : eligibilityData ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  eligibilityData.is_eligible
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {eligibilityData.is_eligible ? (
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle size={24} className="text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {eligibilityData.is_eligible ? 'You Meet All Eligibility Requirements!' : 'Eligibility Criteria Mismatch'}
                    </h4>
                    <p className="text-xs mt-0.5">
                      {eligibilityData.is_eligible
                        ? 'Your academic credentials qualify you to apply for this position.'
                        : eligibilityData.reason || 'You do not meet the minimum college criteria.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Criteria Comparison:
                  </span>
                  {(eligibilityData.criteria_checks || []).map((c: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{c.criterion}</span>
                        <span className="text-slate-500 text-[11px]">Required: {c.required} | Yours: {c.actual}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        c.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {c.passed ? 'Passed ✓' : 'Failed ✕'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setEligibilityJob(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK APPLY MODAL */}
      {applyingJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Apply for {applyingJob.title}</h3>
                <p className="text-xs text-slate-500">{applyingJob.company_name} • {applyingJob.location}</p>
              </div>
              <button onClick={() => setApplyingJob(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Resume Selection */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-xs font-bold text-slate-700 block">Attached Resume</span>
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <FileText size={14} className="text-brand-600" />
                {data.resume_filename || 'Default Profile Master Resume.pdf'}
              </p>
              <Link
                to="/dashboard/student/resume"
                className="text-[11px] text-brand-600 hover:underline inline-block pt-1 font-semibold"
              >
                Change or upload different version &rarr;
              </Link>
            </div>

            {/* Cover Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cover Note to Recruiter (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Highlight your key achievements, relevant projects, or why you are excited about this opportunity..."
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setApplyingJob(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={applyMutation.isPending}
                onClick={() => applyMutation.mutate({ jobId: applyingJob.id, note: coverNote })}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {applyMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Confirm & Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
