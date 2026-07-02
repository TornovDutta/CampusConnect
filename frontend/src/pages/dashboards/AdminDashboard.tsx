import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Building2, GraduationCap, ShieldAlert, Loader2, X, Search, Filter } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard-stats');
      return response.data;
    }
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/admin/toggle-suspend/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      setSelectedOrg(null); // Close modal if state changes
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

  const stats = data?.stats || { total_users: 0, total_colleges: 0, total_companies: 0 };
  const organizations = data?.organizations || [];

  const filteredOrganizations = organizations.filter((org: any) => {
    const matchesSearch = (org.name || org.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || org.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Users</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_users || 0}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Colleges</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_colleges || 0}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Companies</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_companies || 0}</p>
          </div>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 backdrop-blur-md">
          <h2 className="text-lg font-bold text-slate-800">Manage Organizations</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search organizations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full sm:w-40 pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm appearance-none"
              >
                <option value="all">All Types</option>
                <option value="college">College</option>
                <option value="company">Company</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="bg-slate-50/50 text-slate-500 text-sm">
              <tr>
                <th className="w-1/3 px-6 py-3 font-medium">Organization Name</th>
                <th className="w-1/4 px-6 py-3 font-medium">Type</th>
                <th className="w-1/4 px-6 py-3 font-medium">Status</th>
                <th className="w-1/4 px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No organizations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrganizations.map((org: any) => (
                  <tr key={org._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/dashboard/admin/organization/${org._id}`)}
                        className="font-medium text-brand-600 hover:text-brand-700 hover:underline text-left block w-full truncate max-w-[200px]"
                        title={org.name || org.email}
                      >
                        {org.name || org.email}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-600 capitalize">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${org.role === 'college' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {org.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {org.is_suspended ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 flex items-center w-fit gap-1">
                          <ShieldAlert size={12} /> Suspended
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => toggleSuspendMutation.mutate(org._id)}
                        disabled={toggleSuspendMutation.isPending}
                        className={`font-medium text-sm px-3 py-1.5 rounded-lg transition-colors ${
                          org.is_suspended 
                          ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                          : 'text-red-600 bg-red-50 hover:bg-red-100'
                        }`}
                      >
                        {org.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
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
