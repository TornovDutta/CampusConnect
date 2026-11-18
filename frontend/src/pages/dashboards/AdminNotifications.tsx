import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Bell,
  User,
  GraduationCap,
  Building2,
  Users,
  Megaphone,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Loader2,
  Search,
  Clock,
  Globe,
} from 'lucide-react';
import { api } from '../../services/api';

type TargetMode = 'specific_user' | 'college' | 'company' | 'role' | 'all';
type CategoryType = 'announcement' | 'update' | 'warning' | 'alert';
type PriorityType = 'normal' | 'high' | 'urgent';

interface RecipientItem {
  id: string;
  name: string;
  email: string;
  role: string;
  is_suspended?: boolean;
}

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [targetType, setTargetType] = useState<TargetMode>('specific_user');
  const [targetId, setTargetId] = useState('');
  const [targetRole, setTargetRole] = useState<'student' | 'college' | 'company'>('student');
  const [includeCollegeStudents, setIncludeCollegeStudents] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<CategoryType>('announcement');
  const [priority, setPriority] = useState<PriorityType>('normal');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const qType = searchParams.get('targetType') as TargetMode | null;
    const qId = searchParams.get('targetId');
    if (qType && ['specific_user', 'college', 'company', 'role', 'all'].includes(qType)) {
      setTargetType(qType);
    }
    if (qId) {
      setTargetId(qId);
    }
  }, [searchParams]);

  const { data: recipientsData, isLoading: loadingRecipients } = useQuery({
    queryKey: ['adminNotificationRecipients'],
    queryFn: async () => {
      const res = await api.get('/admin/recipients');
      return res.data as {
        students: RecipientItem[];
        colleges: RecipientItem[];
        companies: RecipientItem[];
        counts: { students: number; colleges: number; companies: number; all: number };
      };
    },
  });

  const { data: sentHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['adminSentNotifications'],
    queryFn: async () => {
      const res = await api.get('/admin/notifications/sent');
      return res.data as Array<{
        id: string;
        title: string;
        message: string;
        category: string;
        priority: string;
        target_label: string;
        delivered_count: number;
        sender_name: string;
        created_at: string;
      }>;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        target_type: targetType,
        target_id: ['specific_user', 'college', 'company'].includes(targetType) ? targetId : undefined,
        target_role: targetType === 'role' ? targetRole : targetType === 'all' ? 'all' : undefined,
        include_college_students: targetType === 'college' ? includeCollegeStudents : false,
        title,
        message,
        category,
        priority,
      };
      const res = await api.post('/admin/notifications/send', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setFeedback({
        type: 'success',
        text: `${data.message} (${data.delivered_count} recipient${data.delivered_count === 1 ? '' : 's'}).`,
      });
      setTitle('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['adminSentNotifications'] });
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to send notification.',
      });
    },
  });

  const activeList: RecipientItem[] = (() => {
    if (!recipientsData) return [];
    if (targetType === 'specific_user') return recipientsData.students;
    if (targetType === 'college') return recipientsData.colleges;
    if (targetType === 'company') return recipientsData.companies;
    return [];
  })();

  const filteredRecipients = activeList.filter((item) => {
    const q = recipientSearch.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q)
    );
  });

  const selectedRecipient = activeList.find((r) => r.id === targetId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', text: 'Please enter both a title and a message.' });
      return;
    }
    if (['specific_user', 'college', 'company'].includes(targetType) && !targetId) {
      setFeedback({ type: 'error', text: 'Please select a specific recipient from the list.' });
      return;
    }
    sendMutation.mutate();
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-600" />;
      case 'alert':
        return <ShieldAlert size={18} className="text-red-600" />;
      case 'update':
        return <Sparkles size={18} className="text-purple-600" />;
      default:
        return <Megaphone size={18} className="text-indigo-600" />;
    }
  };

  const getCategoryBg = (cat: string) => {
    switch (cat) {
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      case 'alert':
        return 'bg-red-50 border-red-100';
      case 'update':
        return 'bg-purple-50 border-purple-100';
      default:
        return 'bg-indigo-50 border-indigo-100';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <Megaphone className="text-brand-500" size={26} />
          Custom Notification Center
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Send targeted alerts, announcements, or updates directly to a specific student, college, company, or entire role group.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Composer Form */}
        <div className="xl:col-span-2 card p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Send size={18} className="text-brand-500" />
            Compose Notification
          </h3>

          {feedback && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-sm border flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Target Mode Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                1. Choose Target Audience
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { id: 'specific_user', label: 'Specific Student', icon: User, count: recipientsData?.counts.students },
                  { id: 'college', label: 'Specific College', icon: GraduationCap, count: recipientsData?.counts.colleges },
                  { id: 'company', label: 'Specific Company', icon: Building2, count: recipientsData?.counts.companies },
                  { id: 'role', label: 'Role Group', icon: Users, count: undefined },
                  { id: 'all', label: 'All Users', icon: Globe, count: recipientsData?.counts.all },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = targetType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTargetType(opt.id as TargetMode);
                        setTargetId('');
                        setRecipientSearch('');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                        active
                          ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon size={17} />
                        {opt.count !== undefined && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {opt.count}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Recipient Picker */}
            {['specific_user', 'college', 'company'].includes(targetType) && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Select {targetType === 'specific_user' ? 'Student' : targetType === 'college' ? 'College' : 'Company'}
                  </label>
                  {selectedRecipient && (
                    <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                      Selected: {selectedRecipient.name}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    placeholder={`Search by name or email...`}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {loadingRecipients ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading recipients...</div>
                  ) : filteredRecipients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No matching recipients found.</div>
                  ) : (
                    filteredRecipients.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTargetId(item.id)}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between transition-colors ${
                          targetId === item.id
                            ? 'bg-brand-50 text-brand-800'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-slate-400 truncate">{item.email}</p>
                        </div>
                        {targetId === item.id && <CheckCircle2 size={16} className="text-brand-600 shrink-0" />}
                      </button>
                    ))
                  )}
                </div>

                {targetType === 'college' && (
                  <label className="flex items-center gap-2.5 pt-1 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCollegeStudents}
                      onChange={(e) => setIncludeCollegeStudents(e.target.checked)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Also deliver this notification to all students enrolled in this college
                  </label>
                )}
              </div>
            )}

            {/* Role Group Picker */}
            {targetType === 'role' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Select Role Group
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'student', label: 'All Students', count: recipientsData?.counts.students ?? 0 },
                    { id: 'college', label: 'All Colleges', count: recipientsData?.counts.colleges ?? 0 },
                    { id: 'company', label: 'All Companies', count: recipientsData?.counts.companies ?? 0 },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setTargetRole(r.id as 'student' | 'college' | 'company')}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        targetRole === r.id
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.label} ({r.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="input-field text-sm"
                >
                  <option value="announcement">Announcement</option>
                  <option value="update">Platform Update</option>
                  <option value="warning">Warning / Action Needed</option>
                  <option value="alert">Urgent Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityType)}
                  className="input-field text-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Title & Message */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Notification Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Spring Placement Drive Schedule Updated"
                className="input-field text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Message Body
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a clear message for the recipient(s)..."
                className="input-field text-sm resize-none"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sendMutation.isPending}
                className="btn-primary flex items-center gap-2 px-6 py-2.5"
              >
                {sendMutation.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Bell size={16} className="text-brand-500" />
              Live Recipient Preview
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-brand-50/20 flex items-start gap-3">
              <div className={`p-2 rounded-xl border shrink-0 ${getCategoryBg(category)}`}>
                {getCategoryIcon(category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {title.trim() || 'Notification Title Preview'}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">Just now</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                  {message.trim() || 'Your notification message will appear here inside the recipient’s notification bell popover.'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    From Admin
                  </span>
                  {priority === 'urgent' && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      Urgent
                    </span>
                  )}
                  {priority === 'high' && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      High Priority
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
              <p>
                <span className="font-semibold text-slate-700">Target: </span>
                {targetType === 'all'
                  ? `All Platform Users (${recipientsData?.counts.all ?? 0})`
                  : targetType === 'role'
                  ? `All ${targetRole}s`
                  : selectedRecipient
                  ? `${selectedRecipient.name} (${selectedRecipient.email})${
                      targetType === 'college' && includeCollegeStudents ? ' + all its students' : ''
                    }`
                  : 'No recipient selected yet'}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Delivery: </span>
                Instant in-app notification bell (polls every 8s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sent History Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Sent Custom Notifications History</h3>
          <span className="text-xs text-slate-500">{sentHistory.length} recent dispatches</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Notification</th>
                <th className="px-6 py-3">Recipient</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Delivered</th>
                <th className="px-6 py-3">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loadingHistory ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading history...
                  </td>
                </tr>
              ) : sentHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No custom notifications sent yet.
                  </td>
                </tr>
              ) : (
                sentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3.5 max-w-md">
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{item.message}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 font-medium">{item.target_label}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                          item.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : item.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 font-semibold">{item.delivered_count}</td>
                    <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                      </span>
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
