import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Video,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  Loader2,
  Building,
  RotateCcw,
  Check,
  Send,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function StudentInterviews() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'scheduled' | 'mock' | 'prep'>('scheduled');

  // Scheduled interviews query
  const { data: interviews = [], isLoading: loadingInterviews } = useQuery({
    queryKey: ['studentInterviews'],
    queryFn: async () => {
      const res = await api.get('/student/interviews');
      return res.data;
    }
  });

  // Mock interview state
  const [selectedTopic, setSelectedTopic] = useState<'all' | 'frontend' | 'backend' | 'hr'>('all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  // Mock questions query
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['mockQuestions', selectedTopic],
    queryFn: async () => {
      const res = await api.get('/student/mock-interview/questions', {
        params: { topic: selectedTopic === 'all' ? undefined : selectedTopic }
      });
      return res.data;
    }
  });

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const startTimer = () => {
    setTimerSeconds(180);
    setIsTimerRunning(true);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(180);
  };

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ appId, attending, note }: { appId: string; attending: boolean; note?: string }) => {
      await api.post(`/student/interviews/${appId}/rsvp`, { attending, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentInterviews'] });
      alert('RSVP status recorded successfully!');
    }
  });

  // Mock evaluate mutation
  const evaluateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/student/mock-interview/evaluate', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setEvaluationResult(data);
      setIsTimerRunning(false);
    }
  });

  const handleEvaluate = () => {
    if (!answerText.trim()) {
      alert('Please enter your answer before evaluating.');
      return;
    }
    const currentQ = questions[currentQuestionIndex] || {};
    evaluateMutation.mutate({
      question_id: currentQ.id || 'q1',
      topic: currentQ.topic || 'General',
      question: currentQ.question || '',
      answer: answerText,
      time_spent_seconds: 180 - timerSeconds
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCurrentQuestionIndex(0);
    }
    setAnswerText('');
    setEvaluationResult(null);
    resetTimer();
  };

  const nextInterview = interviews.find((i: any) => i.interview_date && i.interview_date !== 'TBD');

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Video className="text-purple-600" size={28} />
            Interview Center & Simulator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access your live corporate interviews, join virtual meeting rooms, and practice with mock simulators.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'scheduled'
                ? 'bg-white text-purple-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scheduled Interviews ({interviews.length})
          </button>
          <button
            onClick={() => setActiveTab('mock')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'mock'
                ? 'bg-white text-brand-600 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} className="text-amber-500" />
            Mock Simulator
          </button>
          <button
            onClick={() => setActiveTab('prep')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'prep'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Prep & Tips
          </button>
        </div>
      </div>

      {/* TAB 1: SCHEDULED INTERVIEWS */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          {/* Next Interview Highlight Banner */}
          {nextInterview ? (
            <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-xs font-semibold mb-2">
                    <Clock size={13} />
                    Upcoming Next Interview
                  </div>
                  <h3 className="text-2xl font-bold">{nextInterview.job_title}</h3>
                  <p className="text-purple-200 text-sm mt-0.5 flex items-center gap-2">
                    <Building size={14} />
                    {nextInterview.company_name} • {nextInterview.interview_mode}
                  </p>
                  <p className="text-sm font-medium text-white/90 mt-3 flex items-center gap-2">
                    <Calendar size={16} className="text-purple-300" />
                    <strong>{nextInterview.interview_date}</strong> at{' '}
                    <strong>{nextInterview.interview_time || '10:00 AM'}</strong>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {nextInterview.interview_link && (
                    <a
                      href={nextInterview.interview_link}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-purple-50 text-purple-900 font-bold text-sm rounded-xl shadow flex items-center justify-center gap-2 transition-all hover:scale-105"
                    >
                      <Video size={18} className="text-purple-600" />
                      Join Meeting Room
                    </a>
                  )}
                  <button
                    onClick={() => setActiveTab('mock')}
                    className="w-full sm:w-auto px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-white font-semibold text-xs rounded-xl border border-purple-300/30 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} />
                    Warm Up in Simulator
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">No Corporate Interviews Scheduled Yet</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When recruiters shortlist your applications, your interview meeting links and schedules will appear here.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('mock')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Sparkles size={14} />
                Start Practice Mock Interview
              </button>
            </div>
          )}

          {/* List of Scheduled Interviews */}
          {loadingInterviews ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
          ) : interviews.length === 0 ? (
            <div className="card p-12 text-center">
              <Video className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-bold text-slate-800">No scheduled rounds found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Apply to active campus drives to receive technical and HR interview invitations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((item: any) => (
                <div key={item.id} className="card p-6 transition-all hover:border-slate-300">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg text-slate-900">{item.job_title}</span>
                        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 font-semibold text-xs rounded-full">
                          {item.status}
                        </span>
                        {item.rsvp_status && item.rsvp_status !== 'pending' && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.rsvp_status === 'attending'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            RSVP: {item.rsvp_status === 'attending' ? 'Attending' : 'Clash Reported'}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                        <Building size={14} className="text-slate-400" />
                        {item.company_name} • {item.interview_mode}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-purple-900">
                          <Calendar size={14} className="text-purple-600" />
                          Date: {item.interview_date}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-purple-900">
                          <Clock size={14} className="text-purple-600" />
                          Time: {item.interview_time || '10:00 AM'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.rsvp_status !== 'attending' && (
                        <button
                          onClick={() => rsvpMutation.mutate({ appId: item.id, attending: true })}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Check size={14} />
                          Confirm RSVP
                        </button>
                      )}

                      {item.interview_link && (
                        <a
                          href={item.interview_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          <Video size={14} />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </div>

                  {item.interview_instructions && (
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      <strong>Recruiter Instructions:</strong> {item.interview_instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE MOCK INTERVIEW SIMULATOR */}
      {activeTab === 'mock' && (
        <div className="space-y-6">
          {/* Topic Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Domains' },
              { id: 'frontend', label: 'Frontend Engineering' },
              { id: 'backend', label: 'Backend & Systems' },
              { id: 'hr', label: 'Behavioral & HR' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTopic(t.id as any);
                  setCurrentQuestionIndex(0);
                  setEvaluationResult(null);
                  setAnswerText('');
                  resetTimer();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                  selectedTopic === t.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loadingQuestions ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-brand-600" size={32} />
            </div>
          ) : questions.length === 0 ? (
            <div className="card p-12 text-center">
              <HelpCircle className="mx-auto text-slate-300 mb-2" size={40} />
              <p className="text-slate-600 font-medium">No questions found for this topic.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question & Practice Panel */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-full">
                      Question {currentQuestionIndex + 1} of {questions.length} • {questions[currentQuestionIndex]?.topic}
                    </span>

                    {/* Timer */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                          timerSeconds < 30
                            ? 'bg-rose-100 text-rose-700 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Clock size={14} />
                        {formatTimer(timerSeconds)}
                      </div>
                      {!isTimerRunning ? (
                        <button
                          onClick={startTimer}
                          className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg"
                        >
                          Start Timer
                        </button>
                      ) : (
                        <button
                          onClick={resetTimer}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {questions[currentQuestionIndex]?.question}
                  </h3>

                  {/* Key criteria to cover */}
                  {questions[currentQuestionIndex]?.key_points && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl">
                      <span className="text-xs font-bold text-amber-900 block mb-1">
                        Key Points Recruiters Look For:
                      </span>
                      <ul className="list-disc list-inside text-xs text-amber-800 space-y-0.5">
                        {questions[currentQuestionIndex].key_points.map((pt: string, idx: number) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Student Answer Box */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Your Response
                    </label>
                    <textarea
                      rows={6}
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your structured answer here. Elaborate on the core concepts, practical examples, and architectural decisions..."
                      className="w-full p-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-slate-800"
                    />
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                      <span>Word count: {answerText.trim() ? answerText.trim().split(/\s+/).length : 0}</span>
                      <span>Target: 50 - 150 words</span>
                    </div>
                  </div>

                  {/* Submit / Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleNextQuestion}
                      className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                    >
                      Skip / Next Question
                      <ChevronRight size={14} />
                    </button>

                    <button
                      disabled={evaluateMutation.isPending || !answerText.trim()}
                      onClick={handleEvaluate}
                      className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2"
                    >
                      {evaluateMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={15} />
                      )}
                      Evaluate Answer
                    </button>
                  </div>
                </div>
              </div>

              {/* Instant Evaluation & Benchmarking */}
              <div className="space-y-4">
                {evaluationResult ? (
                  <div className="card p-6 space-y-4 border-2 border-brand-200 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Readiness Score
                      </span>
                      <span
                        className={`text-2xl font-extrabold ${
                          evaluationResult.score >= 80 ? 'text-emerald-600' : 'text-brand-600'
                        }`}
                      >
                        {evaluationResult.score}/100
                      </span>
                    </div>

                    <div className="p-3 bg-brand-50 rounded-xl">
                      <span className="text-xs font-bold text-brand-900 block">Assessment</span>
                      <p className="text-xs text-brand-800 mt-0.5">{evaluationResult.feedback}</p>
                    </div>

                    {/* Strengths */}
                    {evaluationResult.strengths && (
                      <div>
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 mb-1">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Key Strengths:
                        </span>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                          {evaluationResult.strengths.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {evaluationResult.improvements && (
                      <div>
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-1 mb-1">
                          <AlertCircle size={14} className="text-amber-600" />
                          How to Level Up:
                        </span>
                        <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                          {evaluationResult.improvements.map((imp: string, idx: number) => (
                            <li key={idx}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Benchmark Sample Answer */}
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-800 block mb-1">
                        Benchmarking Model Answer:
                      </span>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                        {questions[currentQuestionIndex]?.sample_answer}
                      </p>
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      Practice Next Question
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="card p-6 text-center text-slate-400 space-y-3">
                    <Award className="mx-auto text-slate-300" size={40} />
                    <h4 className="font-bold text-slate-700 text-sm">Instant Scoring & Feedback</h4>
                    <p className="text-xs text-slate-500">
                      Type your response on the left and submit it to see your readiness score, key strengths, and an expert model answer.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INTERVIEW PREPARATION TIPS & FRAMEWORKS */}
      {activeTab === 'prep' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-brand-600" />
              The STAR Behavioral Framework
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When answering situational and HR questions ("Tell me about a time you handled a conflict or deadline"), structure your thoughts using STAR:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="font-bold text-xs text-blue-900 block">S - Situation</span>
                <p className="text-xs text-blue-800 mt-0.5">Describe the context, the team project, or specific challenge.</p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="font-bold text-xs text-purple-900 block">T - Task</span>
                <p className="text-xs text-purple-800 mt-0.5">Explain your specific responsibility and what needed to be achieved.</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-xs text-amber-900 block">A - Action</span>
                <p className="text-xs text-amber-800 mt-0.5">Detail the technical tools, architecture, and proactive steps you took.</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-bold text-xs text-emerald-900 block">R - Result</span>
                <p className="text-xs text-emerald-800 mt-0.5">Highlight the quantifiable impact, outcome, and what you learned.</p>
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Pre-Interview Checklist
            </h3>
            <div className="space-y-2.5 text-xs text-slate-700">
              <label className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-brand-600" />
                <span>Test your webcam, microphone, and internet stability 15 minutes before the round.</span>
              </label>
              <label className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-brand-600" />
                <span>Keep your updated resume PDF and GitHub profile open in a background tab.</span>
              </label>
              <label className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-brand-600" />
                <span>Prepare 2 thoughtful questions for the interviewer regarding engineering practices.</span>
              </label>
              <label className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-brand-600" />
                <span>Review core CS fundamentals: Time/Space Complexity, OOP, and REST APIs.</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
