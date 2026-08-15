import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, Mail, Calendar, Briefcase, FileSignature, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';

export default function CompanyApplicants() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('All');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['companyAllApplications'],
    queryFn: async () => {
      const response = await api.get('/company/all-applications');
      return response.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      await api.patch(`/company/applications/${appId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAllApplications'] });
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

  const filteredApplications = filterStatus === 'All' 
    ? applications 
    : applications.filter((app: any) => app.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSignature size={28} className="text-brand-500" /> All Applicants
          </h2>
          <p className="text-slate-500 mt-1">Review candidates across all your job postings</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Filter:</span>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field py-2 pr-10 text-sm font-medium text-slate-700 bg-white shadow-sm"
          >
            <option value="All">All Applicants ({applications.length})</option>
            <option value="Applied">Applied / New</option>
            <option value="In Review">In Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Offer Sent">Offer Sent</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-500 text-sm border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Candidate</th>
                <th className="px-6 py-4 font-medium">Applied For</th>
                <th className="px-6 py-4 font-medium">Applied On</th>
                <th className="px-6 py-4 font-medium">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Users size={32} className="mx-auto text-slate-300 mb-3" />
                    <p>No applicants found matching this criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app: any) => (
                  <tr key={app._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{app.student_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Mail size={12} className="text-slate-400" /> {app.student_email || 'Email not provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-700 flex items-center gap-1.5">
                        <Briefcase size={14} /> {app.job_title}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1" title="Application ID">
                        #{app._id.slice(-6)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <select 
                          value={app.status || 'Applied'} 
                          onChange={(e) => updateStatusMutation.mutate({ appId: app._id, status: e.target.value })}
                          disabled={updateStatusMutation.isPending}
                          className={`appearance-none text-xs font-bold px-4 py-2 pr-8 rounded-lg border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                            app.status === 'Shortlisted' || app.status === 'Offer Sent' || app.status === 'Hired' ? 'bg-green-50 text-green-700 border-green-200' :
                            app.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : 
                            'bg-slate-50 text-slate-700 border-slate-200 hover:border-brand-300'
                          }`}
                        >
                          <option value="Applied">Applied</option>
                          <option value="In Review">In Review</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Offer Sent">Offer Sent</option>
                          <option value="Hired">Hired</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
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
