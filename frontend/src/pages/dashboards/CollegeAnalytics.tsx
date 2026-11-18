import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  AlertTriangle,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  GraduationCap,
  ArrowRight,
  Loader2,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
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

const ENGAGEMENT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
const FUNNEL_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function CollegeAnalytics() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['collegeAnalytics'],
    queryFn: async () => {
      const res = await api.get('/college/analytics');
      return res.data;
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
        Failed to load college analytics.
      </div>
    );
  }

  const ov = data.overview || {};
  const funnel = data.funnel || [];
  const engagement = (data.engagement_breakdown || []).filter((d: any) => d.value > 0);
  const byBranch = data.by_branch || [];
  const byBatch = data.by_batch || [];
  const byCgpa = data.by_cgpa_band || [];
  const lagAlerts = data.lag_alerts || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <BarChart3 className="text-brand-500" size={26} />
          College Progress & Lag Analytics
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Visual breakdown of campus placement performance, branch & CGPA outcomes, and automated bottleneck detection.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Students</span>
            <Users size={15} className="text-brand-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 mt-1.5">{ov.total_students ?? 0}</p>
          <p className="text-[11px] text-slate-400">{ov.approved_students ?? 0} approved</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Participation</span>
            <TrendingUp size={15} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600 mt-1.5">{ov.participation_rate ?? 0}%</p>
          <p className="text-[11px] text-slate-400">{ov.unapplied_students ?? 0} unapplied</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Placement Rate</span>
            <Award size={15} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1.5">{ov.placement_rate ?? 0}%</p>
          <p className="text-[11px] text-slate-400">{ov.placed_students ?? 0} shortlisted/placed</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Applications</span>
            <CheckCircle2 size={15} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800 mt-1.5">{ov.total_applications ?? 0}</p>
          <p className="text-[11px] text-slate-400">Across all drives</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Avg CGPA</span>
            <GraduationCap size={15} className="text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 mt-1.5">{ov.avg_cgpa || '—'}</p>
          <p className="text-[11px] text-slate-400">{ov.missing_cgpa_count ?? 0} missing CGPA</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Lag Bottlenecks</span>
            <Clock size={15} className={lagAlerts.length > 0 ? 'text-amber-500' : 'text-emerald-500'} />
          </div>
          <p className={`text-2xl font-extrabold mt-1.5 ${lagAlerts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {lagAlerts.length}
          </p>
          <p className="text-[11px] text-slate-400">Detected gaps</p>
        </div>
      </div>

      {/* Automated Lag Diagnostics Panel */}
      <div className="card p-6 border-amber-200/70 bg-gradient-to-br from-amber-50/40 via-white to-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Where Your College Is Lagging (Automated Bottleneck Diagnostics)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Actionable gaps slowing down student placements across your campus
            </p>
          </div>
        </div>

        {lagAlerts.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
            <CheckCircle2 size={18} />
            Great job! No major placement bottlenecks or unapplied student lags detected right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {lagAlerts.map((alert: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  alert.severity === 'high'
                    ? 'bg-red-50/70 border-red-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        alert.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.severity} priority
                    </span>
                    <h4 className="text-sm font-bold text-slate-800">{alert.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{alert.detail}</p>
                </div>
                {alert.action_path && (
                  <button
                    onClick={() => navigate(alert.action_path)}
                    className="self-start text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
                  >
                    {alert.action_label || 'Take Action'} <ArrowRight size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 1: Placement Funnel + Student Engagement & Lag Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card p-6">
          <h3 className="text-base font-bold text-slate-800">Campus Placement Funnel</h3>
          <p className="text-xs text-slate-500 mb-4">
            Track where students advance or drop off across recruitment stages
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
                  {funnel.map((_: any, idx: number) => (
                    <Cell key={idx} fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800">Student Engagement & Lag Split</h3>
          <p className="text-xs text-slate-500 mb-3">Placed vs Applying vs Unapplied / Pending Lags</p>
          <div className="h-64 w-full">
            {engagement.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No students yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagement}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={4}
                  >
                    {engagement.map((_: any, idx: number) => (
                      <Cell key={idx} fill={ENGAGEMENT_COLORS[idx % ENGAGEMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Branch Progress vs Lag + CGPA Band Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800">Branch-Wise Progress & Lag</h3>
          <p className="text-xs text-slate-500 mb-4">
            Compare total students, active applicants, unapplied lag, and placements per department
          </p>
          <div className="h-72 w-full">
            {byBranch.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No branch data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byBranch} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="branch" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" name="Total Students" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="applied" name="Applied" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unapplied" name="Unapplied (Lag)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="placed" name="Shortlisted/Placed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800">CGPA Band Performance</h3>
          <p className="text-xs text-slate-500 mb-4">
            Identify which CGPA tiers convert best and where academic support is needed
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCgpa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="band" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Total Students" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="applied" name="Applied" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placed" name="Shortlisted/Placed" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Batch-Wise Progress */}
      <div className="card p-6">
        <h3 className="text-base font-bold text-slate-800">Batch-Wise Placement Progress</h3>
        <p className="text-xs text-slate-500 mb-4">Graduation cohort participation and placement outcomes</p>
        <div className="h-64 w-full">
          {byBatch.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">No batch data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBatch} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="batch" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Total Students" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="applied" name="Applied" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placed" name="Shortlisted/Placed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
