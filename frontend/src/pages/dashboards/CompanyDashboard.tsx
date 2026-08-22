import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileSignature, CheckCircle, Plus, Loader2, Globe, Building, X, User, Mail, Calendar } from 'lucide-react';
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
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
        Failed to load dashboard data.
      </div>
    );
  }

  const stats = data?.stats || { active_jobs: 0, total_applications: 0, offers_sent: 0 };
  const recent_jobs = data?.recent_jobs || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Recruitment Overview</h2>
        <button onClick={() => navigate('/dashboard/company/post-job')} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Post New Job
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-xl">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Jobs</p>
            <p className="text-2xl font-bold text-slate-800">{stats.active_jobs}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <FileSignature size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Applications</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_applications}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Offers Sent</p>
            <p className="text-2xl font-bold text-slate-800">{stats.offers_sent}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Job Postings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Job Title</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Visibility</th>
                <th className="px-6 py-3 font-medium">Applications</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No active job postings found. Click "Post New Job" to get started.
                  </td>
                </tr>
              ) : (
                recent_jobs.map((job: any) => (
                  <tr key={job._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{job.title}</td>
                    <td className="px-6 py-4 text-slate-600">{job.location}</td>
                    <td className="px-6 py-4">
                      {job.visibility === 'requested_college' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-md">
                          <Building size={12} /> Requested College ({job.target_colleges?.length || 0})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md">
                          <Globe size={12} /> Public (All Students)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold">{job.applications_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setSelectedJob({ id: job._id, title: job.title })}
                          className="text-brand-600 hover:text-brand-700 font-semibold text-sm hover:underline"
                        >
                          View Candidates ({job.applications_count || 0})
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          onClick={() => navigate(`/dashboard/company/edit-job/${job._id}`)}
                          className="text-slate-600 hover:text-brand-700 font-semibold text-sm hover:underline"
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

      {selectedJob && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Candidates for: {selectedJob.title}</h3>
                <p className="text-sm text-slate-500">Review applicants and update recruitment status</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 space-y-3">
              {isLoadingCandidates ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin text-brand-500" size={28} />
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No students have applied for this position yet.
                </div>
              ) : (
                candidates.map((app: any) => (
                  <div key={app._id} className="p-4 border border-slate-200 rounded-xl hover:border-brand-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <User size={16} className="text-brand-500" /> {app.student_name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" /> {app.student_email}
                      </p>
                      {app.created_at && (
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" /> Applied on {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <select 
                        value={app.status} 
                        onChange={(e) => updateStatusMutation.mutate({ appId: app._id, status: e.target.value })}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-brand-500 cursor-pointer"
                      >
                        <option value="In Review">In Review</option>
                        <option value="Shortlisted">Shortlisted</option>
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
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
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

