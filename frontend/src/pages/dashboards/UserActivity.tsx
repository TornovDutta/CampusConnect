import { useQuery } from '@tanstack/react-query';
import { Activity, User, Building2, GraduationCap, Clock, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../../services/api';

export default function UserActivity() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminUserActivity'],
    queryFn: async () => {
      const response = await api.get('/admin/activity');
      return response.data;
    }
  });

  const getIcon = (role: string) => {
    switch (role) {
      case 'college': return <GraduationCap size={16} className="text-blue-600" />;
      case 'company': return <Building2 size={16} className="text-purple-600" />;
      default: return <User size={16} className="text-brand-600" />;
    }
  };

  const getBgColor = (role: string) => {
    switch (role) {
      case 'college': return 'bg-blue-50';
      case 'company': return 'bg-purple-50';
      default: return 'bg-brand-50';
    }
  };

  const getBadgeColor = (role: string) => {
    switch (role) {
      case 'college': return 'bg-blue-100 text-blue-800';
      case 'company': return 'bg-purple-100 text-purple-800';
      default: return 'bg-teal-100 text-teal-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load activity logs.
      </div>
    );
  }

  const { activities, chart_data } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Activity size={28} className="text-brand-500" /> Platform Activity Logs
        </h2>
        <p className="text-slate-500 mt-1">Real-time overview of users joining and logging into CampusConnect</p>
      </div>

      {/* Analytics Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BarChart3 size={20} className="text-slate-400" /> Last 7 Days Engagement
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Student" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="College" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Company" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Activity Stream */}
      <div className="card">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Recent User Actions</h3>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">Live Feed</span>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No activity recorded yet.</div>
          ) : (
            activities.map((act: any) => (
              <div key={act.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${getBgColor(act.role)}`}>
                    {getIcon(act.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{act.user}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getBadgeColor(act.role)}`}>
                        {act.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{act.details}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  <span>{new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
