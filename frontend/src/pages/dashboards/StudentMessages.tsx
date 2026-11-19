import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  User,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { api } from '../../services/api';

const QUICK_INQUIRIES = [
  { label: 'Drive Eligibility', category: 'drive_eligibility', text: 'Hello Placement Cell, could you please clarify the eligibility criteria for the upcoming tech drive?' },
  { label: 'Resume Approval', category: 'resume_approval', text: 'Hi, I have updated my profile and uploaded my latest resume. Could you please verify and approve it?' },
  { label: 'Interview Clash', category: 'interview_query', text: 'Dear Sir/Madam, my upcoming campus interview clashes with an exam schedule. Can we request a reschedule?' },
  { label: 'NOC / Clearance', category: 'general', text: 'Hello, I have received an internship offer and need the college NOC / placement clearance certificate.' }
];

export default function StudentMessages() {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['studentCollegeMessages'],
    queryFn: async () => {
      const res = await api.get('/student/college-messages');
      return res.data;
    },
    refetchInterval: 10000 // periodic refresh
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: { message: string; category: string }) => {
      const res = await api.post('/student/college-messages', payload);
      return res.data;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['studentCollegeMessages'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to send message.');
    }
  });

  const messages = data?.messages || [];
  const college = data?.college;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMutation.mutate({ message: messageText, category: selectedCategory });
  };

  const handleUseQuickInquiry = (inquiry: any) => {
    setMessageText(inquiry.text);
    setSelectedCategory(inquiry.category);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-brand-600" size={28} />
            Message College Placement Cell
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Direct 2-way communication channel with your institutional placement coordinators.
          </p>
        </div>

        {college && (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-700 font-semibold border border-slate-200">
            <Building size={15} className="text-brand-600" />
            <span>{college.name}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        )}
      </div>

      {/* Quick Template Chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
          <Sparkles size={13} className="text-amber-500" />
          Quick Inquiries & Templates:
        </span>
        <div className="flex flex-wrap gap-2">
          {QUICK_INQUIRIES.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleUseQuickInquiry(q)}
              className="px-3 py-1.5 bg-white hover:bg-brand-50 hover:text-brand-700 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              + {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="card overflow-hidden flex flex-col h-[600px] border border-slate-200 shadow-sm">
        {/* Chat Officer Info Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{college?.name || 'College Placement Desk'}</h3>
              <p className="text-[11px] text-slate-500">Official Placement & Career Guidance Cell</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Active Desk
          </span>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-brand-600" size={32} />
            </div>
          ) : !college ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <Building size={36} className="text-slate-300" />
              <h4 className="font-bold text-slate-800">No College Assigned</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                You are not currently linked to any college placement cell. Please check your profile or register with your college.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
              <MessageSquare size={36} className="text-slate-300" />
              <h4 className="font-bold text-slate-800">No messages yet</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Have a question regarding campus drives, eligibility criteria, or need document clearance? Send a message below to start the conversation!
              </p>
            </div>
          ) : (
            messages.map((m: any) => {
              const isStudent = m.sender_role === 'student';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-bold text-slate-500">
                      {isStudent ? 'You' : m.sender_name || 'Placement Officer'}
                    </span>
                    {m.category && m.category !== 'general' && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-slate-200/70 text-slate-600 rounded">
                        {m.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                      isStudent
                        ? 'bg-brand-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <div
                      className={`text-[10px] mt-1.5 text-right font-medium ${
                        isStudent ? 'text-brand-100' : 'text-slate-400'
                      }`}
                    >
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Tag size={12} /> Category:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="general">General Inquiry</option>
              <option value="drive_eligibility">Drive Eligibility</option>
              <option value="resume_approval">Resume Approval</option>
              <option value="interview_query">Interview Schedule</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message to the placement cell coordinator..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
            />
            <button
              type="submit"
              disabled={sendMutation.isPending || !messageText.trim() || !college}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
