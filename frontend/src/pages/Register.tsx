import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GraduationCap, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'student';
  
  const [role, setRole] = useState(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [collegeSearch, setCollegeSearch] = useState('');
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const navigate = useNavigate();

  const { data: colleges = [] } = useQuery({
    queryKey: ['colleges'],
    queryFn: async () => {
      const response = await api.get('/auth/colleges');
      return response.data;
    }
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        email: email.trim().toLowerCase(),
        password,
        role,
        name: name.trim()
      };
      if (role === 'student') payload.college_id = collegeId;
      const response = await api.post('/auth/register', payload);
      return response.data;
    },
    onSuccess: () => {
      setSuccessMsg('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    },
    onError: (error: any) => {
      if (!error.response) {
        setErrorMsg('Network error: Unable to connect to server. Please verify your connection or server status.');
      } else {
        setErrorMsg(error.response?.data?.detail || 'Registration failed. Please try again.');
      }
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password || !name) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    if (role === 'student' && !collegeId) {
      setErrorMsg('Please select a college');
      return;
    }
    registerMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Ambient Cosmic Blobs */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[130px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      </div>

      <div className="max-w-md w-full space-y-6 sm:space-y-8 relative z-10">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-5 sm:mb-6 group">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap size={26} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">CampusConnect</span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">Join the next-generation campus placement platform</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-8">
          {/* Segmented Role Switcher */}
          <div className="grid grid-cols-3 gap-1 mb-6 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all text-center truncate ${
                role === 'student'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => setRole('college')}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all text-center truncate ${
                role === 'college'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏛️ College
            </button>
            <button
              type="button"
              onClick={() => setRole('company')}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all text-center truncate ${
                role === 'company'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💼 Company
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-medium border border-rose-200/80">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-medium border border-emerald-200/80">
                {successMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {role === 'student' ? 'Full Name' : role === 'college' ? 'Institution Name' : 'Company Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field py-2.5 text-sm rounded-xl"
                placeholder={role === 'student' ? 'e.g. Alex Johnson' : role === 'college' ? 'e.g. Stanford University' : 'e.g. Acme Corp'}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field py-2.5 text-sm rounded-xl"
                placeholder="name@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="email"
                required
              />
            </div>

            {role === 'student' && (
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Search and Select College</label>
                <input
                  type="text"
                  value={collegeSearch}
                  onChange={(e) => {
                    setCollegeSearch(e.target.value);
                    setShowCollegeDropdown(true);
                    setCollegeId('');
                  }}
                  onFocus={() => setShowCollegeDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowCollegeDropdown(false), 250);
                  }}
                  className="input-field py-2.5 text-sm rounded-xl"
                  placeholder="Type college name to search..."
                  autoComplete="off"
                />
                
                {showCollegeDropdown && (
                  <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-auto divide-y divide-slate-100">
                    {colleges.filter((c: any) => c.name.toLowerCase().includes(collegeSearch.toLowerCase())).length > 0 ? (
                      colleges
                        .filter((c: any) => c.name.toLowerCase().includes(collegeSearch.toLowerCase()))
                        .map((college: any) => (
                          <div
                            key={college.id}
                            className={`px-4 py-3 hover:bg-indigo-50 cursor-pointer text-xs sm:text-sm transition-colors ${
                              collegeId === college.id ? 'bg-indigo-50/80 text-indigo-700 font-bold' : 'text-slate-700'
                            }`}
                            onMouseDown={() => {
                              setCollegeId(college.id);
                              setCollegeSearch(college.name);
                              setShowCollegeDropdown(false);
                            }}
                          >
                            {college.name}
                          </div>
                        ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-slate-500 italic">No colleges found matching "{collegeSearch}"</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field py-2.5 text-sm rounded-xl pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex justify-center items-center gap-2 mt-4 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100 text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
