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
  Briefcase,
  Download,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight
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

  // Bulk Selection
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  // Quick Message Modal
  const [messagingApp, setMessagingApp] = useState<any | null>(null);
  const [quickMessageText, setQuickMessageText] = useState('');

  // Assign to Drive Slot Modal
  const [slotAssignApp, setSlotAssignApp] = useState<any | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState('');

  // Offer Modal
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

  // Fetch drive slots for assignment modal
  const { data: driveSlots = [] } = useQuery({
    queryKey: ['companyDriveSlots'],
    queryFn: async () => {
      const res = await api.get('/company/drive-slots');
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

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      await api.post('/company/applications/bulk-status', {
        application_ids: selectedAppIds,
        status
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companyAllApplications'] });
      queryClient.invalidateQueries({ queryKey: ['companyDashboardStats'] });
      setSelectedAppIds([]);
      alert(`Bulk update successful: ${selectedAppIds.length} candidate(s) set to "${variables.status}"`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to perform bulk update.');
    }
  });

  // Quick message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const appId = messagingApp.id || messagingApp._id;
      await api.post(`/company/applications/${appId}/messages`, {
        message: quickMessageText
      });
    },
    onSuccess: () => {
      alert(`Message successfully sent to ${messagingApp?.student_name}!`);
      setMessagingApp(null);
      setQuickMessageText('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to send message.');
    }
  });

  // Assign to drive slot mutation
  const assignSlotMutation = useMutation({
    mutationFn: async () => {
      const appId = slotAssignApp.id || slotAssignApp._id;
      await api.post(`/company/drive-slots/${selectedSlotId}/assign`, {
        application_id: appId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAllApplications'] });
      queryClient.invalidateQueries({ queryKey: ['companyDriveSlots'] });
      alert(`Candidate successfully allocated to drive slot!`);
      setSlotAssignApp(null);
      setSelectedSlotId('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to assign candidate to slot.');
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

  // Handle Multi-select
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAppIds(filteredApps.map((a: any) => a.id || a._id));
    } else {
      setSelectedAppIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export to CSV
  const exportToCsv = () => {
    if (filteredApps.length === 0) {
      alert('No candidate data to export.');
      return;
    }

    const headers = [
      'Candidate Name',
      'Email',
      'Phone',
      'College',
      'Branch',
      'Batch',
      'CGPA',
      'Job Title',
      'Status Stage',
      'Match Score (%)',
      'Interview Date',
      'Applied Date'
    ];

    const rows = filteredApps.map((a: any) => [
      `"${a.student_name || ''}"`,
      `"${a.student_email || ''}"`,
      `"${a.student_phone || ''}"`,
      `"${a.college_name || ''}"`,
      `"${a.student_branch || ''}"`,
      `"${a.student_batch || ''}"`,
      `"${a.student_cgpa || ''}"`,
      `"${a.job_title || ''}"`,
      `"${a.status || ''}"`,
      `"${a.match_score || 80}"`,
      `"${a.interview_date || ''}"`,
      `"${a.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusConnect_Applicants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const getMatchBadge = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 75) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
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
            Track, filter, screen, and manage every candidate submission across your active campus drives.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportToCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>
          <Link
            to="/dashboard/company/drive-slots"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Calendar size={14} />
            Drive Day Slots
          </Link>
          <Link
            to="/dashboard/company/interviews"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Video size={15} />
            Live Interview Suite
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

      {/* BULK ACTIONS FLOATING TOOLBAR */}
      {selectedAppIds.length > 0 && (
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500 text-white text-[11px]">
              {selectedAppIds.length} Selected
            </span>
            <span>Batch Recruitment Actions:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              disabled={bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate({ status: 'Shortlisted' })}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Bulk Shortlist
            </button>
            <button
              disabled={bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate({ status: 'Interview Scheduled' })}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Move to Interview
            </button>
            <button
              disabled={bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate({ status: 'Rejected' })}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Bulk Reject
            </button>
            <button
              onClick={() => setSelectedAppIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Applications Table */}
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
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedAppIds.length === filteredApps.length && filteredApps.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-brand-600"
                    />
                  </th>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">Applied Position</th>
                  <th className="px-5 py-3.5">College & Academic</th>
                  <th className="px-4 py-3.5">Match Score</th>
                  <th className="px-5 py-3.5">Status Stage</th>
                  <th className="px-5 py-3.5">Interview / Date</th>
                  <th className="px-5 py-3.5 text-right">Recruitment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app: any) => {
                  const appId = app.id || app._id;
                  const isSelected = selectedAppIds.includes(appId);
                  const matchScore = app.match_score || 85;

                  return (
                    <tr
                      key={appId}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(appId)}
                          className="rounded text-brand-600"
                        />
                      </td>

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

                      {/* Match Score */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getMatchBadge(matchScore)}`}>
                          <Sparkles size={12} />
                          {matchScore}% Match
                        </span>
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
                            <span className="font-bold text-slate-800 text-[11px] block">{app.interview_date}</span>
                            <span className="text-[10px] text-slate-400">{app.interview_time || '10:00 AM'} ({app.round_type || 'Round 1'})</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not scheduled</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Message Button */}
                          <button
                            title="Direct Message"
                            onClick={() => {
                              setMessagingApp(app);
                              setQuickMessageText(`Hi ${app.student_name}, thank you for your application for '${app.job_title}'. `);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            <MessageSquare size={14} />
                          </button>

                          {/* Assign Slot Button */}
                          <button
                            title="Assign to Drive Slot"
                            onClick={() => {
                              setSlotAssignApp(app);
                              if (driveSlots.length > 0) setSelectedSlotId(driveSlots[0].id || driveSlots[0]._id);
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                          >
                            <Calendar size={14} />
                          </button>

                          {/* Interview Room */}
                          <Link
                            to={`/dashboard/company/interviews?appId=${appId}`}
                            title="Launch Live Interview Suite"
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                          >
                            <Video size={14} />
                          </Link>

                          {/* Offer Dispatcher */}
                          {app.status !== 'Offer Sent' && app.status !== 'Hired' && (
                            <button
                              title="Extend Offer Letter"
                              onClick={() => {
                                setOfferApp(app);
                                setOfferDesignation(app.job_title);
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                            >
                              <Award size={14} />
                            </button>
                          )}

                          {/* Dossier Modal */}
                          <button
                            onClick={() => setDossierApp(app)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold text-[11px] rounded-lg transition-colors"
                          >
                            Dossier
                          </button>
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

      {/* QUICK MESSAGE MODAL */}
      {messagingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-brand-600" />
                Message {messagingApp.student_name}
              </h3>
              <button onClick={() => setMessagingApp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Send a direct message to this candidate. They will receive an instant notification on their portal.
              </p>
              <textarea
                rows={4}
                value={quickMessageText}
                onChange={(e) => setQuickMessageText(e.target.value)}
                placeholder="Type your message to the applicant..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setMessagingApp(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={sendMessageMutation.isPending || !quickMessageText.trim()}
                onClick={() => sendMessageMutation.mutate()}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                {sendMessageMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TO DRIVE SLOT MODAL */}
      {slotAssignApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-brand-600" />
                Allocate to Drive Slot
              </h3>
              <button onClick={() => setSlotAssignApp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Assign <strong className="text-slate-900">{slotAssignApp.student_name}</strong> to an active interview batch:
              </p>

              {driveSlots.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl text-amber-800 border border-amber-200">
                  No drive slots created yet. Go to "Drive Day Slots" to create your first interview slot.
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Choose Drive Slot:</label>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                  >
                    {driveSlots.map((s: any) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.slot_title} - {s.drive_date} ({s.start_time})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSlotAssignApp(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={assignSlotMutation.isPending || !selectedSlotId}
                onClick={() => assignSlotMutation.mutate()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                {assignSlotMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED CANDIDATE DOSSIER DRAWER / MODAL */}
      {dossierApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(dossierApp.status)}`}>
                  {dossierApp.status}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{dossierApp.student_name}</h2>
                <span className="text-xs text-slate-500">{dossierApp.job_title} Application</span>
              </div>
              <button onClick={() => setDossierApp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Academic & Contact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                <span className="font-semibold text-slate-800">{dossierApp.student_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">College</span>
                <span className="font-semibold text-slate-800">{dossierApp.college_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic CGPA</span>
                <span className="font-bold text-emerald-700">{dossierApp.student_cgpa || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Branch</span>
                <span className="font-semibold text-slate-800">{dossierApp.student_branch || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch</span>
                <span className="font-semibold text-slate-800">{dossierApp.student_batch || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Match Score</span>
                <span className="font-bold text-brand-600">{dossierApp.match_score || 85}% Match</span>
              </div>
            </div>

            {/* Resume Link */}
            {dossierApp.resume_url && (
              <div className="p-3 bg-purple-50/50 border border-purple-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="text-purple-600" size={18} />
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Candidate ATS Resume Attached</span>
                    <span className="text-[10px] text-slate-400">{dossierApp.resume_filename || 'Resume.pdf'}</span>
                  </div>
                </div>
                <a
                  href={dossierApp.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  download={dossierApp.resume_filename || 'Resume.pdf'}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Download Resume
                </a>
              </div>
            )}

            {/* Candidate Cover Note */}
            {dossierApp.cover_note && (
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Statement of Purpose / Cover Note</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 italic leading-relaxed">
                  "{dossierApp.cover_note}"
                </p>
              </div>
            )}

            {/* Audit Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Recruitment Milestone Timeline</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(dossierApp.timeline || []).map((t: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">{t.title || t.status}</div>
                      <div className="text-[11px] text-slate-500">{t.description}</div>
                      <span className="text-[10px] text-slate-400">{t.timestamp ? new Date(t.timestamp).toLocaleString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <select
                  value={dossierApp.status}
                  onChange={(e) => {
                    const newSt = e.target.value;
                    updateStatusMutation.mutate({ appId: dossierApp.id || dossierApp._id, status: newSt });
                    setDossierApp((prev: any) => ({ ...prev, status: newSt }));
                  }}
                  className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  {PIPELINE_STAGES.filter((s) => s !== 'All').map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/dashboard/company/interviews?appId=${dossierApp.id || dossierApp._id}`}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Launch Interview Room
                </Link>
                <button
                  type="button"
                  onClick={() => setDossierApp(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Close Dossier
                </button>
              </div>
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
