import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  BarChart3,
  Briefcase,
  Users,
  Video,
  Award,
  CheckCircle2,
  XCircle,
  Building,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';

export default function CompanyAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['companyAnalytics'],
    queryFn: async () => {
      const res = await api.get('/company/analytics');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  const overview = data?.overview || {
    total_applications: 0,
    in_review: 0,
    active_interviews: 0,
    offers_extended: 0,
    hired: 0,
    rejected: 0
  };

  const funnelData = data?.funnel || [];
  const collegeMetrics = data?.college_breakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-brand-600" size={28} />
          Recruitment Funnel & Conversion Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor your full recruiting funnel from initial campus drive application to final candidate hire.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="card p-4 border-l-4 border-indigo-500">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Applied</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{overview.total_applications}</p>
        </div>

        <div className="card p-4 border-l-4 border-amber-500">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Review</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{overview.in_review}</p>
        </div>

        <div className="card p-4 border-l-4 border-purple-500">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Interviewing</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{overview.active_interviews}</p>
        </div>

        <div className="card p-4 border-l-4 border-blue-500">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Offers Sent</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{overview.offers_extended}</p>
        </div>

        <div className="card p-4 border-l-4 border-emerald-500">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hired</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{overview.hired}</p>
        </div>

        <div className="card p-4 border-l-4 border-rose-500">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Closed</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{overview.rejected}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Pipeline Conversion Funnel */}
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-600" />
              Recruitment Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500">Candidate drop-off and progression across screening stages.</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {funnelData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* College Equity & Partner Institution Performance */}
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Building size={18} className="text-brand-600" />
              Institutional Conversion Leaderboard
            </h3>
            <p className="text-xs text-slate-500">Applications vs. Shortlisted vs. Offers across participating colleges.</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collegeMetrics} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="college_name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="applications" name="Applications" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="shortlisted" name="Shortlisted" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="offers" name="Offers Extended" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
