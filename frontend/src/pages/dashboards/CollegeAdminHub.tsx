import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  FileBarChart2,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Users,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';

export default function CollegeAdminHub() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'reports' ? 'reports' : searchParams.get('tab') === 'students' ? 'students' : 'messages';
  const [activeTab, setActiveTab] = useState<'messages' | 'reports' | 'students'>(initialTab);

  // Messaging state
  const [msgText, setMsgText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Student chat state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentReplyText, setStudentReplyText] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const studentChatEndRef = useRef<HTMLDivElement>(null);

  // Report state
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('placement_summary');
  const [reportPriority, setReportPriority] = useState('normal');
  const [reportDesc, setReportDesc] = useState('');
  const [attachStats, setAttachStats] = useState(true);
  const [reportSuccess, setReportSuccess] = useState('');

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['collegeAdminMessages'],
    queryFn: async () => {
      const res = await api.get('/college/messages');
      return res.data as Array<{
        id: string;
        sender_role: string;
        sender_name: string;
        message: string;
        created_at: string;
      }>;
    },
    refetchInterval: 8000,
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['collegeSubmittedReports'],
    queryFn: async () => {
      const res = await api.get('/college/reports');
      return res.data as any[];
    },
  });

  // Student threads & chat query
  const { data: studentThreads = [], isLoading: loadingThreads } = useQuery({
    queryKey: ['collegeStudentThreads'],
    queryFn: async () => {
      const res = await api.get('/college/student-threads');
      return res.data as any[];
    },
    refetchInterval: 8000,
  });

  const { data: studentMessages = [], isLoading: loadingStudentMsgs } = useQuery({
    queryKey: ['collegeStudentMessages', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const res = await api.get(`/college/student-messages/${selectedStudentId}`);
      return res.data as any[];
    },
    enabled: !!selectedStudentId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (activeTab === 'messages') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'students') {
      studentChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, studentMessages.length, activeTab]);

  const replyStudentMutation = useMutation({
    mutationFn: async ({ studentId, message }: { studentId: string; message: string }) => {
      await api.post(`/college/student-messages/${studentId}`, { message });
    },
    onSuccess: () => {
      setStudentReplyText('');
      queryClient.invalidateQueries({ queryKey: ['collegeStudentMessages', selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ['collegeStudentThreads'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to send reply');
    }
  });

  const handleReplyStudent = (e: FormEvent) => {
    e.preventDefault();
    if (!studentReplyText.trim() || !selectedStudentId) return;
    replyStudentMutation.mutate({ studentId: selectedStudentId, message: studentReplyText });
  };

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      await api.post('/college/messages', { message: msgText });
    },
    onSuccess: () => {
      setMsgText('');
      queryClient.invalidateQueries({ queryKey: ['collegeAdminMessages'] });
      queryClient.invalidateQueries({ queryKey: ['collegeDashboardStats'] });
    },
  });

  const submitReportMutation = useMutation({
    mutationFn: async () => {
      await api.post('/college/reports', {
        title: reportTitle,
        category: reportCategory,
        priority: reportPriority,
        description: reportDesc,
        attach_stats_snapshot: attachStats,
      });
    },
    onSuccess: () => {
      setReportTitle('');
      setReportDesc('');
      setReportSuccess('Report submitted to Super Admin successfully!');
      setTimeout(() => setReportSuccess(''), 4000);
      queryClient.invalidateQueries({ queryKey: ['collegeSubmittedReports'] });
    },
  });

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    sendMessageMutation.mutate();
  };

  const handleSubmitReport = (e: FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDesc.trim()) return;
    submitReportMutation.mutate();
  };

  const getReportStatusBadge = (st: string) => {
    if (st === 'resolved') return 'bg-emerald-100 text-emerald-700';
    if (st === 'under_review') return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <ShieldCheck className="text-brand-500" size={26} />
          Admin Communication & Reports Hub
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Exchange direct messages with CampusConnect Super Admins and submit official placement or issue reports.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('messages')}
          className={`py-3 px-4 border-b-2 text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
            activeTab === 'messages'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare size={16} /> Direct Messages with Admin
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 border-b-2 text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileBarChart2 size={16} /> Reports to Admin ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`py-3 px-4 border-b-2 text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
            activeTab === 'students'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={16} /> Student Inquiries Desk
          {studentThreads.some((t: any) => t.unread_count > 0) && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
      </div>

      {activeTab === 'messages' && (
        <div className="card flex flex-col h-[560px] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Super Admin Direct Thread</h3>
              <p className="text-xs text-slate-500">Messages sent by Super Admin to your college appear here in real time.</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
              Live Sync (8s)
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-500" size={26} />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <MessageSquare size={36} className="mb-2 opacity-40" />
                <p className="text-sm font-medium text-slate-600">No messages yet</p>
                <p className="text-xs mt-1">Start a conversation with CampusConnect Super Admin below.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.sender_role === 'college';
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isMine
                          ? 'bg-brand-600 text-white rounded-br-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      <div className={`text-[10px] font-bold uppercase mb-1 ${isMine ? 'text-brand-100' : 'text-indigo-600'}`}>
                        {isMine ? 'Your Placement Cell' : 'Super Admin'}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
                      <div className={`text-[10px] mt-1.5 text-right ${isMine ? 'text-brand-100' : 'text-slate-400'}`}>
                        {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-2.5">
            <input
              type="text"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Write a direct message to Super Admin..."
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={sendMessageMutation.isPending || !msgText.trim()}
              className="btn-primary px-5 py-2.5 flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {sendMessageMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send
            </button>
          </form>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Submit New Report */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileBarChart2 size={19} className="text-brand-500" />
              Submit Official Report to Super Admin
            </h3>

            {reportSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle2 size={18} /> {reportSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Report Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="placement_summary">Placement Summary Report</option>
                    <option value="issue_escalation">Technical / Feature Issue Escalation</option>
                    <option value="company_feedback">Company / Recruiter Feedback</option>
                    <option value="drive_request">New Campus Drive Request</option>
                    <option value="general">General Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Priority</label>
                  <select
                    value={reportPriority}
                    onChange={(e) => setReportPriority(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Monthly Placement Progress & Support Request — Batch 2026"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Detailed Summary / Observations</label>
                <textarea
                  rows={4}
                  required
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Provide details, concerns, drive outcomes, or requests for the platform administrator..."
                  className="input-field text-sm resize-none"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachStats}
                  onChange={(e) => setAttachStats(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600"
                />
                Automatically attach live college placement statistics snapshot (students, applications, placements)
              </label>

              <div className="flex justify-end">
                <button type="submit" disabled={submitReportMutation.isPending} className="btn-primary px-6 py-2.5 flex items-center gap-2">
                  {submitReportMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Submit Report to Admin
                </button>
              </div>
            </form>
          </div>

          {/* Submitted Reports History */}
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Submitted Reports History</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {loadingReports ? (
                <div className="p-8 text-center text-slate-400">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No reports submitted to Admin yet.</div>
              ) : (
                reports.map((r: any) => (
                  <div key={r.id} className="p-5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{r.title}</span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {r.category.replace('_', ' ')}
                        </span>
                        {r.priority === 'urgent' && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 inline-flex items-center gap-1">
                            <AlertTriangle size={10} /> Urgent
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${getReportStatusBadge(r.status)}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{r.description}</p>

                    {r.stats_snapshot && (
                      <div className="flex flex-wrap gap-3 text-[11px] bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-slate-600">
                        <span>Students: <strong>{r.stats_snapshot.total_students}</strong></span>
                        <span>Approved: <strong>{r.stats_snapshot.approved_students}</strong></span>
                        <span>Applications: <strong>{r.stats_snapshot.total_applications}</strong></span>
                        <span>Shortlisted/Placed: <strong>{r.stats_snapshot.placed_or_shortlisted}</strong></span>
                      </div>
                    )}

                    {r.admin_response && (
                      <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-900">
                        <span className="font-bold">Super Admin Response: </span>
                        {r.admin_response}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock size={11} /> Submitted {r.created_at ? new Date(r.created_at).toLocaleString() : '-'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT INQUIRIES DESK */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Student Threads List */}
          <div className="card flex flex-col h-[600px] overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Student Inquiries</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                  {studentThreads.length} Thread(s)
                </span>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter student by name or branch..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingThreads ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="animate-spin text-brand-600 mx-auto mb-2" size={24} />
                  Loading threads...
                </div>
              ) : studentThreads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No students have sent messages to the placement desk yet.
                </div>
              ) : (
                studentThreads
                  .filter((st: any) => {
                    if (!studentSearch.trim()) return true;
                    const q = studentSearch.toLowerCase();
                    return (
                      (st.student_name || '').toLowerCase().includes(q) ||
                      (st.branch || '').toLowerCase().includes(q) ||
                      (st.roll_number || '').toLowerCase().includes(q)
                    );
                  })
                  .map((st: any) => {
                    const isSelected = selectedStudentId === st.student_id;
                    return (
                      <button
                        key={st.student_id}
                        onClick={() => setSelectedStudentId(st.student_id)}
                        className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-brand-50/60 border-l-4 border-brand-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800 truncate">{st.student_name}</span>
                            {st.unread_count > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                                {st.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {st.branch || 'Student'} {st.batch ? `• ${st.batch}` : ''} {st.cgpa ? `(CGPA ${st.cgpa})` : ''}
                          </p>
                          <p className="text-[11px] text-slate-600 truncate mt-1 italic">
                            "{st.last_message}"
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {st.last_message_time ? new Date(st.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Right: Selected Student Chat Thread */}
          <div className="lg:col-span-2 card flex flex-col h-[600px] overflow-hidden">
            {selectedStudentId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {studentThreads.find((t: any) => t.student_id === selectedStudentId)?.student_name || 'Student Chat'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {studentThreads.find((t: any) => t.student_id === selectedStudentId)?.student_email} • Roll: {studentThreads.find((t: any) => t.student_id === selectedStudentId)?.roll_number || 'N/A'}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    Live Channel
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/30">
                  {loadingStudentMsgs ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="animate-spin text-brand-500" size={24} />
                    </div>
                  ) : studentMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                      No messages in this thread yet. Send a message below!
                    </div>
                  ) : (
                    studentMessages.map((m: any) => {
                      const isCollege = m.sender_role === 'college';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isCollege ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[11px] font-semibold text-slate-400">
                              {isCollege ? 'Placement Desk (You)' : m.sender_name || 'Student'}
                            </span>
                            {m.category && m.category !== 'general' && (
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-slate-200/70 text-slate-600 rounded">
                                {m.category.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                              isCollege
                                ? 'bg-brand-600 text-white rounded-br-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.message}</p>
                            <span
                              className={`text-[10px] block mt-1 text-right ${
                                isCollege ? 'text-brand-100' : 'text-slate-400'
                              }`}
                            >
                              {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={studentChatEndRef} />
                </div>

                {/* Reply Form */}
                <form onSubmit={handleReplyStudent} className="p-4 border-t border-slate-200 bg-white flex gap-2.5">
                  <input
                    type="text"
                    value={studentReplyText}
                    onChange={(e) => setStudentReplyText(e.target.value)}
                    placeholder="Reply to student regarding drive eligibility, resume approval, etc..."
                    className="flex-1 px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={replyStudentMutation.isPending || !studentReplyText.trim()}
                    className="btn-primary px-5 py-2 flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    {replyStudentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                    Reply
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                <Users size={36} className="text-slate-300" />
                <h4 className="font-bold text-slate-700 text-sm">Select a Student Inquiry</h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Click on any student from the left panel to review their inquiry and send an official placement desk response.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
