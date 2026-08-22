import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Briefcase, ArrowLeft, Globe, Building, X, Plus, Sparkles, Tag, CheckSquare, Square, Link as LinkIcon } from 'lucide-react';
import { api } from '../../services/api';

import { useParams } from 'react-router-dom';
export default function EditJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [prereqInput, setPrereqInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState({
    title: '',
    location: '',
    description: '',
    job_type: 'Paid',
    employment_type: 'Full-time',
    stipend: '',
    working_hours: '',
    prerequisites: [] as string[],
    visibility: 'public',
    target_colleges: [] as string[],
    apply_type: 'easy_apply',
    external_link: ''
  });

  const { data: colleges = [], isLoading: isLoadingColleges } = useQuery({
    queryKey: ['collegesList'],
    queryFn: async () => {
      const res = await api.get('/auth/colleges');
      return res.data;
    }
  });

  const { data: suggestionList = [] } = useQuery<string[]>({
    queryKey: ['prerequisiteSuggestions'],
    queryFn: async () => {
      const res = await api.get('/company/prerequisites');
      return res.data;
    }
  });

  const filteredSuggestions = suggestionList.filter(
    (item: string) => 
      item.toLowerCase().includes(prereqInput.toLowerCase().trim()) && 
      !form.prerequisites.includes(item)
  );

  const addPrerequisite = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !form.prerequisites.includes(trimmed)) {
      setForm({ ...form, prerequisites: [...form.prerequisites, trimmed] });
    }
    setPrereqInput('');
    setShowSuggestions(false);
  };

  const removePrerequisite = (value: string) => {
    setForm({ ...form, prerequisites: form.prerequisites.filter(p => p !== value) });
  };

  
  const { id } = useParams();

  const { data: jobDetails, isLoading: isLoadingJob } = useQuery({
    queryKey: ['jobDetails', id],
    queryFn: async () => {
      const res = await api.get(`/company/jobs/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  React.useEffect(() => {
    if (jobDetails) {
      setForm({
        title: jobDetails.title || '',
        location: jobDetails.location || '',
        description: jobDetails.description || '',
        job_type: jobDetails.job_type || 'Paid',
        employment_type: jobDetails.employment_type || 'Full-time',
        stipend: jobDetails.stipend || '',
        working_hours: jobDetails.working_hours || '',
        prerequisites: jobDetails.prerequisites || [],
        visibility: jobDetails.visibility || 'public',
        target_colleges: jobDetails.target_colleges || [],
        apply_type: jobDetails.apply_type || 'easy_apply',
        external_link: jobDetails.external_link || ''
      });
    }
  }, [jobDetails]);

  const updateJobMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/company/jobs/${id}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['companyAllJobs'] });
      navigate('/dashboard/company');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to update job');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.visibility === 'requested_college' && form.target_colleges.length === 0) {
      alert('Please select at least one target college for Requested College visibility.');
      return;
    }
    if (form.apply_type === 'external_link' && !form.external_link.trim()) {
      alert('Please provide an external application link.');
      return;
    }
    updateJobMutation.mutate();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (isLoadingJob) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/dashboard/company')}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="text-brand-500" /> Edit Job
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Update the details below to modify the job posting.</p>
        </div>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required className="input-field" placeholder="e.g. Frontend Developer Intern" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location *</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} required className="input-field" placeholder="e.g. Remote, or New York, NY" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Compensation Type *</label>
              <select name="job_type" value={form.job_type} onChange={handleChange} required className="input-field">
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type *</label>
              <select name="employment_type" value={form.employment_type} onChange={handleChange} required className="input-field">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stipend / Salary (Optional)</label>
              <input type="text" name="stipend" value={form.stipend} onChange={handleChange} className="input-field" placeholder="e.g. $20/hr or $5000/month" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Working Hours (Optional)</label>
              <input type="text" name="working_hours" value={form.working_hours} onChange={handleChange} className="input-field" placeholder="e.g. 20 hrs/week, Flexible" />
            </div>

            <div className="md:col-span-2 relative">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Tag size={16} className="text-brand-500" /> Prerequisites & Eligibility (Optional)
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Type skills or qualifications and pick from suggestions, or press Enter to add new ones. Any new prerequisite you type will be saved to the database for future suggestions!
              </p>

              {/* Selected Tags Display */}
              {form.prerequisites.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {form.prerequisites.map((req) => (
                    <span key={req} className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-200 text-brand-700 rounded-lg text-xs font-bold shadow-2xs">
                      {req}
                      <button 
                        type="button" 
                        onClick={() => removePrerequisite(req)}
                        className="hover:bg-brand-100 text-brand-700 p-0.5 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input field with Autocomplete */}
              <div className="relative">
                <input
                  type="text"
                  value={prereqInput}
                  onChange={(e) => {
                    setPrereqInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && prereqInput.trim()) {
                      e.preventDefault();
                      addPrerequisite(prereqInput);
                    }
                  }}
                  className="input-field w-full pr-24 text-sm"
                  placeholder="Type skill (e.g. React.js, Final Year) and press Enter or select below..."
                />
                {prereqInput.trim() && (
                  <button
                    type="button"
                    onClick={() => addPrerequisite(prereqInput)}
                    className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-brand-600 text-white font-semibold rounded-lg text-xs flex items-center gap-1 hover:bg-brand-700 transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Add Tag
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (prereqInput.trim().length > 0 || filteredSuggestions.length > 0) && (
                <div className="absolute z-40 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredSuggestions.length > 0 ? (
                    <div className="p-1.5">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-500" /> Suggestions from Database
                      </div>
                      {filteredSuggestions.map((suggestion) => (
                        <div
                          key={suggestion}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addPrerequisite(suggestion);
                          }}
                          className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700 rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <span>{suggestion}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Click to select</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {prereqInput.trim() && !suggestionList.includes(prereqInput.trim()) && (
                    <div 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addPrerequisite(prereqInput);
                      }}
                      className="p-3 text-xs font-bold text-brand-600 bg-brand-50/50 hover:bg-brand-100 cursor-pointer flex items-center gap-2 transition-colors rounded-b-xl"
                    >
                      <Plus size={15} className="text-brand-600" />
                      <span>Add <span className="underline font-extrabold">"{prereqInput.trim()}"</span> as a new prerequisite (will be saved to database)</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Apply Method Section */}
            <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2 space-y-4">
              <label className="block text-base font-bold text-slate-800 mb-2">How should candidates apply? *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setForm({ ...form, apply_type: 'easy_apply', external_link: '' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${form.apply_type === 'easy_apply' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className={`p-2 rounded-lg ${form.apply_type === 'easy_apply' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Easy Apply</h4>
                    <p className="text-xs text-slate-500 mt-1">Candidates can apply directly through CampusConnect with their profile.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setForm({ ...form, apply_type: 'external_link' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${form.apply_type === 'external_link' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className={`p-2 rounded-lg ${form.apply_type === 'external_link' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <LinkIcon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">External Link</h4>
                    <p className="text-xs text-slate-500 mt-1">Redirect candidates to your own career site or external form.</p>
                  </div>
                </div>
              </div>

              {form.apply_type === 'external_link' && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-1">External Application Link *</label>
                  <input 
                    type="url" 
                    name="external_link"
                    value={form.external_link} 
                    onChange={handleChange} 
                    required={form.apply_type === 'external_link'}
                    className="input-field w-full" 
                    placeholder="https://careers.yourcompany.com/apply/..." 
                  />
                  <p className="text-xs text-slate-500 mt-2">When candidates click "Apply", they will be redirected to this URL.</p>
                </div>
              )}
            </div>

            {/* Job Visibility Section */}
            <div className="md:col-span-2 border-t border-b border-slate-100 py-6 my-2 space-y-4">
              <label className="block text-base font-bold text-slate-800 mb-2">Job Visibility & Target Audience *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setForm({ ...form, visibility: 'public', target_colleges: [] })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${form.visibility === 'public' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className={`p-2 rounded-lg ${form.visibility === 'public' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Globe size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Public Opportunity</h4>
                    <p className="text-xs text-slate-500 mt-1">Visible to all approved student users across all colleges in the portal. Any verified student can apply.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setForm({ ...form, visibility: 'requested_college' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${form.visibility === 'requested_college' ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className={`p-2 rounded-lg ${form.visibility === 'requested_college' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Building size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Requested College (Campus Drive)</h4>
                    <p className="text-xs text-slate-500 mt-1">Restrict application only to students belonging to specific requested colleges.</p>
                  </div>
                </div>
              </div>

              {form.visibility === 'requested_college' && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-3">Select Requested Colleges * (At least 1 required)</label>
                  {isLoadingColleges ? (
                    <div className="text-sm text-slate-500 flex items-center gap-2 py-2"><Loader2 className="animate-spin" size={16} /> Loading colleges...</div>
                  ) : colleges.length === 0 ? (
                    <p className="text-sm text-amber-600 font-medium">No active colleges registered in the portal yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-2">
                      {colleges.map((col: { id: string; name: string }) => {
                        const isSelected = form.target_colleges.includes(col.id);
                        return (
                          <div 
                            key={col.id}
                            onClick={() => {
                              if (isSelected) {
                                setForm({ ...form, target_colleges: form.target_colleges.filter(c => c !== col.id) });
                              } else {
                                setForm({ ...form, target_colleges: [...form.target_colleges, col.id] });
                              }
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-sm font-medium ${isSelected ? 'bg-white border-brand-500 text-brand-700 shadow-sm' : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'}`}
                          >
                            {isSelected ? <CheckSquare size={18} className="text-brand-600 shrink-0" /> : <Square size={18} className="text-slate-400 shrink-0" />}
                            <span className="truncate">{col.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {form.target_colleges.length === 0 && (
                    <p className="text-xs text-red-500 mt-2 font-medium">Please select at least one college to proceed.</p>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required className="input-field min-h-[150px]" placeholder="Detailed job requirements, responsibilities, and perks..."></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/dashboard/company')} className="btn-secondary px-8">Cancel</button>
            <button type="submit" disabled={updateJobMutation.isPending || (form.visibility === 'requested_college' && form.target_colleges.length === 0)} className="btn-primary px-8 flex items-center gap-2">
              {updateJobMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


