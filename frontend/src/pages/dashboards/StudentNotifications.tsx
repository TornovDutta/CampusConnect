import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Briefcase,
  Video,
  Megaphone,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Building,
  CheckCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function StudentNotifications() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'application' | 'announcement' | 'college_message'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['studentNotifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    }
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
    }
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  const filteredNotifications = notifications.filter((n: any) => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <Briefcase className="text-blue-600" size={18} />;
      case 'interview':
        return <Video className="text-purple-600" size={18} />;
      case 'college_message':
        return <Building className="text-emerald-600" size={18} />;
      case 'announcement':
      default:
        return <Megaphone className="text-amber-600" size={18} />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="text-brand-600" size={28} />
            Notifications & Broadcasts
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-brand-600 text-white text-xs font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status alerts on your applications, scheduled interviews, and placement announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold w-fit">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'application', label: 'Applications' },
          { id: 'college_message', label: 'College Placement' },
          { id: 'announcement', label: 'Announcements' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === t.id
                ? 'bg-white text-brand-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-lg font-bold text-slate-800">No notifications</h3>
          <p className="text-xs text-slate-500 mt-1">
            You're all caught up! New placement updates and drive announcements will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n: any) => {
            const isUnread = !n.is_read;
            return (
              <div
                key={n.id}
                className={`card p-4 transition-all flex items-start justify-between gap-4 border ${
                  isUnread
                    ? 'bg-brand-50/20 border-brand-200 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-brand-600" />
                      )}
                      {n.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold text-[10px] rounded">
                          High Priority
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {n.created_at ? new Date(n.created_at).toLocaleString() : 'Recently'}
                      </span>
                      {n.sender_name && (
                        <span>From: <strong>{n.sender_name}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isUnread && (
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      title="Mark as read"
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-brand-600 rounded-lg transition-colors"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotificationMutation.mutate(n.id)}
                    title="Dismiss notification"
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
