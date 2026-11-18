import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  FileText,
  CheckSquare,
  Plus,
  Loader2,
  UserCheck,
  X,
  FileSpreadsheet,
  Megaphone,
  BarChart3,
  MessageSquare,
  SlidersHorizontal,
  ArrowRight,
  CheckCheck,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../../services/api';

const FUNNEL_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
const ENGAGEMENT_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

export default function CollegeDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: '',
    cgpa: '',
    batch: '',
    branch: '',
    roll_number: '',
  });

  // Inline Accept & Set Criteria modal for Recent Drive Invitations
  const [criteriaInvite, setCriteriaInvite] = useState<any | null>(null);
  const [inviteMinCgpa, setInviteMinCgpa] = useState('');
  const [inviteBatches, setInviteBatches] = useState('');
  const [inviteBranches, setInviteBranches] = useState('');
  const [inviteMaxBacklogs, setInviteMaxBacklogs] = useState('');
  const [inviteNotify, setInviteNotify] = useState(true);

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['collegeDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/college/dashboard-stats');
      return response.data;
    },
  });

  const { data: pendingStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['collegePendingStudents'],
    queryFn: async () => {
      const response = await api.get('/college/pending-students');
      return response.data;
    },
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['collegeAnalytics'],
    queryFn: async () => {
      const res = await api.get('/college/analytics');
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await api.patch(`/college/approve-student/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collegeDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['collegePendingStudents'] });
      queryClient.invalidateQueries({ queryKey: ['collegeAnalytics'] });
    },
  });

  const approveAllMutation = useMutation({
    mutationFn: async () => {
      await api.post('/college/approve-all-pending');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collegeDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['collegePendingStudents'] });
      queryClient.invalidateQueries({ queryKey: ['collegeAnalytics'] });
    },
  });

  const respondInviteMutation = useMutation({
    mutationFn: async (payload: {
      jobId: string;
      decision: 'accepted' | 'declined';
      min_cgpa?: number | null;
      allowed_batches?: string[];
      allowed_branches?: string[];
      max_backlogs?: number | null;
      notify_eligible?: boolean;
    }) => {
      const { jobId, ...body } = payload;
      const res = await api.patch(`/college/invitations/${jobId}/respond`, body);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['collegeDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['collegeJobsWithRules'] });
      setCriteriaInvite(null);
      if (res?.message) {
        alert(
          res.message +
            (res.notified_count ? ` (${res.notified_count} student(s) notified).` : '.')
        );
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to update drive invitation');
    },
  });

  const openCriteriaModal = (invite: any) => {
    setCriteriaInvite(invite);
    const r = invite.rule || {};
    setInviteMinCgpa(r.min_cgpa !== null && r.min_cgpa !== undefined ? String(r.min_cgpa) : '');
    setInviteBatches((r.allowed_batches || []).join(', '));
    setInviteBranches((r.allowed_branches || []).join(', '));
    setInviteMaxBacklogs(r.max_backlogs !== null && r.max_backlogs !== undefined ? String(r.max_backlogs) : '');
    setInviteNotify(true);
  };

  const toggleInviteChip = (currentText: string, val: string, setter: (v: string) => void) => {
    const arr = currentText.split(',').map((s) => s.trim()).filter(Boolean);
    const exists = arr.some((x) => x.toLowerCase() === val.toLowerCase());
    const next = exists ? arr.filter((x) => x.toLowerCase() !== val.toLowerCase()) : [...arr, val];
    setter(next.join(', '));
  };

  const handlePublishInviteCriteria = (e: FormEvent) => {
    e.preventDefault();
    if (!criteriaInvite) return;
    respondInviteMutation.mutate({
      jobId: criteriaInvite.id,
      decision: 'accepted',
      min_cgpa: inviteMinCgpa.trim() ? parseFloat(inviteMinCgpa) : null,
      allowed_batches: inviteBatches.split(',').map((s) => s.trim()).filter(Boolean),
      allowed_branches: inviteBranches.split(',').map((s) => s.trim()).filter(Boolean),
      max_backlogs: inviteMaxBacklogs.trim() ? parseInt(inviteMaxBacklogs, 10) : null,
      notify_eligible: inviteNotify,
    });
  };

  const addStudentMutation = useMutation({
    mutationFn: async () => {
      await api.post('/college/add-student', {
        name: newStudent.name,
        email: newStudent.email,
        password: newStudent.password,
        cgpa: newStudent.cgpa.trim() ? parseFloat(newStudent.cgpa) : null,
        batch: newStudent.batch,
        branch: newStudent.branch,
        roll_number: newStudent.roll_number,
      });
    },
    onSuccess: () => {
      setIsAddModalOpen(false);
      setNewStudent({ name: '', email: '', password: '', cgpa: '', batch: '', branch: '', roll_number: '' });
      queryClient.invalidateQueries({ queryKey: ['collegeDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['collegeStudents'] });
      queryClient.invalidateQueries({ queryKey: ['collegeAnalytics'] });
      alert('Student added successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to add student');
    },
  });

  const handleAddStudent = (e: FormEvent) => {
    e.preventDefault();
    addStudentMutation.mutate();
  };

  if (isLoadingStats || isLoadingStudents) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  const stats = statsData?.stats || {
    registered_students: 0,
    pending_students: 0,
    drive_invitations: 0,
    students_placed: 0,
    total_applications: 0,
    unread_admin_messages: 0,
  };
  const recent_invitations = statsData?.recent_invitations || [];
  const funnel = analyticsData?.funnel || [];
  const engagement = (analyticsData?.engagement_breakdown || []).filter((d: any) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Placement Cell Command Center</h2>
          <p className="text-sm text-slate-500">
            Manage students, import Excel rosters, set CGPA/batch job rules, monitor lags, and connect with Admin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/college/students')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-700 rounded-xl flex items-center gap-1.5"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" /> Excel Import
          </button>
          <button
            onClick={() => navigate('/dashboard/college/jobs')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-700 rounded-xl flex items-center gap-1.5"
          >
            <SlidersHorizontal size={15} /> Job Eligibility
          </button>
          <button
            onClick={() => navigate('/dashboard/college/notifications')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-700 rounded-xl flex items-center gap-1.5"
          >
            <Megaphone size={15} /> Notify Students
          </button>
          <button
            onClick={() => navigate('/dashboard/college/admin-hub')}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-700 rounded-xl flex items-center gap-1.5 relative"
          >
            <MessageSquare size={15} /> Admin Hub
            {stats.unread_admin_messages > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                {stats.unread_admin_messages}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/dashboard/college/students')}
          className="card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <div className="p-3.5 bg-brand-50 text-brand-600 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Approved Students</p>
            <p className="text-2xl font-bold text-slate-800">{stats.registered_students}</p>
            <p className="text-[11px] text-amber-600">{stats.pending_students || 0} pending approval</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/dashboard/college/jobs')}
          className="card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Drive Invitations</p>
            <p className="text-2xl font-bold text-slate-800">{stats.drive_invitations}</p>
            <p className="text-[11px] text-slate-400">{stats.total_applications || 0} total apps</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/dashboard/college/selected-jobs')}
          className="card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <div className="p-3.5 bg-green-50 text-green-600 rounded-xl">
            <CheckSquare size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Shortlisted / Placed</p>
            <p className="text-2xl font-bold text-slate-800">{stats.students_placed}</p>
            <p className="text-[11px] text-emerald-600">
              {analyticsData?.overview?.placement_rate ?? 0}% placement rate
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/dashboard/college/analytics')}
          className="card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Lag Bottlenecks</p>
            <p className="text-2xl font-bold text-amber-600">{analyticsData?.lag_alerts?.length ?? 0}</p>
            <p className="text-[11px] text-slate-400">View progress graphs →</p>
          </div>
        </div>
      </div>

      {/* Quick Progress & Lag Diagrams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Campus Placement Funnel</h3>
              <p className="text-xs text-slate-500">Student progress across hiring stages</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/college/analytics')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              All Graphs & Lag Report <ArrowRight size={14} />
            </button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
                  {funnel.map((_: any, idx: number) => (
                    <Cell key={idx} fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-800">Engagement vs Lag</h3>
          <p className="text-xs text-slate-500 mb-3">Active students vs unapplied / pending lags</p>
          <div className="h-56 w-full">
            {engagement.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">No students yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagement}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={42}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {engagement.map((_: any, idx: number) => (
                      <Cell key={idx} fill={ENGAGEMENT_COLORS[idx % ENGAGEMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Pending Students Section */}
      <div className="card border-orange-100/50">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-orange-50/30">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck size={20} className="text-orange-500" /> Pending Student Approvals
          </h2>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
              {pendingStudents.length} Requests
            </span>
            {pendingStudents.length > 1 && (
              <button
                onClick={() => approveAllMutation.mutate()}
                disabled={approveAllMutation.isPending}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg inline-flex items-center gap-1"
              >
                <CheckCheck size={14} /> Approve All Pending
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Student Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Request Date</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No pending student requests.
                  </td>
                </tr>
              ) : (
                pendingStudents.map((student: any) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{student.name}</td>
                    <td className="px-6 py-4 text-slate-600">{student.email}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(student.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => approveMutation.mutate(student._id)}
                        disabled={approveMutation.isPending}
                        className="btn-primary text-sm px-4 py-1.5 h-auto bg-green-600 hover:bg-green-700"
                      >
                        Approve Student
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drive Invitations */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Recent Drive Invitations</h2>
            <p className="text-xs text-slate-500">
              Company-invited campus drives stay hidden from students until you accept &amp; set eligibility criteria.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/college/jobs')}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            Manage All Job Eligibility Rules →
          </button>
        </div>
        <div className="p-6 space-y-4">
          {recent_invitations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No campus drive invitations from companies yet.
            </div>
          ) : (
            recent_invitations.map((invite: any) => {
              const isLive = invite.college_decision === 'accepted' && invite.criteria_configured && invite.rule?.is_open;
              const isDeclined = invite.college_decision === 'declined';
              const r = invite.rule || {};
              return (
                <div
                  key={invite.id}
                  className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-xl gap-4 transition-colors ${
                    isLive
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isDeclined
                      ? 'border-red-100 bg-red-50/20'
                      : 'border-amber-200 bg-amber-50/25'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-800">{invite.title}</h3>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 size={12} /> Live for {invite.eligible_students_count}/{invite.total_college_students} Matching Students
                        </span>
                      ) : isDeclined ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                          <XCircle size={12} /> Declined
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <Clock size={12} /> Action Required — Set Criteria to Publish
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {invite.company_name} • {invite.location || 'Campus'} • {invite.package_details}
                    </p>
                    {isLive && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {r.min_cgpa ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            CGPA ≥ {r.min_cgpa}
                          </span>
                        ) : null}
                        {r.allowed_batches?.length > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Batch: {r.allowed_batches.join(', ')}
                          </span>
                        )}
                        {r.allowed_branches?.length > 0 && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                            Branch: {r.allowed_branches.join(', ')}
                          </span>
                        )}
                        {r.max_backlogs !== null && r.max_backlogs !== undefined && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Max Backlogs: {r.max_backlogs}
                          </span>
                        )}
                        {!r.min_cgpa && !r.allowed_batches?.length && !r.allowed_branches?.length && r.max_backlogs === null && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            Open to all approved campus students
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 ml-1">
                          ({invite.applied_count || 0} applied)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      onClick={() => openCriteriaModal(invite)}
                      disabled={respondInviteMutation.isPending}
                      className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
                    >
                      <SlidersHorizontal size={14} />
                      {isLive ? 'Edit Criteria' : 'Accept & Set Criteria'}
                    </button>
                    {!isDeclined && (
                      <button
                        onClick={() => respondInviteMutation.mutate({ jobId: invite.id, decision: 'declined' })}
                        disabled={respondInviteMutation.isPending}
                        className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded-xl transition-colors"
                      >
                        Decline
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Inline Accept & Set Criteria Modal for Recent Drive Invitations */}
      {criteriaInvite && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Accept Drive &amp; Set Student Criteria</h3>
                <p className="text-xs text-slate-500">
                  {criteriaInvite.title} — {criteriaInvite.company_name}
                </p>
              </div>
              <button onClick={() => setCriteriaInvite(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-200 text-xs text-brand-900">
              Only students of your college who <strong>match all criteria below</strong> will see and be able to apply to this drive. Leave fields blank to allow all approved campus students.
            </div>

            <form onSubmit={handlePublishInviteCriteria} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={inviteMinCgpa}
                    onChange={(e) => setInviteMinCgpa(e.target.value)}
                    placeholder="e.g. 9.0"
                    className="input-field text-sm"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['', '7.0', '7.5', '8.0', '8.5', '9.0'].map((val) => (
                      <button
                        key={val || 'any'}
                        type="button"
                        onClick={() => setInviteMinCgpa(val)}
                        className={`text-[11px] px-2 py-0.5 rounded border ${
                          inviteMinCgpa === val
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {val ? `${val}+` : 'Any'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Max Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={inviteMaxBacklogs}
                    onChange={(e) => setInviteMaxBacklogs(e.target.value)}
                    placeholder="e.g. 0 for zero backlogs"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Allowed Batches (comma-separated)
                </label>
                <input
                  type="text"
                  value={inviteBatches}
                  onChange={(e) => setInviteBatches(e.target.value)}
                  placeholder="e.g. 2026, 2027"
                  className="input-field text-sm"
                />
                {(statsData?.batches || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(statsData?.batches || []).map((b: string) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleInviteChip(inviteBatches, b, setInviteBatches)}
                        className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        + {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Allowed Branches / Departments (comma-separated)
                </label>
                <input
                  type="text"
                  value={inviteBranches}
                  onChange={(e) => setInviteBranches(e.target.value)}
                  placeholder="e.g. CSE, IT, ECE"
                  className="input-field text-sm"
                />
                {(statsData?.branches || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(statsData?.branches || []).map((br: string) => (
                      <button
                        key={br}
                        type="button"
                        onClick={() => toggleInviteChip(inviteBranches, br, setInviteBranches)}
                        className="text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100"
                      >
                        + {br}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inviteNotify}
                  onChange={(e) => setInviteNotify(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600"
                />
                <Bell size={14} className="text-brand-600" />
                Notify all matching students immediately after publishing
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCriteriaInvite(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={respondInviteMutation.isPending}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                >
                  {respondInviteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Approve &amp; Distribute to Matching Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-800">Add New Student</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field text-sm"
                  placeholder="John Doe"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="input-field text-sm"
                  placeholder="john@college.edu"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  className="input-field text-sm"
                  placeholder="••••••••"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">CGPA (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="input-field text-sm"
                    placeholder="e.g. 9.1"
                    value={newStudent.cgpa}
                    onChange={(e) => setNewStudent({ ...newStudent, cgpa: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Batch Year</label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="e.g. 2026"
                    value={newStudent.batch}
                    onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Branch / Dept</label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="e.g. CSE"
                    value={newStudent.branch}
                    onChange={(e) => setNewStudent({ ...newStudent, branch: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Roll Number</label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="e.g. CS202601"
                    value={newStudent.roll_number}
                    onChange={(e) => setNewStudent({ ...newStudent, roll_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStudentMutation.isPending}
                  className="btn-primary flex-1 flex justify-center items-center gap-2"
                >
                  {addStudentMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
