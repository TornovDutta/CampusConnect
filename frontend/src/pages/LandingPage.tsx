import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  Building2,
  ChevronRight,
  Mail,
  Phone,
  ExternalLink,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Globe,
  Star,
  Quote,
  Sparkles,
  Award,
  Video,
  Code2,
  Check,
  Zap,
  TrendingUp,
  SlidersHorizontal,
  FileText,
  Calendar,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const MARQUEE_PARTNERS = [
  { name: 'Google', category: 'Tech Partner' },
  { name: 'Microsoft', category: 'Cloud Partner' },
  { name: 'Amazon', category: 'Hiring Partner' },
  { name: 'Cisco', category: 'Networking' },
  { name: 'Deloitte', category: 'Consulting' },
  { name: 'Infosys', category: 'Global Enterprise' },
  { name: 'TCS', category: 'Digital Solutions' },
  { name: 'IIT Delhi', category: 'Premier Institute' },
  { name: 'BITS Pilani', category: 'Top Campus' },
  { name: 'NIT Trichy', category: 'National Campus' },
  { name: 'VIT Vellore', category: 'Partner Campus' },
  { name: 'SRM University', category: 'Partner Campus' },
];

function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2500, bounce: 0 });

  useEffect(() => {
    if (inView) {
      motionValue.set(to);
    }
  }, [inView, motionValue, to]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        let formatted = Math.floor(latest).toString();
        if (to >= 10000) {
          formatted = Math.floor(latest / 1000) + 'k';
        } else {
          formatted = Intl.NumberFormat('en-US').format(Math.floor(latest));
        }
        ref.current.textContent = formatted + suffix;
      }
    });
  }, [springValue, suffix, to]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function LandingPage() {
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'student' | 'college' | 'company'>('student');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: contactInfo } = useQuery({
    queryKey: ['publicContactInfo'],
    queryFn: async () => {
      const response = await api.get('/admin/contact-info');
      return response.data;
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-brand-500/30 overflow-x-hidden">
      {/* ================= STICKY GLASS HEADER ================= */}
      <div className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-8 pt-3 sm:pt-5 pointer-events-none">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-6xl mx-auto bg-white/85 backdrop-blur-2xl backdrop-saturate-150 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full pointer-events-auto transition-all"
        >
          <div className="flex justify-between h-14 sm:h-16 items-center px-3 sm:px-6 gap-2">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
              <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-1.5 sm:p-2 rounded-xl text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300 shrink-0">
                <motion.div animate={{ rotate: [0, -8, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}>
                  <GraduationCap size={19} strokeWidth={2.5} />
                </motion.div>
              </div>
              <span className="text-sm sm:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight truncate">
                CampusConnect
              </span>
            </Link>

            <nav className="hidden md:flex gap-1 items-center bg-black/[0.03] p-1 rounded-full border border-black/[0.03]">
              <Link to="/colleges" className="text-xs lg:text-sm text-indigo-700 hover:text-indigo-900 hover:bg-white/90 px-4 py-2 rounded-full font-bold transition-all flex items-center gap-1.5">
                <Search size={13} />
                <span>Colleges & Placements</span>
              </Link>
              <a href="#features" className="text-xs lg:text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-4 py-2 rounded-full font-medium transition-all">Features</a>
              <a href="#workflow" className="text-xs lg:text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-4 py-2 rounded-full font-medium transition-all">Platform Tour</a>
              <a href="#how-it-works" className="text-xs lg:text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-4 py-2 rounded-full font-medium transition-all">How it Works</a>
              <a href="#stats" className="text-xs lg:text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-4 py-2 rounded-full font-medium transition-all">Impact</a>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link to="/login" className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors px-2.5 sm:px-3 py-1.5">
                Log in
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
                <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all shadow-sm hover:shadow-md hover:shadow-indigo-500/25">
                  Get Started
                </Link>
              </motion.div>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="md:hidden p-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-black/5 transition-colors focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </motion.header>

        {/* Animated Mobile Dropdown Menu with Fullscreen Backdrop */}
        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 md:hidden pointer-events-auto"
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="relative z-40 md:hidden max-w-6xl mx-auto mt-2.5 p-4 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-2xl space-y-2 pointer-events-auto"
              >
                <Link
                  to="/colleges"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 font-bold text-xs sm:text-sm shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Search size={16} className="text-indigo-600 shrink-0" />
                    <span className="truncate">Colleges & Placements</span>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-2 py-0.5 rounded-full shrink-0 ml-2">
                    Directory
                  </span>
                </Link>

                <div className="space-y-0.5 pt-1">
                  <a
                    href="#features"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#workflow"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    Platform Tour
                  </a>
                  <a
                    href="#how-it-works"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    How it Works
                  </a>
                  <a
                    href="#stats"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    Impact & Metrics
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <Link
                    to="/register"
                    onClick={() => setMobileNavOpen(false)}
                    className="w-full text-center py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-colors"
                  >
                    Get Started Free
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-grow min-w-0 w-full">
        {/* ================= HERO SECTION (MotionSites Style) ================= */}
        <section className="relative pt-24 sm:pt-36 md:pt-44 pb-14 sm:pb-20 md:pb-32 overflow-hidden flex flex-col justify-center w-full max-w-full min-h-[85vh] sm:min-h-[92vh]">
          {/* Animated Ambient Blobs (No mix-blend-multiply to avoid iOS Safari gray boxes) */}
          <div className="absolute top-[-5%] left-[-5%] w-[55%] h-[55%] rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="absolute top-[20%] right-[-5%] w-[55%] h-[55%] rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-5%] left-[20%] w-[45%] h-[45%] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06] pointer-events-none" />

          {/* Floating Micro-UI Cards Around Hero (Desktop only) */}
          <motion.div
            animate={{ y: [0, -12, 0], x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut' }}
            className="hidden xl:flex items-center gap-3 absolute top-36 left-12 bg-white/90 backdrop-blur-xl border border-white/80 p-3.5 rounded-2xl shadow-xl shadow-indigo-200/40 z-20 pointer-events-none"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
              <Award size={20} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">Job Offer Dispatched</div>
              <div className="text-[11px] text-emerald-600 font-bold">₹24.5 LPA Package • Google</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 14, 0], x: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6.5, ease: 'easeInOut', delay: 0.6 }}
            className="hidden xl:flex items-center gap-3 absolute top-44 right-12 bg-white/90 backdrop-blur-xl border border-white/80 p-3.5 rounded-2xl shadow-xl shadow-violet-200/40 z-20 pointer-events-none"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold shadow-xs">
              <Video size={20} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">In-Portal Technical IDE</div>
              <div className="text-[11px] text-violet-600 font-bold">Live Python & JS Runner</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut', delay: 1.2 }}
            className="hidden xl:flex items-center gap-2.5 absolute bottom-24 right-20 bg-white/95 backdrop-blur-xl border border-white/80 px-4 py-2.5 rounded-2xl shadow-xl shadow-slate-200/70 z-20 pointer-events-none"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-800">97.8% ATS Verification Score</span>
          </motion.div>

          <div className="w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Glowing Pill Tag */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/90 border border-indigo-200 text-indigo-700 font-bold text-[11px] sm:text-xs mb-6 sm:mb-8 shadow-xs backdrop-blur-md max-w-full"
            >
              <Sparkles size={14} className="text-indigo-600 animate-pulse shrink-0" />
              <span className="truncate">Next-Gen Campus Placement Ecosystem 2.0</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, type: 'spring', bounce: 0.3 }}
              className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight mb-5 sm:mb-6 leading-tight break-words max-w-full px-1"
            >
              Where campus ambition meets <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 animate-gradient-x inline break-words">
                Elite Career Opportunities
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-sm sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2"
            >
              The unified, transparent platform connecting university students, college placement cells, and corporate recruiters for seamless campus recruitment.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5 w-full max-w-xs sm:max-w-none mx-auto"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <Link
                  to="/register?role=student"
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-7 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 w-full shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <GraduationCap size={18} />
                  Join as Student
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <Link
                  to="/register?role=college"
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 px-7 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 w-full shadow-xs hover:border-indigo-300 transition-all"
                >
                  Register College
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <Link
                  to="/register?role=company"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-7 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 w-full shadow-md shadow-slate-900/20 transition-all"
                >
                  <Building2 size={18} />
                  Hire Talent
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-6 sm:mt-7 flex justify-center px-2"
            >
              <Link
                to="/colleges"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-white/95 hover:bg-indigo-50/70 border border-slate-200/90 hover:border-indigo-300 text-xs sm:text-sm font-bold text-slate-800 hover:text-indigo-700 transition-all shadow-xs hover:shadow-md max-w-full"
              >
                <Search size={15} className="text-indigo-600 shrink-0" />
                <span className="hidden sm:inline">Search & inspect placement performance across partner colleges</span>
                <span className="sm:hidden font-semibold truncate">Search college placements</span>
                <ArrowRight size={14} className="text-indigo-600 shrink-0" />
              </Link>
            </motion.div>

            {/* ================= MOTIONSITES INFINITE MARQUEE TICKER ================= */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-12 sm:mt-20 pt-8 sm:pt-10 border-t border-slate-200/70 w-full min-w-0 max-w-5xl mx-auto overflow-hidden"
            >
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 sm:mb-6">
                Trusted by 500+ Top Campuses & Global Hiring Partners
              </p>

              {/* Continuous Infinite Loop with narrow mobile fade gradients */}
              <div className="relative w-full overflow-hidden py-2">
                <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
                <motion.div
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: 24 }}
                  className="flex gap-3 sm:gap-4 items-center whitespace-nowrap w-max"
                >
                  {[...MARQUEE_PARTNERS, ...MARQUEE_PARTNERS].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/80 backdrop-blur-xs border border-slate-200/80 shadow-xs text-slate-800 font-bold text-xs hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      <Building2 size={14} className="text-indigo-600 shrink-0" />
                      <span>{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider pl-0.5">• {item.category}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================= MOTIONSITES INTERACTIVE PLATFORM SPOTLIGHT ================= */}
        <section id="workflow" className="py-16 sm:py-24 md:py-28 bg-white border-y border-slate-200/80 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-semibold text-xs mb-3">
                <Sparkles size={13} className="text-indigo-500" />
                <span>Interactive Experience</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Designed for every role in the hiring cycle
              </h2>
              <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-slate-500 max-w-xl mx-auto px-2">
                Explore the custom toolsets built directly into CampusConnect for each user role.
              </p>

              {/* Responsive 3-Column Tab Switcher */}
              <div className="grid grid-cols-3 sm:inline-flex items-center justify-center gap-1 sm:gap-2 mt-6 sm:mt-8 p-1 sm:p-1.5 bg-slate-100 rounded-2xl w-full max-w-md sm:max-w-none mx-auto border border-slate-200">
                <button
                  onClick={() => setActiveWorkflowTab('student')}
                  className={`px-1.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all text-center ${
                    activeWorkflowTab === 'student' ? 'text-indigo-700 shadow-sm bg-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🎓 Students
                </button>
                <button
                  onClick={() => setActiveWorkflowTab('college')}
                  className={`px-1.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all text-center ${
                    activeWorkflowTab === 'college' ? 'text-indigo-700 shadow-sm bg-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏛️ Colleges
                </button>
                <button
                  onClick={() => setActiveWorkflowTab('company')}
                  className={`px-1.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all text-center ${
                    activeWorkflowTab === 'company' ? 'text-indigo-700 shadow-sm bg-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💼 Recruiters
                </button>
              </div>
            </motion.div>

            {/* Interactive Tab Showcase Content */}
            <AnimatePresence mode="wait">
              {activeWorkflowTab === 'student' && (
                <motion.div
                  key="student"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
                >
                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                      <FileText size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">ATS Resume & Skill Match</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Instant algorithmic match scoring against drive prerequisites with professional ATS export.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
                      <Video size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">In-Portal Interview Suite</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Practice live coding questions, review round status, and attend scheduled technical & HR interviews.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                      <Mail size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">2-Way Recruiter & College Chat</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Message the college placement cell or recruiter directly with real-time push alerts and offer tracking.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeWorkflowTab === 'college' && (
                <motion.div
                  key="college"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
                >
                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <Users size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Excel Student Import</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Import entire batches via XLSX/CSV in seconds with automatic CGPA, branch, and roll-number mapping.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                      <SlidersHorizontal size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Dynamic Eligibility Gates</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Open drives for specific student cohorts (e.g. 8.5+ CGPA, 2026 Batch) with placement verification.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                      <BarChart3 size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Placement Lag Analytics</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Interactive Recharts analytics pinpointing placement bottlenecks, conversion rates, and admin reports.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeWorkflowTab === 'company' && (
                <motion.div
                  key="company"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
                >
                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                      <Code2 size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Live In-Portal IDE & Code Runner</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Evaluate candidates live with Python & JavaScript code execution, problem templates, and runtime timing.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                      <Calendar size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Drive Days & Batch Slots</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Schedule organized interview batches, allocate candidates to time slots, and dispatch instant invitations.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                      <Award size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Formal Offer Letter Dispatcher</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Issue verified job offers with designation, CTC, joining date, and onboarding notes with instant notifications.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ================= STATS SECTION ================= */}
        <section id="stats" className="py-16 sm:py-20 bg-gradient-to-br from-slate-950 via-[#0a0e1a] to-[#1e1b4b] text-white relative overflow-hidden border-y border-indigo-900/40">
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center"
            >
              <motion.div variants={fadeIn} className="flex flex-col items-center p-3.5 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs min-w-0">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black mb-1 sm:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-violet-300 truncate w-full">
                  <AnimatedCounter to={500} suffix="+" />
                </div>
                <div className="text-indigo-200 font-semibold text-[11px] sm:text-sm">Partner Colleges</div>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-col items-center p-3.5 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs min-w-0">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black mb-1 sm:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-300 truncate w-full">
                  <AnimatedCounter to={10000} suffix="+" />
                </div>
                <div className="text-indigo-200 font-semibold text-[11px] sm:text-sm">Active Students</div>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-col items-center p-3.5 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs min-w-0">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black mb-1 sm:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-pink-300 truncate w-full">
                  <AnimatedCounter to={1200} suffix="+" />
                </div>
                <div className="text-indigo-200 font-semibold text-[11px] sm:text-sm">Hiring Companies</div>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-col items-center p-3.5 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xs min-w-0">
                <div className="text-2xl sm:text-4xl lg:text-5xl font-black mb-1 sm:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 truncate w-full">
                  <AnimatedCounter to={95} suffix="%" />
                </div>
                <div className="text-indigo-200 font-semibold text-[11px] sm:text-sm">Placement Rate</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section className="py-16 sm:py-24 md:py-32 bg-white" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-12 sm:mb-20"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Built for Everyone</h2>
              <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
                A unified, seamless experience tailored for each participant in the recruitment journey.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10"
            >
              {/* Feature 1: Colleges */}
              <motion.div variants={fadeIn} whileHover={{ y: -8 }} className="group relative bg-slate-50 rounded-3xl p-6 sm:p-8 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 border border-slate-100 flex flex-col h-full">
                <motion.div whileHover={{ rotate: 12, scale: 1.05 }} className="w-12 sm:w-14 h-12 sm:h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-xs">
                  <GraduationCap size={26} />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">For Colleges</h3>
                <p className="text-slate-600 leading-relaxed mb-5 sm:mb-6 text-xs sm:text-sm flex-grow">
                  Manage student records, set eligibility criteria, receive drive invitations, and track placement throughput effortlessly.
                </p>
                <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-xs sm:text-sm"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> Excel Student Import</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-xs sm:text-sm"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> Criteria Verification Gates</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-xs sm:text-sm"><CheckCircle2 size={16} className="text-blue-500 shrink-0" /> Placement Analytics & Lag</motion.li>
                </motion.ul>
                <Link to="/register?role=college" className="inline-flex items-center font-bold text-blue-600 hover:text-blue-700 group/link text-xs sm:text-sm mt-auto">
                  Register Institution <ArrowRight size={15} className="ml-1.5 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Feature 2: Students */}
              <motion.div variants={fadeIn} whileHover={{ y: -8 }} className="group relative bg-indigo-50/40 rounded-3xl p-6 sm:p-8 hover:bg-white hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-500 border border-indigo-100/60 flex flex-col h-full">
                <motion.div whileHover={{ rotate: 12, scale: 1.05 }} className="w-12 sm:w-14 h-12 sm:h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 shadow-xs">
                  <Briefcase size={26} />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">For Students</h3>
                <p className="text-slate-600 leading-relaxed mb-5 sm:mb-6 text-xs sm:text-sm flex-grow">
                  Build verified ATS resumes, browse open campus drives, practice mock interviews, and land top opportunities.
                </p>
                <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-xs sm:text-sm"><CheckCircle2 size={16} className="text-indigo-500 shrink-0" /> ATS Resume Matcher</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-xs sm:text-sm"><CheckCircle2 size={16} className="text-indigo-500 shrink-0" /> 1-Click Drive Application</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-xs sm:text-sm"><CheckCircle2 size={16} className="text-indigo-500 shrink-0" /> Direct Recruiter Messaging</motion.li>
                </motion.ul>
                <Link to="/register?role=student" className="inline-flex items-center font-bold text-indigo-600 hover:text-indigo-700 group/link text-xs sm:text-sm mt-auto">
                  Start your Journey <ArrowRight size={15} className="ml-1.5 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Feature 3: Companies */}
              <motion.div variants={fadeIn} whileHover={{ y: -8 }} className="group relative bg-slate-50 rounded-3xl p-6 sm:p-8 hover:bg-white hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-500 border border-slate-100 flex flex-col h-full">
                <motion.div whileHover={{ rotate: 12, scale: 1.05 }} className="w-12 sm:w-14 h-12 sm:h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500 shadow-xs">
                  <Building2 size={26} />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">For Companies</h3>
                <p className="text-slate-600 leading-relaxed mb-5 sm:mb-6 text-xs sm:text-sm flex-grow">
                  Post jobs, conduct live coding assessments in Python & JS, coordinate drive batches, and dispatch offer letters.
                </p>
                <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-xs sm:text-sm"><CheckCircle2 size={16} className="text-purple-500 shrink-0" /> Live In-Portal IDE & Code Runner</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-xs sm:text-sm"><CheckCircle2 size={16} className="text-purple-500 shrink-0" /> STAR Behavioral Scoring Rubrics</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-xs sm:text-sm"><CheckCircle2 size={16} className="text-purple-500 shrink-0" /> Automated Offer Dispatcher</motion.li>
                </motion.ul>
                <Link to="/register?role=company" className="inline-flex items-center font-bold text-purple-600 hover:text-purple-700 group/link text-xs sm:text-sm mt-auto">
                  Hire Top Talent <ArrowRight size={15} className="ml-1.5 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section id="how-it-works" className="py-16 sm:py-24 md:py-32 bg-slate-50 border-y border-slate-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-20">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">How it Works</h2>
              <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">A simple, transparent process to get you from registration to hired.</p>
            </motion.div>

            <div className="relative">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 -translate-y-1/2 rounded-full opacity-50 origin-left"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                {[
                  { step: '01', title: 'Register', desc: 'Sign up and verify your college or company profile.', icon: <Users size={20} /> },
                  { step: '02', title: 'Connect', desc: 'Colleges verify students, companies broadcast drives.', icon: <Globe size={20} /> },
                  { step: '03', title: 'Evaluate', desc: 'In-portal coding assessment and behavioral interviews.', icon: <CheckCircle2 size={20} /> },
                  { step: '04', title: 'Get Hired', desc: 'Receive offer letters with compensation & start dates.', icon: <Star size={20} /> },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20, y: 20 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, type: 'spring' }}
                    whileHover={{ y: -6 }}
                    className="relative bg-white p-5 sm:p-6 rounded-3xl shadow-md border border-slate-100 z-10 transition-shadow duration-300 hover:shadow-xl"
                  >
                    <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-full flex items-center justify-center mb-4 sm:mb-5 shadow-md shadow-indigo-500/30 mx-auto md:mx-0">
                      {item.icon}
                    </motion.div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 sm:mb-2 text-center md:text-left">{item.step}. {item.title}</h4>
                    <p className="text-slate-600 text-xs sm:text-sm text-center md:text-left leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS ================= */}
        <section className="py-16 sm:py-24 md:py-32 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12 sm:mb-20">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Success Stories</h2>
              <p className="mt-2.5 sm:mt-4 text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">Hear from participants who transformed their campus placement experience.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                { quote: "CampusConnect eliminated hundreds of manual email chains. We managed 500+ candidates and conducted 20 campus drives seamlessly.", author: "Dr. Sarah Jenkins", role: "Placement Director, Tech University", avatarClass: "bg-blue-100 text-blue-600" },
                { quote: "I created my profile, completed the ATS resume review, and received 3 interview invites within a week. The live coding environment was fantastic.", author: "Rahul Sharma", role: "Computer Science Senior", avatarClass: "bg-indigo-100 text-indigo-600" },
                { quote: "Evaluating student code in Python right inside the portal with instant test runners and star rubrics cut our screening cycle by half.", author: "Emily Chen", role: "Technical Recruiter, Innovate Inc.", avatarClass: "bg-purple-100 text-purple-600" },
              ].map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} whileHover={{ y: -6 }} className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                  <Quote size={48} className="absolute top-4 right-4 text-slate-200/50 rotate-12 pointer-events-none" />
                  <div>
                    <div className="flex gap-1 mb-4 sm:mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={15} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 leading-relaxed mb-6 sm:mb-8 relative z-10 italic text-xs sm:text-sm">"{t.quote}"</p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 relative z-10 mt-auto">
                    <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl shrink-0 ${t.avatarClass}`}>{t.author.charAt(0)}</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{t.author}</h4>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section className="py-16 sm:py-24 md:py-32 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
              <p className="mt-2 text-sm sm:text-lg text-slate-600">Got questions? We've got answers.</p>
            </motion.div>

            <div className="space-y-3 sm:space-y-4">
              {[
                { q: 'Is CampusConnect free for students?', a: 'Yes! CampusConnect is 100% free for students. You can create your profile, build your resume, and apply to unlimited campus drives without any charges.' },
                { q: 'How do colleges onboard their student batches?', a: 'Colleges can upload student records in bulk via Excel/CSV or invite students to register directly. Placement officers can then verify and approve profiles with a single click.' },
                { q: 'Can companies conduct live interviews in the portal?', a: 'Yes! The in-portal interview suite includes live code execution in Python & JavaScript, STAR behavioral rubrics, screen-sharing, and formal offer dispatching.' },
                { q: 'Is candidate data protected and verified?', a: 'Yes, academic scores and college registrations are verified by official placement officers to ensure zero resume inflation and complete hiring transparency.' },
              ].map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5 flex items-start gap-2.5">
                    <div className="mt-0.5 text-indigo-600 shrink-0"><ChevronRight size={17} /></div>
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-slate-600 ml-6 sm:ml-7 text-xs sm:text-sm leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA SECTION ================= */}
        <section className="py-20 sm:py-24 relative overflow-hidden bg-slate-950 text-white border-t border-indigo-900/40">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-cyan-500/10 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 leading-tight">
              Ready to transform your <br className="hidden md:block" /> campus recruitment?
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-sm sm:text-lg text-slate-300 mb-8 sm:mb-10 max-w-xl mx-auto px-2">
              Join hundreds of institutions and companies already streamlining placements with CampusConnect.
            </motion.p>
            <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2, type: 'spring' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block w-full sm:w-auto">
              <Link to="/register" className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 sm:px-9 py-3.5 sm:py-4 rounded-2xl sm:rounded-full text-sm sm:text-base font-bold transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 w-full sm:w-auto">
                Get Started Now <ChevronRight size={18} className="ml-1.5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 py-12 sm:py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
            <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-3 mb-4 group cursor-pointer">
                <div className="bg-indigo-600/20 p-2.5 rounded-xl group-hover:bg-indigo-600/30 transition-colors">
                  <GraduationCap size={26} className="text-indigo-400" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight">CampusConnect</span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed text-xs sm:text-sm">
                Empowering students, colleges, and recruiters with an automated, transparent campus hiring platform.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-bold mb-4 sm:mb-5 text-xs sm:text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2.5 sm:space-y-3 flex flex-col items-center md:items-start text-xs sm:text-sm">
                <li><Link to="/register?role=college" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Register Institution</Link></li>
                <li><Link to="/register?role=company" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Hire Talent</Link></li>
                <li><Link to="/register?role=student" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Join as Student</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Login to Portal</Link></li>
              </ul>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-bold mb-4 sm:mb-5 text-xs sm:text-sm uppercase tracking-wider">Contact & Support</h4>
              {contactInfo ? (
                <ul className="space-y-2.5 sm:space-y-3 w-full max-w-xs flex flex-col items-center md:items-start text-xs sm:text-sm">
                  {contactInfo.email && (
                    <li>
                      <a href={`mailto:${contactInfo.email}`} className="group flex items-center gap-2.5 hover:text-white transition-colors">
                        <div className="bg-slate-900 p-1.5 rounded-lg text-indigo-400 border border-slate-800">
                          <Mail size={16} />
                        </div>
                        <span className="truncate">{contactInfo.email}</span>
                      </a>
                    </li>
                  )}
                  {contactInfo.phone && (
                    <li>
                      <a href={`tel:${contactInfo.phone}`} className="group flex items-center gap-2.5 hover:text-white transition-colors">
                        <div className="bg-slate-900 p-1.5 rounded-lg text-indigo-400 border border-slate-800">
                          <Phone size={16} />
                        </div>
                        <span>{contactInfo.phone}</span>
                      </a>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 bg-slate-900 p-3 rounded-lg border border-slate-800">Contact info not available</p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-900 text-xs text-slate-500 gap-4 text-center">
            <p>© {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security Overview</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
