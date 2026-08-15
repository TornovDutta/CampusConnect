import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { GraduationCap, Briefcase, Building2, ChevronRight, Mail, Phone, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from './services/api';

function LandingPage() {
  const { data: contactInfo } = useQuery({
    queryKey: ['publicContactInfo'],
    queryFn: async () => {
      const response = await api.get('/admin/contact-info');
      return response.data;
    }
  });
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-brand-500 p-2 rounded-lg text-white">
                <GraduationCap size={24} />
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">CampusConnect</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Log in</Link>
              <Link to="/register" className="btn-primary text-sm px-5">Get Started</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-brand-50/50 to-transparent"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Bridge the gap between <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-blue-600">Talent and Opportunity</span>
            </h1>
            <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
              The all-in-one centralized platform for Colleges, Students, and Companies to streamline campus recruitment and internship hiring.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link to="/register?role=student" className="btn-primary px-8 py-3 text-lg flex items-center justify-center gap-2 group w-full sm:w-auto shadow-lg shadow-brand-500/30">
                <GraduationCap size={20} />
                Join as Student
              </Link>
              <Link to="/register?role=college" className="btn-secondary px-8 py-3 text-lg flex items-center justify-center gap-2 w-full sm:w-auto hover:bg-slate-50">
                Register Institution
                <ChevronRight size={20} className="text-slate-400" />
              </Link>
              <Link to="/register?role=company" className="btn-secondary px-8 py-3 text-lg flex items-center justify-center gap-2 w-full sm:w-auto hover:bg-slate-50">
                <Building2 size={20} className="text-slate-500" />
                Hire Talent
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Built for Everyone</h2>
              <p className="mt-4 text-lg text-slate-600">A unified experience tailored for each participant in the recruitment journey.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="card p-8 group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">For Colleges</h3>
                <p className="text-slate-600 leading-relaxed">
                  Manage student records, receive company invitations, track placement statistics, and streamline the entire campus drive process.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card p-8 group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">For Students</h3>
                <p className="text-slate-600 leading-relaxed">
                  Build professional profiles, browse eligible opportunities, track application statuses, and land your dream job or internship.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card p-8 group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Building2 size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">For Companies</h3>
                <p className="text-slate-600 leading-relaxed">
                  Post jobs, define eligibility criteria, invite colleges, shortlist candidates, schedule interviews, and roll out offers seamlessly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-brand-500/10 p-2 rounded-lg">
                  <GraduationCap size={28} className="text-brand-500" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">CampusConnect</span>
              </div>
              <p className="text-slate-500 text-center md:text-left max-w-sm leading-relaxed">
                Empowering students and streamlining recruitment. The ultimate bridge between academia and industry.
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-semibold mb-6 text-lg">Quick Links</h4>
              <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
                <li><Link to="/register?role=college" className="hover:text-brand-400 transition-colors">Register Institution</Link></li>
                <li><Link to="/register?role=company" className="hover:text-brand-400 transition-colors">Hire Talent</Link></li>
                <li><Link to="/register?role=student" className="hover:text-brand-400 transition-colors">Join as Student</Link></li>
                <li><Link to="/login" className="hover:text-brand-400 transition-colors">Login to Portal</Link></li>
              </ul>
            </div>
            
            <div className="flex flex-col items-center md:items-start">
              <h4 className="text-white font-semibold mb-6 text-lg">Connect With Us</h4>
              {contactInfo ? (
                <ul className="space-y-4 text-sm w-full max-w-xs flex flex-col items-center md:items-start">
                  {contactInfo.email && (
                    <li>
                      <a href={`mailto:${contactInfo.email}`} className="group flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-slate-900 transition-colors">
                        <div className="bg-slate-800 p-2 rounded-md group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                          <Mail size={16} />
                        </div>
                        <span className="group-hover:text-brand-300 transition-colors">{contactInfo.email}</span>
                      </a>
                    </li>
                  )}
                  {contactInfo.phone && (
                    <li>
                      <a href={`tel:${contactInfo.phone}`} className="group flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-slate-900 transition-colors">
                        <div className="bg-slate-800 p-2 rounded-md group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                          <Phone size={16} />
                        </div>
                        <span className="group-hover:text-brand-300 transition-colors">{contactInfo.phone}</span>
                      </a>
                    </li>
                  )}
                  {(contactInfo.github || contactInfo.linkedin) && (
                    <>
                      {contactInfo.github && (
                        <li>
                          <a href={contactInfo.github} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-slate-900 transition-colors">
                            <div className="bg-slate-800 p-2 rounded-md group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                              <ExternalLink size={16} />
                            </div>
                            <span className="group-hover:text-brand-300 transition-colors">GitHub</span>
                          </a>
                        </li>
                      )}
                      {contactInfo.linkedin && (
                        <li>
                          <a href={contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 p-2 -ml-2 rounded-lg hover:bg-slate-900 transition-colors">
                            <div className="bg-slate-800 p-2 rounded-md group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                              <ExternalLink size={16} />
                            </div>
                            <span className="group-hover:text-brand-300 transition-colors">LinkedIn</span>
                          </a>
                        </li>
                      )}
                    </>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Contact information not available</p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800 text-sm text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}



import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import CollegeDashboard from './pages/dashboards/CollegeDashboard';
import CollegeStudentsList from './pages/dashboards/CollegeStudentsList';
import CollegeStudentProfile from './pages/dashboards/CollegeStudentProfile';
import CollegeSelectedJobs from './pages/dashboards/CollegeSelectedJobs';
import CompanyDashboard from './pages/dashboards/CompanyDashboard';
import CompanyJobs from './pages/dashboards/CompanyJobs';
import CompanyApplicants from './pages/dashboards/CompanyApplicants';
import OrganizationDetails from './pages/dashboards/OrganizationDetails';
import Profile from './pages/dashboards/Profile';
import Settings from './pages/dashboards/Settings';
import UserActivity from './pages/dashboards/UserActivity';
import PostJob from './pages/dashboards/PostJob';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={<DashboardLayout allowedRoles={['super_admin', 'college', 'student', 'company']} />}>
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/activity" element={<UserActivity />} />
            <Route path="admin/organization/:id" element={<OrganizationDetails />} />
            <Route path="student" element={<StudentDashboard />} />
            <Route path="college" element={<CollegeDashboard />} />
            <Route path="college/students" element={<CollegeStudentsList />} />
            <Route path="college/students/:id" element={<CollegeStudentProfile />} />
            <Route path="college/selected-jobs" element={<CollegeSelectedJobs />} />
            <Route path="company" element={<CompanyDashboard />} />
            <Route path="company/jobs" element={<CompanyJobs />} />
            <Route path="company/applicants" element={<CompanyApplicants />} />
            <Route path="company/post-job" element={<PostJob />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
