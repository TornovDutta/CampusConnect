import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Briefcase, Building2, ChevronRight, Mail, Phone, ExternalLink, Users, BarChart3, CheckCircle2, ArrowRight, ShieldCheck, Globe, Star, Quote, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

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

function AnimatedCounter({ to, suffix = '' }: { to: number, suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 2500, bounce: 0 });

  useEffect(() => {
    if (inView) {
      motionValue.set(to);
    }
  }, [inView, motionValue, to]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        // format thousands with 'k' if needed, or just comma
        let formatted = Math.floor(latest).toString();
        if (to >= 10000) {
           formatted = Math.floor(latest / 1000) + 'k';
        } else {
           formatted = Intl.NumberFormat("en-US").format(Math.floor(latest));
        }
        ref.current.textContent = formatted + suffix;
      }
    });
  }, [springValue, suffix, to]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function LandingPage() {
  const { data: contactInfo } = useQuery({
    queryKey: ['publicContactInfo'],
    queryFn: async () => {
      const response = await api.get('/admin/contact-info');
      return response.data;
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-brand-500/30">
      <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-6 pointer-events-none">
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-6xl mx-auto bg-white/30 backdrop-blur-2xl backdrop-saturate-150 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full pointer-events-auto transition-all"
        >
          <div className="flex justify-between h-16 items-center px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-brand-500 to-blue-600 p-2 rounded-xl text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300">
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}>
                  <GraduationCap size={22} strokeWidth={2.5} />
                </motion.div>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight hidden sm:block">CampusConnect</span>
            </Link>
            
            <nav className="hidden md:flex gap-1 items-center bg-black/[0.03] p-1 rounded-full border border-black/[0.03]">
              <a href="#features" className="text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-5 py-2 rounded-full font-medium transition-all shadow-sm shadow-transparent hover:shadow-black/[0.04]">Features</a>
              <a href="#how-it-works" className="text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-5 py-2 rounded-full font-medium transition-all shadow-sm shadow-transparent hover:shadow-black/[0.04]">How it Works</a>
              <a href="#stats" className="text-sm text-slate-700 hover:text-slate-900 hover:bg-white/90 px-5 py-2 rounded-full font-medium transition-all shadow-sm shadow-transparent hover:shadow-black/[0.04]">Impact</a>
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors px-2 sm:px-4 py-2">Log in</Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="bg-slate-900 hover:bg-brand-600 text-white text-sm font-medium px-4 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all shadow-sm hover:shadow-md hover:shadow-brand-500/20">Get Started</Link>
              </motion.div>
            </div>
          </div>
        </motion.header>
      </div>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-28 md:pt-40 pb-24 md:pb-40 overflow-hidden flex items-center justify-center min-h-[90vh]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          
          {/* Animated Background Gradients */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/20 blur-[120px] mix-blend-multiply animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>
          
          {/* Floating Background Icons */}
          <motion.div animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="hidden md:block absolute top-1/4 left-1/4 text-brand-500">
             <Star size={32} />
          </motion.div>
          <motion.div animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }} className="hidden md:block absolute bottom-1/4 right-1/4 text-purple-500">
             <ShieldCheck size={40} />
          </motion.div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 font-medium text-sm mb-8 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              The New Era of Campus Hiring
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, type: "spring", bounce: 0.4 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight"
            >
              Bridge the gap between <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-blue-600 to-purple-600 animate-gradient-x inline-block" >Talent and Opportunity</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-4 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10"
            >
              The all-in-one centralized platform for Colleges, Students, and Companies to streamline campus recruitment and internship hiring.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-5"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link to="/register?role=student" className="bg-brand-600 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-3 w-full shadow-xl shadow-brand-500/30 hover:bg-brand-700 transition-colors duration-300">
                  <GraduationCap size={22} />
                  Join as Student
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link to="/register?role=college" className="bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-3 w-full hover:border-brand-300 hover:bg-brand-50 transition-colors duration-300">
                  Register Institution
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link to="/register?role=company" className="bg-slate-900 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-3 w-full shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors duration-300">
                  <Building2 size={22} />
                  Hire Talent
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 1, delay: 1 }}
               className="mt-20 pt-10 border-t border-slate-200/60 max-w-4xl mx-auto flex flex-col items-center"
            >
               <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Trusted by top institutions and companies</p>
               <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 font-bold text-xl text-slate-700"><Globe size={24} /> TechCorp</motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 font-bold text-xl text-slate-700"><ShieldCheck size={24} /> EduGlobal</motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 font-bold text-xl text-slate-700"><BarChart3 size={24} /> Innovate Inc.</motion.div>
               </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-20 bg-brand-600 text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
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

        {/* Features Section */}
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
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">A unified, seamless experience tailored for each participant in the recruitment journey. No more fragmented emails and spreadsheets.</p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-10"
            >
              {/* Feature 1 */}
              <motion.div variants={fadeIn} whileHover={{ y: -10 }} className="group relative bg-slate-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 border border-slate-100 flex flex-col h-full">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  <GraduationCap size={28} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">For Colleges</h3>
                <p className="text-slate-600 leading-relaxed mb-6 text-sm flex-grow">
                  Manage student records, receive company invitations, track placement statistics, and streamline the entire campus drive process effortlessly.
                </p>
                <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3 mb-8">
                   <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-blue-500" /> Verify Student Data</motion.li>
                   <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-blue-500" /> Manage Drive Schedules</motion.li>
                   <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-blue-500" /> Track Placement Metrics</motion.li>
                </motion.ul>
                <Link to="/register?role=college" className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 group/link text-sm mt-auto">
                   Register Institution <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Feature 2 */}
              <motion.div variants={fadeIn} whileHover={{ y: -10 }} className="group relative bg-brand-50/50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-brand-200/50 transition-all duration-500 border border-brand-100/50 flex flex-col h-full">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="w-14 h-14 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  <Briefcase size={28} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">For Students</h3>
                <p className="text-slate-600 leading-relaxed mb-6 text-sm flex-grow">
                  Build professional profiles, browse eligible opportunities, track application statuses, and land your dream job or internship.
                </p>
                <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3 mb-8">
                   <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-brand-500" /> Create Stunning Resumes</motion.li>
                   <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-brand-500" /> One-Click Applications</motion.li>
                   <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-brand-500" /> Interview Notifications</motion.li>
                </motion.ul>
                <Link to="/register?role=student" className="inline-flex items-center font-semibold text-brand-600 hover:text-brand-700 group/link text-sm mt-auto">
                   Start your Journey <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Feature 3 */}
              <motion.div variants={fadeIn} whileHover={{ y: -10 }} className="group relative bg-slate-50 rounded-3xl p-8 hover:bg-white hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-500 border border-slate-100 flex flex-col h-full">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }} className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                  <Building2 size={28} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">For Companies</h3>
                <p className="text-slate-600 leading-relaxed mb-6 text-sm flex-grow">
                  Post jobs, define eligibility criteria, invite colleges, shortlist candidates, schedule interviews, and roll out offers seamlessly.
                </p>
                <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3 mb-8">
                   <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-purple-500" /> Set Eligibility Criteria</motion.li>
                   <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-purple-500" /> Automated Shortlisting</motion.li>
                   <motion.li variants={fadeIn} className="flex items-center text-slate-700 gap-2 text-sm"><CheckCircle2 size={16} className="text-purple-500" /> Direct College Invites</motion.li>
                </motion.ul>
                <Link to="/register?role=company" className="inline-flex items-center font-semibold text-purple-600 hover:text-purple-700 group/link text-sm mt-auto">
                   Hire Top Talent <ArrowRight size={16} className="ml-2 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="py-20 md:py-32 bg-slate-50 border-y border-slate-200 overflow-hidden">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-20"
              >
                 <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">How it Works</h2>
                 <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">A simple, transparent process to get you from registration to hired.</p>
              </motion.div>

              <div className="relative">
                 {/* Connecting line */}
                 <motion.div 
                   initial={{ scaleX: 0 }} 
                   whileInView={{ scaleX: 1 }} 
                   viewport={{ once: true }} 
                   transition={{ duration: 1, ease: "easeInOut" }} 
                   className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 -translate-y-1/2 rounded-full opacity-50 origin-left"
                 ></motion.div>
                 
                 <div className="grid md:grid-cols-4 gap-8">
                    {[
                       { step: '01', title: 'Register', desc: 'Sign up and complete your detailed profile.', icon: <Users size={20} /> },
                       { step: '02', title: 'Connect', desc: 'Colleges verify students, companies invite colleges.', icon: <Globe size={20} /> },
                       { step: '03', title: 'Apply/Shortlist', desc: 'Apply to jobs or let the automated system shortlist you.', icon: <CheckCircle2 size={20} /> },
                       { step: '04', title: 'Get Hired', desc: 'Ace your interviews and receive offer letters online.', icon: <Star size={20} /> },
                    ].map((item, i) => (
                       <motion.div 
                         key={i}
                         initial={{ opacity: 0, x: -20, y: 20 }}
                         whileInView={{ opacity: 1, x: 0, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ delay: i * 0.15, type: "spring" }}
                         whileHover={{ y: -10 }}
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

        {/* Testimonials Section */}
        <section className="py-20 md:py-32 bg-white relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
                 <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Success Stories</h2>
                 <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Hear from the students, colleges, and companies who have transformed their recruitment process with us.</p>
              </motion.div>
              
              <div className="grid md:grid-cols-3 gap-8">
                 {[
                    { quote: "CampusConnect made our placement drive effortless. We could manage 500+ students and coordinate with 20 companies without a single spreadsheet.", author: "Dr. Sarah Jenkins", role: "Placement Director, Tech University", bgIconClass: "text-blue-500/10", avatarClass: "bg-blue-100 text-blue-600" },
                    { quote: "I created my profile, applied to 5 companies, and got 3 interviews within a week. The UI is incredibly intuitive and finding eligible jobs is a breeze.", author: "Rahul Sharma", role: "Computer Science Senior", bgIconClass: "text-brand-500/10", avatarClass: "bg-brand-100 text-brand-600" },
                    { quote: "As a recruiter, finding the right talent was always a challenge. Now we can filter eligible candidates instantly and send interview links in one click.", author: "Emily Chen", role: "HR Manager, Innovate Inc.", bgIconClass: "text-purple-500/10", avatarClass: "bg-purple-100 text-purple-600" },
                 ].map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} whileHover={{ y: -10 }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 relative">
                       <Quote size={80} className={`absolute top-4 right-4 ${t.bgIconClass} rotate-12`} />
                       <div className="flex gap-1 mb-6">
                          {[1,2,3,4,5].map(star => <Star key={star} size={16} className="text-yellow-400 fill-yellow-400" />)}
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

        {/* FAQ Section */}
        <section className="py-20 md:py-32 bg-slate-50 border-t border-slate-200">
           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                 <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
                 <p className="mt-4 text-lg text-slate-600">Got questions? We've got answers.</p>
              </motion.div>
              
              <div className="space-y-6">
                 {[
                    { q: "Is CampusConnect free for students?", a: "Yes! CampusConnect is 100% free for students. You can create your profile, build your resume, and apply to unlimited jobs without any hidden charges." },
                    { q: "How do colleges onboard their students?", a: "Colleges can bulk-upload student data via CSV or invite students to register using a unique college code. Once registered, the college TPO can verify and approve the profiles." },
                    { q: "Can companies set specific eligibility criteria?", a: "Absolutely. Companies can filter candidates based on CGPA, backlogs, branch, graduation year, and specific technical skills before shortlisting them." },
                    { q: "Is data shared with third parties?", a: "No, we take privacy very seriously. Student data is only shared with the companies they explicitly apply to or when their college shares it during a campus drive." },
                 ].map((faq, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                       <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-3">
                         <div className="mt-1 text-brand-500"><ChevronRight size={18} /></div>
                         {faq.q}
                       </h4>
                       <p className="text-slate-600 ml-7 leading-relaxed">{faq.a}</p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
           <div className="absolute inset-0 bg-slate-900"></div>
           <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-purple-600/20 mix-blend-overlay"></div>
           
           <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">Ready to transform your <br className="hidden md:block"/> campus recruitment?</motion.h2>
              <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-lg text-slate-300 mb-10">Join thousands of students, colleges, and companies already using CampusConnect.</motion.p>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2, type: "spring" }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link to="/register" className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-400 text-white px-10 py-4 rounded-full text-lg font-bold transition-all shadow-xl shadow-brand-500/40 hover:shadow-brand-500/60">
                   Get Started Now <ChevronRight size={20} className="ml-2" />
                </Link>
              </motion.div>
           </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-6 group cursor-pointer">
                <div className="bg-brand-500/20 p-2.5 rounded-xl group-hover:bg-brand-500/30 transition-colors">
                  <GraduationCap size={28} className="text-brand-400" />
                </div>
                <span className="text-3xl font-bold text-white tracking-tight">CampusConnect</span>
              </div>
              <p className="text-slate-400 text-center md:text-left max-w-sm leading-relaxed text-lg">
                Empowering students and streamlining recruitment. The ultimate bridge between academia and industry.
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-4 flex flex-col items-center md:items-start">
                <li><Link to="/register?role=college" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ChevronRight size={16} /> Register Institution</Link></li>
                <li><Link to="/register?role=company" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ChevronRight size={16} /> Hire Talent</Link></li>
                <li><Link to="/register?role=student" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ChevronRight size={16} /> Join as Student</Link></li>
                <li><Link to="/login" className="hover:text-brand-400 transition-colors flex items-center gap-2"><ChevronRight size={16} /> Login to Portal</Link></li>
              </ul>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-bold mb-6 text-lg">Connect With Us</h4>
              {contactInfo ? (
                <ul className="space-y-4 w-full max-w-xs flex flex-col items-center md:items-start">
                  {contactInfo.email && (
                    <li>
                      <a href={`mailto:${contactInfo.email}`} className="group flex items-center gap-3 hover:text-white transition-colors">
                        <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                          <Mail size={18} />
                        </div>
                        <span>{contactInfo.email}</span>
                      </a>
                    </li>
                  )}
                  {contactInfo.phone && (
                    <li>
                      <a href={`tel:${contactInfo.phone}`} className="group flex items-center gap-3 hover:text-white transition-colors">
                        <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                          <Phone size={18} />
                        </div>
                        <span>{contactInfo.phone}</span>
                      </a>
                    </li>
                  )}
                  {(contactInfo.github || contactInfo.linkedin) && (
                    <li className="flex gap-3 pt-2">
                      {contactInfo.github && (
                        <a href={contactInfo.github} target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-3 rounded-lg hover:bg-brand-500/20 hover:text-brand-400 transition-colors">
                          <ExternalLink size={20} />
                        </a>
                      )}
                      {contactInfo.linkedin && (
                        <a href={contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-3 rounded-lg hover:bg-brand-500/20 hover:text-brand-400 transition-colors">
                          <ExternalLink size={20} />
                        </a>
                      )}
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 bg-slate-900 p-4 rounded-lg">Contact info not available</p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/60 text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
