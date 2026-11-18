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
  X
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { api } from '../services/api';

export default function DashboardLayout({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [dismissedBannerAt, setDismissedBannerAt] = useState<string | null>(null);

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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <GraduationCap size={24} className="text-brand-400 mr-2" />
          <span className="text-xl font-bold tracking-tight">CampusConnect</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
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
                      <span className="font-medium text-sm">Students List</span>
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
                      <span className="font-medium text-sm">Applicants</span>
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
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shadow-sm shrink-0">
          <div className="flex items-center">
            <div className="bg-brand-500 p-1.5 rounded-md text-white mr-3">
              <GraduationCap size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 capitalize">
              {user.role.replace('_', ' ')} Portal
            </h1>
          </div>

          <div className="flex items-center gap-3">
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
          <div className={`mx-6 sm:mx-8 mt-5 px-4 py-3 rounded-xl border text-sm flex items-center justify-between gap-3 ${bannerClasses}`}>
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

        <div className="p-6 sm:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
