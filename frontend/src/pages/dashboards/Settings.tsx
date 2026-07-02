import React from 'react';
import { Bell, Lock, Globe } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Account Settings</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between pb-6 border-b border-slate-100">
            <div className="flex gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Notifications</h3>
                <p className="text-sm text-slate-500 mt-1">Manage how you receive updates and alerts.</p>
              </div>
            </div>
            <button className="btn-secondary px-4 py-2 text-sm">Configure</button>
          </div>

          <div className="flex items-start justify-between pb-6 border-b border-slate-100">
            <div className="flex gap-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg h-fit">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Security</h3>
                <p className="text-sm text-slate-500 mt-1">Update your password and security preferences.</p>
              </div>
            </div>
            <button className="btn-secondary px-4 py-2 text-sm">Change Password</button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg h-fit">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Preferences</h3>
                <p className="text-sm text-slate-500 mt-1">Language, timezone, and appearance settings.</p>
              </div>
            </div>
            <button className="btn-secondary px-4 py-2 text-sm">Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}
