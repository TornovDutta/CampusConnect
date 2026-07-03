import React, { useState } from 'react';
import { Bell, Lock, Globe, X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function Settings() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
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
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Change Password
            </button>
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

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
              <button 
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setError('');
                  setSuccess('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm font-medium text-green-600 bg-green-50 rounded-lg">
                  {success}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-6 py-2 text-sm flex items-center justify-center min-w-[120px]"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
