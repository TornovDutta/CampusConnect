import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  GraduationCap,
  ShieldAlert,
  Loader2,
  Search,
  Filter,
  Briefcase,
  Bug,
  Megaphone,
  BarChart3,
  CheckCircle2,
  Clock,
  Send,
  Download,
  ArrowRight,
  Radio,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { downloadRowsAsCsv } from '../../utils/csvExport';

const ROLE_COLORS = ['#14b8a6', '#3b82f6', '#a855f7', '#f59e0b'];
const VISIBILITY_COLORS = ['#0d9488', '#6366f1'];
const FUNNEL_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

function ContactSettings() {
  const queryClient = useQueryClient();
  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ['adminContactInfo'],
    queryFn: async () => {
      const response = await api.get('/admin/contact-info');
      return response.data;
    },
  });

  const [form, setForm] = useState({ email: '', phone: '', github: '', linkedin: '' });

  useEffect(() => {
    if (contactInfo) {
      setForm({
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        github: contactInfo.github || '',
        linkedin: contactInfo.linkedin || '',
      });
    }
  }, [contactInfo]);

  const updateMutation = useMutation({
    mutationFn: async (newInfo: any) => {
      await api.put('/admin/contact-info', newInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminContactInfo'] });
      alert('Contact info updated successfully!');
    },
  });

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /></div>;

  return (
    <div className="card p-6 max-w-2xl mx-auto mt-2">
      <h3 className="text-xl font-bold text-slate-800 mb-2">Contact Information Settings</h3>
      <p className="text-slate-500 mb-6 text-sm">Update the contact details displayed in the landing page footer.</p>
      <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="admin@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
          <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+1 234 567 8900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">GitHub Link</label>
          <input type="url" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} className="input-field" placeholder="https://github.com/yourprofile" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn Link</label>
          <input type="url" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} className="input-field" placeholder="https://linkedin.com/in/yourprofile" />
        </div>
        <button type="submit" disabled={updateMutation.isPending} className="btn-primary mt-6 flex items-center gap-2">
          {updateMutation.isPending && <Loader2 className="animate-spin" size={16} />}
          Save Changes
        </button>
      </form>
    </div>
  );
}

function PlatformAnnouncementManager() {
  const queryClient = useQueryClient();
  const { data: banner, isLoading } = useQuery({
    queryKey: ['platformAnnouncement'],
    queryFn: async () => {
      const res = await api.get('/admin/announcement');
      return res.data;
    },
  });

  const [form, setForm] = useState({
    enabled: false,
    title: '',
    message: '',
    variant: 'info',
    target_role: 'all',
  });
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (banner) {
      setForm({
        enabled: !!banner.enabled,
        title: banner.title || '',
        message: banner.message || '',
        variant: banner.variant || 'info',
        target_role: banner.target_role || 'all',
      });
    }
  }, [banner]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put('/admin/announcement', form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformAnnouncement'] });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    },
  });

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline" /></div>;

  const previewStyle =
    form.variant === 'warning'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : form.variant === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
      : 'bg-brand-50 border-brand-200 text-brand-900';

  return (
    <div className="card p-6 max-w-3xl mx-auto mt-2 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Radio size={20} className="text-brand-500" />
            Live Platform Announcement Banner
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Display a highlighted top banner across user dashboards (e.g., mega placement drives, deadlines, or maintenance windows).
          </p>
        </div>

        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${form.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {form.enabled ? 'Live' : 'Hidden'}
          </span>
        </label>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} /> Platform announcement saved!
        </div>
      )}

      {/* Live Preview */}
      <div className={`p-3.5 rounded-xl border text-sm flex items-center gap-3 ${previewStyle}`}>
        <Sparkles size={18} className="shrink-0" />
        <div>
          <span className="font-bold mr-2">{form.title || 'Banner Title Preview'}:</span>
          <span>{form.message || 'Your platform-wide message will appear at the top of targeted dashboards.'}</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
            <select
              value={form.target_role}
              onChange={(e) => setForm({ ...form, target_role: e.target.value })}
              className="input-field text-sm"
            >
              <option value="all">All Portals (Students, Colleges, Companies)</option>
              <option value="student">Students Only</option>
              <option value="college">Colleges Only</option>
              <option value="company">Companies Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Banner Style</label>
            <select
              value={form.variant}
              onChange={(e) => setForm({ ...form, variant: e.target.value })}
              className="input-field text-sm"
            >
              <option value="info">Info (Brand Teal)</option>
              <option value="success">Highlight / Drive Open (Green)</option>
              <option value="warning">Alert / Maintenance (Amber)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field text-sm"
            placeholder="e.g., Spring Placement Drive 2026"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Banner Message</label>
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="input-field text-sm resize-none"
            placeholder="e.g., All final-year students should verify their college approval before Friday 5 PM."
          />
        </div>

        <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2">
          {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
          Save Banner Configuration
        </button>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'announcement' | 'contact'>('overview');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard-stats');
      return response.data;
    },
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['adminAnalytics', 14],
    queryFn: async () => {
      const response = await api.get('/admin/analytics?days=14');
      return response.data;
    },
  });

  const toggleSuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/admin/toggle-suspend/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
  });

  const toggleApproveMutation = useMutation({
    mutationFn: async (orgId: string) => {
      await api.patch(`/admin/approve-organization/${orgId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
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

  const stats = data?.stats || {};
  const organizations = data?.organizations || [];

  const filteredOrganizations = organizations.filter((org: any) => {
    const matchesSearch = (org.name || org.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterRole === 'pending') {
      return matchesSearch && org.is_approved === false;
    }
    const matchesRole = filterRole === 'all' || org.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const userDistribution = (analyticsData?.user_distribution || []).filter((d: any) => d.value > 0);
  const dailyTrends = analyticsData?.daily_trends || [];
  const applicationFunnel = analyticsData?.application_funnel || [];
  const jobVisibility = analyticsData?.job_visibility || [];

  return (
    <div className="space-y-6">
      {/* Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Super Admin Command Center</h2>
          <p className="text-sm text-slate-500">
            Real-time platform statistics, organization governance, custom notifications, and system issue monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/admin/notifications')}
            className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Megaphone size={15} /> Send Notification
          </button>
          <button
            onClick={() => navigate('/dashboard/admin/analytics')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-700 rounded-xl flex items-center gap-1.5"
          >
            <BarChart3 size={15} /> Full Analytics
          </button>
          <button
            onClick={() => navigate('/dashboard/admin/jobs')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-700 rounded-xl flex items-center gap-1.5"
          >
            <Briefcase size={15} /> Moderate Jobs
          </button>
          <button
            onClick={() => navigate('/dashboard/admin/issues')}
            className={`px-3.5 py-2 text-xs font-semibold border rounded-xl flex items-center gap-1.5 ${
              (stats.open_issues || 0) > 0
                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bug size={15} /> Issues ({stats.open_issues || 0})
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="card p-5 flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl shrink-0">
            <Users size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Total Users</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_users || 0}</p>
            <p className="text-[11px] text-slate-400 truncate">{stats.total_students || 0} students</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <GraduationCap size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Colleges</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_colleges || 0}</p>
            <p className="text-[11px] text-slate-400 truncate">Campus partners</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
            <Building2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Companies</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_companies || 0}</p>
            <p className="text-[11px] text-amber-600 truncate">
              {stats.pending_company_approvals || 0} pending verify
            </p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform cursor-pointer" onClick={() => navigate('/dashboard/admin/jobs')}>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Briefcase size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Active Jobs</p>
            <p className="text-2xl font-bold text-slate-800">{stats.active_jobs || 0}</p>
            <p className="text-[11px] text-slate-400 truncate">of {stats.total_jobs || 0} total</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform cursor-pointer" onClick={() => navigate('/dashboard/admin/analytics')}>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Applications</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total_applications || 0}</p>
            <p className="text-[11px] text-emerald-600 truncate">{stats.placed_applications || 0} shortlisted/hired</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-3.5 hover:-translate-y-0.5 transition-transform cursor-pointer" onClick={() => navigate('/dashboard/admin/issues')}>
          <div className={`p-3 rounded-xl shrink-0 ${(stats.open_issues || 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <Bug size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Website Issues</p>
            <p className={`text-2xl font-bold ${(stats.open_issues || 0) > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {stats.open_issues || 0}
            </p>
            <p className="text-[11px] text-slate-400 truncate">Open feature errors</p>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview & Diagrams' },
          { id: 'organizations', label: `Manage Organizations (${organizations.length})` },
          { id: 'announcement', label: 'Platform Announcement' },
          { id: 'contact', label: 'Contact Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 border-b-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Diagram 1: 14-Day Platform Growth Area Chart */}
            <div className="xl:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">14-Day Platform Growth & Activity</h3>
                  <p className="text-xs text-slate-500">Logins, new user signups, and job applications</p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/admin/analytics')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  More Charts <ArrowRight size={14} />
                </button>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashLogins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dashApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="logins" name="Logins" stroke="#14b8a6" fill="url(#dashLogins)" strokeWidth={2} />
                    <Area type="monotone" dataKey="applications" name="Applications" stroke="#6366f1" fill="url(#dashApps)" strokeWidth={2} />
                    <Area type="monotone" dataKey="signups" name="Signups" stroke="#f59e0b" fill="none" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Diagram 2: User Distribution Donut */}
            <div className="card p-6">
              <h3 className="text-base font-bold text-slate-800">User Distribution</h3>
              <p className="text-xs text-slate-500 mb-3">Platform accounts by role</p>
              <div className="h-64 w-full">
                {userDistribution.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={4}
                      >
                        {userDistribution.map((_: any, idx: number) => (
                          <Cell key={idx} fill={ROLE_COLORS[idx % ROLE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diagram 3: Recruitment Pipeline Funnel */}
            <div className="card p-6">
              <h3 className="text-base font-bold text-slate-800">Recruitment Pipeline Status</h3>
              <p className="text-xs text-slate-500 mb-4">Candidate progression across all jobs</p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicationFunnel} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
                      {applicationFunnel.map((_: any, idx: number) => (
                        <Cell key={idx} fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Diagram 4: Job Visibility Split */}
            <div className="card p-6">
              <h3 className="text-base font-bold text-slate-800">Job Visibility (Open vs Targeted)</h3>
              <p className="text-xs text-slate-500 mb-4">Tracking equal-opportunity public drives vs restricted campus drives</p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobVisibility}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={4}
                    >
                      {jobVisibility.map((_: any, idx: number) => (
                        <Cell key={idx} fill={VISIBILITY_COLORS[idx % VISIBILITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'announcement' && <PlatformAnnouncementManager />}

      {activeTab === 'contact' && <ContactSettings />}

      {activeTab === 'organizations' && (
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/50 backdrop-blur-md">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Manage Organizations</h2>
              <p className="text-xs text-slate-500">Approve new corporate accounts, send direct notifications, or suspend accounts.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-56 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full sm:w-44 pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm appearance-none"
                >
                  <option value="all">All Types</option>
                  <option value="college">Colleges</option>
                  <option value="company">Companies</option>
                  <option value="pending">Pending Verification</option>
                </select>
              </div>
              <button
                onClick={() => downloadRowsAsCsv('campusconnect-organizations', filteredOrganizations)}
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Download size={14} /> CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">Organization</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Verification</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No organizations found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrganizations.map((org: any) => (
                    <tr key={org._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/dashboard/admin/organization/${org._id}`)}
                          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline text-left block truncate max-w-[220px]"
                          title={org.name || org.email}
                        >
                          {org.name || org.email}
                        </button>
                        <p className="text-xs text-slate-400 truncate max-w-[220px]">{org.email}</p>
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${org.role === 'college' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {org.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {org.is_approved === false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock size={12} /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {org.is_suspended ? (
                          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 inline-flex items-center gap-1">
                            <ShieldAlert size={12} /> Suspended
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/dashboard/admin/notifications?targetType=${org.role}&targetId=${org._id}`)
                            }
                            className="font-medium text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center gap-1"
                            title="Send custom notification"
                          >
                            <Send size={12} /> Notify
                          </button>

                          <button
                            onClick={() => toggleApproveMutation.mutate(org._id)}
                            disabled={toggleApproveMutation.isPending}
                            className={`font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                              org.is_approved === false
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {org.is_approved === false ? 'Approve' : 'Revoke'}
                          </button>

                          <button
                            onClick={() => toggleSuspendMutation.mutate(org._id)}
                            disabled={toggleSuspendMutation.isPending}
                            className={`font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                              org.is_suspended
                                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                : 'text-red-600 bg-red-50 hover:bg-red-100'
                            }`}
                          >
                            {org.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
