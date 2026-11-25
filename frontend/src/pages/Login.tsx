import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  GraduationCap,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Building2,
  Briefcase
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const normalizedEmail = email.trim().toLowerCase();
      const formData = new URLSearchParams();
      formData.append('username', normalizedEmail);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      login(data.access_token, data.user);
    },
    onError: (error: any) => {
      if (!error.response) {
        setErrorMsg('Network error: Cannot reach authentication server. Please verify your connection or backend server status.');
      } else if (error.response.status === 401) {
        setErrorMsg(error.response?.data?.detail || 'Incorrect email or password. Please verify your credentials.');
      } else if (error.response.status === 403) {
        setErrorMsg(error.response?.data?.detail || 'Account suspended or awaiting administrator approval.');
      } else {
        setErrorMsg(error.response?.data?.detail || `Login failed (${error.response.status}). Please try again.`);
      }
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password');
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 font-sans selection:bg-brand-500/20">
      {/* ================= LEFT SIDE: Simple, Clean & Animated Theme ================= */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white flex-col justify-between p-12 xl:p-16 overflow-hidden select-none">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Top: Brand Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="bg-brand-500 p-2.5 rounded-xl text-white shadow-lg shadow-brand-500/30"
            >
              <GraduationCap size={26} />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white">CampusConnect</span>
              <span className="text-[10px] text-brand-300 font-bold uppercase tracking-widest">
                Campus Recruitment Network
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Clean Headline + Floating Micro-Cards (MotionSites style) */}
        <div className="relative z-10 my-auto py-8 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-brand-300 text-xs font-semibold mb-6 backdrop-blur-md"
          >
            <Sparkles size={14} className="text-brand-400" />
            <span>Unified Placement Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-snug mb-4"
          >
            Where campus talent meets{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-teal-200 to-emerald-300">
              opportunity.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-sm xl:text-base leading-relaxed mb-8"
          >
            Connect students, college placement cells, and corporate recruiters under one fast, transparent system.
          </motion.p>

          {/* Simple, Clean Floating Pill Cards (MotionSites style) */}
          <div className="space-y-3">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:bg-white/[0.08] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0">
                <GraduationCap size={18} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">Verified Students & ATS Matching</span>
                <span className="text-slate-400">1-click drive applications & automated eligibility check</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.5 }}
              className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:bg-white/[0.08] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Building2 size={18} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">Placement Officer Hub</span>
                <span className="text-slate-400">Manage batch invitations, criteria filtering & admin reports</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
              className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md hover:bg-white/[0.08] transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Briefcase size={18} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">Recruiter Interview Suite</span>
                <span className="text-slate-400">Live in-portal coding, behavioral scoring & offer dispatcher</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Left: Clean Live Pulse */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-white/10">
          <div className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Live Campus Placements Active</span>
          </div>
          <span>&copy; {new Date().getFullYear()} CampusConnect</span>
        </div>
      </div>

      {/* ================= RIGHT SIDE: Clean, Simple Login Form ================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative bg-slate-50/70">
        {/* Subtle Background Glow Accent */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />

        {/* Top Header: Mobile Logo & Back Link */}
        <div className="relative z-10 flex items-center justify-between w-full max-w-md mx-auto mb-6 lg:mb-0">
          <div className="lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="bg-brand-500 p-2 rounded-lg text-white shadow-md">
                <GraduationCap size={20} />
              </div>
              <span className="text-lg font-black text-slate-900 tracking-tight">CampusConnect</span>
            </Link>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors ml-auto group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to website
          </Link>
        </div>

        {/* Main Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto my-auto relative z-10"
        >
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-7 sm:p-9">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Enter your credentials to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-medium border border-rose-200/80 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={17} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 pr-4 py-2.5 text-sm sm:text-base rounded-xl"
                    placeholder="name@example.com"
                    autoComplete="username email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Please contact your administrator or placement officer to reset your password.')}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={17} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10 py-2.5 text-sm rounded-xl"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loginMutation.isPending}
                className="btn-primary w-full py-2.5 text-sm font-semibold rounded-xl shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={17} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Register Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm text-slate-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Clean Bottom Note */}
        <div className="relative z-10 w-full max-w-md mx-auto text-center text-xs text-slate-400 py-2">
          <span>CampusConnect &bull; Single Sign-In for Students, Colleges, Companies & Admins</span>
        </div>
      </div>
    </div>
  );
}
