import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  GraduationCap,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Building2,
  Users,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
      // OAuth2 requires URL encoded form data
      const formData = new URLSearchParams();
      formData.append('username', email);
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
      setErrorMsg(error.response?.data?.detail || 'An error occurred during login');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50">
      {/* ================= LEFT SIDE: Website Theme & Logo ================= */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white flex-col justify-between p-12 xl:p-16 overflow-hidden select-none">
        {/* Ambient Glows & Background Accents */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-brand-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Top: Brand Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3.5 group">
            <div className="bg-brand-500 p-2.5 rounded-xl text-white shadow-lg shadow-brand-500/30 group-hover:scale-105 group-hover:bg-brand-400 transition-all duration-300">
              <GraduationCap size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white group-hover:text-brand-200 transition-colors">
                CampusConnect
              </span>
              <span className="text-[11px] text-brand-300/80 tracking-widest font-bold uppercase">
                Recruitment Ecosystem
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Website Theme & Key Highlights */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-400/20 text-brand-300 text-xs font-semibold mb-6 backdrop-blur-sm">
            <Sparkles size={14} className="text-brand-400" />
            <span>Democratizing Campus Recruitment</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15] mb-5">
            Connecting Talent With Opportunity{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-teal-200 to-emerald-300">
              Without Boundaries.
            </span>
          </h1>

          <p className="text-slate-300 text-base leading-relaxed mb-8">
            Empowering students, colleges, and corporate recruiters with a unified, transparent, and merit-first campus hiring platform.
          </p>

          {/* Pillars / Feature Badges */}
          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:border-brand-500/30">
              <div className="p-2 rounded-lg bg-brand-500/20 text-brand-300 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Merit-First Hiring</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluate candidates based on verified skills, projects, and academic merit rather than college brand names.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:border-brand-500/30">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Unified College Network</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connect multiple campuses directly with leading hiring partners with placement cell oversight.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:border-brand-500/30">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Centralized Corporate ATS</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Broadcast job openings, filter qualified applicants, and manage recruitment pipelines in real time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Left Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-white/10">
          <span>&copy; {new Date().getFullYear()} CampusConnect. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5 text-brand-300 font-medium">
            <CheckCircle2 size={14} className="text-brand-400" />
            Verified Role-Based Access
          </span>
        </div>
      </div>

      {/* ================= RIGHT SIDE: Login Form ================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative bg-slate-50/70">
        {/* Dynamic Light Background Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-brand-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

        {/* Top bar on right: Mobile Logo & Back Link */}
        <div className="relative z-10 flex items-center justify-between w-full max-w-md mx-auto mb-6 lg:mb-0">
          {/* Mobile Logo (hidden on lg) */}
          <div className="lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="bg-brand-500 p-2 rounded-lg text-white shadow-md group-hover:scale-105 transition-transform">
                <GraduationCap size={22} />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">CampusConnect</span>
            </Link>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors ml-auto group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to website
          </Link>
        </div>

        {/* Center: Login Form Card */}
        <div className="relative z-10 max-w-md w-full mx-auto my-auto py-6">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in to CampusConnect
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Welcome back! Please enter your details to access your account.
            </p>
          </div>

          <div className="card p-7 sm:p-9 shadow-xl shadow-slate-200/50 border border-slate-200/80 bg-white backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="bg-red-50 text-red-700 p-3.5 rounded-lg text-sm border border-red-200/80 flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 text-sm py-2.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="name@college.edu or name@company.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Please contact your administrator or placement officer to reset your password.');
                    }}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10 text-sm py-2.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="btn-primary w-full flex justify-center items-center gap-2 py-3 mt-2 text-sm font-semibold shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar on right: Simple helpful hint */}
        <div className="relative z-10 w-full max-w-md mx-auto text-center text-xs text-slate-500 py-2">
          <span>Accessible to Students, Colleges, Corporate Recruiters & Administrators</span>
        </div>
      </div>
    </div>
  );
}
