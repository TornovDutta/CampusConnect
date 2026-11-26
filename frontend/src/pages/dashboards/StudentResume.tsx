import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Upload,
  CheckCircle2,
  Download,
  Trash2,
  Plus,
  Globe,
  Phone,
  Mail,
  User,
  Sparkles,
  Printer,
  Loader2,
  AlertCircle,
  Building,
  GraduationCap
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

const POPULAR_SKILLS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
  'FastAPI', 'MongoDB', 'PostgreSQL', 'SQL', 'Docker', 'Git',
  'Data Structures & Algorithms', 'C++', 'Java', 'TailwindCSS', 'AWS'
];

export default function StudentResume() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upload' | 'builder'>('upload');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Profile Query
  const { data: profile, isLoading } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      const res = await api.get('/student/profile');
      return res.data;
    }
  });

  // Profile Update Form State
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync state once profile loads
  if (profile && !isInitialized) {
    setBio(profile.bio || '');
    setPhone(profile.phone || '');
    setGithubUrl(profile.github_url || '');
    setLinkedinUrl(profile.linkedin_url || '');
    setPortfolioUrl(profile.portfolio_url || '');
    setSkillsList(profile.skills || []);
    setIsInitialized(true);
  }

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      await api.put('/student/profile', updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
      alert('Profile details and skills updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to update profile.');
    }
  });

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        await api.post('/student/resume/upload', {
          filename: file.name,
          content_base64: base64Data,
          file_type: file.type || 'application/pdf',
          skills: skillsList
        });
        queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
        queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
        alert('Resume uploaded successfully!');
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to upload resume.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      const updated = [...skillsList, trimmed];
      setSkillsList(updated);
      setNewSkillInput('');
      updateProfileMutation.mutate({ skills: updated });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skillsList.filter((s) => s !== skillToRemove);
    setSkillsList(updated);
    updateProfileMutation.mutate({ skills: updated });
  };

  const handleSaveContactAndBio = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      phone,
      bio,
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl,
      skills: skillsList
    });
  };

  const handlePrintResume = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-brand-600" size={28} />
            Resume Management & ATS Builder
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your master resume PDF, manage technical skills, and generate an ATS-formatted CV.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-brand-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload & Skills
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'builder'
                ? 'bg-white text-brand-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} className="text-amber-500" />
            ATS Resume Preview
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Resume Upload & File Status */}
          <div className="space-y-6">
            {/* Active Resume Card */}
            <div className="card p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-brand-600" />
                Active Master Resume
              </h3>

              {profile?.resume_filename ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
                        PDF
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm truncate max-w-[180px]">
                          {profile.resume_filename}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Updated: {profile.resume_updated_at ? new Date(profile.resume_updated_at).toLocaleDateString() : 'Active'}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    {profile.resume_url && (
                      <a
                        href={profile.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        download={profile.resume_filename}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <Download size={14} />
                        Download File
                      </a>
                    )}
                    <span className="text-[11px] text-emerald-700 font-medium">Auto-attached to applications</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <span>No resume uploaded yet. Upload your PDF so recruiters can evaluate your applications.</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Upload New Version (.PDF or .DOCX)
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="animate-spin text-brand-600" size={28} />
                      <span className="text-xs font-semibold text-slate-600">Uploading resume...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto text-brand-600" size={28} />
                      <p className="text-xs font-bold text-slate-700">Click to upload or drag & drop</p>
                      <p className="text-[11px] text-slate-400">PDF, DOC, DOCX up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Placement Context */}
            <div className="card p-6 space-y-3 bg-slate-50 border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">College Credentials</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Institution:</span>
                  <span className="font-semibold text-slate-800">{profile?.college_name || 'Associated College'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CGPA:</span>
                  <span className="font-semibold text-slate-800">{profile?.cgpa || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="font-semibold text-slate-800">{profile?.roll_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch & Batch:</span>
                  <span className="font-semibold text-slate-800">{profile?.branch} ({profile?.batch})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Skills & Contact Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skills Tag Manager */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Technical & Professional Skills</h3>
                  <p className="text-xs text-slate-500">Add relevant technologies to match campus drive eligibility filters.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full">
                  {skillsList.length} Skills
                </span>
              </div>

              {/* Add Skill Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Next.js, Kubernetes, Flutter, Django..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(newSkillInput);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(newSkillInput)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1"
                >
                  <Plus size={15} />
                  Add
                </button>
              </div>

              {/* Current Skills Chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
                {skillsList.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No skills added yet. Select from the suggestions below!</p>
                )}
              </div>

              {/* Suggested Skills */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 block mb-2">Recommended Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.filter((s) => !skillsList.includes(s)).slice(0, 10).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 text-slate-600 text-xs rounded-md font-medium transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Social & Contact Information */}
            <div className="card p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Contact & Portfolio Links</h3>
              <form onSubmit={handleSaveContactAndBio} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Github size={14} className="text-slate-400" />
                      GitHub Profile
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/username"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Linkedin size={14} className="text-slate-400" />
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Globe size={14} className="text-slate-400" />
                      Portfolio / Website
                    </label>
                    <input
                      type="url"
                      placeholder="https://yourportfolio.dev"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Professional Summary / Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Passionate computer science student specializing in distributed systems, full-stack web applications, and algorithmic problem solving..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                    Save Profile Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: ATS RESUME BUILDER & PRINT PREVIEW */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">ATS-Optimized Campus Resume</h3>
              <p className="text-xs text-slate-500">Live preview generated automatically from your verified academic records and skills.</p>
            </div>

            <button
              onClick={handlePrintResume}
              className="w-full sm:w-auto justify-center px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 shrink-0"
            >
              <Printer size={15} />
              Print / Save as PDF
            </button>
          </div>

          {/* Printable Resume Sheet */}
          <div className="max-w-3xl mx-auto bg-white border border-slate-300 shadow-lg p-5 sm:p-10 font-sans text-slate-900 space-y-6 rounded-xl">
            {/* Header */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase break-words">
                {profile?.name || 'STUDENT NAME'}
              </h1>
              <div className="flex items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 flex-wrap">
                {profile?.email && <span className="break-all">{profile.email}</span>}
                {phone && <span>• {phone}</span>}
                {profile?.branch && <span>• {profile.branch}</span>}
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-brand-700 font-semibold pt-1 flex-wrap">
                {githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>}
                {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>}
                {portfolioUrl && <a href={portfolioUrl} target="_blank" rel="noreferrer">Portfolio</a>}
              </div>
            </div>

            {/* Professional Summary */}
            {bio && (
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed">{bio}</p>
              </div>
            )}

            {/* Education */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Education
              </h2>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{profile?.college_name || 'Engineering Institution'}</p>
                  <p className="text-slate-600">Bachelor of Technology in {profile?.branch || 'Computer Science'}</p>
                  <p className="text-slate-500 text-[11px]">Roll No: {profile?.roll_number || 'N/A'}</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-bold text-slate-900">Graduating Batch: {profile?.batch || '2026'}</p>
                  <p className="font-semibold text-brand-700">CGPA: {profile?.cgpa || 'N/A'} / 10.0</p>
                </div>
              </div>
            </div>

            {/* Technical Skills */}
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                Technical Skills & Tools
              </h2>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skillsList.map((sk) => (
                  <span
                    key={sk}
                    className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-semibold rounded border border-slate-200"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Institutional Endorsement */}
            <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
              <span>Verified Campus Placement Profile via CampusConnect</span>
              <span>Approval Status: {profile?.is_college_approved ? 'Verified Active' : 'Pending'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
