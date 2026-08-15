import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, CheckCircle2, Clock, XCircle, Loader2, Globe, Building, Check, ChevronRight, X } from 'lucide-react';
import { api } from '../../services/api';

export default function StudentDashboard() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['studentDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/student/dashboard-stats');
      return response.data;
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await api.post(`/student/apply/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
      alert('Application submitted successfully!');
      setSelectedJob(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to apply for this job');
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

  const stats = data?.stats || { total_applications: 0, in_review: 0, shortlisted: 0, rejected: 0 };
  const recommended_jobs = data?.recommended_jobs || [];
  const recent_applications = data?.recent_applications || [];
  const isApproved = data?.is_college_approved;

  if (!isApproved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 flex items-center justify-center rounded-full mb-6">
          <Clock size={40} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Waiting for College Approval</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Your account has been created successfully, but you must wait for your selected college's placement cell to approve your profile before you can apply to jobs and view campus drives.
        </p>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-md w-full">
          <p className="text-sm font-medium text-slate-600">
            Status: <span className="text-orange-600">Pending Review</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Applications</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_applications}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-yellow-50 text-yellow-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">In Review</p>
            <p className="text-2xl font-bold text-slate-800">{stats.in_review}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Shortlisted</p>
            <p className="text-2xl font-bold text-slate-800">{stats.shortlisted}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-slate-800">{stats.rejected}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended & Available Jobs */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Available Jobs & Campus Drives</h2>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{recommended_jobs.length} Opportunities</span>
          </div>
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {recommended_jobs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No active job opportunities found right now. Check back later!
              </div>
            ) : (
              recommended_jobs.map((job: any) => (
                <div 
                  key={job.id} 
                  onClick={() => setSelectedJob(job)}
                  className="p-4 border border-slate-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer bg-white flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">{job.employment_type || 'Full-time'}</span>
                      {job.visibility === 'requested_college' ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 inline-flex items-center gap-1">
                          <Building size={11} /> Requested College Drive
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                          <Globe size={11} /> Public Opportunity
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-brand-600 transition-colors">{job.title}</h3>
                    <p className="text-sm text-slate-600 mb-1">{job.company_name || 'Company'} • {job.location}</p>
                    {job.stipend && (
                      <p className="text-xs font-bold text-emerald-600 mt-1">
                        💰 {job.stipend}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                    <span className="text-brand-600 flex items-center gap-0.5">View details <ChevronRight size={14} /></span>
                    {job.has_applied ? (
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                        <Check size={13} /> Applied
                      </span>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                        className="btn-primary text-xs px-3 py-1 h-auto"
                      >
                        {job.apply_type === 'external_link' ? 'View & Apply' : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Your Application History</h2>
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {recent_applications.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                You haven't applied to any jobs yet. Browse available jobs on the left to get started!
              </div>
            ) : (
              recent_applications.map((app: any) => (
                <div key={app.id || app._id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-800">{app.job_title}</h3>
                    <p className="text-sm font-medium text-slate-500">{app.company_name}</p>
                    {app.created_at && (
                      <p className="text-xs text-slate-400 mt-1">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    app.status === 'Shortlisted' || app.status === 'Offer Sent' || app.status === 'Hired' ? 'bg-green-100 text-green-700' :
                    app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status || 'In Review'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
                {selectedJob.working_hours && (
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Working Hours</span>
                    <span className="font-bold text-slate-700">{selectedJob.working_hours}</span>
                  </div>
                )}
                {selectedJob.prerequisites && (Array.isArray(selectedJob.prerequisites) ? selectedJob.prerequisites.length > 0 : !!selectedJob.prerequisites) && (
                  <div className="col-span-2 mt-1">
                    <span className="text-xs text-slate-400 block font-medium mb-1.5">Prerequisites & Eligibility</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(selectedJob.prerequisites) ? (
                        selectedJob.prerequisites.map((req: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs shadow-2xs">
                            ✓ {req}
                          </span>
                        ))
                      ) : (
                        <span className="font-bold text-slate-700">{selectedJob.prerequisites}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2 text-base">Job Description & Responsibilities</h4>
                <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed bg-white p-2 rounded-lg">
                  {selectedJob.description || 'No description provided.'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedJob(null)}
                className="btn-secondary px-6 py-2"
              >
                Close
              </button>
              {selectedJob.has_applied ? (
                <button disabled className="px-6 py-2 bg-green-100 text-green-700 font-bold rounded-xl flex items-center gap-2 cursor-not-allowed">
                  <Check size={18} /> Already Applied
                </button>
              ) : selectedJob.apply_type === 'external_link' ? (
                <a 
                  href={selectedJob.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-8 flex items-center gap-2"
                >
                  Apply on Company Site <Globe size={18} />
                </a>
              ) : (
                <button 
                  onClick={() => applyMutation.mutate(selectedJob.id || selectedJob._id)}
                  disabled={applyMutation.isPending}
                  className="btn-primary px-8 flex items-center gap-2"
                >
                  {applyMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

