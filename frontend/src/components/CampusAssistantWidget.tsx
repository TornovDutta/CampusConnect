import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Trash2,
  Loader2,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface SourceItem {
  id: string;
  category: string;
  title: string;
  college_name: string;
}

interface ActionLink {
  label: string;
  path: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceItem[];
  suggested_actions?: ActionLink[];
  model?: string;
}

interface CampusAssistantWidgetProps {
  collegeId?: string;
  contextLabel?: string;
}

function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 break-words">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        // Bold inline segments: **something**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, idx) => {
              if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                return (
                  <strong key={idx} className="font-bold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function CampusAssistantWidget({
  collegeId,
  contextLabel,
}: CampusAssistantWidgetProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const scrollEndRef = useRef<HTMLDivElement>(null);

  const { data: statusData } = useQuery({
    queryKey: ['assistantStatus'],
    queryFn: async () => {
      const res = await api.get('/assistant/status');
      return res.data as { configured: boolean; model: string; provider: string };
    },
    staleTime: 60000,
    enabled: isOpen,
  });

  // Load saved history for logged-in users when widget opens
  useEffect(() => {
    if (!isOpen || !isAuthenticated || hasLoadedHistory) return;
    let active = true;
    (async () => {
      try {
        const res = await api.get('/assistant/history');
        if (!active) return;
        const rows = (res.data?.messages || []) as Array<{
          role: 'user' | 'assistant';
          content: string;
        }>;
        if (rows.length > 0) {
          setMessages(
            rows.map((r, idx) => ({
              id: `hist-${idx}`,
              role: r.role,
              content: r.content,
            }))
          );
        }
      } catch {
        // Ignore history fetch errors gracefully
      } finally {
        if (active) setHasLoadedHistory(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, isAuthenticated, hasLoadedHistory]);

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending, isOpen]);

  const role = user?.role || 'guest';

  const quickPrompts =
    role === 'college'
      ? [
          'How can I add campus clubs & facilities?',
          'How many students are awaiting approval?',
          'Summarize active campus drives',
        ]
      : role === 'super_admin'
      ? [
          'Give me a live platform summary',
          'How do I publish a global campus FAQ?',
          'List current active colleges',
        ]
      : role === 'company'
      ? [
          'How do I invite partner colleges to a drive?',
          'How does the In-Portal Interview Suite work?',
          'Which colleges are on CampusConnect?',
        ]
      : [
          'What campus clubs & activities are available?',
          'Tell me about college facilities & labs',
          'Are there any upcoming campus events?',
          isAuthenticated ? 'Show my active drives & interviews' : 'Which colleges can I explore?',
        ];

  const handleSend = async (textOverride?: string) => {
    const trimmed = (textOverride ?? input).trim();
    if (!trimmed || isSending) return;

    setErrorText(null);
    if (!textOverride) setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsSending(true);

    try {
      const historyPayload = nextMessages.slice(-8, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post('/assistant/chat', {
        message: trimmed,
        college_id: collegeId || undefined,
        history: historyPayload,
      });

      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.data?.reply || 'I could not generate a response right now.',
        sources: res.data?.sources || [],
        suggested_actions: res.data?.suggested_actions || [],
        model: res.data?.model,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        'Unable to reach the AI Campus Assistant right now. Please try again.';
      setErrorText(detail);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleClear = async () => {
    setErrorText(null);
    setMessages([]);
    if (isAuthenticated) {
      try {
        await api.delete('/assistant/history');
      } catch {
        // ignore
      }
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close AI Campus Assistant' : 'Open AI Campus Assistant'}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/35 hover:shadow-indigo-500/50 transition-all border border-white/20"
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? <X size={20} /> : <Bot size={20} />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
          )}
        </div>
        <span className="text-xs sm:text-sm font-bold tracking-tight">
          {isOpen ? 'Close AI' : 'Campus AI'}
        </span>
      </motion.button>

      {/* Responsive Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-3 bottom-20 top-16 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[410px] sm:h-[580px] sm:max-h-[calc(100vh-8rem)] z-50 bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-950 via-[#131836] to-[#1e1b4b] text-white flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold tracking-tight truncate">
                    AI Campus Assistant
                  </h3>
                  <p className="text-[11px] text-indigo-200 truncate">
                    {contextLabel
                      ? contextLabel
                      : statusData?.model
                      ? `Groq • ${statusData.model}`
                      : 'Activities, Clubs, Facilities & FAQs'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear conversation"
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close assistant"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-slate-50/70 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="space-y-4 py-2">
                  <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                      <Bot size={16} />
                      <span>Welcome to CampusConnect Assistant!</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ask me anything about <strong>campus activities</strong>,{' '}
                      <strong>college facilities</strong>, <strong>student clubs</strong>,{' '}
                      <strong>upcoming events</strong>, or your <strong>placement drives</strong>.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block">
                      Try asking:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickPrompts.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => handleSend(q)}
                          className="text-left px-3 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-medium text-slate-700 transition-colors shadow-2xs"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-sm'
                            : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        ) : (
                          renderFormattedText(m.content)
                        )}
                      </div>

                      {/* Grounded Sources */}
                      {!isUser && m.sources && m.sources.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1 max-w-[90%]">
                          {m.sources.slice(0, 3).map((src) => (
                            <span
                              key={src.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-semibold text-indigo-700"
                            >
                              <BookOpen size={10} />
                              <span className="truncate max-w-[140px]">{src.title}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quick Navigation Actions */}
                      {!isUser && m.suggested_actions && m.suggested_actions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[90%]">
                          {m.suggested_actions.map((act) => (
                            <button
                              key={act.path}
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                navigate(act.path);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-colors"
                            >
                              <span>{act.label}</span>
                              <ArrowRight size={11} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {isSending && (
                <div className="flex items-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

              {errorText && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorText}
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about clubs, facilities, events..."
                disabled={isSending}
                className="flex-1 min-w-0 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 text-slate-900 placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label="Send message"
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white shadow-sm shrink-0 transition-all"
              >
                <Send size={17} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
