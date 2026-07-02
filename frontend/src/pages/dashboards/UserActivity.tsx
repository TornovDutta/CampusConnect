import React from 'react';
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

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
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
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
        Failed to load activity data.
      </div>
    );
  }

  const { activities = [], chart_data = [] } = data;

  return (
    <div className="space-y-6">
      {/* Activity Graph */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Activity Overview</h2>
          </div>
        </div>
        <div className="p-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chart_data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Student" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="College" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Company" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <Activity size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">User Activity Log</h2>
          </div>
        </div>
        <div className="p-0">
          <div className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No recent activity found.
              </div>
            ) : (
              activities.map((activity: any) => (
              <div key={activity.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                <div className={`p-3 rounded-xl flex-shrink-0 ${getBgColor(activity.role)}`}>
                  {getIcon(activity.role)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {activity.user}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500 whitespace-nowrap">
                      <Clock size={14} />
                      {formatDate(activity.time)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{activity.details}</p>
                  <span className="inline-block mt-2 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600">
                    {activity.role}
                  </span>
                </div>
              </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 text-center">
            <button className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
              Load More Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
