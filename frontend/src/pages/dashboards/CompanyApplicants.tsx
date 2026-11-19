import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  FileText,
  Video,
  MessageSquare,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Building,
  GraduationCap,
  ExternalLink,
  Loader2,
  ChevronRight,
  X,
  Mail,
  Phone,
  Send,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const PIPELINE_STAGES = [
  'All',
  'In Review',
  'Shortlisted',
  'Interview Scheduled',
  'Technical Passed',
  'Behavioral Passed',
  'Offer Sent',
  'Hired',
  'Rejected'
];

export default function CompanyApplicants() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dossierApp, setDossierApp] = useState<any | null>(null);

  // Offer modal state
  const [offerApp, setOfferApp] = useState<any | null>(null);
  const [offerDesignation, setOfferDesignation] = useState('');
  const [offerCtc, setOfferCtc] = useState('');
  const [offerJoiningDate, setOfferJoiningDate] = useState('');
  const [offerNotes, setOfferNotes] = useState('');

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['companyAllApplications', statusFilter],
    queryFn: async () => {
      const res = await api.get('/company/all-applications', {
        params: { status: statusFilter === 'All' ? undefined : statusFilter }
      });
      return res.data;
    }
  });

  // Fast status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status, feedback }: { appId: string; status: string; feedback?: string }) => {
      await api.patch(`/company/applications/${appId}/status`, { status, feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAllApplications'] });
      queryClient.invalidateQueries({ queryKey: ['companyDashboardStats'] });
      alert('Candidate application status updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to update status.');
    }
  });

  // Offer letter mutation
  const offerMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/company/applications/${offerApp.id || offerApp._id}/offer`, {
        designation: offerDesignation,
        ctc_or_stipend: offerCtc,
        joining_date: offerJoiningDate,
        offer_notes: offerNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAllApplications'] });
      setOfferApp(null);
      alert('Formal offer letter dispatched to candidate with immediate notification!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to dispatch offer.');
    }
  });

  const filteredApps = applications.filter((app: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (app.student_name || '').toLowerCase().includes(q) ||
      (app.student_email || '').toLowerCase().includes(q) ||
      (app.job_title || '').toLowerCase().includes(q) ||
      (app.college_name || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Hired':
      case 'Selected':
      case 'Offer Sent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Interview Scheduled':
      case 'Technical Passed':
      case 'Behavioral Passed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Shortlisted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-brand-600" size={28} />
            Application Monitoring & Recruitment Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, filter, and monitor every candidate submission across your active job postings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/company/interviews"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Video size={15} />
            Live Interview Suite
          </Link>
          <Link
            to="/dashboard/company/messages"
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <MessageSquare size={15} />
            Candidate Inbox
          </Link>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filter by candidate, email, college, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing {filteredApps.length} candidate(s)
          </div>
        </div>

        {/* Stage Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Recruiting Stage:
          </span>
          {PIPELINE_STAGES.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table / Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <Users className="mx-auto text-slate-300" size={44} />
          <h3 className="text-lg font-bold text-slate-800">No applications match your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter === 'All'
              ? 'Student applications submitted to your campus drives will be organized here.'
              : `No candidates currently under status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Applied Position</th>
                  <th className="px-5 py-3.5">College & Academic</th>
                  <th className="px-5 py-3.5">Status Stage</th>
                  <th className="px-5 py-3.5">Interview / Date</th>
                  <th className="px-5 py-3.5 text-right">Recruitment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app: any) => {
                  const appId = app.id || app._id;
                  return (
                    <tr key={appId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Candidate Column */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{app.student_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail size={12} /> {app.student_email}
                        </div>
                        {app.resume_url && (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            download={app.resume_filename || 'Resume.pdf'}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline mt-1"
                          >
                            <FileText size={12} />
                            View Resume
                          </a>
                        )}
                      </td>

                      {/* Position */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-800 text-xs block">{app.job_title}</span>
                        <span className="text-[10px] text-slate-400">Easy Apply</span>
                      </td>

                      {/* College & Academic */}
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-800 block">{app.college_name || 'College'}</span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {app.student_cgpa && <strong className="text-emerald-700">CGPA: {app.student_cgpa}</strong>}
                          <span>{app.student_branch}</span>
                        </div>
                      </td>

                      {/* Status Stage */}
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                      </td>

                      {/* Interview Info */}
                      <td className="px-5 py-4 text-slate-500">
                        {app.interview_date ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-purple-700 block flex items-center gap-1">
                              <Calendar size={12} /> {app.interview_date}
                            </span>
                            <span className="text-[10px] text-slate-400">{app.interview_time || '10:00 AM'} ({app.round_type || 'Interview'})</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => setDossierApp(app)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
                            title="Inspect full dossier & timeline"
                          >
                            Dossier
                          </button>

                          <Link
                            to={`/dashboard/company/interviews?appId=${appId}`}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-lg"
                            title="Open in Live Interview Suite"
                          >
                            Interview
                          </Link>

                          <Link
                            to={`/dashboard/company/messages?appId=${appId}`}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg"
                            title="Direct Message Candidate"
                          >
                            <MessageSquare size={14} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setOfferApp(app);
                              setOfferDesignation(app.job_title || 'Software Engineer');
                              setOfferCtc('Competitive Package');
                              setOfferJoiningDate('Immediate / Upon Graduation');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-lg"
                            title="Extend Offer Letter"
                          >
                            Offer
                          </button>

                          {/* Quick Stage Dropdown */}
                          <select
                            value={app.status}
                            onChange={(e) => updateStatusMutation.mutate({ appId, status: e.target.value })}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
                          >
                            <option value="In Review">In Review</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Technical Passed">Technical Passed</option>
                            <option value="Behavioral Passed">Behavioral Passed</option>
                            <option value="Offer Sent">Offer Sent</option>
                            <option value="Hired">Hired</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CANDIDATE DOSSIER DRAWER / MODAL */}
      {dossierApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Candidate Dossier
                </span>
                <h3 className="text-xl font-bold text-slate-900">{dossierApp.student_name}</h3>
                <p className="text-xs text-slate-500">{dossierApp.student_email} • {dossierApp.college_name}</p>
              </div>
              <button onClick={() => setDossierApp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Academic & Profile Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block font-medium">CGPA</span>
                <span className="font-bold text-emerald-700 text-sm">{dossierApp.student_cgpa || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Branch</span>
                <span className="font-bold text-slate-800">{dossierApp.student_branch || 'CSE'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Graduating Batch</span>
                <span className="font-bold text-slate-800">{dossierApp.student_batch || '2026'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Roll Number</span>
                <span className="font-bold text-slate-800">{dossierApp.student_roll_number || 'N/A'}</span>
              </div>
            </div>

            {/* Submitted Cover Note */}
            {dossierApp.cover_note && (
              <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-blue-900">Applicant Cover Note:</span>
                <p className="text-xs text-blue-800 italic">"{dossierApp.cover_note}"</p>
              </div>
            )}

            {/* Resume Button */}
            {dossierApp.resume_url && (
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white">
                <div className="flex items-center gap-2">
                  <FileText className="text-brand-600" size={18} />
                  <span className="text-xs font-bold text-slate-800">{dossierApp.resume_filename || 'Candidate_Resume.pdf'}</span>
                </div>
                <a
                  href={dossierApp.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  Download Resume
                </a>
              </div>
            )}

            {/* Timeline Audit Log */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Application Timeline & Audited Milestones
              </h4>
              <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                {(dossierApp.timeline || []).map((t: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-brand-600 border-2 border-white ring-2 ring-brand-100" />
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-xs text-slate-800">{t.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {t.timestamp ? new Date(t.timestamp).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Link
                to={`/dashboard/company/interviews?appId=${dossierApp.id || dossierApp._id}`}
                className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Conducted Interview Scorecard
              </Link>
              <button
                type="button"
                onClick={() => setDossierApp(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTEND OFFER LETTER MODAL */}
      {offerApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award size={20} className="text-emerald-600" />
              Extend Formal Job Offer to {offerApp.student_name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Designation</label>
                <input
                  type="text"
                  value={offerDesignation}
                  onChange={(e) => setOfferDesignation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CTC Package / Monthly Stipend</label>
                <input
                  type="text"
                  placeholder="e.g. ₹12,00,000 CTC / ₹45,000/mo Stipend"
                  value={offerCtc}
                  onChange={(e) => setOfferCtc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Joining Date</label>
                <input
                  type="text"
                  placeholder="e.g. July 1, 2026 or Immediate"
                  value={offerJoiningDate}
                  onChange={(e) => setOfferJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Offer Letter Notes & Welcome Message</label>
                <textarea
                  rows={3}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="We are thrilled to welcome you to our engineering team! Details regarding your joining formalities will follow..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOfferApp(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={offerMutation.isPending || !offerDesignation}
                onClick={() => offerMutation.mutate()}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {offerMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Dispatch Official Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
