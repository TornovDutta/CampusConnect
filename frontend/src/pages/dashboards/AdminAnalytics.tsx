import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Users,
  Briefcase,
  FileCheck2,
  TrendingUp,
  Building2,
  GraduationCap,
  AlertTriangle,
  Download,
  Loader2,
  Award,
  CheckCircle2,
  Clock,
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

export default function AdminAnalytics() {
  const [days, setDays] = useState<number>(14);
  const [exporting, setExporting] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminAnalytics', days],
    queryFn: async () => {
      const res = await api.get(`/admin/analytics?days=${days}`);
      return res.data;
    },
  });

  const handleExport = async (resource: 'users' | 'organizations' | 'jobs' | 'issues') => {
    try {
      setExporting(resource);
      const res = await api.get(`/admin/export/${resource}`);
      downloadRowsAsCsv(`campusconnect-${resource}`, res.data.rows || []);
    } catch {
      alert(`Failed to export ${resource}.`);
    } finally {
      setExporting(null);
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
        Failed to load platform analytics.
      </div>
    );
  }

  const ov = data.overview || {};
  const userDistribution = (data.user_distribution || []).filter((d: any) => d.value > 0);
  const dailyTrends = data.daily_trends || [];
  const applicationFunnel = data.application_funnel || [];
  const jobVisibility = data.job_visibility || [];
  const jobEmploymentTypes = data.job_employment_types || [];
  const topColleges = data.top_colleges || [];
  const topCompanies = data.top_companies || [];

  return (
    <div className="space-y-6">
      {/* Header + Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <BarChart3 className="text-brand-500" size={26} />
            Platform Statistics & Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive visual telemetry across users, recruitment funnels, college equity, and platform growth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  days === d ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {(['users', 'organizations', 'jobs', 'issues'] as const).map((res) => (
              <button
                key={res}
                onClick={() => handleExport(res)}
                disabled={exporting === res}
                className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-700 rounded-xl flex items-center gap-1.5 transition-colors capitalize"
                title={`Export ${res} to CSV`}
              >
                {exporting === res ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Users</span>
            <Users size={16} className="text-brand-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 mt-2">{ov.total_users ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {ov.total_students ?? 0} students · {ov.suspended_users ?? 0} suspended
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Colleges</span>
            <GraduationCap size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 mt-2">{ov.total_colleges ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">{ov.approved_students ?? 0} approved students</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Companies</span>
            <Building2 size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 mt-2">{ov.total_companies ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">{ov.approved_companies ?? 0} verified partners</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Jobs</span>
            <Briefcase size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 mt-2">{ov.active_jobs ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">of {ov.total_jobs ?? 0} total postings</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Placement Rate</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{ov.placement_rate ?? 0}%</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {ov.placed_applications ?? 0} / {ov.total_applications ?? 0} applications
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Open Issues</span>
            <AlertTriangle size={16} className={ov.open_issues > 0 ? 'text-red-500' : 'text-emerald-500'} />
          </div>
          <p className={`text-2xl font-extrabold mt-2 ${ov.open_issues > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {ov.open_issues ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{ov.critical_issues ?? 0} critical logged</p>
        </div>
      </div>

      {/* Row 1: Growth Area Chart + User Distribution Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">Platform Growth & Activity Trend</h3>
              <p className="text-xs text-slate-500">Daily logins, new registrations, jobs posted, and student applications ({days} days)</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="logins" name="Logins" stroke="#14b8a6" fill="url(#gradLogins)" strokeWidth={2} />
                <Area type="monotone" dataKey="applications" name="Applications" stroke="#6366f1" fill="url(#gradApps)" strokeWidth={2} />
                <Area type="monotone" dataKey="signups" name="New Signups" stroke="#f59e0b" fill="url(#gradSignups)" strokeWidth={2} />
                <Area type="monotone" dataKey="jobs" name="Jobs Posted" stroke="#ec4899" fill="none" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800">User Role Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Breakdown of all registered accounts</p>
          <div className="h-72 w-full">
            {userDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No user data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={88}
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

      {/* Row 2: Recruitment Funnel + Job Visibility + Employment Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileCheck2 size={18} className="text-indigo-500" />
            Recruitment Pipeline Funnel
          </h3>
          <p className="text-xs text-slate-500 mb-4">Applications across hiring stages</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationFunnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
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

        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800">Job Access Visibility</h3>
          <p className="text-xs text-slate-500 mb-4">Open-to-all vs college-restricted drives</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobVisibility}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
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

        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800">Job Employment Types</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution by contract / role category</p>
          <div className="h-64 w-full">
            {jobEmploymentTypes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No jobs posted yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobEmploymentTypes} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={90} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="value" name="Jobs" fill="#0d9488" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top Colleges vs Top Companies Diagrams */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={18} className="text-blue-500" />
            Top Colleges — Students & Applications
          </h3>
          <p className="text-xs text-slate-500 mb-4">Comparing campus participation across partner institutions</p>
          <div className="h-72 w-full">
            {topColleges.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No college data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topColleges.slice(0, 6)} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="students" name="Students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="applications" name="Applications" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="placements" name="Shortlisted/Placed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Building2 size={18} className="text-purple-500" />
            Top Recruiting Companies
          </h3>
          <p className="text-xs text-slate-500 mb-4">Jobs published vs applications received</p>
          <div className="h-72 w-full">
            {topCompanies.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No company data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCompanies.slice(0, 6)} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total_jobs" name="Total Jobs" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="applications" name="Applications" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hires" name="Offers/Hires" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Mission Feature: College Equity & Placement Readiness Leaderboard */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Award size={18} className="text-brand-500" />
              College Equity & Placement Readiness Leaderboard
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor student approval bottlenecks and equal placement outcomes across all connected campuses.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">College</th>
                <th className="px-6 py-3">Total Students</th>
                <th className="px-6 py-3">Approved</th>
                <th className="px-6 py-3">Pending Backlog</th>
                <th className="px-6 py-3">Applications</th>
                <th className="px-6 py-3">Shortlisted / Placed</th>
                <th className="px-6 py-3">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {topColleges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No colleges registered yet.
                  </td>
                </tr>
              ) : (
                topColleges.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{c.name}</td>
                    <td className="px-6 py-3.5 text-slate-700">{c.students}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 size={13} /> {c.approved_students}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {c.pending_students > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Clock size={12} /> {c.pending_students} waiting
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">{c.applications}</td>
                    <td className="px-6 py-3.5 font-semibold text-brand-700">{c.placements}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${Math.min(100, c.placement_rate)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{c.placement_rate}%</span>
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
