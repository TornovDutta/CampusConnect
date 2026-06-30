import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { GraduationCap, Briefcase, Building2, ChevronRight } from 'lucide-react';

function LandingPage() {
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
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">How it works</a>
            </nav>
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
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register?role=college" className="btn-primary px-8 py-3 text-lg flex items-center justify-center gap-2 group">
                Register Institution
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/register?role=company" className="btn-secondary px-8 py-3 text-lg flex items-center justify-center gap-2">
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

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <GraduationCap size={24} className="text-brand-500" />
            <span className="text-xl font-bold text-white tracking-tight">CampusConnect</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} CampusConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">{title}</h1>
        <Link to="/" className="text-brand-600 hover:underline flex items-center justify-center gap-1">
          Return to Home
        </Link>
      </div>
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
import CompanyDashboard from './pages/dashboards/CompanyDashboard';
import OrganizationDetails from './pages/dashboards/OrganizationDetails';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={<DashboardLayout allowedRoles={['super_admin', 'college', 'student', 'company']} />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/organization/:id" element={<OrganizationDetails />} />
            <Route path="student" element={<StudentDashboard />} />
            <Route path="college" element={<CollegeDashboard />} />
            <Route path="company" element={<CompanyDashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
