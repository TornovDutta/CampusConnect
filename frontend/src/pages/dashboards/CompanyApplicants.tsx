import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, Mail, Calendar, Briefcase } from 'lucide-react';
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
    : applications.filter((app: any) => app.status?.toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={28} className="text-brand-500" /> All Applicants
          </h2>
          <p className="text-slate-500 mt-1">Review candidates and manage recruitment stages</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {['All', 'Applied', 'Shortlisted', 'Selected', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus.toLowerCase() === status.toLowerCase()
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700">No applicants found</h3>
          <p className="text-slate-500 text-sm mt-1">
            {filterStatus === 'All' ? 'Students who apply to your job postings will appear here.' : `No candidates currently under ${filterStatus}.`}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Applied Job</th>
                  <th className="px-6 py-4">College</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status Stage</th>
                  <th className="px-6 py-4 text-right">Update Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app: any) => (
                  <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{app.student_name || 'Candidate'}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {app.student_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={14} className="text-brand-500" />
                        <span>{app.job_title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {app.college_name || 'Registered College'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        app.status === 'selected' ? 'bg-green-50 text-green-700' :
                        app.status === 'shortlisted' ? 'bg-blue-50 text-blue-700' :
                        app.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <select
                          value={app.status}
                          onChange={(e) => updateStatusMutation.mutate({ appId: app._id, status: e.target.value })}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlist</option>
                          <option value="selected">Select / Offer</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
