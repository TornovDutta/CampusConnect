import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Search,
  User,
  Building,
  Briefcase,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const QUICK_RECRUITER_SNIPPETS = [
  'Hello! We were impressed by your profile and would like to confirm your availability for an interview.',
  'Could you please share your updated GitHub or live portfolio project link?',
  'Congratulations! We are pleased to move forward with your candidacy and discuss the offer details.',
  'Please review the meeting link and join 5 minutes early for your upcoming technical evaluation.'
];

export default function CompanyMessages() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlAppId = searchParams.get('appId') || '';

  const [selectedAppId, setSelectedAppId] = useState<string>(urlAppId);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch all applications
  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ['companyAllApplications'],
    queryFn: async () => {
      const res = await api.get('/company/all-applications');
      return res.data;
    }
  });

  // Fetch threads with recent messages
  const { data: candidateThreads = [] } = useQuery({
    queryKey: ['companyCandidateThreads'],
    queryFn: async () => {
      const res = await api.get('/company/candidate-threads');
      return res.data;
    },
    refetchInterval: 8000
  });

  // Set default selection if none selected
  const activeAppId = selectedAppId || (applications.length > 0 ? (applications[0].id || applications[0]._id) : '');

  // Fetch messages for active application
  const { data: threadData, isLoading: loadingMessages } = useQuery({
    queryKey: ['companyAppMessages', activeAppId],
    queryFn: async () => {
      if (!activeAppId) return null;
      const res = await api.get(`/company/applications/${activeAppId}/messages`);
      return res.data;
    },
    enabled: !!activeAppId,
    refetchInterval: 6000
  });

  const selectedApp = applications.find((a: any) => (a.id || a._id) === activeAppId);
  const messages = threadData?.messages || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeAppId]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      await api.post(`/company/applications/${activeAppId}/messages`, { message: text });
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['companyAppMessages', activeAppId] });
      queryClient.invalidateQueries({ queryKey: ['companyCandidateThreads'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to send message to candidate.');
    }
  });

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeAppId) return;
    sendMutation.mutate(messageText.trim());
  };

  const filteredApps = applications.filter((a: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.student_name || '').toLowerCase().includes(q) ||
      (a.job_title || '').toLowerCase().includes(q) ||
      (a.college_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-brand-600" size={28} />
            Direct Candidate Messaging Desk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Communicate directly with student applicants regarding interviews, technical requirements, and offer discussions.
          </p>
        </div>

        {selectedApp && (
          <Link
            to={`/dashboard/company/interviews?appId=${activeAppId}`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            Conduct Interview with {selectedApp.student_name?.split(' ')[0]}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Main 2-Column Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Applicants / Conversation List */}
        <div className="card flex flex-col max-h-[280px] lg:max-h-none lg:h-[650px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Applicants ({applications.length})</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                Direct Sync
              </span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingApps ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="animate-spin text-brand-600 mx-auto mb-2" size={24} />
                Loading applicants...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No applicants match your search.
              </div>
            ) : (
              filteredApps.map((app: any) => {
                const appId = app.id || app._id;
                const isSelected = activeAppId === appId;
                const thread = candidateThreads.find((t: any) => t.application_id === appId);

                return (
                  <button
                    key={appId}
                    type="button"
                    onClick={() => setSelectedAppId(appId)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-brand-50/60 border-l-4 border-brand-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {app.student_name || 'Candidate'}
                        </span>
                        {thread && thread.unread_count > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                        {app.job_title}
                      </p>

                      <p className="text-[10px] text-slate-400 truncate">
                        {app.college_name || 'College'} • {app.status || 'In Review'}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : ''}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Direct Conversation Feed */}
        <div className="lg:col-span-2 card flex flex-col h-[460px] lg:h-[650px] overflow-hidden">
          {selectedApp ? (
            <>
              {/* Chat Candidate Header */}
              <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {selectedApp.student_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{selectedApp.student_name}</h3>
                    <p className="text-[11px] text-slate-500">
                      Applied for <strong className="text-slate-700">{selectedApp.job_title}</strong> • Stage: {selectedApp.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedApp.resume_url && (
                    <a
                      href={selectedApp.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      Resume
                    </a>
                  )}
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    Live Channel
                  </span>
                </div>
              </div>

              {/* Quick Response Snippets */}
              <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-500" /> Quick Replies:
                </span>
                {QUICK_RECRUITER_SNIPPETS.map((snip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessageText(snip)}
                    className="px-2.5 py-1 bg-white hover:bg-brand-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-600 shrink-0 transition-colors"
                  >
                    {snip.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-brand-600" size={26} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                    <MessageSquare size={36} className="text-slate-300" />
                    <h4 className="font-bold text-slate-700 text-sm">No messages exchanged yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Send a direct message to {selectedApp.student_name} regarding interview scheduling, required documents, or next steps!
                    </p>
                  </div>
                ) : (
                  messages.map((m: any) => {
                    const isRecruiter = m.sender_role === 'company';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isRecruiter ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {isRecruiter ? 'You (Recruiting Team)' : selectedApp.student_name}
                          </span>
                        </div>
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                            isRecruiter
                              ? 'bg-brand-600 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.message}</p>
                          <span
                            className={`text-[10px] block mt-1 text-right ${
                              isRecruiter ? 'text-brand-100' : 'text-slate-400'
                            }`}
                          >
                            {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2.5">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Write a direct message to ${selectedApp.student_name}...`}
                  className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={sendMutation.isPending || !messageText.trim()}
                  className="btn-primary px-5 py-2.5 flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <User size={36} className="text-slate-300" />
              <h4 className="font-bold text-slate-700 text-sm">Select an Applicant</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose a candidate from the left list to open their dedicated messaging channel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
