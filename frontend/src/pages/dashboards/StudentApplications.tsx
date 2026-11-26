import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  Video,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Loader2,
  Building,
  MapPin,
  XCircle,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Send,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const STAGES = ['Applied', 'In Review', 'Shortlisted', 'Interview Scheduled', 'Offer Sent'];

function getStageIndex(status: string): number {
  const s = (status || '').toLowerCase();
  if (s === 'applied') return 0;
  if (s === 'in review' || s === 'screening') return 1;
  if (s === 'shortlisted') return 2;
  if (s === 'interview scheduled' || s === 'interviewing' || s === 'interview') return 3;
  if (s === 'offer sent' || s === 'selected' || s === 'hired' || s === 'accepted') return 4;
  return 1;
}

export default function StudentApplications() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [messagingApp, setMessagingApp] = useState<any | null>(null);
  const [recruiterMsgText, setRecruiterMsgText] = useState('');

  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ['studentApplications', statusFilter],
    queryFn: async () => {
      const res = await api.get('/student/applications', {
        params: { status: statusFilter === 'All' ? undefined : statusFilter }
      });
      return res.data;
    }
  });

  // Recruiter messaging query
  const { data: recruiterThread, isLoading: loadingRecruiterMsgs } = useQuery({
    queryKey: ['studentRecruiterMessages', messagingApp?.id],
    queryFn: async () => {
      if (!messagingApp?.id) return null;
      const res = await api.get(`/student/company-messages/${messagingApp.id}`);
      return res.data;
    },
    enabled: !!messagingApp?.id,
    refetchInterval: 6000
  });

  const sendRecruiterMsgMutation = useMutation({
    mutationFn: async (text: string) => {
      await api.post(`/student/company-messages/${messagingApp.id}`, { message: text });
    },
    onSuccess: () => {
      setRecruiterMsgText('');
      queryClient.invalidateQueries({ queryKey: ['studentRecruiterMessages', messagingApp?.id] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to send message.');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (appId: string) => {
      await api.delete(`/student/applications/${appId}/withdraw`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentApplications'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
      setWithdrawingId(null);
      alert('Application withdrawn successfully.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to withdraw application.');
    }
  });

  const filteredApps = applications.filter((app: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (app.job_title || '').toLowerCase().includes(q) ||
      (app.company_name || '').toLowerCase().includes(q) ||
      (app.location || '').toLowerCase().includes(q)
    );
  });

  const counts = {
    all: applications.length,
    in_review: applications.filter((a: any) => ['In Review', 'Applied'].includes(a.status)).length,
    shortlisted: applications.filter((a: any) => ['Shortlisted', 'Interview Scheduled'].includes(a.status)).length,
    offers: applications.filter((a: any) => ['Offer Sent', 'Selected', 'Hired'].includes(a.status)).length,
    rejected: applications.filter((a: any) => a.status === 'Rejected').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="text-brand-600" size={28} />
            My Job Applications & Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track stage progression, interview schedules, recruiter notes, and manage active submissions.
          </p>
        </div>

        <Link
          to="/dashboard/student"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          Explore More Drives
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('All')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'All'
              ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total</div>
          <div className="text-xl font-bold text-slate-800 mt-0.5">{counts.all}</div>
        </button>

        <button
          onClick={() => setStatusFilter('In Review')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'In Review'
              ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Review</div>
          <div className="text-xl font-bold text-amber-600 mt-0.5">{counts.in_review}</div>
        </button>

        <button
          onClick={() => setStatusFilter('Shortlisted')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'Shortlisted'
              ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Shortlisted</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">{counts.shortlisted}</div>
        </button>

        <button
          onClick={() => setStatusFilter('Offer Sent')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'Offer Sent'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Offers</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">{counts.offers}</div>
        </button>

        <button
          onClick={() => setStatusFilter('Rejected')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'Rejected'
              ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Closed</div>
          <div className="text-xl font-bold text-rose-600 mt-0.5">{counts.rejected}</div>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-end">
          <span>Showing {filteredApps.length} application(s)</span>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle size={20} />
          <span>Failed to load your applications. Please try again later.</span>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="text-lg font-bold text-slate-800">No applications match your filter</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {statusFilter === 'All'
              ? "You haven't submitted any job applications yet. Browse active campus drives and open opportunities to get started."
              : `You have no applications under status "${statusFilter}".`}
          </p>
          <Link
            to="/dashboard/student"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm"
          >
            Browse Available Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app: any) => {
            const isExpanded = expandedId === app.id;
            const currentStageIdx = getStageIndex(app.status);
            const isRejected = app.status === 'Rejected';

            return (
              <div
                key={app.id}
                className="card overflow-hidden transition-all hover:border-slate-300 shadow-sm"
              >
                {/* Main Card Content */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg text-slate-900">{app.job_title}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isRejected
                              ? 'bg-rose-100 text-rose-700'
                              : app.status === 'Offer Sent' || app.status === 'Selected'
                              ? 'bg-emerald-100 text-emerald-700'
                              : app.status === 'Interview Scheduled'
                              ? 'bg-purple-100 text-purple-700'
                              : app.status === 'Shortlisted'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building size={15} className="text-slate-400" />
                          {app.company_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={15} className="text-slate-400" />
                          {app.location || 'Flexible'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={15} className="text-slate-400" />
                          Applied {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {app.interview_link && (
                        <a
                          href={app.interview_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                          <Video size={14} />
                          Join Interview
                        </a>
                      )}

                      <Link
                        to={`/dashboard/student/interviews`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        <Sparkles size={14} className="text-brand-600" />
                        Prep Tips
                      </Link>

                      <button
                        type="button"
                        onClick={() => setMessagingApp(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg border border-brand-200"
                        title="Direct message company recruiter"
                      >
                        <MessageSquare size={13} />
                        Message Recruiter
                      </button>

                      {app.can_withdraw && (
                        <button
                          onClick={() => setWithdrawingId(app.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-lg"
                        >
                          <Trash2 size={13} />
                          Withdraw
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200"
                      >
                        {isExpanded ? 'Hide Details' : 'View Tracker'}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Visual Stepper Pipeline */}
                  {!isRejected ? (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0 hidden sm:block" />

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
                          {STAGES.map((stage, idx) => {
                            const isCompleted = idx <= currentStageIdx;
                            const isCurrent = idx === currentStageIdx;

                            return (
                              <div key={stage} className="flex flex-col items-center text-center">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors mb-2 ${
                                    isCompleted
                                      ? 'bg-brand-600 text-white ring-4 ring-brand-50'
                                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                                  }`}
                                >
                                  {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                                </div>
                                <span
                                  className={`text-xs font-semibold ${
                                    isCurrent ? 'text-brand-700 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                                  }`}
                                >
                                  {stage}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-xs text-rose-700">
                      <XCircle size={16} className="shrink-0" />
                      <span>
                        This application has concluded for this drive. We encourage you to review your skills and apply to other open roles!
                      </span>
                    </div>
                  )}

                  {/* Interview Highlight Callout */}
                  {app.interview_date && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                          <Calendar size={14} />
                          Interview Scheduled
                        </div>
                        <p className="text-sm font-semibold text-purple-950 mt-1">
                          Date: {app.interview_date} at {app.interview_time || 'TBD'} ({app.interview_mode || 'Online'})
                        </p>
                        {app.interview_instructions && (
                          <p className="text-xs text-purple-800 mt-0.5">{app.interview_instructions}</p>
                        )}
                      </div>

                      {app.interview_link && (
                        <a
                          href={app.interview_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Video size={14} />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Details / Timeline Log */}
                {isExpanded && (
                  <div className="bg-slate-50 p-6 border-t border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock size={16} className="text-slate-500" />
                      Detailed Timeline & Stage Milestones
                    </h4>

                    <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
                      {(app.timeline || []).map((milestone: any, mIdx: number) => (
                        <div key={mIdx} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 bg-brand-600 rounded-full border-2 border-white ring-2 ring-brand-100" />
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-800">{milestone.title}</span>
                              <span className="text-[11px] text-slate-400">
                                {milestone.timestamp ? new Date(milestone.timestamp).toLocaleString() : ''}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{milestone.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Resume & Notes Attachment Info */}
                    <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <FileText size={14} className="text-slate-400" />
                        <span>Submitted Resume: <strong>{app.resume_filename || 'Default Profile Resume'}</strong></span>
                      </div>
                      {app.cover_note && (
                        <div className="w-full bg-white p-3 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-700 block mb-1">Cover Note:</span>
                          <p className="text-slate-600 italic">"{app.cover_note}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Recruiter Chat Modal */}
      {messagingApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="card max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl flex flex-col h-[85vh] max-h-[540px]">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Direct Recruiter Channel
                </span>
                <h3 className="text-lg font-bold text-slate-900">{messagingApp.company_name}</h3>
                <p className="text-xs text-slate-500">Position: {messagingApp.job_title}</p>
              </div>
              <button onClick={() => setMessagingApp(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-50/70 rounded-xl">
              {loadingRecruiterMsgs ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-brand-600" size={24} />
                </div>
              ) : (recruiterThread?.messages || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  <MessageSquare size={32} className="text-slate-300 mb-1" />
                  No messages yet. Send a query regarding your application or interview schedule!
                </div>
              ) : (
                recruiterThread.messages.map((m: any) => {
                  const isMe = m.sender_role === 'student';
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-semibold text-slate-400 mb-0.5 px-1">
                        {isMe ? 'You' : m.sender_name || 'Recruiter'}
                      </span>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.message}</p>
                        <span className={`text-[9px] block mt-1 text-right ${isMe ? 'text-brand-100' : 'text-slate-400'}`}>
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!recruiterMsgText.trim()) return;
                sendRecruiterMsgMutation.mutate(recruiterMsgText.trim());
              }}
              className="flex gap-2 pt-2 border-t border-slate-100"
            >
              <input
                type="text"
                placeholder="Write a message to the hiring team..."
                value={recruiterMsgText}
                onChange={(e) => setRecruiterMsgText(e.target.value)}
                className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={sendRecruiterMsgMutation.isPending || !recruiterMsgText.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                {sendRecruiterMsgMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Withdrawal */}
      {withdrawingId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Withdraw Application?</h3>
            <p className="text-sm text-slate-500">
              Are you sure you want to withdraw this application? This action cannot be undone and will notify the hiring team.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setWithdrawingId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={withdrawMutation.isPending}
                onClick={() => withdrawMutation.mutate(withdrawingId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
              >
                {withdrawMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
