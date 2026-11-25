import { useState } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  Settings,
  GraduationCap,
  Activity,
  Users,
  Award,
  Briefcase,
  PlusCircle,
  BarChart3,
  Megaphone,
  Bug,
  ShieldCheck,
  Sparkles,
  Tag,
  Sliders,
  MessageSquare,
  SlidersHorizontal,
  X,
  Video,
  FileText,
  Calendar,
  Bell,
  Building2,
  Menu
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { api } from '../services/api';

export default function DashboardLayout({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [dismissedBannerAt, setDismissedBannerAt] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: announcement } = useQuery({
    queryKey: ['platformAnnouncement'],
    queryFn: async () => {
      const res = await api.get('/admin/announcement');
      return res.data as {
        enabled: boolean;
        title: string;
        message: string;
        variant: 'info' | 'success' | 'warning';
        target_role: string;
        updated_at: string;
      };
    },
    enabled: !!isAuthenticated && !!user,
    staleTime: 30000,
  });

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;
  }

  const showBanner =
    announcement?.enabled &&
    (announcement.title || announcement.message) &&
    (announcement.target_role === 'all' || announcement.target_role === user.role || user.role === 'super_admin') &&
    dismissedBannerAt !== (announcement.updated_at || announcement.message);

  const bannerClasses =
    announcement?.variant === 'warning'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : announcement?.variant === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
      : 'bg-brand-50 border-brand-200 text-brand-900';

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-x-hidden">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center">
            <GraduationCap size={24} className="text-brand-400 mr-2" />
            <span className="text-xl font-bold tracking-tight">CampusConnect</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav 
          className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) {
              setIsMobileMenuOpen(false);
            }
          }}
        >
          {/* Overview Section */}
          <div className="mb-6">
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Overview</h3>
            <div className="space-y-1">
              <NavLink 
                to={`/dashboard/${user.role === 'super_admin' ? 'admin' : user.role}`} 
                end
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <LayoutDashboard size={18} />
                <span className="font-medium text-sm">Dashboard</span>
              </NavLink>

              <NavLink 
                to="/colleges" 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Building2 size={18} />
                <span className="font-medium text-sm">College Directory</span>
              </NavLink>
              
              {user.role === 'super_admin' && (
                <NavLink 
                  to="/dashboard/admin/analytics" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <BarChart3 size={18} />
                  <span className="font-medium text-sm">Analytics & Charts</span>
                </NavLink>
              )}
            </div>
          </div>

          {/* Super Admin Management & Operations Sections */}
          {user.role === 'super_admin' && (
            <>
              <div className="mb-6">
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Management</h3>
                <div className="space-y-1">
                  <NavLink 
                    to="/dashboard/admin/users" 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Users size={18} />
                    <span className="font-medium text-sm">User Directory</span>
                  </NavLink>

                  <NavLink 
                    to="/dashboard/admin/placements" 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Award size={18} />
                    <span className="font-medium text-sm">Placement Tracker</span>
                  </NavLink>

                  <NavLink 
                    to="/dashboard/admin/jobs" 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <ShieldCheck size={18} />
                    <span className="font-medium text-sm">Job Moderation</span>
                  </NavLink>

                  <NavLink 
                    to="/dashboard/admin/skills" 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Tag size={18} />
                    <span className="font-medium text-sm">Skills Catalog</span>
                  </NavLink>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Operations</h3>
                <div className="space-y-1">
                  <NavLink 
                    to="/dashboard/admin/notifications" 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Megaphone size={18} />
                    <span className="font-medium text-sm">Custom Notifications</span>
                  </NavLink>

                  <NavLink 
                    to="/dashboard/admin/college-desk" 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <MessageSquare size={18} />
                    <span className="font-medium text-sm">College Desk & Msg</span>
                  </NavLink>

                  <NavLink 
                    to="/dashboard/admin/issues" 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Bug size={18} />
                    <span className="font-medium text-sm">Issue Monitor</span>
                  </NavLink>

                  <NavLink 
                    to="/dashboard/admin/controls" 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Sliders size={18} />
                    <span className="font-medium text-sm">Platform Controls</span>
                  </NavLink>

                  <NavLink 
                    to="/dashboard/admin/activity" 
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Activity size={18} />
                    <span className="font-medium text-sm">Activity Logs</span>
                  </NavLink>
                </div>
              </div>
            </>
          )}

          {/* Student Placement Services Section */}
          {user.role === 'student' && (
            <div className="mb-6">
              <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Placement Services
              </h3>
              <div className="space-y-1">
                <NavLink 
                  to="/dashboard/student/applications" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Briefcase size={18} />
                  <span className="font-medium text-sm">My Applications</span>
                </NavLink>

                <NavLink 
                  to="/dashboard/student/interviews" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Video size={18} />
                  <span className="font-medium text-sm">Interview Center</span>
                </NavLink>

                <NavLink 
                  to="/dashboard/student/resume" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <FileText size={18} />
                  <span className="font-medium text-sm">Resume & ATS</span>
                </NavLink>

                <NavLink 
                  to="/dashboard/student/calendar" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Calendar size={18} />
                  <span className="font-medium text-sm">Placement Calendar</span>
                </NavLink>

                <NavLink 
                  to="/dashboard/student/messages" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <MessageSquare size={18} />
                  <span className="font-medium text-sm">Message College</span>
                </NavLink>

                <NavLink 
                  to="/dashboard/student/notifications" 
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Bell size={18} />
                  <span className="font-medium text-sm">Notifications</span>
                </NavLink>
              </div>
            </div>
          )}

          {/* Role-Specific Sections */}
          {(user.role === 'college' || user.role === 'company') && (
            <div className="mb-6">
              <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                {user.role === 'college' ? 'Placement Cell' : 'Recruitment'}
              </h3>
              <div className="space-y-1">
                {user.role === 'college' && (
                  <>
                    <NavLink 
                      to="/dashboard/college/analytics" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <BarChart3 size={18} />
                      <span className="font-medium text-sm">Progress & Lag</span>
                    </NavLink>

                    <NavLink 
                      to="/dashboard/college/students" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Users size={18} />
                      <span className="font-medium text-sm">Students & Excel</span>
                    </NavLink>

                    <NavLink 
                      to="/dashboard/college/jobs" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <SlidersHorizontal size={18} />
                      <span className="font-medium text-sm">Job Eligibility</span>
                    </NavLink>
                    
                    <NavLink 
                      to="/dashboard/college/selected-jobs" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Award size={18} />
                      <span className="font-medium text-sm">Selected Jobs</span>
                    </NavLink>

                    <NavLink 
                      to="/dashboard/college/notifications" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Megaphone size={18} />
                      <span className="font-medium text-sm">Notify Students</span>
                    </NavLink>

                    <NavLink 
                      to="/dashboard/college/admin-hub" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <MessageSquare size={18} />
                      <span className="font-medium text-sm">Admin Msg & Reports</span>
                    </NavLink>
                  </>
                )}

                {user.role === 'company' && (
                  <>
                    <NavLink 
                      to="/dashboard/company/jobs" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Briefcase size={18} />
                      <span className="font-medium text-sm">Manage Jobs</span>
                    </NavLink>
                    
                    <NavLink 
                      to="/dashboard/company/applicants" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Users size={18} />
                      <span className="font-medium text-sm">Monitor Applicants</span>
                    </NavLink>

                    <NavLink 
                      to="/dashboard/company/interviews" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Video size={18} />
                      <span className="font-medium text-sm">Live Interview Suite</span>
                    </NavLink>

                    <NavLink 
                      to="/dashboard/company/drive-slots" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Calendar size={18} />
                      <span className="font-medium text-sm">Drive Day Slots</span>
                    </NavLink>

                    <NavLink 
                      to="/dashboard/company/messages" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <MessageSquare size={18} />
                      <span className="font-medium text-sm">Candidate Messages</span>
                    </NavLink>

                    <NavLink 
                      to="/dashboard/company/talent-pool" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Sparkles size={18} />
                      <span className="font-medium text-sm">Talent Pool Search</span>
                    </NavLink>

                    <NavLink 
                      to="/dashboard/company/analytics" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <BarChart3 size={18} />
                      <span className="font-medium text-sm">Funnel Analytics</span>
                    </NavLink>
                    
                    <NavLink 
                      to="/dashboard/company/post-job" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <PlusCircle size={18} />
                      <span className="font-medium text-sm">Post a Job</span>
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Account Section */}
          <div className="mb-6">
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Account</h3>
            <div className="space-y-1">
              <NavLink 
                to="/dashboard/profile" 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <UserIcon size={18} />
                <span className="font-medium text-sm">Profile</span>
              </NavLink>
              
              <NavLink 
                to="/dashboard/settings" 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Settings size={18} />
                <span className="font-medium text-sm">Settings</span>
              </NavLink>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name || user.email}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0 w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-sm shrink-0">
          <div className="flex items-center min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 mr-2 -ml-1 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="bg-brand-500 p-1.5 rounded-md text-white mr-2.5 sm:mr-3 shrink-0">
              <GraduationCap size={20} />
            </div>
            <h1 className="text-base sm:text-xl font-bold text-slate-800 capitalize truncate">
              {user.role.replace('_', ' ')} Portal
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-bold flex items-center justify-center text-xs">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800 max-w-[120px] truncate leading-tight">
                  {user.name || user.email}
                </p>
                <p className="text-[10px] text-slate-400 capitalize leading-tight">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {showBanner && announcement && (
          <div className={`mx-3 sm:mx-6 lg:mx-8 mt-4 px-4 py-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${bannerClasses}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles size={16} className="shrink-0" />
              <p className="truncate sm:whitespace-normal">
                {announcement.title && <strong className="mr-2">{announcement.title}:</strong>}
                <span>{announcement.message}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDismissedBannerAt(announcement.updated_at || announcement.message)}
              className="p-1 rounded-lg hover:bg-black/5 shrink-0"
              aria-label="Dismiss announcement"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="p-3.5 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
