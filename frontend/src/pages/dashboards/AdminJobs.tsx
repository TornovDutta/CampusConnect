import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Search,
  Globe,
  Building2,
  Flag,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  Users,
  MapPin,
  Download,
} from 'lucide-react';
import { api } from '../../services/api';
import { downloadRowsAsCsv } from '../../utils/csvExport';

interface AdminJob {
  id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  employment_type: string;
  stipend: string;
  visibility: string;
  status: 'active' | 'closed' | 'flagged';
  moderation_reason?: string;
  applications_count: number;
  created_at: string;
}

export default function AdminJobs() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  const { data: jobs = [], isLoading, isError } = useQuery({
    queryKey: ['adminAllJobs'],
    queryFn: async () => {
      const res = await api.get('/admin/jobs');
      return res.data as AdminJob[];
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      await api.patch(`/admin/jobs/${id}/status`, { status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
  });

  const handleFlagJob = (job: AdminJob) => {
    const reason = window.prompt(`Enter moderation reason for flagging "${job.title}" (sent to ${job.company_name}):`);
    if (reason === null) return;
    moderateMutation.mutate({ id: job.id, status: 'flagged', reason });
  };

  const handleDeleteJob = (job: AdminJob) => {
    if (!window.confirm(`Permanently delete job posting "${job.title}" by ${job.company_name}?`)) return;
    deleteMutation.mutate(job.id);
  };

  const filtered = jobs.filter((job) => {
    const q = search.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(q) ||
      job.company_name.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesVis = visibilityFilter === 'all' || job.visibility === visibilityFilter;
    return matchesSearch && matchesStatus && matchesVis;
  });

  const activeCount = jobs.filter((j) => j.status === 'active').length;
  const closedCount = jobs.filter((j) => j.status === 'closed').length;
  const flaggedCount = jobs.filter((j) => j.status === 'flagged').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg">Failed to load platform jobs.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Briefcase className="text-brand-500" size={26} />
            Job Moderation & Quality Control
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitor, verify, flag, or remove job postings across CampusConnect to maintain high-trust merit-first hiring.
          </p>
        </div>

        <button
          onClick={() => downloadRowsAsCsv('campusconnect-jobs', filtered as unknown as Record<string, unknown>[])}
          className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download size={14} /> Export Jobs CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500">Total Postings</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{jobs.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-emerald-600">Active Drives</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500">Closed</p>
          <p className="text-2xl font-extrabold text-slate-700 mt-1">{closedCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-red-600">Flagged for Review</p>
          <p className="text-2xl font-extrabold text-red-600 mt-1">{flaggedCount}</p>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job title, company, or location..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="flagged">Flagged</option>
            </select>

            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public (All Colleges)</option>
              <option value="requested_college">College-Targeted</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Job & Company</th>
                <th className="px-6 py-3">Visibility</th>
                <th className="px-6 py-3">Applicants</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No job postings match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{job.title}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Building2 size={12} /> {job.company_name}
                        </span>
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} /> {job.location}
                          </span>
                        )}
                        {job.employment_type && (
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">{job.employment_type}</span>
                        )}
                      </div>
                      {job.moderation_reason && (
                        <p className="text-[11px] text-red-600 mt-1">Flag note: {job.moderation_reason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {job.visibility === 'requested_college' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                          <Building2 size={12} /> College-Targeted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">
                          <Globe size={12} /> Public
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <Users size={14} className="text-slate-400" /> {job.applications_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                          job.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : job.status === 'flagged'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {job.status !== 'active' && (
                          <button
                            onClick={() => moderateMutation.mutate({ id: job.id, status: 'active' })}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1"
                            title="Approve / Re-activate job"
                          >
                            <CheckCircle2 size={13} /> Activate
                          </button>
                        )}
                        {job.status === 'active' && (
                          <button
                            onClick={() => moderateMutation.mutate({ id: job.id, status: 'closed' })}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 inline-flex items-center gap-1"
                            title="Close job posting"
                          >
                            <XCircle size={13} /> Close
                          </button>
                        )}
                        {job.status !== 'flagged' && (
                          <button
                            onClick={() => handleFlagJob(job)}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 inline-flex items-center gap-1"
                            title="Flag suspicious/incomplete job"
                          >
                            <Flag size={13} /> Flag
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteJob(job)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete job"
                        >
                          <Trash2 size={15} />
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
    </div>
  );
}
