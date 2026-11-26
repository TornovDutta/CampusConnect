import { useState, useEffect } from 'react';
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
  Play,
  RotateCcw,
  Terminal,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  CheckSquare,
  Square,
  Timer
} from 'lucide-react';
import { api } from '../../services/api';

const TECH_PROBLEMS = [
  {
    id: 'p1',
    title: 'Two-Sum & Target Index Map (O(N))',
    topic: 'DSA & Hash Tables',
    desc: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target in O(N) time.',
    starterCode: {
      python: `def two_sum(nums, target):\n    # TODO: Implement O(N) solution using a Hash Map\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []\n\n# Test Harness\ntest_nums = [2, 7, 11, 15]\ntest_target = 9\nprint(f"Input: {test_nums}, Target: {test_target}")\nresult = two_sum(test_nums, test_target)\nprint(f"Output Indices: {result}")\nassert result == [0, 1], "Test failed!"\nprint("✅ All test cases passed successfully!")`,
      javascript: `function twoSum(nums, target) {\n    // TODO: Implement O(N) using Map\n    const seen = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (seen.has(complement)) {\n            return [seen.get(complement), i];\n        }\n        seen.set(nums[i], i);\n    }\n    return [];\n}\n\n// Test Harness\nconst nums = [2, 7, 11, 15];\nconst target = 9;\nconsole.log("Input:", nums, "Target:", target);\nconst res = twoSum(nums, target);\nconsole.log("Output Indices:", res);\nconsole.log(res[0] === 0 && res[1] === 1 ? "✅ Passed!" : "❌ Failed!");`
    }
  },
  {
    id: 'p2',
    title: 'Longest Substring Without Repeating Characters',
    topic: 'Sliding Window',
    desc: 'Given a string s, find the length of the longest substring without repeating characters in O(N) complexity.',
    starterCode: {
      python: `def length_of_longest_substring(s: str) -> int:\n    char_index = {}\n    left = 0\n    max_len = 0\n    for right, ch in enumerate(s):\n        if ch in char_index and char_index[ch] >= left:\n            left = char_index[ch] + 1\n        char_index[ch] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len\n\n# Test Harness\ntest_cases = ["abcabcbb", "bbbbb", "pwwkew"]\nfor text in test_cases:\n    print(f"String: '{text}' -> Longest Length: {length_of_longest_substring(text)}")\nprint("✅ Test suite execution complete!")`,
      javascript: `function lengthOfLongestSubstring(s) {\n    let map = new Map();\n    let left = 0;\n    let maxLen = 0;\n    for (let right = 0; right < s.length; right++) {\n        const ch = s[right];\n        if (map.has(ch) && map.get(ch) >= left) {\n            left = map.get(ch) + 1;\n        }\n        map.set(ch, right);\n        maxLen = Math.max(maxLen, right - left + 1);\n    }\n    return maxLen;\n}\n\n["abcabcbb", "bbbbb", "pwwkew"].forEach(str => {\n    console.log("'" + str + "': length =", lengthOfLongestSubstring(str));\n});`
    }
  },
  {
    id: 'p3',
    title: 'Token Bucket Rate Limiter Class',
    topic: 'System Design & Concurrency',
    desc: 'Implement a Token Bucket rate limiter that allows a burst capacity and refills at a steady rate per second.',
    starterCode: {
      python: `import time\n\nclass TokenBucketRateLimiter:\n    def __init__(self, capacity: int, refill_rate_per_sec: float):\n        self.capacity = capacity\n        self.refill_rate = refill_rate_per_sec\n        self.tokens = capacity\n        self.last_refill = time.time()\n\n    def allow_request(self, tokens_needed: int = 1) -> bool:\n        now = time.time()\n        elapsed = now - self.last_refill\n        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)\n        self.last_refill = now\n        if self.tokens >= tokens_needed:\n            self.tokens -= tokens_needed\n            return True\n        return False\n\nlimiter = TokenBucketRateLimiter(capacity=3, refill_rate_per_sec=1.0)\nprint("Request 1:", limiter.allow_request())\nprint("Request 2:", limiter.allow_request())\nprint("Request 3:", limiter.allow_request())\nprint("Request 4 (Expect False):", limiter.allow_request())`,
      javascript: `class TokenBucketRateLimiter {\n    constructor(capacity, refillRatePerSec) {\n        this.capacity = capacity;\n        this.refillRate = refillRatePerSec;\n        this.tokens = capacity;\n        this.lastRefill = Date.now();\n    }\n    allowRequest(tokensNeeded = 1) {\n        const now = Date.now();\n        const elapsedSec = (now - this.lastRefill) / 1000;\n        this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRate);\n        this.lastRefill = now;\n        if (this.tokens >= tokensNeeded) {\n            this.tokens -= tokensNeeded;\n            return true;\n        }\n        return false;\n    }\n}\nconst limiter = new TokenBucketRateLimiter(3, 1);\nconsole.log("Req 1:", limiter.allowRequest());\nconsole.log("Req 2:", limiter.allowRequest());\nconsole.log("Req 3:", limiter.allowRequest());\nconsole.log("Req 4 (Burst Exceeded):", limiter.allowRequest());`
    }
  }
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

  // Interactive Code Runner State
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript'>('python');
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const [activeCode, setActiveCode] = useState(() => TECH_PROBLEMS[0].starterCode.python);
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Coding Stopwatch / Timer
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => sec - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Behavioral scores & STAR Checklist
  const [behavCommunication, setBehavCommunication] = useState(4);
  const [behavCultureFit, setBehavCultureFit] = useState(4);
  const [behavLeadership, setBehavLeadership] = useState(4);
  const [behavSTAR, setBehavSTAR] = useState(4);
  const [behavNotes, setBehavNotes] = useState('');

  const [starChecklist, setStarChecklist] = useState({
    situation: true,
    task: true,
    action: true,
    result: false
  });

  // Simulated WebRTC Media State
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);

  // Final recommendation
  const [recommendation, setRecommendation] = useState<'strong_hire' | 'hire' | 'next_round' | 'reject'>('hire');
  const [overallFeedback, setOverallFeedback] = useState('');

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00 AM');
  const [scheduleMode, setScheduleMode] = useState('Virtual (In-Portal / Google Meet)');
  const [scheduleLink, setScheduleLink] = useState('https://meet.jit.si/CampusConnect-Live');
  const [scheduleRound, setScheduleRound] = useState('Technical Round');
  const [scheduleInstructions, setScheduleInstructions] = useState('Please join 5 minutes early with camera on.');

  // Fetch all applications
  const { data: applications = [] } = useQuery({
    queryKey: ['companyAllApplications'],
    queryFn: async () => {
      const res = await api.get('/company/all-applications');
      return res.data;
    }
  });

  const selectedApp = applications.find((a: any) => a.id === selectedAppId || a._id === selectedAppId) || applications[0];
  const activeId = selectedApp ? (selectedApp.id || selectedApp._id) : '';

  // Problem Switcher
  const handleProblemChange = (index: number) => {
    setSelectedProblemIndex(index);
    const problem = TECH_PROBLEMS[index];
    const starter = selectedLanguage === 'python' ? problem.starterCode.python : problem.starterCode.javascript;
    setActiveCode(starter);
    setCodeOutput(null);
    setCodeError(null);
    setExecTime(null);
  };

  const handleLanguageChange = (lang: 'python' | 'javascript') => {
    setSelectedLanguage(lang);
    const problem = TECH_PROBLEMS[selectedProblemIndex];
    setActiveCode(lang === 'python' ? problem.starterCode.python : problem.starterCode.javascript);
    setCodeOutput(null);
    setCodeError(null);
  };

  // Run Code Mutation
  const handleRunCode = async () => {
    setIsRunningCode(true);
    setCodeOutput(null);
    setCodeError(null);
    try {
      const res = await api.post('/company/interview/run-code', {
        language: selectedLanguage,
        code: activeCode
      });
      setCodeOutput(res.data.stdout);
      setCodeError(res.data.stderr || null);
      setExecTime(res.data.execution_time_ms);
      if (res.data.status === 'success') {
        setTechNotes((prev) => `${prev ? prev + '\n' : ''}[Code Run: Success in ${res.data.execution_time_ms}ms]\n`);
      } else {
        setTechNotes((prev) => `${prev ? prev + '\n' : ''}[Code Run: Errors encountered]\n`);
      }
    } catch (err: any) {
      setCodeError(err.response?.data?.detail || 'Execution error');
    } finally {
      setIsRunningCode(false);
    }
  };

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
            In-Portal Live Interview Suite & IDE
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Conduct live coding assessments, run real test cases, evaluate STAR behavioral competencies, and finalize decisions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Coding Timer Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-mono font-bold shadow-sm">
            <Timer size={14} className={isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
            <span>{formatTime(secondsRemaining)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-[10px] text-brand-300 hover:text-white underline ml-1"
            >
              {isTimerRunning ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setSecondsRemaining(45 * 60);
              }}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Reset
            </button>
          </div>

          {selectedApp?.interview_link && (
            <a
              href={selectedApp.interview_link}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Video size={16} />
              Open WebRTC Room
            </a>
          )}

          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Calendar size={15} />
            Schedule Round
          </button>
        </div>
      </div>

      {/* Candidate Dossier Bar */}
      <div className="card p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200">
                Active Interviewee
              </span>
              <span className="text-xs font-semibold text-slate-300">
                Stage: <strong className="text-white">{selectedApp?.status || 'In Review'}</strong>
              </span>
              {selectedApp?.match_score && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {selectedApp.match_score}% Match
                </span>
              )}
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
        {/* Left 2 Cols: Evaluation Rubric & Questions & IDE */}
        <div className="lg:col-span-2 space-y-4">
          {/* Round Toggle */}
          <div className="flex flex-wrap sm:flex-nowrap bg-slate-100 p-1 rounded-xl text-xs font-bold w-full sm:w-fit gap-1">
            <button
              onClick={() => setActiveRound('technical')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeRound === 'technical'
                  ? 'bg-white text-purple-700 shadow font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 size={16} className="shrink-0" />
              <span className="truncate">Technical & Coding</span>
            </button>
            <button
              onClick={() => setActiveRound('behavioral')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeRound === 'behavioral'
                  ? 'bg-white text-indigo-700 shadow font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users2 size={16} className="shrink-0" />
              <span className="truncate">Behavioral & STAR</span>
            </button>
          </div>

          {/* TAB 1: TECHNICAL ASSESSMENT & LIVE IN-PORTAL CODE RUNNER */}
          {activeRound === 'technical' && (
            <div className="space-y-4">
              {/* INTERACTIVE IN-PORTAL CODING WORKSPACE */}
              <div className="card p-5 space-y-4 border-2 border-purple-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Code2 size={20} className="text-purple-600" />
                      In-Portal Collaborative IDE & Test Suite
                    </h3>
                    <p className="text-xs text-slate-500">
                      Write and execute live candidate code with real test cases directly inside CampusConnect.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                      value={selectedProblemIndex}
                      onChange={(e) => handleProblemChange(Number(e.target.value))}
                      className="flex-1 sm:flex-none max-w-full px-2.5 py-1.5 border border-purple-200 bg-purple-50/50 rounded-lg text-xs font-bold text-purple-900 focus:outline-none truncate"
                    >
                      {TECH_PROBLEMS.map((prob, idx) => (
                        <option key={prob.id} value={idx}>
                          {prob.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value as any)}
                      className="px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none shrink-0"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript (Node.js)</option>
                    </select>
                  </div>
                </div>

                {/* Problem Description Banner */}
                <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-800">
                    <span>{TECH_PROBLEMS[selectedProblemIndex].title}</span>
                    <span className="uppercase text-[10px] bg-purple-200/60 px-2 py-0.5 rounded-full">
                      {TECH_PROBLEMS[selectedProblemIndex].topic}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{TECH_PROBLEMS[selectedProblemIndex].desc}</p>
                </div>

                {/* Live Code Area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>main.{selectedLanguage === 'python' ? 'py' : 'js'}</span>
                    <button
                      type="button"
                      onClick={() => handleProblemChange(selectedProblemIndex)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RotateCcw size={12} /> Reset Template
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={activeCode}
                    onChange={(e) => setActiveCode(e.target.value)}
                    className="w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 border border-slate-800 leading-relaxed shadow-inner"
                    spellCheck={false}
                  />
                </div>

                {/* Run Action & Execution Console */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      disabled={isRunningCode || !activeCode.trim()}
                      onClick={handleRunCode}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      {isRunningCode ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                      Run Code & Verify Cases
                    </button>

                    {execTime !== null && (
                      <span className="text-[11px] font-mono text-slate-500">
                        Execution time: <strong className="text-slate-800">{execTime}ms</strong>
                      </span>
                    )}
                  </div>

                  {/* Terminal Console Output */}
                  {(codeOutput !== null || codeError !== null) && (
                    <div className="p-3.5 bg-slate-900 rounded-xl text-xs font-mono space-y-1 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-800">
                        <Terminal size={13} />
                        <span>Interactive Test Runner Terminal Output:</span>
                      </div>
                      {codeOutput && <pre className="text-emerald-400 whitespace-pre-wrap">{codeOutput}</pre>}
                      {codeError && <pre className="text-rose-400 whitespace-pre-wrap">{codeError}</pre>}
                    </div>
                  )}
                </div>
              </div>

              {/* Rubric Criteria Grid */}
              <div className="card p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code2 size={20} className="text-purple-600" />
                  Technical Competency Rubric
                </h3>

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

                {/* Technical Interviewer Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Live Technical Notes & Candidate Code Observations
                  </label>
                  <textarea
                    rows={3}
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                    placeholder="Record how the candidate approached edge cases, code modularity, hints needed, and architectural justifications..."
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BEHAVIORAL ASSESSMENT & STAR METHOD EVALUATION */}
          {activeRound === 'behavioral' && (
            <div className="space-y-4">
              {/* STAR METHOD INTERACTIVE CHECKLIST */}
              <div className="card p-5 space-y-3 border-2 border-indigo-200 shadow-sm bg-gradient-to-br from-indigo-50/40 to-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users2 size={20} className="text-indigo-600" />
                    STAR Method Competency Tracker
                  </h3>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg">
                    {Object.values(starChecklist).filter(Boolean).length} / 4 Components Checked
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setStarChecklist((prev) => ({ ...prev, situation: !prev.situation }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      starChecklist.situation ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      {starChecklist.situation ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                      [S] Situation
                    </div>
                    <p className="text-[11px] mt-1 text-slate-600">Candidate clearly established the business context, stakes, and constraints.</p>
                  </div>

                  <div
                    onClick={() => setStarChecklist((prev) => ({ ...prev, task: !prev.task }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      starChecklist.task ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      {starChecklist.task ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                      [T] Task
                    </div>
                    <p className="text-[11px] mt-1 text-slate-600">Candidate articulated their direct individual role vs team responsibility.</p>
                  </div>

                  <div
                    onClick={() => setStarChecklist((prev) => ({ ...prev, action: !prev.action }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      starChecklist.action ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      {starChecklist.action ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                      [A] Action
                    </div>
                    <p className="text-[11px] mt-1 text-slate-600">Specific steps taken, engineering decisions made, and interpersonal tact.</p>
                  </div>

                  <div
                    onClick={() => setStarChecklist((prev) => ({ ...prev, result: !prev.result }))}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      starChecklist.result ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      {starChecklist.result ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                      [R] Result
                    </div>
                    <p className="text-[11px] mt-1 text-slate-600">Candidate quantified outcomes (percentages, speedups, learnings, business impact).</p>
                  </div>
                </div>
              </div>

              {/* LIVE VIDEO / AUDIO SIMULATOR */}
              <div className="card p-4 space-y-3 bg-slate-900 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video size={16} className="text-purple-400" />
                    <span className="font-bold text-xs">Live Meeting Studio Preview</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setMicActive(!micActive)}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        micActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {micActive ? <Mic size={14} /> : <MicOff size={14} />}
                      {micActive ? 'Mic Active' : 'Muted'}
                    </button>
                    <button
                      onClick={() => setVideoActive(!videoActive)}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        videoActive ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {videoActive ? <Video size={14} /> : <VideoOff size={14} />}
                      {videoActive ? 'Cam On' : 'Cam Off'}
                    </button>
                    <button
                      onClick={() => setScreenShareActive(!screenShareActive)}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        screenShareActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Monitor size={14} />
                      Screen
                    </button>
                  </div>
                </div>

                <div className="h-44 bg-slate-950 rounded-xl flex items-center justify-center relative border border-slate-800 overflow-hidden">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center mx-auto text-xl font-black border border-purple-500/50">
                      {selectedApp?.student_name ? selectedApp.student_name[0] : 'C'}
                    </div>
                    <div className="text-xs font-bold text-white">{selectedApp?.student_name}</div>
                    <div className="text-[10px] text-slate-400">Connected to In-Portal Live Audio/Video Stream</div>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-emerald-400 font-mono">
                    ● HD 1080p Stream Active
                  </div>
                </div>
              </div>

              {/* Rubric Criteria Grid */}
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

                {/* Behavioral Questions */}
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

                {/* Behavioral Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Interviewer Behavioral Observations
                  </label>
                  <textarea
                    rows={3}
                    value={behavNotes}
                    onChange={(e) => setBehavNotes(e.target.value)}
                    placeholder="Record candidate's real-life project situations, ownership maturity, team dynamics..."
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="card max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
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
                  placeholder="https://meet.jit.si/CampusConnect-Live"
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
