import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  SlidersHorizontal,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Globe,
  Building2,
  Loader2,
  X,
  Eye,
  Bell,
} from 'lucide-react';
import { api } from '../../services/api';

interface JobRule {
  is_open: boolean;
  min_cgpa: number | null;
  allowed_batches: string[];
  allowed_branches: string[];
  max_backlogs: number | null;
  specific_student_ids: string[];
  note: string;
}

interface CollegeJob {
  id: string;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  stipend: string;
  visibility: string;
  college_decision?: string;
  criteria_configured?: boolean;
  is_live_for_students?: boolean;
  created_at: string;
  total_college_students: number;
  eligible_students_count: number;
  college_stats: {
    applied: number;
    shortlisted: number;
    offers: number;
    hired: number;
    rejected: number;
  };
  rule: JobRule;
}

export default function CollegeJobControl() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [driveFilter, setDriveFilter] = useState<'all' | 'pending' | 'campus' | 'public'>('all');
  const [editingJob, setEditingJob] = useState<CollegeJob | null>(null);
  const [trackingJob, setTrackingJob] = useState<CollegeJob | null>(null);

  // Rule form state
  const [isOpen, setIsOpen] = useState(true);
  const [minCgpa, setMinCgpa] = useState('');
  const [batchesText, setBatchesText] = useState('');
  const [branchesText, setBranchesText] = useState('');
  const [maxBacklogs, setMaxBacklogs] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentPickerSearch, setStudentPickerSearch] = useState('');
  const [note, setNote] = useState('');
  const [notifyEligible, setNotifyEligible] = useState(true);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['collegeJobsWithRules'],
    queryFn: async () => {
      const res = await api.get('/college/jobs');
      return res.data as { jobs: CollegeJob[]; batches: string[]; branches: string[] };
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ['collegeStudents'],
    queryFn: async () => {
      const res = await api.get('/college/students');
      return res.data as any[];
    },
  });

  const { data: applicants = [], isLoading: loadingApplicants } = useQuery({
    queryKey: ['collegeJobApplicants', trackingJob?.id],
    queryFn: async () => {
      if (!trackingJob) return [];
      const res = await api.get(`/college/jobs/${trackingJob.id}/applicants`);
      return res.data as any[];
    },
    enabled: !!trackingJob,
  });

  const saveRuleMutation = useMutation({
    mutationFn: async () => {
      if (!editingJob) return;
      const payload = {
        is_open: isOpen,
        min_cgpa: minCgpa.trim() ? parseFloat(minCgpa) : null,
        allowed_batches: batchesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        allowed_branches: branchesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        max_backlogs: maxBacklogs.trim() ? parseInt(maxBacklogs, 10) : null,
        specific_student_ids: selectedStudentIds,
        note,
        notify_eligible: notifyEligible,
      };
      const res = await api.put(`/college/jobs/${editingJob.id}/eligibility`, payload);
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['collegeJobsWithRules'] });
      alert(
        `Eligibility rules saved! ${res.eligible_students_count} student(s) currently qualify` +
          (res.notified_count ? ` and ${res.notified_count} notified.` : '.')
      );
      setEditingJob(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to update job eligibility rules');
    },
  });

  const openRuleModal = (job: CollegeJob) => {
    setEditingJob(job);
    const isPendingCampus = job.visibility === 'requested_college' && !job.criteria_configured;
    setIsOpen(isPendingCampus ? true : job.rule.is_open);
    setMinCgpa(job.rule.min_cgpa !== null && job.rule.min_cgpa !== undefined ? String(job.rule.min_cgpa) : '');
    setBatchesText((job.rule.allowed_batches || []).join(', '));
    setBranchesText((job.rule.allowed_branches || []).join(', '));
    setMaxBacklogs(job.rule.max_backlogs !== null && job.rule.max_backlogs !== undefined ? String(job.rule.max_backlogs) : '');
    setSelectedStudentIds(job.rule.specific_student_ids || []);
    setNote(job.rule.note || '');
    setNotifyEligible(isPendingCampus);
    setStudentPickerSearch('');
  };

  const toggleChip = (currentText: string, value: string, setter: (v: string) => void) => {
    const list = currentText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = list.some((item) => item.toLowerCase() === value.toLowerCase());
    const next = exists ? list.filter((item) => item.toLowerCase() !== value.toLowerCase()) : [...list, value];
    setter(next.join(', '));
  };

  const toggleSpecificStudent = (sid: string) => {
    setSelectedStudentIds((prev) => (prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]));
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    saveRuleMutation.mutate();
  };

  const allJobs = data?.jobs || [];
  const pendingCount = allJobs.filter(
    (j) => j.visibility === 'requested_college' && !j.criteria_configured && j.college_decision !== 'declined'
  ).length;

  const jobs = allJobs.filter((j) => {
    const q = search.toLowerCase();
    const matchesSearch =
      j.title.toLowerCase().includes(q) ||
      j.company_name.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (driveFilter === 'pending') {
      return j.visibility === 'requested_college' && !j.criteria_configured && j.college_decision !== 'declined';
    }
    if (driveFilter === 'campus') return j.visibility === 'requested_college';
    if (driveFilter === 'public') return j.visibility !== 'requested_college';
    return true;
  });
  const availableBatches = data?.batches || [];
  const availableBranches = data?.branches || [];

  const filteredPickerStudents = students.filter((s) => {
    const q = studentPickerSearch.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.roll_number || '').toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 bg-red-50 text-red-600 rounded-lg">Failed to load job drives.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Briefcase className="text-brand-500" size={26} />
            Job Eligibility Controls & Drive Tracker
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Open job drives for specific students (e.g., 9.0+ CGPA, particular batch/branch, zero backlogs, or hand-picked students) and track student outcomes per job.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job or company..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: `All Drives (${allJobs.length})` },
          { id: 'pending', label: `Pending Criteria (${pendingCount})` },
          { id: 'campus', label: 'Invited Campus Drives' },
          { id: 'public', label: 'Public Jobs (Open to All)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDriveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              driveFilter === tab.id
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          No active job drives match this filter right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {jobs.map((job) => {
            const r = job.rule;
            const isPendingCampus =
              job.visibility === 'requested_college' && !job.criteria_configured && job.college_decision !== 'declined';
            const hasFilters =
              !!r.min_cgpa ||
              r.allowed_batches.length > 0 ||
              r.allowed_branches.length > 0 ||
              r.max_backlogs !== null ||
              r.specific_student_ids.length > 0;

            return (
              <div key={job.id} className={`card p-5 flex flex-col justify-between gap-4 ${isPendingCampus ? 'border-amber-300 bg-amber-50/15' : ''}`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{job.title}</h3>
                      <p className="text-xs font-medium text-brand-600 mt-0.5">
                        {job.company_name} · {job.location || 'Remote'} · {job.stipend || job.employment_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPendingCampus ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Awaiting Criteria
                        </span>
                      ) : (
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            job.is_live_for_students ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {job.is_live_for_students ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {job.is_live_for_students ? 'Live' : 'Closed'}
                        </span>
                      )}
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                        {job.visibility === 'requested_college' ? <Building2 size={11} /> : <Globe size={11} />}
                        {job.visibility === 'requested_college' ? 'Invited' : 'Public'}
                      </span>
                    </div>
                  </div>

                  {/* Active Eligibility Rule Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {isPendingCampus ? (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                        Hidden from students until you set criteria &amp; publish
                      </span>
                    ) : !hasFilters ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                        Open to all approved students ({job.eligible_students_count}/{job.total_college_students})
                      </span>
                    ) : (
                      <>
                        {r.min_cgpa !== null && r.min_cgpa > 0 && (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                            CGPA ≥ {r.min_cgpa}
                          </span>
                        )}
                        {r.allowed_batches.length > 0 && (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                            Batch: {r.allowed_batches.join(', ')}
                          </span>
                        )}
                        {r.allowed_branches.length > 0 && (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                            Branch: {r.allowed_branches.join(', ')}
                          </span>
                        )}
                        {r.max_backlogs !== null && (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                            Max Backlogs: {r.max_backlogs}
                          </span>
                        )}
                        {r.specific_student_ids.length > 0 && (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {r.specific_student_ids.length} Hand-Picked Student(s)
                          </span>
                        )}
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                          {job.eligible_students_count} Eligible
                        </span>
                      </>
                    )}
                  </div>

                  {/* Per-Job College Student Performance Strip */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Applied</p>
                      <p className="text-base font-extrabold text-slate-800">{job.college_stats.applied}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-purple-50/70 text-center">
                      <p className="text-[10px] uppercase font-semibold text-purple-600">Shortlisted</p>
                      <p className="text-base font-extrabold text-purple-700">{job.college_stats.shortlisted}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 text-center">
                      <p className="text-[10px] uppercase font-semibold text-emerald-600">Offers/Hired</p>
                      <p className="text-base font-extrabold text-emerald-700">
                        {job.college_stats.offers + job.college_stats.hired}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-50/70 text-center">
                      <p className="text-[10px] uppercase font-semibold text-red-500">Rejected</p>
                      <p className="text-base font-extrabold text-red-600">{job.college_stats.rejected}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setTrackingJob(job)}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Eye size={14} /> Track Applicants ({job.college_stats.applied})
                  </button>
                  <button
                    onClick={() => openRuleModal(job)}
                    className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
                  >
                    <SlidersHorizontal size={14} /> Set Eligibility Rules
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Eligibility Rule Editor Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Configure Job Eligibility</h3>
                <p className="text-xs text-slate-500">
                  {editingJob.title} — {editingJob.company_name}
                </p>
              </div>
              <button onClick={() => setEditingJob(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Open / Close Switch */}
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-slate-800">Open Applications for Campus Students</p>
                  <p className="text-xs text-slate-500">Turn off to temporarily hide/close this drive for your college</p>
                </div>
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(e) => setIsOpen(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
              </label>

              {/* CGPA + Backlogs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Minimum CGPA (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value)}
                    placeholder="e.g. 9.0"
                    className="input-field text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['', '7.0', '7.5', '8.0', '8.5', '9.0'].map((val) => (
                      <button
                        key={val || 'any'}
                        type="button"
                        onClick={() => setMinCgpa(val)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border ${
                          minCgpa === val
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {val ? `${val}+` : 'Any'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Max Active Backlogs (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={maxBacklogs}
                    onChange={(e) => setMaxBacklogs(e.target.value)}
                    placeholder="e.g. 0 for no backlogs"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              {/* Batches */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Allowed Batches (comma-separated, leave blank for all)
                </label>
                <input
                  type="text"
                  value={batchesText}
                  onChange={(e) => setBatchesText(e.target.value)}
                  placeholder="e.g. 2026, 2027"
                  className="input-field text-sm"
                />
                {availableBatches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {availableBatches.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleChip(batchesText, b, setBatchesText)}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        + {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Branches */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Allowed Branches / Departments (comma-separated, blank for all)
                </label>
                <input
                  type="text"
                  value={branchesText}
                  onChange={(e) => setBranchesText(e.target.value)}
                  placeholder="e.g. CSE, IT, ECE"
                  className="input-field text-sm"
                />
                {availableBranches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {availableBranches.map((br) => (
                      <button
                        key={br}
                        type="button"
                        onClick={() => toggleChip(branchesText, br, setBranchesText)}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100"
                      >
                        + {br}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hand-picked specific students */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-slate-600 flex items-center gap-1.5">
                    <Users size={14} /> Or Restrict to Specific Hand-Picked Students ({selectedStudentIds.length} selected)
                  </label>
                  {selectedStudentIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={studentPickerSearch}
                  onChange={(e) => setStudentPickerSearch(e.target.value)}
                  placeholder="Search students by name, email, or roll no..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <div className="max-h-32 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {filteredPickerStudents.slice(0, 30).map((s) => {
                    const checked = selectedStudentIds.includes(s._id);
                    return (
                      <label
                        key={s._id}
                        className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSpecificStudent(s._id)}
                            className="rounded border-slate-300 text-brand-600"
                          />
                          <span className="font-medium text-slate-800 truncate">{s.name}</span>
                          <span className="text-slate-400 truncate">({s.branch || '-'} · CGPA {s.cgpa ?? '-'})</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notify eligible toggle */}
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEligible}
                  onChange={(e) => setNotifyEligible(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600"
                />
                <Bell size={14} className="text-brand-600" />
                Send an instant notification to all students who qualify under these rules
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveRuleMutation.isPending}
                  className="btn-primary text-xs px-5 py-2"
                >
                  {saveRuleMutation.isPending ? 'Saving...' : 'Save Eligibility Rules'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Track Applicants Modal */}
      {trackingJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">College Applicants Tracker</h3>
                <p className="text-xs text-slate-500">
                  {trackingJob.title} at {trackingJob.company_name}
                </p>
              </div>
              <button onClick={() => setTrackingJob(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {loadingApplicants ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="animate-spin text-brand-500" size={26} />
                </div>
              ) : applicants.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  None of your students have applied to this job yet.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Student</th>
                      <th className="px-4 py-2.5">Academic</th>
                      <th className="px-4 py-2.5">Stage</th>
                      <th className="px-4 py-2.5">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map((a: any) => (
                      <tr key={a.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{a.student_name}</p>
                          <p className="text-xs text-slate-400">{a.student_email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          CGPA {a.cgpa ?? '-'} · {a.branch || '-'} · {a.batch || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
