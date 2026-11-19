import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Building,
  Award,
  Sparkles,
  FileText,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../../services/api';

const Github = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Linkedin = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const POPULAR_SKILL_FILTERS = [
  'All', 'React', 'Python', 'Node.js', 'TypeScript', 'SQL',
  'MongoDB', 'Data Structures', 'Docker', 'AWS', 'Java', 'C++'
];

export default function CompanyTalentPool() {
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [minCgpa, setMinCgpa] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Invite modal state
  const [invitingStudent, setInvitingStudent] = useState<any | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [inviteMessage, setInviteMessage] = useState<string>('');

  // Fetch active company jobs for invite modal
  const { data: jobs = [] } = useQuery({
    queryKey: ['companyJobsList'],
    queryFn: async () => {
      const res = await api.get('/company/jobs');
      return res.data;
    }
  });

  // Fetch talent pool
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['companyTalentPool', selectedSkill, minCgpa, branchFilter, searchQuery],
    queryFn: async () => {
      const res = await api.get('/company/talent-pool', {
        params: {
          skill: selectedSkill === 'All' ? undefined : selectedSkill,
          min_cgpa: minCgpa ? parseFloat(minCgpa) : undefined,
          branch: branchFilter ? branchFilter : undefined,
          search: searchQuery ? searchQuery : undefined
        }
      });
      return res.data;
    }
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ studentId, jobId, message }: { studentId: string; jobId: string; message: string }) => {
      await api.post(`/company/talent-pool/${studentId}/invite`, {
        job_id: jobId,
        message
      });
    },
    onSuccess: () => {
      alert(`Direct invitation successfully dispatched to ${invitingStudent?.name}!`);
      setInvitingStudent(null);
      setInviteMessage('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to dispatch invitation.');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-brand-600" size={28} />
            Campus Talent Pool & Candidate Search
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover verified campus candidates across all partner institutions by technical skills, CGPA, and branch.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by student name or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <select
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="">Any CGPA</option>
              <option value="7.0">CGPA ≥ 7.0</option>
              <option value="7.5">CGPA ≥ 7.5</option>
              <option value="8.0">CGPA ≥ 8.0</option>
              <option value="8.5">CGPA ≥ 8.5</option>
              <option value="9.0">CGPA ≥ 9.0</option>
            </select>

            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="">All Branches</option>
              <option value="Computer Science">Computer Science / IT</option>
              <option value="Electronics">Electronics / ECE</option>
              <option value="Electrical">Electrical</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>
        </div>

        {/* Skill Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Filter by Skill:
          </span>
          {POPULAR_SKILL_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSkill(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                selectedSkill === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      ) : candidates.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <Users className="mx-auto text-slate-300" size={44} />
          <h3 className="text-lg font-bold text-slate-800">No candidates match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try relaxing the minimum CGPA filter or clearing the skill search to discover more verified campus students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((cand: any) => (
            <div
              key={cand.id}
              className="card p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{cand.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building size={13} className="text-slate-400" />
                      {cand.college_name}
                    </p>
                  </div>
                  {cand.cgpa && (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg">
                      CGPA {cand.cgpa}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>Batch: <strong>{cand.batch || '2026'}</strong></span>
                  <span>•</span>
                  <span>Branch: <strong>{cand.branch || 'CSE'}</strong></span>
                </div>

                {cand.bio && (
                  <p className="text-xs text-slate-600 line-clamp-2 italic">
                    "{cand.bio}"
                  </p>
                )}

                {/* Skills Chips */}
                {Array.isArray(cand.skills) && cand.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cand.skills.slice(0, 5).map((sk: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded"
                      >
                        {sk}
                      </span>
                    ))}
                    {cand.skills.length > 5 && (
                      <span className="text-[10px] text-slate-400 font-semibold self-center">
                        +{cand.skills.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cand.github_url && (
                    <a href={cand.github_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900">
                      <Github size={16} />
                    </a>
                  )}
                  {cand.linkedin_url && (
                    <a href={cand.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                      <Linkedin size={16} />
                    </a>
                  )}
                  {cand.resume_url && (
                    <a href={cand.resume_url} target="_blank" rel="noreferrer" download className="text-slate-400 hover:text-emerald-600" title="Download Resume">
                      <FileText size={16} />
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInvitingStudent(cand);
                    setSelectedJobId(jobs[0]?.id || jobs[0]?._id || '');
                    setInviteMessage(`Hello ${cand.name}, we reviewed your academic profile and would love to invite you to apply for our position!`);
                  }}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Send size={13} />
                  Direct Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIRECT INVITATION MODAL */}
      {invitingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Invite {invitingStudent.name} to Apply
                </h3>
                <p className="text-xs text-slate-500">
                  {invitingStudent.college_name} • CGPA {invitingStudent.cgpa} ({invitingStudent.branch})
                </p>
              </div>
              <button onClick={() => setInvitingStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Open Job Opportunity</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {jobs.map((j: any) => (
                    <option key={j.id || j._id} value={j.id || j._id}>
                      {j.title} ({j.employment_type || 'Full-Time'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Recruiter Invitation Note</label>
                <textarea
                  rows={3}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInvitingStudent(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={inviteMutation.isPending || !selectedJobId}
                onClick={() => inviteMutation.mutate({
                  studentId: invitingStudent.id,
                  jobId: selectedJobId,
                  message: inviteMessage
                })}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
              >
                {inviteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Dispatch Direct Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
