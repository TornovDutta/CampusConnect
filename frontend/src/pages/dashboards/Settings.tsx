import React, { useState, useEffect } from 'react';
import {
  Globe,
  Bell,
  Lock,
  Moon,
  Sun,
  Laptop,
  Check,
  Loader2,
  X,
  Palette,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface PreferencesData {
  language: string;
  timezone: string;
  theme: string;
  accent_color: string;
  compact_mode: boolean;
  email_notifications: boolean;
  login_alerts: boolean;
  desktop_notifications: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'preferences' | 'notifications' | 'security'>('preferences');

  // Preferences State
  const [prefs, setPrefs] = useState<PreferencesData>({
    language: localStorage.getItem('cc_language') || 'en',
    timezone: localStorage.getItem('cc_timezone') || 'Asia/Kolkata',
    theme: localStorage.getItem('cc_theme') || 'light',
    accent_color: localStorage.getItem('cc_accent') || 'teal',
    compact_mode: localStorage.getItem('cc_compact') === 'true',
    email_notifications: localStorage.getItem('cc_email_notifs') !== 'false',
    login_alerts: localStorage.getItem('cc_login_alerts') !== 'false',
    desktop_notifications: localStorage.getItem('cc_desktop_notifs') === 'true',
  });

  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState('');
  const [prefsError, setPrefsError] = useState('');

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch saved preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await api.get('/auth/preferences');
        if (res.data) {
          setPrefs((prev) => ({
            ...prev,
            ...res.data,
          }));
        }
      } catch {
        // Fall back to local storage
      }
    }
    loadPreferences();
  }, []);

  // Handle saving preferences
  const handleSavePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPrefs(true);
    setPrefsError('');
    setPrefsSuccess('');

    // Persist locally
    localStorage.setItem('cc_language', prefs.language);
    localStorage.setItem('cc_timezone', prefs.timezone);
    localStorage.setItem('cc_theme', prefs.theme);
    localStorage.setItem('cc_accent', prefs.accent_color);
    localStorage.setItem('cc_compact', String(prefs.compact_mode));
    localStorage.setItem('cc_email_notifs', String(prefs.email_notifications));
    localStorage.setItem('cc_login_alerts', String(prefs.login_alerts));
    localStorage.setItem('cc_desktop_notifs', String(prefs.desktop_notifications));

    // Apply theme to document
    if (prefs.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (prefs.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System default
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    try {
      await api.put('/auth/preferences', prefs);
      setPrefsSuccess('Settings & preferences saved successfully!');
      setTimeout(() => setPrefsSuccess(''), 3500);
    } catch {
      setPrefsSuccess('Preferences saved locally!');
      setTimeout(() => setPrefsSuccess(''), 3500);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize your display language, timezone, appearance, and notification alerts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'preferences'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe size={18} />
          Preferences & Appearance
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'notifications'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell size={18} />
          Notifications
          {user?.role === 'super_admin' && (
            <span className="text-[10px] bg-brand-100 text-brand-700 font-bold px-1.5 py-0.5 rounded-full">
              Admin Login Alerts
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'security'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock size={18} />
          Security
        </button>
      </div>

      {/* Feedback Messages */}
      {prefsSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{prefsSuccess}</span>
        </div>
      )}

      {prefsError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{prefsError}</span>
        </div>
      )}

      {/* TAB 1: PREFERENCES & APPEARANCE */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Language & Timezone */}
          <div className="card p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe size={18} className="text-brand-500" />
                Localization & Region
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your preferred system language and display timezone for timestamps and interview slots.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Language */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  System Language
                </label>
                <select
                  value={prefs.language}
                  onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="en">English (US)</option>
                  <option value="en-gb">English (UK)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="ja">Japanese (日本語)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Controls the primary navigation and interface labels.
                </p>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Timezone
                </label>
                <select
                  value={prefs.timezone}
                  onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="Asia/Kolkata">India Standard Time (IST - UTC+05:30)</option>
                  <option value="UTC">Coordinated Universal Time (UTC+00:00)</option>
                  <option value="America/New_York">Eastern Time (US & Canada - UTC-05:00)</option>
                  <option value="America/Chicago">Central Time (US & Canada - UTC-06:00)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada - UTC-08:00)</option>
                  <option value="Europe/London">London, Edinburgh (GMT - UTC+00:00)</option>
                  <option value="Europe/Paris">Central European Time (CET - UTC+01:00)</option>
                  <option value="Asia/Dubai">Gulf Standard Time (GST - UTC+04:00)</option>
                  <option value="Asia/Singapore">Singapore Time (SGT - UTC+08:00)</option>
                  <option value="Asia/Tokyo">Japan Standard Time (JST - UTC+09:00)</option>
                  <option value="Australia/Sydney">Sydney Time (AEST - UTC+10:00)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Placement schedules and activity logs will display in this timezone.
                </p>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="card p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Palette size={18} className="text-brand-500" />
                Appearance & Theme
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize how CampusConnect looks on your screen.
              </p>
            </div>

            {/* Theme Mode Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                Theme Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, theme: 'light' })}
                  className={`p-4 rounded-xl border flex flex-col items-start gap-2.5 transition-all text-left ${
                    prefs.theme === 'light'
                      ? 'border-brand-500 bg-brand-50/20 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <Sun size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Light Mode</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Clean, bright interface</p>
                  </div>
                  {prefs.theme === 'light' && (
                    <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 mt-1">
                      <Check size={14} /> Active
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, theme: 'dark' })}
                  className={`p-4 rounded-xl border flex flex-col items-start gap-2.5 transition-all text-left ${
                    prefs.theme === 'dark'
                      ? 'border-brand-500 bg-brand-50/20 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-900 text-white">
                    <Moon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Dark Mode</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Easy on the eyes at night</p>
                  </div>
                  {prefs.theme === 'dark' && (
                    <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 mt-1">
                      <Check size={14} /> Active
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPrefs({ ...prefs, theme: 'system' })}
                  className={`p-4 rounded-xl border flex flex-col items-start gap-2.5 transition-all text-left ${
                    prefs.theme === 'system'
                      ? 'border-brand-500 bg-brand-50/20 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                    <Laptop size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">System Default</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Matches your OS setting</p>
                  </div>
                  {prefs.theme === 'system' && (
                    <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 mt-1">
                      <Check size={14} /> Active
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Brand Accent Color
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'teal', name: 'Signature Teal', bg: 'bg-[#14b8a6]' },
                  { id: 'blue', name: 'Classic Blue', bg: 'bg-[#3b82f6]' },
                  { id: 'emerald', name: 'Emerald Green', bg: 'bg-[#10b981]' },
                  { id: 'indigo', name: 'Royal Indigo', bg: 'bg-[#6366f1]' },
                ].map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setPrefs({ ...prefs, accent_color: color.id })}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                      prefs.accent_color === color.id
                        ? 'border-slate-800 bg-slate-50 font-bold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${color.bg}`} />
                    <span>{color.name}</span>
                    {prefs.accent_color === color.id && <Check size={14} className="text-slate-800" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Mode Toggle */}
            <div className="pt-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Compact Table Layout</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reduces vertical padding in tables and job lists to show more items per page.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.compact_mode}
                  onChange={(e) => setPrefs({ ...prefs, compact_mode: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSavingPrefs}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 shadow-md shadow-brand-500/20"
            >
              {isSavingPrefs ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="card p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell size={18} className="text-brand-500" />
                Notification Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure when and how CampusConnect sends you alerts and notifications.
              </p>
            </div>

            {/* Special Highlight for Admin User Logins */}
            {user?.role === 'super_admin' && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50 to-teal-50 border border-brand-200/80">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-brand-500 text-white shrink-0 mt-0.5">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        Admin New User Login Notifications
                      </h4>
                      <span className="text-[10px] bg-brand-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      As a Super Administrator, you automatically receive a real-time notification in the top navbar bell whenever any user (student, college, or company) logs into the platform.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 divide-y divide-slate-100">
              {/* Login Alerts Toggle */}
              <div className="pt-4 first:pt-0 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Login Activity Alerts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trigger notification entries whenever logins occur from authenticated users.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.login_alerts}
                  onChange={(e) => setPrefs({ ...prefs, login_alerts: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              {/* Email Notifications */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Email Notifications</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Send critical security and placement drive updates directly to your registered email address.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.email_notifications}
                  onChange={(e) => setPrefs({ ...prefs, email_notifications: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              {/* Desktop / In-app Audio alerts */}
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Real-Time In-App Alert Badges</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Display an animated ping badge on the notification bell when new activities take place.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.desktop_notifications}
                  onChange={(e) => setPrefs({ ...prefs, desktop_notifications: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={isSavingPrefs}
                className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 shadow-md shadow-brand-500/20"
              >
                {isSavingPrefs ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                <span>Save Notification Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="card p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock size={18} className="text-purple-600" />
                Password & Authentication
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep your CampusConnect account protected with a strong, unique password.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Account Password</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Last updated or created via secure bcrypt hash.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Change Password
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Role-Based Access Control</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Signed in as <strong className="text-slate-800 uppercase">{user?.role}</strong> ({user?.email})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-800">Change Password</h2>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 text-xs font-semibold text-green-700 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field text-sm"
                  placeholder="Re-enter new password"
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
                  disabled={isSubmittingPassword}
                  className="btn-primary px-6 py-2 text-sm flex items-center justify-center min-w-[120px]"
                >
                  {isSubmittingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
