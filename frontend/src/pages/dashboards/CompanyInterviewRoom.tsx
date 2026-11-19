import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Video,
  Code2,
  Users2,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  Award,
  Send,
  Loader2,
  ExternalLink,
  Building,
  FileText,
  User,
  AlertCircle,
  ChevronDown,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';

const TECH_QUESTIONS = [
  { id: 't1', topic: 'Data Structures & Algorithms', title: 'Two-Sum / Subarray Sum with Hash Map', desc: 'Design an O(N) solution to find indices in an array that sum to a target value. Discuss edge cases (negatives, duplicates).' },
  { id: 't2', topic: 'System Design', title: 'Design a Distributed Rate Limiter', desc: 'Discuss Token Bucket vs Leaky Bucket algorithms, Redis atomic counters, and handling multi-region race conditions.' },
  { id: 't3', topic: 'Frontend & React', title: 'Virtual DOM, Reconciliation & Hook Closures', desc: 'Explain how React batches commits, diffing keys, and why stale closures happen inside useEffect.' },
  { id: 't4', topic: 'Database & Concurrency', title: 'Indexing Strategies & ACID Isolation Levels', desc: 'Explain B-Tree index lookups vs Table Scans, and compare Read Committed with Serializable isolation.' },
];

const BEHAVIORAL_QUESTIONS = [
  { id: 'b1', topic: 'Conflict Resolution', title: 'Disagreement on Technical Architecture', desc: 'Describe a situation where you strongly disagreed with a peer on an engineering decision. How did you resolve it?' },
  { id: 'b2', topic: 'Ownership & Delivery', title: 'Handling a Missed Deadline or Outage', desc: 'Tell me about a production bug or missed deadline. How did you diagnose, communicate, and prevent recurrence?' },
  { id: 'b3', topic: 'Teamwork & Mentorship', title: 'Onboarding or Unblocking a Team Member', desc: 'Describe a time you stepped in to help a teammate unblock a critical feature under time pressure.' },
  { id: 'b4', topic: 'Culture & Motivation', title: 'Long-Term Trajectory & Engineering Ethics', desc: 'What inspires you about this company, and how do you see yourself taking product ownership over the next 2-3 years?' },
];

export default function CompanyInterviewRoom() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialAppId = searchParams.get('appId') || '';

  const [selectedAppId, setSelectedAppId] = useState<string>(initialAppId);
  const [activeRound, setActiveRound] = useState<'technical' | 'behavioral'>('technical');

  // Technical scores
  const [techProblemSolving, setTechProblemSolving] = useState(4);
  const [techDSA, setTechDSA] = useState(4);
  const [techCodeQuality, setTechCodeQuality] = useState(4);
  const [techSystemDesign, setTechSystemDesign] = useState(3);
  const [techNotes, setTechNotes] = useState('');

  // Behavioral scores
  const [behavCommunication, setBehavCommunication] = useState(4);
  const [behavCultureFit, setBehavCultureFit] = useState(4);
  const [behavLeadership, setBehavLeadership] = useState(4);
  const [behavSTAR, setBehavSTAR] = useState(4);
  const [behavNotes, setBehavNotes] = useState('');

  // Final recommendation
  const [recommendation, setRecommendation] = useState<'strong_hire' | 'hire' | 'next_round' | 'reject'>('hire');
  const [overallFeedback, setOverallFeedback] = useState('');

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00 AM');
  const [scheduleMode, setScheduleMode] = useState('Virtual (In-Portal / Google Meet)');
  const [scheduleLink, setScheduleLink] = useState('https://meet.google.com/new');
  const [scheduleRound, setScheduleRound] = useState('Technical Round');
  const [scheduleInstructions, setScheduleInstructions] = useState('Please join 5 minutes early with camera on.');

  // Fetch all applications
  const { data: applications = [], isLoading: loadingApps } = useQuery({
    queryKey: ['companyAllApplications'],
    queryFn: async () => {
      const res = await api.get('/company/all-applications');
      return res.data;
    }
  });

  // Selected candidate dossier
  const selectedApp = applications.find((a: any) => a.id === selectedAppId || a._id === selectedAppId) || applications[0];
  const activeId = selectedApp ? (selectedApp.id || selectedApp._id) : '';

  // Evaluation mutation
  const evaluateMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/company/applications/${activeId}/interview/evaluate`, {
        round_type: activeRound,
        technical_scores: {
          problem_solving: techProblemSolving,
          dsa: techDSA,
          code_quality: techCodeQuality,
          system_design: techSystemDesign
        },
        behavioral_scores: {
          communication: behavCommunication,
          culture_fit: behavCultureFit,
          leadership: behavLeadership,
          star_method: behavSTAR
        },
        recommendation,
        technical_notes: techNotes,
        behavioral_notes: behavNotes,
        overall_feedback: overallFeedback
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAllApplications'] });
      queryClient.invalidateQueries({ queryKey: ['companyDashboardStats'] });
      alert(`Interview scorecard successfully recorded! Candidate updated to status: ${recommendation.replace('_', ' ').toUpperCase()}`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to submit evaluation.');
    }
  });

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/company/applications/${activeId}/interview/schedule`, {
        interview_date: scheduleDate,
        interview_time: scheduleTime,
        interview_mode: scheduleMode,
        interview_link: scheduleLink,
        round_type: scheduleRound,
        interview_instructions: scheduleInstructions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyAllApplications'] });
      setShowScheduleModal(false);
      alert('Interview scheduled and invitation dispatched to candidate!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to schedule interview.');
    }
  });

  const renderStarRating = (value: number, setter: (val: number) => void) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setter(star)}
          className={`p-1 transition-colors ${
            star <= value ? 'text-amber-500' : 'text-slate-200 hover:text-amber-300'
          }`}
        >
          <Star size={18} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
      <span className="text-xs font-bold text-slate-700 ml-1.5">{value} / 5</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Video className="text-purple-600" size={28} />
            Live Interview Suite & Conductor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Evaluate candidates in real time with Technical & Behavioral rubrics, take structured notes, and submit hire decisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedApp?.interview_link && (
            <a
              href={selectedApp.interview_link}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Video size={16} />
              Launch Meeting Room
            </a>
          )}

          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Calendar size={15} />
            Schedule / Reschedule
          </button>
        </div>
      </div>

      {/* Candidate Dossier Bar */}
      <div className="card p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200">
                Active Candidate
              </span>
              <span className="text-xs font-semibold text-slate-300">
                Stage: <strong className="text-white">{selectedApp?.status || 'In Review'}</strong>
              </span>
            </div>

            <h2 className="text-xl font-black text-white">
              {selectedApp?.student_name || 'Select a Candidate'}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap pt-0.5">
              <span>{selectedApp?.student_email}</span>
              {selectedApp?.college_name && (
                <span className="flex items-center gap-1 text-purple-200">
                  <Building size={12} /> {selectedApp.college_name}
                </span>
              )}
              {selectedApp?.student_cgpa && (
                <span className="font-bold text-emerald-400">CGPA: {selectedApp.student_cgpa}</span>
              )}
              {selectedApp?.student_branch && (
                <span>Branch: {selectedApp.student_branch}</span>
              )}
            </div>
          </div>

          {/* Quick Candidate Switcher Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <select
              value={activeId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="px-3.5 py-2 bg-slate-800/90 border border-slate-700 text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 max-w-xs"
            >
              {applications.map((app: any) => (
                <option key={app.id || app._id} value={app.id || app._id}>
                  {app.student_name} - {app.job_title} ({app.status})
                </option>
              ))}
            </select>

            {selectedApp?.resume_url && (
              <a
                href={selectedApp.resume_url}
                target="_blank"
                rel="noreferrer"
                download={selectedApp.resume_filename || 'Resume.pdf'}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
              >
                <FileText size={14} />
                Resume
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Interview Workspace: 2 Tabs (Technical vs Behavioral) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Evaluation Rubric & Questions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Round Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold w-fit">
            <button
              onClick={() => setActiveRound('technical')}
              className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeRound === 'technical'
                  ? 'bg-white text-purple-700 shadow font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 size={16} />
              Technical & Problem Solving Round
            </button>
            <button
              onClick={() => setActiveRound('behavioral')}
              className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeRound === 'behavioral'
                  ? 'bg-white text-indigo-700 shadow font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users2 size={16} />
              Behavioral, HR & Culture Fit Round
            </button>
          </div>

          {/* TAB 1: TECHNICAL ASSESSMENT PANEL */}
          {activeRound === 'technical' && (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code2 size={20} className="text-purple-600" />
                  Technical Competency Rubric
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assess the candidate across key computer science and software engineering dimensions.
                </p>
              </div>

              {/* Rubric Criteria Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Problem Solving & Algorithmic Logic</span>
                  <p className="text-[11px] text-slate-500">Ability to break down ambiguous challenges into optimal sub-problems.</p>
                  {renderStarRating(techProblemSolving, setTechProblemSolving)}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Data Structures & Space/Time Efficiency</span>
                  <p className="text-[11px] text-slate-500">Understanding of Big-O complexity, hash tables, trees, graphs, caching.</p>
                  {renderStarRating(techDSA, setTechDSA)}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Code Quality, Modularity & Clean Syntax</span>
                  <p className="text-[11px] text-slate-500">Readability, variable naming, idiomatic syntax, error handling.</p>
                  {renderStarRating(techCodeQuality, setTechCodeQuality)}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">System Design & Architecture Depth</span>
                  <p className="text-[11px] text-slate-500">Microservices, database schema design, APIs, scalability tradeoffs.</p>
                  {renderStarRating(techSystemDesign, setTechSystemDesign)}
                </div>
              </div>

              {/* Technical Questions Bank */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Suggested Technical Questions Bank:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TECH_QUESTIONS.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => setTechNotes((prev) => `${prev ? prev + '\n' : ''}[Asked: ${q.title}]\n`)}
                      className="p-3 bg-purple-50/50 hover:bg-purple-50 border border-purple-200/80 rounded-xl cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-purple-700">{q.topic}</span>
                        <span className="text-[10px] text-brand-600 font-semibold">+ Add to Notes</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900">{q.title}</h4>
                      <p className="text-[11px] text-slate-600">{q.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Interviewer Notes Scratchpad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Live Technical Notes & Candidate Code Observations
                </label>
                <textarea
                  rows={4}
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                  placeholder="Record how the candidate approached edge cases, code modularity, hints needed, and architectural justifications..."
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BEHAVIORAL ASSESSMENT PANEL */}
          {activeRound === 'behavioral' && (
            <div className="card p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users2 size={20} className="text-indigo-600" />
                  Behavioral & Culture Fit Rubric
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluate interpersonal communication, ownership, conflict management, and cultural alignment.
                </p>
              </div>

              {/* Rubric Criteria Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Articulation & Communication Clarity</span>
                  <p className="text-[11px] text-slate-500">Concise explanations, active listening, structured speaking.</p>
                  {renderStarRating(behavCommunication, setBehavCommunication)}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Culture Fit & Core Company Values</span>
                  <p className="text-[11px] text-slate-500">Collaboration mindset, humility, customer-centric attitude.</p>
                  {renderStarRating(behavCultureFit, setBehavCultureFit)}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Ownership, Initiative & Bias for Action</span>
                  <p className="text-[11px] text-slate-500">Proactively solving roadblocks without waiting for instructions.</p>
                  {renderStarRating(behavLeadership, setBehavLeadership)}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Conflict Resolution & STAR Structure</span>
                  <p className="text-[11px] text-slate-500">Constructive feedback handling, diplomatic teamwork under stress.</p>
                  {renderStarRating(behavSTAR, setBehavSTAR)}
                </div>
              </div>

              {/* Behavioral Question Prompts */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  Suggested Behavioral & STAR Prompts:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BEHAVIORAL_QUESTIONS.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => setBehavNotes((prev) => `${prev ? prev + '\n' : ''}[Asked: ${q.title}]\n`)}
                      className="p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-200/80 rounded-xl cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-indigo-700">{q.topic}</span>
                        <span className="text-[10px] text-brand-600 font-semibold">+ Add to Notes</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900">{q.title}</h4>
                      <p className="text-[11px] text-slate-600">{q.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavioral Interviewer Notes Scratchpad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Interviewer Behavioral Observations
                </label>
                <textarea
                  rows={4}
                  value={behavNotes}
                  onChange={(e) => setBehavNotes(e.target.value)}
                  placeholder="Record candidate's real-life project situations, ownership maturity, team dynamics..."
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Scorecard & Final Decision Submission */}
        <div className="space-y-4">
          <div className="card p-6 space-y-5 border-2 border-slate-200 shadow-md">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Official Interview Scorecard
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Decision & Recommendation</h3>
            </div>

            {/* Recommendation Decision Radio Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Hiring Recommendation
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecommendation('strong_hire')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    recommendation === 'strong_hire'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold block">🟢 Strong Hire</span>
                  <span className="text-[10px] text-slate-500">Top 5% talent</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendation('hire')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    recommendation === 'hire'
                      ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm ring-2 ring-blue-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold block">🔵 Hire</span>
                  <span className="text-[10px] text-slate-500">Meets all criteria</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendation('next_round')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    recommendation === 'next_round'
                      ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-sm ring-2 ring-amber-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold block">🟡 Next Round</span>
                  <span className="text-[10px] text-slate-500">Needs more signal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecommendation('reject')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    recommendation === 'reject'
                      ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-sm ring-2 ring-rose-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold block">🔴 No Hire</span>
                  <span className="text-[10px] text-slate-500">Below benchmark</span>
                </button>
              </div>
            </div>

            {/* Overall Summary Feedback */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Executive Evaluation Summary & Feedback
              </label>
              <textarea
                rows={3}
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                placeholder="Candidate demonstrated exceptional problem solving, strong communication, and recommended for immediate offer..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
              />
            </div>

            {/* Submit Scorecard */}
            <button
              disabled={evaluateMutation.isPending || !activeId}
              onClick={() => evaluateMutation.mutate()}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
            >
              {evaluateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
              Finalize & Submit Scorecard
            </button>
          </div>
        </div>
      </div>

      {/* SCHEDULE INTERVIEW MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-purple-600" />
              Schedule Interview with {selectedApp?.student_name}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Interview Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Time Slot</label>
                <input
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Round Type</label>
                <select
                  value={scheduleRound}
                  onChange={(e) => setScheduleRound(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="Technical Round">Technical Round</option>
                  <option value="Behavioral & HR Round">Behavioral & HR Round</option>
                  <option value="Final Culture Fit">Final Culture Fit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Platform / Mode</label>
                <input
                  type="text"
                  value={scheduleMode}
                  onChange={(e) => setScheduleMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Virtual Meeting URL</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={scheduleLink}
                  onChange={(e) => setScheduleLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Candidate Instructions</label>
                <textarea
                  rows={2}
                  value={scheduleInstructions}
                  onChange={(e) => setScheduleInstructions(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={scheduleMutation.isPending || !scheduleDate}
                onClick={() => scheduleMutation.mutate()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {scheduleMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Confirm & Dispatch Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
