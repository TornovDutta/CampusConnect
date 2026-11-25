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
      <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-5 pointer-events-none">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-6xl mx-auto bg-white/70 backdrop-blur-2xl backdrop-saturate-150 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full pointer-events-auto transition-all"
        >
          <div className="flex justify-between h-16 items-center px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-brand-500 to-teal-600 p-2 rounded-xl text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300">
                <motion.div animate={{ rotate: [0, -8, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}>
                  <GraduationCap size={22} strokeWidth={2.5} />
                </motion.div>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight hidden sm:block">
                CampusConnect
              </span>
            </Link>

            <nav className="hidden md:flex gap-1 items-center bg-black/[0.03] p-1 rounded-full border border-black/[0.03]">
              <Link to="/colleges" className="text-xs lg:text-sm text-brand-700 hover:text-brand-900 hover:bg-white/90 px-4 py-2 rounded-full font-bold transition-all flex items-center gap-1.5">
                <Search size={13} />
                <span>Colleges & Placements</span>
              </Link>
              <a href="#features" className="text-xs lg:text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-4 py-2 rounded-full font-medium transition-all">Features</a>
              <a href="#workflow" className="text-xs lg:text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-4 py-2 rounded-full font-medium transition-all">Platform Tour</a>
              <a href="#how-it-works" className="text-xs lg:text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-4 py-2 rounded-full font-medium transition-all">How it Works</a>
              <a href="#stats" className="text-xs lg:text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-4 py-2 rounded-full font-medium transition-all">Impact</a>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link to="/login" className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors px-2.5 sm:px-3 py-2">
                Log in
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
                <Link to="/register" className="bg-slate-900 hover:bg-brand-600 text-white text-xs sm:text-sm font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all shadow-sm hover:shadow-md hover:shadow-brand-500/20">
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

          {/* Animated Mobile Dropdown Menu */}
          <AnimatePresence>
            {mobileNavOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="md:hidden mt-2 p-4 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-2xl space-y-2 pointer-events-auto"
              >
                <Link
                  to="/colleges"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-brand-50/90 border border-brand-200 text-brand-800 font-bold text-xs sm:text-sm shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-brand-600" />
                    <span>Colleges & Placements</span>
                  </div>
                  <span className="text-[10px] uppercase font-extrabold bg-brand-600 text-white px-2 py-0.5 rounded-full">
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
                    className="w-full text-center py-2.5 bg-slate-900 hover:bg-brand-600 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-colors"
                  >
                    Get Started Free
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </div>

      <main className="flex-grow">
        {/* ================= HERO SECTION (MotionSites Style) ================= */}
        <section className="relative pt-32 md:pt-44 pb-20 md:pb-32 overflow-hidden flex items-center justify-center min-h-[92vh]">
          {/* Animated Ambient Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-brand-400/20 blur-[120px] mix-blend-multiply animate-blob pointer-events-none" />
          <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-teal-400/20 blur-[120px] mix-blend-multiply animate-blob animation-delay-2000 pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-400/15 blur-[120px] mix-blend-multiply animate-blob animation-delay-4000 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] pointer-events-none" />

          {/* MotionSites Floating Micro-UI Cards Around Hero */}
          <motion.div
            animate={{ y: [0, -12, 0], x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut' }}
            className="hidden xl:flex items-center gap-3 absolute top-36 left-12 bg-white/85 backdrop-blur-xl border border-white/80 p-3 rounded-2xl shadow-xl shadow-slate-200/50 z-20 pointer-events-none"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Award size={20} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">Job Offer Extended</div>
              <div className="text-[11px] text-emerald-600 font-semibold">₹18.5 LPA Package • Google</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 14, 0], x: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6.5, ease: 'easeInOut', delay: 0.6 }}
            className="hidden xl:flex items-center gap-3 absolute top-44 right-12 bg-white/85 backdrop-blur-xl border border-white/80 p-3 rounded-2xl shadow-xl shadow-purple-200/50 z-20 pointer-events-none"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Video size={20} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">Live Technical Suite</div>
              <div className="text-[11px] text-purple-600 font-semibold">10:30 AM • In-Portal IDE</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut', delay: 1.2 }}
            className="hidden xl:flex items-center gap-2.5 absolute bottom-24 right-20 bg-white/90 backdrop-blur-xl border border-white/80 px-4 py-2.5 rounded-2xl shadow-xl shadow-slate-200/60 z-20 pointer-events-none"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-800">96% ATS Qualification Match</span>
          </motion.div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Glowing Pill Tag */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-brand-200/80 text-brand-700 font-semibold text-xs mb-8 shadow-sm backdrop-blur-md"
            >
              <Sparkles size={14} className="text-brand-500" />
              <span>Next-Gen Campus Placement Ecosystem</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, type: 'spring', bounce: 0.3 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]"
            >
              Bridge the gap between <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-teal-600 to-blue-600 animate-gradient-x inline-block">
                Talent and Opportunity
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10"
            >
              The unified, transparent platform connecting students, college placement cells, and corporate recruiters for seamless campus recruitment.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-5"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <Link
                  to="/register?role=student"
                  className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 w-full shadow-lg shadow-brand-500/25 transition-all"
                >
                  <GraduationCap size={20} />
                  Join as Student
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <Link
                  to="/register?role=college"
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-3.5 rounded-2xl text-base font-semibold flex items-center justify-center gap-2.5 w-full shadow-sm hover:border-brand-300 transition-all"
                >
                  Register College
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="w-full sm:w-auto">
                <Link
                  to="/register?role=company"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 w-full shadow-md shadow-slate-900/20 transition-all"
                >
                  <Building2 size={20} />
                  Hire Talent
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-6 flex justify-center"
            >
              <Link
                to="/colleges"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-white/90 hover:bg-brand-50 border border-slate-200/90 hover:border-brand-300 text-xs sm:text-sm font-semibold text-slate-700 hover:text-brand-700 transition-all shadow-sm hover:shadow-md"
              >
                <Search size={15} className="text-brand-600 shrink-0" />
                <span className="hidden sm:inline">Looking for a college? Search & inspect placement performance</span>
                <span className="sm:hidden font-medium">Search & inspect college placements</span>
                <ArrowRight size={14} className="text-brand-600 shrink-0" />
              </Link>
            </motion.div>

            {/* ================= MOTIONSITES INFINITE MARQUEE TICKER ================= */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-20 pt-10 border-t border-slate-200/70 max-w-5xl mx-auto"
            >
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                Trusted by 500+ Top Campuses & Global Hiring Partners
              </p>

              {/* Continuous Infinite Loop */}
              <div className="relative w-full overflow-hidden py-2">
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
                <motion.div
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: 24 }}
                  className="flex gap-4 items-center whitespace-nowrap w-max"
                >
                  {[...MARQUEE_PARTNERS, ...MARQUEE_PARTNERS].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm text-slate-800 font-bold text-xs hover:border-brand-300 hover:text-brand-600 transition-colors"
                    >
                      <Building2 size={15} className="text-brand-500" />
                      <span>{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider pl-1">• {item.category}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================= MOTIONSITES INTERACTIVE PLATFORM SPOTLIGHT ================= */}
        <section id="workflow" className="py-20 md:py-28 bg-white border-y border-slate-200/80 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 font-semibold text-xs mb-3">
                <Sparkles size={13} className="text-brand-500" />
                <span>Interactive Experience</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Designed for every role in the hiring cycle
              </h2>
              <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
                Explore the custom toolsets built directly into CampusConnect for each user role.
              </p>

              {/* Animated Tab Switcher */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 sm:gap-2 mt-8 p-1 bg-slate-100 rounded-2xl max-w-full mx-auto border border-slate-200">
                <button
                  onClick={() => setActiveWorkflowTab('student')}
                  className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                    activeWorkflowTab === 'student' ? 'text-brand-700 shadow-sm bg-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🎓 For Students
                </button>
                <button
                  onClick={() => setActiveWorkflowTab('college')}
                  className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                    activeWorkflowTab === 'college' ? 'text-brand-700 shadow-sm bg-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏛️ For Colleges
                </button>
                <button
                  onClick={() => setActiveWorkflowTab('company')}
                  className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                    activeWorkflowTab === 'company' ? 'text-brand-700 shadow-sm bg-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💼 For Recruiters
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
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-brand-300 transition-all shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                      <FileText size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">ATS Resume & Skill Match</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Instant algorithmic match scoring against drive prerequisites with professional ATS export.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-brand-300 transition-all shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
                      <Video size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">In-Portal Interview Suite</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Practice live coding questions, review round status, and attend scheduled technical & HR interviews.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-brand-300 transition-all shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
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
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <Users size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Excel Student Import</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Import entire batches via XLSX/CSV in seconds with automatic CGPA, branch, and roll-number mapping.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                      <SlidersHorizontal size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Dynamic Eligibility Gates</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Open drives for specific student cohorts (e.g. 8.5+ CGPA, 2026 Batch) with placement verification.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm">
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
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-purple-300 transition-all shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                      <Code2 size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Live In-Portal IDE & Code Runner</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Evaluate candidates live with Python & JavaScript code execution, problem templates, and runtime timing.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-purple-300 transition-all shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                      <Calendar size={22} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Drive Days & Batch Slots</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Schedule organized interview batches, allocate candidates to time slots, and dispatch instant invitations.
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 hover:border-purple-300 transition-all shadow-sm">
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
        <section id="stats" className="py-20 bg-brand-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-8 text-center"
            >
              <motion.div variants={fadeIn} className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-extrabold mb-2"><AnimatedCounter to={500} suffix="+" /></div>
                <div className="text-brand-100 font-medium text-sm md:text-base">Partner Colleges</div>
              </motion.div>
              <motion.div variants={fadeIn} className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-extrabold mb-2"><AnimatedCounter to={10000} suffix="+" /></div>
                <div className="text-brand-100 font-medium text-sm md:text-base">Active Students</div>
              </motion.div>
              <motion.div variants={fadeIn} className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-extrabold mb-2"><AnimatedCounter to={1200} suffix="+" /></div>
                <div className="text-brand-100 font-medium text-sm md:text-base">Hiring Companies</div>
              </motion.div>
              <motion.div variants={fadeIn} className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-extrabold mb-2"><AnimatedCounter to={95} suffix="%" /></div>
                <div className="text-brand-100 font-medium text-sm md:text-base">Placement Rate</div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section className="py-20 md:py-32 bg-white" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center mb-20"
            >
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Built for Everyone</h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                A unified, seamless experience tailored for each participant in the recruitment journey.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-10"
            >
              {/* Feature 1: Colleges */}
              <motion.div variants={fadeIn} whileHover={{ y: -8 }} className="group relative bg-slate-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 border border-slate-100 flex flex-col h-full">
                <motion.div whileHover={{ rotate: 12, scale: 1.05 }} className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  <GraduationCap size={28} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">For Colleges</h3>
                <p className="text-slate-600 leading-relaxed mb-6 text-sm flex-grow">
                  Manage student records, set eligibility criteria, receive drive invitations, and track placement throughput effortlessly.
                </p>
                <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3 mb-8">
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-blue-500" /> Excel Student Import</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-blue-500" /> Criteria Verification Gates</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-blue-500" /> Placement Analytics & Lag</motion.li>
                </motion.ul>
                <Link to="/register?role=college" className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 group/link text-sm mt-auto">
                  Register Institution <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Feature 2: Students */}
              <motion.div variants={fadeIn} whileHover={{ y: -8 }} className="group relative bg-brand-50/50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-brand-200/50 transition-all duration-500 border border-brand-100/50 flex flex-col h-full">
                <motion.div whileHover={{ rotate: 12, scale: 1.05 }} className="w-14 h-14 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  <Briefcase size={28} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">For Students</h3>
                <p className="text-slate-600 leading-relaxed mb-6 text-sm flex-grow">
                  Build verified ATS resumes, browse open campus drives, practice mock interviews, and land top opportunities.
                </p>
                <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3 mb-8">
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-brand-500" /> ATS Resume Matcher</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-brand-500" /> 1-Click Drive Application</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-brand-500" /> Direct Recruiter Messaging</motion.li>
                </motion.ul>
                <Link to="/register?role=student" className="inline-flex items-center font-semibold text-brand-600 hover:text-brand-700 group/link text-sm mt-auto">
                  Start your Journey <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Feature 3: Companies */}
              <motion.div variants={fadeIn} whileHover={{ y: -8 }} className="group relative bg-slate-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-500 border border-slate-100 flex flex-col h-full">
                <motion.div whileHover={{ rotate: 12, scale: 1.05 }} className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  <Building2 size={28} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">For Companies</h3>
                <p className="text-slate-600 leading-relaxed mb-6 text-sm flex-grow">
                  Post jobs, conduct live coding assessments in Python & JS, coordinate drive batches, and dispatch offer letters.
                </p>
                <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3 mb-8">
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-purple-500" /> Live In-Portal IDE & Code Runner</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-purple-500" /> STAR Behavioral Scoring Rubrics</motion.li>
                  <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-purple-500" /> Automated Offer Dispatcher</motion.li>
                </motion.ul>
                <Link to="/register?role=company" className="inline-flex items-center font-semibold text-purple-600 hover:text-purple-700 group/link text-sm mt-auto">
                  Hire Top Talent <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section id="how-it-works" className="py-20 md:py-32 bg-slate-50 border-y border-slate-200 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">How it Works</h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">A simple, transparent process to get you from registration to hired.</p>
            </motion.div>

            <div className="relative">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 -translate-y-1/2 rounded-full opacity-50 origin-left"
              />

              <div className="grid md:grid-cols-4 gap-8">
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
                    whileHover={{ y: -8 }}
                    className="relative bg-white p-6 rounded-3xl shadow-lg border border-slate-100 z-10 transition-shadow duration-300 hover:shadow-xl"
                  >
                    <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center mb-5 shadow-lg shadow-brand-500/40 mx-auto md:mx-0">
                      {item.icon}
                    </motion.div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2 text-center md:text-left">{item.step}. {item.title}</h4>
                    <p className="text-slate-600 text-sm text-center md:text-left leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS ================= */}
        <section className="py-20 md:py-32 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Success Stories</h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Hear from participants who transformed their campus placement experience.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { quote: "CampusConnect eliminated hundreds of manual email chains. We managed 500+ candidates and conducted 20 campus drives seamlessly.", author: "Dr. Sarah Jenkins", role: "Placement Director, Tech University", bgIconClass: "text-blue-500/10", avatarClass: "bg-blue-100 text-blue-600" },
                { quote: "I created my profile, completed the ATS resume review, and received 3 interview invites within a week. The live coding environment was fantastic.", author: "Rahul Sharma", role: "Computer Science Senior", bgIconClass: "text-brand-500/10", avatarClass: "bg-brand-100 text-brand-600" },
                { quote: "Evaluating student code in Python right inside the portal with instant test runners and star rubrics cut our screening cycle by half.", author: "Emily Chen", role: "Technical Recruiter, Innovate Inc.", bgIconClass: "text-purple-500/10", avatarClass: "bg-purple-100 text-purple-600" },
              ].map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} whileHover={{ y: -8 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 relative">
                  <Quote size={80} className={`absolute top-4 right-4 ${t.bgIconClass} rotate-12`} />
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-8 relative z-10 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-4 mt-auto relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${t.avatarClass}`}>{t.author.charAt(0)}</div>
                    <div>
                      <h4 className="font-bold text-slate-900">{t.author}</h4>
                      <p className="text-sm text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section className="py-20 md:py-32 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
              <p className="mt-4 text-lg text-slate-600">Got questions? We've got answers.</p>
            </motion.div>

            <div className="space-y-4">
              {[
                { q: 'Is CampusConnect free for students?', a: 'Yes! CampusConnect is 100% free for students. You can create your profile, build your resume, and apply to unlimited campus drives without any charges.' },
                { q: 'How do colleges onboard their student batches?', a: 'Colleges can upload student records in bulk via Excel/CSV or invite students to register directly. Placement officers can then verify and approve profiles with a single click.' },
                { q: 'Can companies conduct live interviews in the portal?', a: 'Yes! The in-portal interview suite includes live code execution in Python & JavaScript, STAR behavioral rubrics, screen-sharing, and formal offer dispatching.' },
                { q: 'Is candidate data protected and verified?', a: 'Yes, academic scores and college registrations are verified by official placement officers to ensure zero resume inflation and complete hiring transparency.' },
              ].map((faq, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <h4 className="text-base font-bold text-slate-900 mb-2 flex items-start gap-2.5">
                    <div className="mt-0.5 text-brand-500"><ChevronRight size={18} /></div>
                    {faq.q}
                  </h4>
                  <p className="text-slate-600 ml-7 text-xs sm:text-sm leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA SECTION ================= */}
        <section className="py-24 relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-teal-600/20 mix-blend-overlay pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              Ready to transform your <br className="hidden md:block" /> campus recruitment?
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-slate-300 mb-10 max-w-xl mx-auto">
              Join hundreds of institutions and companies already streamlining placements with CampusConnect.
            </motion.p>
            <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2, type: 'spring' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link to="/register" className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-400 text-white px-9 py-4 rounded-full text-base font-bold transition-all shadow-xl shadow-brand-500/40 hover:shadow-brand-500/60">
                Get Started Now <ChevronRight size={18} className="ml-1.5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-5 group cursor-pointer">
                <div className="bg-brand-500/20 p-2.5 rounded-xl group-hover:bg-brand-500/30 transition-colors">
                  <GraduationCap size={26} className="text-brand-400" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight">CampusConnect</span>
              </div>
              <p className="text-slate-400 text-center md:text-left max-w-sm leading-relaxed text-sm">
                Empowering students, colleges, and recruiters with an automated, transparent campus hiring platform.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-3 flex flex-col items-center md:items-start text-xs sm:text-sm">
                <li><Link to="/register?role=college" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Register Institution</Link></li>
                <li><Link to="/register?role=company" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Hire Talent</Link></li>
                <li><Link to="/register?role=student" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Join as Student</Link></li>
                <li><Link to="/login" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> Login to Portal</Link></li>
              </ul>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Contact & Support</h4>
              {contactInfo ? (
                <ul className="space-y-3 w-full max-w-xs flex flex-col items-center md:items-start text-xs sm:text-sm">
                  {contactInfo.email && (
                    <li>
                      <a href={`mailto:${contactInfo.email}`} className="group flex items-center gap-2.5 hover:text-white transition-colors">
                        <div className="bg-slate-800 p-1.5 rounded-lg text-brand-400">
                          <Mail size={16} />
                        </div>
                        <span>{contactInfo.email}</span>
                      </a>
                    </li>
                  )}
                  {contactInfo.phone && (
                    <li>
                      <a href={`tel:${contactInfo.phone}`} className="group flex items-center gap-2.5 hover:text-white transition-colors">
                        <div className="bg-slate-800 p-1.5 rounded-lg text-brand-400">
                          <Phone size={16} />
                        </div>
                        <span>{contactInfo.phone}</span>
                      </a>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 bg-slate-900 p-3 rounded-lg">Contact info not available</p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/60 text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
            <div className="flex gap-6">
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
