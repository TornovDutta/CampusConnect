import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Building2,
  GraduationCap,
  MapPin,
  Award,
  TrendingUp,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  X,
  ChevronRight,
  ArrowRight,
  Users,
  Briefcase,
  BarChart3,
  Sparkles,
  Filter,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PublicCollegeItem {
  id: string;
  _id?: string;
  name: string;
  email: string;
  city: string;
  state: string;
  location: string;
  website?: string;
  accreditation: string;
  student_pool_size: string;
  placement_tier: string;
  performance_badge: string;
  top_hiring_partners: string[];
  average_package_bracket: string;
  is_verified: boolean;
}

interface PublicOverview {
  id: string;
  name: string;
  email: string;
  city: string;
  state: string;
  location: string;
  website: string;
  accreditation: string;
  placement_tier: string;
  estimated_placement_bracket: string;
  estimated_average_package: string;
  top_recruiters: string[];
  active_hiring_sectors: string[];
  student_community_size: string;
  drives_hosted_this_season: number;
}

interface VerifiedMetrics {
  total_registered_batch: number;
  total_placed_candidates: number;
  exact_placement_rate: number;
  average_ctc: string;
  highest_ctc: string;
  median_ctc: string;
  active_applications_in_pipeline: number;
  total_participating_companies: number;
}

interface DepartmentBreakdown {
  branch: string;
  total_students: number;
  placed_students: number;
  unplaced_students: number;
  placement_rate: number;
}

interface CgpaBand {
  band: string;
  total: number;
  placed: number;
  rate?: number;
}

interface RecruiterStat {
  company: string;
  hires: number;
}

interface PlacementRollItem {
  student_name: string;
  job_title: string;
  company_name: string;
  ctc: string;
  status: string;
  date?: string;
}

interface UserContext {
  is_authenticated: boolean;
  user_role: string | null;
  belongs_to_college: boolean;
  user_college_name?: string | null;
  lock_reason?: string | null;
}

interface PerformanceResponse {
  can_view_detailed: boolean;
  user_context: UserContext;
  public_overview: PublicOverview;
  locked_sections?: string[];
  gated_notice?: {
    title: string;
    message: string;
  };
  verified_metrics?: VerifiedMetrics;
  department_breakdown?: DepartmentBreakdown[];
  cgpa_success_matrix?: CgpaBand[];
  recruiter_leaderboard?: RecruiterStat[];
  recent_placement_roll?: PlacementRollItem[];
}

export default function CollegeDirectory() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);

  // Fetch list of colleges
  const {
    data: collegesData,
    isLoading: isCollegesLoading,
    error: collegesError,
  } = useQuery({
    queryKey: ['publicColleges', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      const res = await api.get(`/public/colleges?${params.toString()}`);
      return res.data as { total_colleges: number; colleges: PublicCollegeItem[] };
    },
    staleTime: 60000,
  });

  // Fetch single college placement performance when modal is opened
  const {
    data: performanceData,
    isLoading: isPerformanceLoading,
    error: performanceError,
  } = useQuery({
    queryKey: ['collegePerformance', selectedCollegeId],
    queryFn: async () => {
      if (!selectedCollegeId) return null;
      const res = await api.get(`/public/colleges/${selectedCollegeId}/placement-performance`);
      return res.data as PerformanceResponse;
    },
    enabled: !!selectedCollegeId,
    staleTime: 30000,
  });

  // Extract unique states for filter
  const stateOptions = useMemo(() => {
    if (!collegesData?.colleges) return ['All'];
    const states = new Set<string>();
    collegesData.colleges.forEach((c) => {
      if (c.state && c.state.trim()) {
        states.add(c.state.trim());
      } else if (c.city && c.city.trim()) {
        states.add(c.city.trim());
      }
    });
    return ['All', ...Array.from(states).slice(0, 8)];
  }, [collegesData]);

  // Filtered colleges list
  const filteredColleges = useMemo(() => {
    if (!collegesData?.colleges) return [];
    return collegesData.colleges.filter((c) => {
      const matchState =
        selectedState === 'All' ||
        c.state?.toLowerCase() === selectedState.toLowerCase() ||
        c.city?.toLowerCase() === selectedState.toLowerCase();
      
      const matchTier =
        selectedTier === 'All' ||
        (selectedTier === 'Tier 1' && c.placement_tier?.includes('Tier 1')) ||
        (selectedTier === 'Tier 2' && c.placement_tier?.includes('Tier 2'));

      return matchState && matchTier;
    });
  }, [collegesData, selectedState, selectedTier]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <GraduationCap size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                CampusConnect
              </span>
              <span className="text-[10px] text-brand-600 font-semibold tracking-wider uppercase mt-0.5">
                Institutional Directory
              </span>
            </div>
          </Link>

          {/* User Status / Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900">{user.name || user.email}</span>
                  <span className="text-[11px] text-brand-600 font-medium capitalize">
                    {user.role === 'super_admin' ? 'Super Admin' : `${user.role} Account`}
                  </span>
                </div>
                <Link
                  to={`/dashboard/${user.role === 'super_admin' ? 'admin' : user.role}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                >
                  <BarChart3 size={15} />
                  <span>My Dashboard</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-brand-600 rounded-xl shadow-sm transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= HERO & SEARCH HEADER ================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/20 to-slate-50 pt-10 pb-12 border-b border-slate-200">
        {/* Subtle Ambient Blobs */}
        <div className="absolute -top-16 -left-16 w-80 h-80 bg-brand-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-96 h-96 bg-teal-300/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold mb-4 shadow-sm">
              <Sparkles size={14} className="text-brand-600 animate-pulse" />
              <span>Public Directory & Audited Placement Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Explore Campus Placement Performance
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Search accredited universities, review public hiring benchmarks, or sign in with your college account to unlock verified student CTC rosters and department breakdowns.
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-brand-500/5 border border-slate-200/80 p-2 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
              <div className="pl-3 text-slate-400">
                <Search size={22} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search college by name, city, state, or location..."
                className="w-full px-3 py-2 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 mr-2 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Filter size={13} /> Tier:
                </span>
                {['All', 'Tier 1', 'Tier 2'].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-3 py-1 rounded-full font-semibold transition-all ${
                      selectedTier === tier
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              {stateOptions.length > 2 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <MapPin size={13} /> Region:
                  </span>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {stateOptions.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN DIRECTORY LISTING ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
        {/* Results Overview Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Accredited Institutions & Campuses
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredColleges.length} verified academic partner{filteredColleges.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Audited Placement Registry Active</span>
          </div>
        </div>

        {/* Loading State */}
        {isCollegesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse space-y-4"
              >
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {collegesError && (
          <div className="my-12 p-8 bg-red-50 border border-red-200 rounded-2xl text-center max-w-lg mx-auto">
            <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-red-900">Failed to load colleges</h3>
            <p className="text-xs text-red-700 mt-1">
              Please check your connection or refresh the page to retry.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isCollegesLoading && !collegesError && filteredColleges.length === 0 && (
          <div className="my-16 text-center max-w-md mx-auto p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-900">No institutions found</h3>
            <p className="text-xs text-slate-500 mt-1">
              We couldn't find any college matching "{searchQuery}". Try searching for another name, city, or clearing your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedState('All');
                setSelectedTier('All');
              }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-brand-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Colleges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredColleges.map((college) => (
            <motion.div
              key={college.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-200 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6">
                {/* College Top Header & Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg shrink-0 group-hover:bg-brand-600 group-hover:text-white transition-all">
                    <Building2 size={24} />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} />
                    {college.performance_badge || 'Verified Campus'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-brand-600 transition-colors">
                  {college.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span>{college.city || college.location || 'India'}</span>
                  {college.state && <span>• {college.state}</span>}
                </div>

                <div className="mt-2 text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-brand-600" />
                  <span>{college.accreditation || 'AICTE / UGC Recognized'}</span>
                </div>

                {/* Performance Metrics Snippet */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Placement Benchmark:</span>
                    <span className="font-bold text-slate-900">{college.placement_tier}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Package Est. Bracket:</span>
                    <span className="font-bold text-brand-700">{college.average_package_bracket}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Student Community:</span>
                    <span className="font-semibold text-slate-700">{college.student_pool_size}</span>
                  </div>
                </div>

                {/* Top Recruiters Pills */}
                {college.top_hiring_partners && college.top_hiring_partners.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Prominent Hiring Partners:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {college.top_hiring_partners.map((comp) => (
                        <span
                          key={comp}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {college.is_verified ? 'Verified Records' : 'Public Profile'}
                </span>

                <button
                  onClick={() => setSelectedCollegeId(college.id)}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-brand-600 shadow-sm transition-all"
                >
                  <span>Inspect Placement</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* ================= COLLEGE PERFORMANCE MODAL / DRAWER ================= */}
      <AnimatePresence>
        {selectedCollegeId && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Modal Top Bar */}
              <div className="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50 to-white shrink-0">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-500/20">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                        {performanceData?.public_overview?.name || 'Institution Placement Report'}
                      </h3>
                      {performanceData?.can_view_detailed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Unlock size={12} />
                          Institutional Access Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Lock size={12} />
                          Public Benchmark View
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                      <MapPin size={12} />
                      <span>{performanceData?.public_overview?.location || 'India'}</span>
                      <span>•</span>
                      <span>{performanceData?.public_overview?.accreditation || 'AICTE / UGC Recognized'}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCollegeId(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6">
                {isPerformanceLoading && (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">
                      Loading placement records and verifying authorization...
                    </p>
                  </div>
                )}

                {performanceError && (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
                    <AlertCircle size={28} className="text-red-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-red-900">Failed to load performance metrics</p>
                  </div>
                )}

                {!isPerformanceLoading && performanceData && (
                  <>
                    {/* Access Privilege Banner */}
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        performanceData.can_view_detailed
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : performanceData.user_context?.is_authenticated
                          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                          : 'bg-brand-50/80 border-brand-200 text-brand-950'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {performanceData.can_view_detailed ? (
                          <ShieldCheck size={20} className="text-emerald-600" />
                        ) : (
                          <Lock size={20} className="text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 text-xs">
                        {performanceData.can_view_detailed ? (
                          <>
                            <span className="font-bold block text-sm text-emerald-900 mb-0.5">
                              Authorized Institutional View
                            </span>
                            <span>
                              You are authenticated as an enrolled member of this institution (or platform administrator).
                              You have full permission to inspect audited CTC offers, branch breakdowns, and candidate registries.
                            </span>
                          </>
                        ) : performanceData.user_context?.is_authenticated ? (
                          <>
                            <span className="font-bold block text-sm text-amber-900 mb-0.5">
                              Restricted to {performanceData.public_overview?.name} Students & Faculty
                            </span>
                            <span>
                              You are currently signed in as a member of{' '}
                              <strong>{performanceData.user_context?.user_college_name || 'another institution'}</strong>.
                              In accordance with academic privacy protocols, exact internal salary books and individual student rolls
                              are protected and accessible only to verified students and faculty of this campus.
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold block text-sm text-brand-900 mb-0.5">
                              Public Benchmark Mode
                            </span>
                            <span>
                              You are viewing verified public benchmarks. Enrolled students and faculty of{' '}
                              <strong>{performanceData.public_overview?.name}</strong> can sign in to unlock exact audited CTC packages,
                              branch-wise placement breakdowns, and student hire registries.
                            </span>
                            <div className="mt-2.5">
                              <Link
                                to={`/login?redirect=/colleges`}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm"
                              >
                                <span>Sign In to Unlock Institutional Data</span>
                                <ArrowRight size={13} />
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SECTION 1: PUBLIC PLACEMENT HIGHLIGHTS (Always Visible) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Award size={16} className="text-brand-600" />
                          <span>Campus Placement Overview & Benchmarks</span>
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-500">
                          Public Benchmarks
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Placement Tier
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 block">
                            {performanceData.public_overview?.placement_tier || 'Tier 1 Benchmark'}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Est. Placement Bracket
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-emerald-600 mt-1 block">
                            {performanceData.public_overview?.estimated_placement_bracket || '80% - 92%'}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Est. Average Package
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-brand-700 mt-1 block">
                            {performanceData.public_overview?.estimated_average_package || '₹8.5 LPA - ₹12.0 LPA'}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Drives Hosted Season
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 block">
                            {performanceData.public_overview?.drives_hosted_this_season || 24}+ Drives
                          </span>
                        </div>
                      </div>

                      {/* Top Recruiters & Sectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                          <span className="text-xs font-bold text-slate-700 block mb-2">
                            Top Campus Recruiting Partners
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {performanceData.public_overview?.top_recruiters?.map((c) => (
                              <span
                                key={c}
                                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                          <span className="text-xs font-bold text-slate-700 block mb-2">
                            Active Hiring Sectors
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {performanceData.public_overview?.active_hiring_sectors?.map((s) => (
                              <span
                                key={s}
                                className="px-2.5 py-1 bg-brand-50 border border-brand-200/80 rounded-lg text-xs font-medium text-brand-800"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: AUDITED INSTITUTIONAL RECORDS (Gated / Verified) */}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <ShieldCheck size={16} className="text-brand-600" />
                          <span>Audited Placement Records & Department Breakdown</span>
                        </h4>
                        {performanceData.can_view_detailed ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Verified Institutional Data
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Lock size={11} />
                            Locked Section
                          </span>
                        )}
                      </div>

                      {/* IF AUTHORIZED: SHOW AUDITED CTCs, DEPARTMENTS, AND RECENT HIRES */}
                      {performanceData.can_view_detailed && performanceData.verified_metrics ? (
                        <div className="space-y-6">
                          {/* Exact Audited Key Figures */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                                Audited Average CTC
                              </span>
                              <span className="text-xl sm:text-2xl font-black text-emerald-900 mt-1 block">
                                {performanceData.verified_metrics.average_ctc}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-medium">
                                Across all engineering branches
                              </span>
                            </div>

                            <div className="p-4 bg-brand-50/70 border border-brand-200 rounded-2xl">
                              <span className="text-[11px] font-bold text-brand-800 uppercase tracking-wider block">
                                Highest Package
                              </span>
                              <span className="text-xl sm:text-2xl font-black text-brand-900 mt-1 block">
                                {performanceData.verified_metrics.highest_ctc}
                              </span>
                              <span className="text-[10px] text-brand-700 font-medium">
                                Top national placement offer
                              </span>
                            </div>

                            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl">
                              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                                Median Salary
                              </span>
                              <span className="text-xl sm:text-2xl font-black text-purple-900 mt-1 block">
                                {performanceData.verified_metrics.median_ctc}
                              </span>
                              <span className="text-[10px] text-purple-700 font-medium">
                                50th percentile offer
                              </span>
                            </div>

                            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
                              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                                Verified Placement %
                              </span>
                              <span className="text-xl sm:text-2xl font-black text-blue-900 mt-1 block">
                                {performanceData.verified_metrics.exact_placement_rate}%
                              </span>
                              <span className="text-[10px] text-blue-700 font-medium">
                                {performanceData.verified_metrics.total_placed_candidates} of {performanceData.verified_metrics.total_registered_batch} placed
                              </span>
                            </div>
                          </div>

                          {/* Branch / Department Breakdown */}
                          {performanceData.department_breakdown && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                              <h5 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                                <span>Department-Wise Placement Performance</span>
                                <span className="text-[11px] text-slate-500 font-normal">
                                  Total Batch vs Placed Students
                                </span>
                              </h5>
                              <div className="space-y-3">
                                {performanceData.department_breakdown.map((dept) => (
                                  <div key={dept.branch} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-semibold text-slate-800">{dept.branch}</span>
                                      <span className="font-bold text-slate-900">
                                        {dept.placement_rate}% ({dept.placed_students} / {dept.total_students} Placed)
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-brand-600 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, dept.placement_rate)}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* CGPA Success Matrix */}
                          {performanceData.cgpa_success_matrix && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                              <h5 className="text-xs font-bold text-slate-800 mb-3">
                                CGPA Tier Placement Correlation
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {performanceData.cgpa_success_matrix.map((band) => (
                                  <div
                                    key={band.band}
                                    className="p-3 bg-white border border-slate-200/80 rounded-xl text-center"
                                  >
                                    <span className="text-xs font-bold text-slate-900 block">{band.band}</span>
                                    <span className="text-base font-extrabold text-brand-600 mt-1 block">
                                      {band.rate ?? Math.round((band.placed / (band.total || 1)) * 100)}%
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {band.placed} / {band.total} Placed
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recent Audited Placement Roll */}
                          {performanceData.recent_placement_roll && (
                            <div>
                              <h5 className="text-xs font-bold text-slate-800 mb-3">
                                Recent Verified Placement Roll
                              </h5>
                              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                      <tr>
                                        <th className="px-4 py-2.5">Candidate</th>
                                        <th className="px-4 py-2.5">Company</th>
                                        <th className="px-4 py-2.5">Role</th>
                                        <th className="px-4 py-2.5">Package</th>
                                        <th className="px-4 py-2.5 text-right">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                      {performanceData.recent_placement_roll.map((roll, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                          <td className="px-4 py-2.5 font-bold text-slate-900">
                                            {roll.student_name}
                                          </td>
                                          <td className="px-4 py-2.5 text-slate-800">
                                            {roll.company_name}
                                          </td>
                                          <td className="px-4 py-2.5 text-slate-600">
                                            {roll.job_title}
                                          </td>
                                          <td className="px-4 py-2.5 font-bold text-brand-700">
                                            {roll.ctc}
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                              {roll.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* GATED / FROSTED LOCKED STATE WITH PREVIEW */
                        <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50 p-6 sm:p-8">
                          {/* Blurred Fake Background representing the data underneath */}
                          <div className="filter blur-sm select-none pointer-events-none opacity-40 space-y-4">
                            <div className="grid grid-cols-4 gap-3">
                              <div className="h-16 bg-slate-300 rounded-xl" />
                              <div className="h-16 bg-slate-300 rounded-xl" />
                              <div className="h-16 bg-slate-300 rounded-xl" />
                              <div className="h-16 bg-slate-300 rounded-xl" />
                            </div>
                            <div className="h-28 bg-slate-200 rounded-xl" />
                            <div className="h-28 bg-slate-200 rounded-xl" />
                          </div>

                          {/* Overlay Lock Notice */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/75 backdrop-blur-md">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 shadow-md">
                              <Lock size={24} />
                            </div>

                            <h5 className="text-base font-extrabold text-slate-900 max-w-md">
                              {performanceData.gated_notice?.title ||
                                'Verified Institutional Placement Records Locked'}
                            </h5>

                            <p className="text-xs text-slate-600 max-w-lg mt-1.5 leading-relaxed">
                              {performanceData.gated_notice?.message ||
                                'Detailed audited CTC distributions, department-wise placement success rates, and student rolls are restricted to enrolled students and verified faculty.'}
                            </p>

                            {!performanceData.user_context?.is_authenticated ? (
                              <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                                <Link
                                  to="/login?redirect=/colleges"
                                  className="px-5 py-2.5 bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                                >
                                  <span>Sign In with College Credentials</span>
                                  <ArrowRight size={14} />
                                </Link>
                                <Link
                                  to="/register"
                                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                                >
                                  Register Account
                                </Link>
                              </div>
                            ) : (
                              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium max-w-md">
                                <ShieldCheck size={14} className="inline mr-1 text-amber-600" />
                                Confidential Institutional Boundary: Your login belongs to{' '}
                                <strong>{performanceData.user_context?.user_college_name || 'another university'}</strong>.
                                Only students of {performanceData.public_overview?.name} can view these specific offer letters.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500">
                  CampusConnect Verified Placement Intelligence
                </span>
                <button
                  onClick={() => setSelectedCollegeId(null)}
                  className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
