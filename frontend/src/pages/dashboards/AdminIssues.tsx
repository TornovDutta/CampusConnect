import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bug,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  Server,
  Monitor,
  Activity,
  Database,
  Download,
  Loader2,
  Wrench,
  FlaskConical,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { downloadRowsAsCsv } from '../../utils/csvExport';

interface IssueItem {
  id: string;
  source: 'backend' | 'frontend';
  feature: string;
  endpoint: string;
  method: string;
  status_code?: number;
  severity: 'critical' | 'error' | 'warning';
  error_type: string;
  message: string;
  stack_trace?: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  status: 'open' | 'investigating' | 'resolved';
  resolution_note?: string;
  created_at: string;
  resolved_at?: string;
}

export default function AdminIssues() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const { data: issuesData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminIssues', statusFilter, severityFilter, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      const res = await api.get(`/admin/issues?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 15000,
  });

  const { data: healthData, refetch: refetchHealth, isFetching: checkingHealth } = useQuery({
    queryKey: ['adminSystemHealth'],
    queryFn: async () => {
      const res = await api.get('/admin/system-health');
      return res.data;
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, status, resolution_note }: { id: string; status: string; resolution_note?: string }) => {
      await api.patch(`/admin/issues/${id}`, { status, resolution_note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
      queryClient.invalidateQueries({ queryKey: ['adminSystemHealth'] });
    },
  });

  const deleteIssueMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/issues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
    },
  });

  const clearResolvedMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/admin/issues');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
    },
  });

  const logTestMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/issues/report', {
        feature: 'Diagnostics',
        message: 'Manual telemetry check: verified issue capture pipeline is operational.',
        source: 'frontend',
        severity: 'warning',
        endpoint: '/dashboard/admin/issues',
        method: 'POST',
        error_type: 'SelfTestEvent',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
    },
  });

  const summary = issuesData?.summary || { total: 0, open: 0, investigating: 0, resolved: 0, critical: 0 };
  const byFeature = issuesData?.by_feature || [];
  const issues: IssueItem[] = (issuesData?.issues || []).filter((iss: IssueItem) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      iss.feature.toLowerCase().includes(q) ||
      iss.message.toLowerCase().includes(q) ||
      iss.endpoint.toLowerCase().includes(q) ||
      iss.error_type.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    downloadRowsAsCsv('campusconnect-issues', issues as unknown as Record<string, unknown>[]);
  };

  const getSeverityBadge = (sev: string) => {
    if (sev === 'critical') return 'bg-red-100 text-red-700 border-red-200';
    if (sev === 'warning') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-orange-100 text-orange-700 border-orange-200';
  };

  const getStatusBadge = (st: string) => {
    if (st === 'resolved') return 'bg-emerald-100 text-emerald-700';
    if (st === 'investigating') return 'bg-blue-100 text-blue-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Bug className="text-red-500" size={26} />
            Website Issue & Feature Failure Monitor
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Automatically captures failed backend API endpoints, server crashes, and frontend UI errors in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => logTestMutation.mutate()}
            disabled={logTestMutation.isPending}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
          >
            <FlaskConical size={14} /> Log Test Event
          </button>
          <button
            onClick={handleExport}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => {
              refetch();
              refetchHealth();
            }}
            className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isFetching || checkingHealth ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Live System Health Banner */}
      <div className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl ${
              healthData?.overall_status === 'healthy'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            <Activity size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-bold text-base">System Health Diagnostics</h3>
              <span
                className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  healthData?.overall_status === 'healthy'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {healthData?.overall_status || 'checking...'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1">
                <Database size={13} className="text-brand-300" />
                MongoDB: {healthData?.database_status || 'checking'} ({healthData?.database_latency_ms ?? '-'} ms)
              </span>
              {healthData?.collections && (
                <span>
                  Records: {healthData.collections.users ?? 0} users · {healthData.collections.jobs ?? 0} jobs ·{' '}
                  {healthData.collections.applications ?? 0} apps
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Auto-refreshes every 15s
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50 text-red-600">
            <AlertOctagon size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Open Issues</p>
            <p className="text-2xl font-extrabold text-slate-800">{summary.open}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Critical Unresolved</p>
            <p className="text-2xl font-extrabold text-rose-600">{summary.critical}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Wrench size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Investigating</p>
            <p className="text-2xl font-extrabold text-slate-800">{summary.investigating}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Resolved</p>
            <p className="text-2xl font-extrabold text-emerald-600">{summary.resolved}</p>
          </div>
        </div>
      </div>

      {/* Issues by Feature Chart */}
      {byFeature.length > 0 && (
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800 mb-1">Failures by Website Feature</h3>
          <p className="text-xs text-slate-500 mb-4">Quickly identify which platform module is experiencing errors</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byFeature} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="feature" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="open" name="Open / Investigating" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Bar + Issue Feed */}
      <div className="card">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feature, endpoint, or error message..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="all">All Sources</option>
              <option value="backend">Backend</option>
              <option value="frontend">Frontend</option>
            </select>

            {summary.resolved > 0 && (
              <button
                onClick={() => clearResolvedMutation.mutate()}
                disabled={clearResolvedMutation.isPending}
                className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1"
              >
                <Trash2 size={13} /> Clear Resolved
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="animate-spin text-brand-500" size={28} />
            </div>
          ) : issues.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 size={28} />
              </div>
              <p className="font-bold text-slate-800">All Systems Running Cleanly</p>
              <p className="text-xs text-slate-500 mt-1">
                No issues match your current filter. Any failed API call or runtime error will automatically appear here.
              </p>
            </div>
          ) : (
            issues.map((issue) => {
              const isExpanded = expandedId === issue.id;
              const draftNote = noteDrafts[issue.id] ?? issue.resolution_note ?? '';

              return (
                <div key={issue.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(
                            issue.severity
                          )}`}
                        >
                          {issue.severity}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {issue.source === 'backend' ? <Server size={11} /> : <Monitor size={11} />}
                          {issue.source}
                        </span>
                        <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                          {issue.feature}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${getStatusBadge(issue.status)}`}>
                          {issue.status}
                        </span>
                        {issue.status_code && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            HTTP {issue.status_code}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-slate-800 break-words">
                        <span className="font-mono text-xs text-slate-500 mr-1.5">[{issue.error_type}]</span>
                        {issue.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        {issue.endpoint && (
                          <span className="font-mono text-slate-600">
                            {issue.method ? `${issue.method} ` : ''}
                            {issue.endpoint}
                          </span>
                        )}
                        {issue.user_role && <span>Role: {issue.user_role}</span>}
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {issue.created_at ? new Date(issue.created_at).toLocaleString() : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={issue.status}
                        onChange={(e) =>
                          updateIssueMutation.mutate({
                            id: issue.id,
                            status: e.target.value,
                            resolution_note: draftNote,
                          })
                        }
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
                      >
                        <option value="open">Open</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                      </select>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                        title="Toggle details"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      <button
                        onClick={() => deleteIssueMutation.mutate(issue.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete issue log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      {issue.stack_trace && (
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-1">Stack Trace / Technical Details</p>
                          <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] overflow-x-auto max-h-56 font-mono leading-relaxed">
                            {issue.stack_trace}
                          </pre>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={draftNote}
                          onChange={(e) => setNoteDrafts({ ...noteDrafts, [issue.id]: e.target.value })}
                          placeholder="Add investigation or resolution note..."
                          className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <button
                          onClick={() =>
                            updateIssueMutation.mutate({
                              id: issue.id,
                              status: issue.status,
                              resolution_note: draftNote,
                            })
                          }
                          className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
