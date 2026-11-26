import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  FileBarChart2,
  Send,
  GraduationCap,
  Loader2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminCollegeDesk() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'messages' | 'reports'>('messages');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [msgText, setMsgText] = useState('');
  const [reportFilter, setReportFilter] = useState('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: threads = [], isLoading: loadingThreads } = useQuery({
    queryKey: ['adminCollegeThreads'],
    queryFn: async () => {
      const res = await api.get('/admin/college-messages');
      return res.data as any[];
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!selectedCollegeId && threads.length > 0) {
      setSelectedCollegeId(threads[0].college_id);
    }
  }, [threads, selectedCollegeId]);

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['adminCollegeThreadMessages', selectedCollegeId],
    queryFn: async () => {
      if (!selectedCollegeId) return [];
      const res = await api.get(`/admin/college-messages/${selectedCollegeId}`);
      return res.data as any[];
    },
    enabled: !!selectedCollegeId,
    refetchInterval: 8000,
  });

  useEffect(() => {
    if (activeTab === 'messages') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeTab, selectedCollegeId]);

  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ['adminCollegeReports', reportFilter],
    queryFn: async () => {
      const qs = reportFilter !== 'all' ? `?status=${reportFilter}` : '';
      const res = await api.get(`/admin/college-reports${qs}`);
      return res.data;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCollegeId) return;
      await api.post(`/admin/college-messages/${selectedCollegeId}`, { message: msgText });
    },
    onSuccess: () => {
      setMsgText('');
      queryClient.invalidateQueries({ queryKey: ['adminCollegeThreadMessages', selectedCollegeId] });
      queryClient.invalidateQueries({ queryKey: ['adminCollegeThreads'] });
    },
  });

  const reviewReportMutation = useMutation({
    mutationFn: async ({ id, status, admin_response }: { id: string; status: string; admin_response: string }) => {
      await api.patch(`/admin/college-reports/${id}`, { status, admin_response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCollegeReports'] });
    },
  });

  const selectedCollege = threads.find((t) => t.college_id === selectedCollegeId);
  const reports = reportsData?.reports || [];
  const reportSummary = reportsData?.summary || { total: 0, submitted: 0, under_review: 0, resolved: 0 };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedCollegeId) return;
    sendMessageMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <GraduationCap className="text-brand-500" size={26} />
          College Messages & Reports Desk
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Message any partner college placement cell directly and review official reports submitted by colleges.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('messages')}
          className={`py-3 px-4 border-b-2 text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
            activeTab === 'messages'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare size={16} /> Direct Messages to Colleges
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 border-b-2 text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileBarChart2 size={16} /> College Reports ({reportSummary.submitted} new)
        </button>
      </div>

      {activeTab === 'messages' ? (
        <div className="card grid grid-cols-1 lg:grid-cols-3 lg:h-[580px] overflow-hidden">
          {/* College Thread List */}
          <div className="border-b lg:border-b-0 lg:border-r border-slate-200 max-h-[260px] lg:max-h-none overflow-y-auto divide-y divide-slate-100 bg-slate-50/40">
            <div className="p-4 border-b border-slate-200 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Partner Colleges ({threads.length})
              </h3>
            </div>
            {loadingThreads ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin text-brand-500" size={22} />
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No colleges registered yet.</div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.college_id}
                  onClick={() => setSelectedCollegeId(t.college_id)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedCollegeId === t.college_id ? 'bg-brand-50 border-l-4 border-brand-500' : 'hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 truncate">{t.college_name}</p>
                    {t.unread_count > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-600 text-white">
                        {t.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {t.last_message || t.college_email}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Chat Pane */}
          <div className="lg:col-span-2 flex flex-col h-[460px] lg:h-full bg-white">
            {!selectedCollege ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Select a college to start messaging
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{selectedCollege.college_name}</h3>
                    <p className="text-xs text-slate-500">{selectedCollege.college_email}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/20">
                  {loadingMessages ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="animate-spin text-brand-500" size={24} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                      No messages exchanged with this college yet. Send the first message below.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.sender_role === 'super_admin';
                      return (
                        <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                              isAdmin
                                ? 'bg-slate-900 text-white rounded-br-sm'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                            }`}
                          >
                            <div className={`text-[10px] font-bold uppercase mb-1 ${isAdmin ? 'text-brand-300' : 'text-blue-600'}`}>
                              {isAdmin ? 'Super Admin (You)' : selectedCollege.college_name}
                            </div>
                            <p className="whitespace-pre-wrap break-words">{m.message}</p>
                            <div className={`text-[10px] mt-1.5 text-right ${isAdmin ? 'text-slate-400' : 'text-slate-400'}`}>
                              {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder={`Message ${selectedCollege.college_name}...`}
                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !msgText.trim()}
                    className="btn-primary px-5 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={15} /> Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {[
                { id: 'all', label: `All (${reportSummary.total})` },
                { id: 'submitted', label: `New (${reportSummary.submitted})` },
                { id: 'under_review', label: `Under Review (${reportSummary.under_review})` },
                { id: 'resolved', label: `Resolved (${reportSummary.resolved})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setReportFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    reportFilter === f.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card divide-y divide-slate-100">
            {loadingReports ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin text-brand-500" size={26} />
              </div>
            ) : reports.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-500" />
                No college reports match this filter.
              </div>
            ) : (
              reports.map((r: any) => {
                const draft = replyDrafts[r.id] ?? r.admin_response ?? '';
                return (
                  <div key={r.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-800">{r.title}</h4>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {r.college_name}
                          </span>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {r.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock size={11} /> {r.created_at ? new Date(r.created_at).toLocaleString() : '-'}
                        </p>
                      </div>

                      <select
                        value={r.status}
                        onChange={(e) =>
                          reviewReportMutation.mutate({
                            id: r.id,
                            status: e.target.value,
                            admin_response: draft,
                          })
                        }
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.description}</p>

                    {r.stats_snapshot && (
                      <div className="flex flex-wrap gap-4 text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-600">
                        <span>Total Students: <strong>{r.stats_snapshot.total_students}</strong></span>
                        <span>Approved: <strong>{r.stats_snapshot.approved_students}</strong></span>
                        <span>Applications: <strong>{r.stats_snapshot.total_applications}</strong></span>
                        <span>Placed/Shortlisted: <strong>{r.stats_snapshot.placed_or_shortlisted}</strong></span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setReplyDrafts({ ...replyDrafts, [r.id]: e.target.value })}
                        placeholder="Write official Admin reply to this college..."
                        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        onClick={() =>
                          reviewReportMutation.mutate({
                            id: r.id,
                            status: r.status === 'submitted' ? 'under_review' : r.status,
                            admin_response: draft,
                          })
                        }
                        className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                      >
                        Send Reply
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
