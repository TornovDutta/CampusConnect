import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Megaphone,
  Send,
  Users,
  User,
  GraduationCap,
  Layers,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';

type Mode = 'all_students' | 'specific_student' | 'batch' | 'branch' | 'cgpa_min' | 'unapplied';

export default function CollegeNotifications() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [targetMode, setTargetMode] = useState<Mode>('all_students');
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [batch, setBatch] = useState('');
  const [branch, setBranch] = useState('');
  const [minCgpa, setMinCgpa] = useState('8.5');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('announcement');
  const [priority, setPriority] = useState('normal');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const qMode = searchParams.get('mode') as Mode | null;
    const qStu = searchParams.get('studentId');
    if (qMode && ['all_students', 'specific_student', 'batch', 'branch', 'cgpa_min', 'unapplied'].includes(qMode)) {
      setTargetMode(qMode);
    }
    if (qStu) {
      setTargetMode('specific_student');
      setStudentId(qStu);
    }
  }, [searchParams]);

  const { data: students = [] } = useQuery({
    queryKey: ['collegeStudents'],
    queryFn: async () => {
      const res = await api.get('/college/students');
      return res.data as any[];
    },
  });

  const { data: sentHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['collegeSentNotifications'],
    queryFn: async () => {
      const res = await api.get('/college/notifications/sent');
      return res.data as any[];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/college/notifications/send', {
        target_mode: targetMode,
        student_id: targetMode === 'specific_student' ? studentId : undefined,
        batch: targetMode === 'batch' ? batch : undefined,
        branch: targetMode === 'branch' ? branch : undefined,
        min_cgpa: targetMode === 'cgpa_min' ? parseFloat(minCgpa) : undefined,
        title,
        message,
        category,
        priority,
      });
      return res.data;
    },
    onSuccess: (res) => {
      setFeedback({ type: 'success', text: res.message });
      setTitle('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['collegeSentNotifications'] });
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', text: err.response?.data?.detail || 'Failed to send notification' });
    },
  });

  const uniqueBatches = Array.from(new Set(students.map((s) => s.batch).filter(Boolean))) as string[];
  const uniqueBranches = Array.from(new Set(students.map((s) => s.branch).filter(Boolean))) as string[];
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    sendMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <Megaphone className="text-brand-500" size={26} />
          Student Notification Center
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Notify all campus students, specific batches/branches, high-CGPA cohorts, individual students, or nudge inactive students who haven&apos;t applied yet.
        </p>
      </div>

      <div className="card p-6">
        {feedback && (
          <div
            className={`mb-5 p-3.5 rounded-xl text-sm border flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              1. Select Student Audience
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { id: 'all_students', label: 'All Students', icon: Users },
                { id: 'specific_student', label: 'Specific Student', icon: User },
                { id: 'batch', label: 'By Batch', icon: GraduationCap },
                { id: 'branch', label: 'By Branch', icon: Layers },
                { id: 'cgpa_min', label: 'By Min CGPA', icon: Award },
                { id: 'unapplied', label: '0 Applications', icon: AlertCircle },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = targetMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTargetMode(opt.id as Mode)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                      active
                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={17} />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {targetMode === 'specific_student' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student by name or email..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div className="max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                {filteredStudents.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => setStudentId(s._id)}
                    className={`w-full px-3.5 py-2 text-left text-sm flex items-center justify-between ${
                      studentId === s._id ? 'bg-brand-50 text-brand-800 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>
                      {s.name} <span className="text-xs text-slate-400">({s.email})</span>
                    </span>
                    {studentId === s._id && <CheckCircle2 size={15} className="text-brand-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {targetMode === 'batch' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-600">Target Batch Year</label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. 2026"
                className="input-field text-sm bg-white"
                required
              />
              {uniqueBatches.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uniqueBatches.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBatch(b)}
                      className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {targetMode === 'branch' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-600">Target Branch / Department</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. CSE"
                className="input-field text-sm bg-white"
                required
              />
              {uniqueBranches.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {uniqueBranches.map((br) => (
                    <button
                      key={br}
                      type="button"
                      onClick={() => setBranch(br)}
                      className="text-xs px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100"
                    >
                      {br}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {targetMode === 'cgpa_min' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold uppercase text-slate-600">Minimum CGPA Threshold</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                className="input-field text-sm bg-white max-w-xs"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-sm">
                <option value="announcement">Placement Announcement</option>
                <option value="update">Drive Update</option>
                <option value="warning">Deadline Reminder</option>
                <option value="alert">Urgent Alert</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field text-sm">
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Notification Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TCS & Infosys On-Campus Drive Registration Open"
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Message</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write instructions, deadlines, or drive eligibility details for your students..."
              className="input-field text-sm resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={sendMutation.isPending} className="btn-primary px-6 py-2.5 flex items-center gap-2">
              {sendMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              Send to Students
            </button>
          </div>
        </form>
      </div>

      {/* Sent History */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Sent Student Notifications History</h3>
          <span className="text-xs text-slate-500">{sentHistory.length} recent</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Notification</th>
                <th className="px-6 py-3">Audience</th>
                <th className="px-6 py-3">Delivered</th>
                <th className="px-6 py-3">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loadingHistory ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-slate-400">Loading...</td>
                </tr>
              ) : sentHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-slate-400">No notifications sent yet.</td>
                </tr>
              ) : (
                sentHistory.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-6 py-3.5 max-w-md">
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 font-medium">{item.target_label}</td>
                    <td className="px-6 py-3.5 font-semibold text-brand-700">{item.delivered_count}</td>
                    <td className="px-6 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
