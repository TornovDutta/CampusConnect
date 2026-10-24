import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  LogIn,
  UserPlus,
  ShieldAlert,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  user_id?: string;
  user_name?: string;
  user_role?: string;
  user_email?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Query notifications with periodic refetch (every 8 seconds)
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data as { notifications: NotificationItem[]; unread_count: number };
    },
    refetchInterval: 8000,
    enabled: !!user,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  // Mark single notification read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/notifications');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'login':
        return (
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <LogIn size={18} />
          </div>
        );
      case 'signup':
        return (
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <UserPlus size={18} />
          </div>
        );
      case 'security':
        return (
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <ShieldAlert size={18} />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 shrink-0">
            <Info size={18} />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-500 text-[10px] font-bold text-white items-center justify-center shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-100 text-brand-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="p-1.5 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={15} />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                  className="p-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex px-4 pt-2 border-b border-slate-100 bg-white">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
                filter === 'all'
                  ? 'border-brand-500 text-brand-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all ${
                filter === 'unread'
                  ? 'border-brand-500 text-brand-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Bell size={22} />
                </div>
                <p className="text-sm font-medium text-slate-800">No notifications yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  {filter === 'unread' ? "You're all caught up with unread alerts!" : "We'll notify you when important events occur."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.is_read) {
                      markReadMutation.mutate(notification.id);
                    }
                  }}
                  className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer hover:bg-slate-50/80 ${
                    notification.is_read ? 'bg-white opacity-80' : 'bg-brand-50/20'
                  }`}
                >
                  {getNotificationIcon(notification.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {notification.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock size={11} />
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {notification.message}
                    </p>

                    {notification.user_role && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {notification.user_role.replace('_', ' ')}
                        </span>
                        {!notification.is_read && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-brand-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                            New
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markReadMutation.mutate(notification.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 shrink-0"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center flex items-center justify-between px-4">
            {user?.role === 'super_admin' ? (
              <Link
                to="/dashboard/admin/activity"
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1.5 mx-auto"
              >
                <span>View Full Admin Activity Logs</span>
                <ExternalLink size={12} />
              </Link>
            ) : (
              <Link
                to="/dashboard/settings"
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-slate-600 hover:text-brand-600 mx-auto"
              >
                Notification Preferences
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
