import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, CheckSquare, Plus, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function CollegeDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['collegeDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/college/dashboard-stats');
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

  const { stats, recent_invitations } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Placement Cell Overview</h2>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Students
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Registered Students</p>
            <p className="text-2xl font-bold text-slate-800">{stats.registered_students}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Drive Invitations</p>
            <p className="text-2xl font-bold text-slate-800">{stats.drive_invitations}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Students Placed</p>
            <p className="text-2xl font-bold text-slate-800">{stats.students_placed}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Drive Invitations</h2>
        </div>
        <div className="p-6 space-y-4">
          {recent_invitations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No pending drive invitations from companies.
            </div>
          ) : (
            recent_invitations.map((invite: any) => (
              <div key={invite.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-100 rounded-lg">
                <div className="mb-4 sm:mb-0">
                  <h3 className="font-bold text-slate-800">{invite.title}</h3>
                  <p className="text-sm text-slate-500">{invite.company_name} • {invite.package_details}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary text-sm px-4">Accept</button>
                  <button className="btn-secondary text-sm px-4">Decline</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
