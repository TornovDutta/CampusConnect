import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Search,
  Download,
  Loader2,
  Building2,
  GraduationCap,
  Briefcase,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import { downloadRowsAsCsv } from '../../utils/csvExport';

interface ApplicationRow {
  id: string;
  job_title: string;
  company_name: string;
  student_name: string;
  student_email: string;
  college_name: string;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = ['In Review', 'Shortlisted', 'Offer Sent', 'Hired', 'Rejected'];

export default function AdminPlacements() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminAllApplications', statusFilter],
    queryFn: async () => {
      const qs = statusFilter !== 'all' ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const res = await api.get(`/admin/applications${qs}`);
      return res.data;
    },
  });

  const overrideStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/admin/applications/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllApplications'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
  });

  const summary = data?.summary || { total: 0, in_review: 0, shortlisted: 0, offer_sent: 0, hired: 0, rejected: 0 };
  const applications: ApplicationRow[] = (data?.applications || []).filter((a: ApplicationRow) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.student_name.toLowerCase().includes(q) ||
      a.student_email.toLowerCase().includes(q) ||
      a.job_title.toLowerCase().includes(q) ||
      a.company_name.toLowerCase().includes(q) ||
      a.college_name.toLowerCase().includes(q)
    );
  });

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Hired':
      case 'Accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Offer Sent':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Shortlisted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Award className="text-brand-500" size={26} />
            Global Placement & Application Tracker
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Audit student applications, shortlists, offers, and hires across every college and recruiting partner.
          </p>
        </div>

        <button
          onClick={() =>
            downloadRowsAsCsv('campusconnect-placements', applications as unknown as Record<string, unknown>[])
          }
          className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download size={14} /> Export Placement Report CSV
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Total Applications', value: summary.total, color: 'text-slate-800' },
          { label: 'In Review', value: summary.in_review, color: 'text-blue-600' },
          { label: 'Shortlisted', value: summary.shortlisted, color: 'text-purple-600' },
          { label: 'Offers Sent', value: summary.offer_sent, color: 'text-amber-600' },
          { label: 'Hired', value: summary.hired, color: 'text-emerald-600' },
          { label: 'Rejected', value: summary.rejected, color: 'text-red-600' },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Applications Table */}
      <div className="card">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, job, company, or college..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">All Pipeline Stages</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="animate-spin text-brand-500" size={28} />
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-red-600 text-sm">Failed to load applications.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">College</th>
                  <th className="px-6 py-3">Role & Company</th>
                  <th className="px-6 py-3">Applied Date</th>
                  <th className="px-6 py-3 text-right">Stage / Admin Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No applications match your filter.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-slate-800">{app.student_name}</p>
                        <p className="text-xs text-slate-400">{app.student_email}</p>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <GraduationCap size={14} className="text-blue-500 shrink-0" />
                          {app.college_name}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Briefcase size={13} className="text-brand-500 shrink-0" /> {app.job_title}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={12} className="text-purple-500 shrink-0" /> {app.company_name}
                        </p>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <select
                          value={app.status === 'Accepted' ? 'Hired' : app.status}
                          onChange={(e) =>
                            overrideStatusMutation.mutate({ id: app.id, status: e.target.value })
                          }
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer ${getStatusClass(
                            app.status
                          )}`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st} className="bg-white text-slate-800">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
