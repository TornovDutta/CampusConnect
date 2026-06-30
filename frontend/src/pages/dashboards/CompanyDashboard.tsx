import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, FileSignature, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function CompanyDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['companyDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/company/dashboard-stats');
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

  const stats = data?.stats || { active_jobs: 0, total_applications: 0, offers_sent: 0 };
  const recent_jobs = data?.recent_jobs || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Recruitment Overview</h2>
        <button className="btn-primary flex items-center gap-2">
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
                <th className="px-6 py-3 font-medium">Applications</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent_jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No active job postings found. Click "Post New Job" to get started.
                  </td>
                </tr>
              ) : (
                recent_jobs.map((job: any) => (
                  <tr key={job._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{job.title}</td>
                    <td className="px-6 py-4 text-slate-600">{job.location}</td>
                    <td className="px-6 py-4 text-slate-600">{job.applications_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-brand-600 hover:text-brand-700 font-medium text-sm mr-3">View Candidates</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
