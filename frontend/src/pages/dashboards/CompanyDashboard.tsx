import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  FileSignature,
  CheckCircle,
  Plus,
  Loader2,
  Globe,
  Building,
  X,
  User,
  Mail,
  Calendar,
  Video,
  MessageSquare,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['companyDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/company/dashboard-stats');
      return response.data;
    }
  });

  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ['jobCandidates', selectedJob?.id],
    queryFn: async () => {
      if (!selectedJob) return [];
      const response = await api.get(`/company/jobs/${selectedJob.id}/candidates`);
      return response.data;
    },
    enabled: !!selectedJob
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      await api.patch(`/company/applications/${appId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobCandidates', selectedJob?.id] });
      queryClient.invalidateQueries({ queryKey: ['companyDashboardStats'] });
      alert('Candidate status updated successfully!');
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
        Failed to load recruitment dashboard data.
      </div>
    );
  }

  const stats = data?.stats || { active_jobs: 0, total_applications: 0, offers_sent: 0 };
  const recent_jobs = data?.recent_jobs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building className="text-brand-600" size={28} />
            Recruiter Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Conduct live technical/behavioral rounds, message applicants, and track your campus hiring pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/company/interviews"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Video size={15} />
            Live Interview Suite
          </Link>
          <button
            onClick={() => navigate('/dashboard/company/post-job')}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus size={16} /> Post New Job
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-brand-500">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Postings</p>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <Briefcase size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{stats.active_jobs}</p>
        </div>

        <Link
          to="/dashboard/company/applicants"
          className="card p-5 border-l-4 border-indigo-500 hover:-translate-y-1 transition-transform"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Applicants</p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">{stats.total_applications}</p>
        </Link>

        <Link
          to="/dashboard/company/interviews"
          className="card p-5 border-l-4 border-purple-500 hover:-translate-y-1 transition-transform"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Interview Suite</p>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Video size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">Active</p>
        </Link>

        <div className="card p-5 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Offers Extended</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{stats.offers_sent}</p>
        </div>
      </div>

      {/* Recruiter Services Launcher Grid */}
      <div className="card p-5 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Recruitment Operations Hub
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Link
            to="/dashboard/company/applicants"
            className="p-3 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <Users size={20} className="mx-auto text-brand-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Monitor Pipeline</p>
            <span className="text-[10px] text-slate-400 block">{stats.total_applications} Candidates</span>
          </Link>

          <Link
            to="/dashboard/company/interviews"
            className="p-3 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <Video size={20} className="mx-auto text-purple-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Live Interview Suite</p>
            <span className="text-[10px] text-slate-400 block">Tech & Behavioral</span>
          </Link>

          <Link
            to="/dashboard/company/messages"
            className="p-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <MessageSquare size={20} className="mx-auto text-blue-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Candidate Messages</p>
            <span className="text-[10px] text-slate-400 block">Direct Channel</span>
          </Link>

          <Link
            to="/dashboard/company/talent-pool"
            className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <Sparkles size={20} className="mx-auto text-emerald-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Talent Pool Search</p>
            <span className="text-[10px] text-slate-400 block">Direct Invites</span>
          </Link>

          <Link
            to="/dashboard/company/analytics"
            className="p-3 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <BarChart3 size={20} className="mx-auto text-amber-600 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Funnel Analytics</p>
            <span className="text-[10px] text-slate-400 block">Conversion Rates</span>
          </Link>

          <Link
            to="/dashboard/company/post-job"
            className="p-3 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 rounded-xl text-center space-y-1.5 transition-all group"
          >
            <Plus size={20} className="mx-auto text-slate-700 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-slate-800">Post a Job</p>
            <span className="text-[10px] text-slate-400 block">Public / Campus</span>
          </Link>
        </div>
      </div>

      {/* Recent Job Postings Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Active Campus Drives & Job Postings</h2>
            <p className="text-xs text-slate-500">Monitor candidate flow per role and review drive statuses.</p>
          </div>
          <Link
            to="/dashboard/company/jobs"
            className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
          >
            Manage All Jobs <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Job Title</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Target & Visibility</th>
                <th className="px-6 py-3.5">Applications</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Recruitment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                    No active job postings found. Click "Post New Job" to initiate a campus recruitment drive.
                  </td>
                </tr>
              ) : (
                recent_jobs.map((job: any) => (
                  <tr key={job._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{job.title}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{job.location}</td>
                    <td className="px-6 py-4">
                      {job.visibility === 'requested_college' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-md">
                          <Building size={11} /> Campus Drive ({job.target_colleges?.length || 0} Colleges)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md">
                          <Globe size={11} /> Public Opportunity
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-black text-sm">{job.applications_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${job.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedJob({ id: job._id, title: job.title })}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-lg transition-colors"
                        >
                          Candidates ({job.applications_count || 0})
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/company/edit-job/${job._id}`)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK CANDIDATES MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Applicants for: {selectedJob.title}</h3>
                <p className="text-xs text-slate-500">Review candidate profiles, schedule interviews, or update status</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 space-y-3">
              {isLoadingCandidates ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin text-brand-600" size={28} />
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No students have applied for this position yet.
                </div>
              ) : (
                candidates.map((app: any) => (
                  <div key={app._id} className="p-4 border border-slate-200 rounded-xl hover:border-brand-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <User size={15} className="text-brand-600" /> {app.student_name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Mail size={13} className="text-slate-400" /> {app.student_email}
                      </p>
                      {app.created_at && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" /> Applied on {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/company/interviews?appId=${app._id}`}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg flex items-center gap-1"
                      >
                        <Video size={13} />
                        Interview
                      </Link>

                      <Link
                        to={`/dashboard/company/messages?appId=${app._id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1"
                      >
                        <MessageSquare size={13} />
                        Chat
                      </Link>

                      <select
                        value={app.status}
                        onChange={(e) => updateStatusMutation.mutate({ appId: app._id, status: e.target.value })}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
                      >
                        <option value="In Review">In Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Technical Passed">Technical Passed</option>
                        <option value="Behavioral Passed">Behavioral Passed</option>
                        <option value="Offer Sent">Offer Sent</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
