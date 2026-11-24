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
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
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
      setErrorMsg(error.response?.data?.detail || 'Invalid email or password. Please try again.');
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
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-slate-50 px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-brand-500/10 via-brand-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header: Back Link */}
      <div className="w-full max-w-md flex items-center justify-between relative z-10 mb-4 sm:mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>
      </div>

      {/* Main Centered Login Card */}
      <div className="w-full max-w-md relative z-10 my-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-7 sm:p-9">
          {/* Brand Header */}
          <div className="text-center mb-7">
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
              <div className="bg-brand-500 p-2.5 rounded-xl text-white shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
                <GraduationCap size={24} />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                CampusConnect
              </span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Please enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-medium border border-rose-200/80 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
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
                  className="input-field pl-10 pr-4 py-2.5 text-sm rounded-xl"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
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
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-primary w-full py-2.5 text-sm font-semibold rounded-xl shadow-md shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 flex items-center justify-center gap-2 mt-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
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
            </button>
          </form>

          {/* Card Footer: Register Link */}
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
      </div>

      {/* Clean Bottom Note */}
      <div className="relative z-10 text-center text-xs text-slate-400 mt-6">
        <span>CampusConnect &bull; Single Sign-In for Students, Colleges, Companies & Admins</span>
      </div>
    </div>
  );
}
