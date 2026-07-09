import React from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, User, Settings, GraduationCap, Activity } from 'lucide-react';

export default function DashboardLayout({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <GraduationCap size={24} className="text-brand-400 mr-2" />
          <span className="text-xl font-bold tracking-tight">CampusConnect</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink 
            to={`/dashboard/${user.role === 'super_admin' ? 'admin' : user.role}`} 
            end
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-brand-600/20 text-brand-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </NavLink>
          
          {user.role === 'super_admin' && (
            <NavLink 
              to="/dashboard/admin/activity" 
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-brand-600/20 text-brand-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Activity size={20} />
            <span className="font-medium">Activity</span>
          </NavLink>
          )}

          <NavLink 
            to="/dashboard/profile" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-brand-600/20 text-brand-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <User size={20} />
            <span className="font-medium">Profile</span>
          </NavLink>
          
          <NavLink 
            to="/dashboard/settings" 
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-brand-600/20 text-brand-400' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </NavLink>
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
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm">
          <img src="/favicon.svg" alt="Logo" className="w-8 h-8 mr-3" />
          <h1 className="text-xl font-bold text-slate-800 capitalize">
            {user.role.replace('_', ' ')} Portal
          </h1>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
