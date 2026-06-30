import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function StudentDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['studentDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/student/dashboard-stats');
      return response.data;
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

  const { stats, recommended_jobs, recent_applications } = data;

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
        {/* Recommended Jobs */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recommended Jobs</h2>
          <div className="space-y-4">
            {recommended_jobs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                Complete your profile to see recommended jobs!
              </div>
            ) : (
              recommended_jobs.map((job: any) => (
                <div key={job.id} className="p-4 border border-slate-100 rounded-lg hover:border-brand-200 hover:shadow-md transition-all cursor-pointer">
                  <h3 className="font-bold text-slate-800">{job.title}</h3>
                  <p className="text-sm text-slate-500 mb-3">{job.company} • {job.location}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Applications</h2>
          <div className="space-y-4">
            {recent_applications.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                You haven't applied to any jobs yet.
              </div>
            ) : (
              recent_applications.map((app: any) => (
                <div key={app.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg">
                  <div>
                    <h3 className="font-bold text-slate-800">{app.job_title}</h3>
                    <p className="text-sm text-slate-500">{app.company_name}</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
