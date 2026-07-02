import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-3xl font-bold">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{user.name || 'User Profile'}</h1>
            <p className="text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Mail size={16} /> Email Address
              </label>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-800 border border-slate-100">
                {user.email}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Shield size={16} /> Role
              </label>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-800 border border-slate-100 capitalize">
                {user.role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
