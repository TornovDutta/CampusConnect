import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  KeyRound,
  Send,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Trash2,
  Download,
  Loader2,
  X,
  RefreshCw,
  Copy,
  Check,
  UserPlus,
} from 'lucide-react';
import { api } from '../../services/api';
import { downloadRowsAsCsv } from '../../utils/csvExport';
import { useAuth } from '../../context/AuthContext';

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'college' | 'company' | 'super_admin';
  college_id?: string;
  college_name?: string;
  is_active: boolean;
  is_suspended: boolean;
  is_approved: boolean;
  is_college_approved: boolean;
  is_pending: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    college_id: '',
  });
  const [createError, setCreateError] = useState('');

  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [copiedPwd, setCopiedPwd] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminAllUsers', roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/admin/users?${params.toString()}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/users', {
        ...createForm,
        college_id: createForm.role === 'student' ? createForm.college_id : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'student', college_id: '' });
      setCreateError('');
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.detail || 'Failed to create user');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!resetTarget) return;
      await api.post(`/admin/users/${resetTarget.id}/reset-password`, { new_password: newPassword });
    },
    onSuccess: () => {
      alert(`Password successfully reset for ${resetTarget?.email}.`);
      setResetTarget(null);
      setNewPassword('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to reset password');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/admin/toggle-suspend/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/admin/users/${userId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to delete user');
    },
  });

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setCopiedPwd(false);
  };

  const handleCopyPassword = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopiedPwd(true);
      setTimeout(() => setCopiedPwd(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const counts = data?.counts || { total: 0, student: 0, college: 0, company: 0, super_admin: 0, suspended: 0 };
  const colleges: Array<{ id: string; name: string }> = data?.colleges || [];
  const users: AdminUserRow[] = (data?.users || []).filter((u: AdminUserRow) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.college_name || '').toLowerCase().includes(q)
    );
  });

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    createMutation.mutate();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-amber-100 text-amber-800';
      case 'college':
        return 'bg-blue-100 text-blue-700';
      case 'company':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-teal-100 text-teal-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Users className="text-brand-500" size={26} />
            Global User Directory & Access Control
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Search, onboard, verify, reset passwords, suspend, or remove any user across all CampusConnect portals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadRowsAsCsv('campusconnect-users', users as unknown as Record<string, unknown>[])}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <UserPlus size={15} /> Create User
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {[
          { label: 'Total Accounts', value: counts.total, color: 'text-slate-800' },
          { label: 'Students', value: counts.student, color: 'text-teal-600' },
          { label: 'Colleges', value: counts.college, color: 'text-blue-600' },
          { label: 'Companies', value: counts.company, color: 'text-purple-600' },
          { label: 'Super Admins', value: counts.super_admin, color: 'text-amber-600' },
          { label: 'Suspended', value: counts.suspended, color: 'text-red-600' },
        ].map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Directory Table */}
      <div className="card">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, or college..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="college">Colleges</option>
              <option value="company">Companies</option>
              <option value="super_admin">Super Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending Approval</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="animate-spin text-brand-500" size={28} />
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-red-600 text-sm">Failed to load user directory.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role / Affiliation</th>
                  <th className="px-6 py-3">Approval</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No users match the selected filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = currentUser?._id === u.id;
                    const notifyType = u.role === 'college' ? 'college' : u.role === 'company' ? 'company' : 'specific_user';
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getRoleBadge(u.role)}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                          {u.college_name && (
                            <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[200px]">{u.college_name}</p>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {u.role === 'super_admin' ? (
                            <span className="text-xs text-slate-400">System</span>
                          ) : u.is_pending ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              <Clock size={11} /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              <CheckCircle2 size={11} /> Approved
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {u.is_suspended ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              <ShieldAlert size={11} /> Suspended
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.is_pending && (
                              <button
                                onClick={() => approveMutation.mutate(u.id)}
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setResetTarget(u);
                                setNewPassword('');
                                setCopiedPwd(false);
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                              title="Reset Password"
                            >
                              <KeyRound size={15} />
                            </button>

                            {u.role !== 'super_admin' && (
                              <button
                                onClick={() =>
                                  navigate(`/dashboard/admin/notifications?targetType=${notifyType}&targetId=${u.id}`)
                                }
                                className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                title="Send Custom Notification"
                              >
                                <Send size={15} />
                              </button>
                            )}

                            {!isSelf && (
                              <>
                                <button
                                  onClick={() => suspendMutation.mutate(u.id)}
                                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg ${
                                    u.is_suspended
                                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                                  }`}
                                >
                                  {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm(`Permanently delete user "${u.name}" (${u.email})?`)) {
                                      deleteMutation.mutate(u.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title="Delete User"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-brand-500" /> Create New Account
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="p-3 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">{createError}</div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="student">Student</option>
                  <option value="college">College</option>
                  <option value="company">Company</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full / Organization Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input-field text-sm"
                  placeholder="name@example.com"
                />
              </div>

              {createForm.role === 'student' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Assign College</label>
                  <select
                    required
                    value={createForm.college_id}
                    onChange={(e) => setCreateForm({ ...createForm, college_id: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="">Select a college...</option>
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary text-xs px-5 py-2">
                  {createMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <KeyRound size={18} className="text-amber-500" /> Reset User Password
              </h3>
              <button onClick={() => setResetTarget(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Setting a new password for <strong className="text-slate-800">{resetTarget.name}</strong> ({resetTarget.email}).
              They will also receive a security notification.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-600">New Temporary Password</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="input-field text-sm flex-1 font-mono"
                />
                <button
                  type="button"
                  onClick={generateTempPassword}
                  className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1"
                  title="Generate strong password"
                >
                  <RefreshCw size={14} /> Generate
                </button>
                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3 py-2 text-xs font-semibold bg-brand-50 text-brand-700 rounded-lg"
                    title="Copy password"
                  >
                    {copiedPwd ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={newPassword.trim().length < 6 || resetPasswordMutation.isPending}
                onClick={() => resetPasswordMutation.mutate()}
                className="btn-primary text-xs px-5 py-2 disabled:opacity-50"
              >
                {resetPasswordMutation.isPending ? 'Updating...' : 'Save New Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
