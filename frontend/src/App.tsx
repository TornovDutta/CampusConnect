import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
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
import EditJob from './pages/dashboards/EditJob';

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
            <Route path="company/edit-job/:id" element={<EditJob />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
