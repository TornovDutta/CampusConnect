import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Briefcase, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

export default function PostJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState({
    title: '',
    location: '',
    description: '',
    job_type: 'Paid',
    employment_type: 'Full-time',
    stipend: '',
    working_hours: '',
    prerequisites: ''
  });

  const postJobMutation = useMutation({
    mutationFn: async () => {
      await api.post('/company/jobs', form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyDashboardStats'] });
      navigate('/dashboard/company');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postJobMutation.mutate();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
            <Briefcase className="text-brand-500" /> Post a New Job
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Fill out the details below to publish a new job opportunity.</p>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Prerequisites (Optional)</label>
              <input type="text" name="prerequisites" value={form.prerequisites} onChange={handleChange} className="input-field" placeholder="e.g. React.js, Python, 3rd Year Student" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required className="input-field min-h-[150px]" placeholder="Detailed job requirements, responsibilities, and perks..."></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/dashboard/company')} className="btn-secondary px-8">Cancel</button>
            <button type="submit" disabled={postJobMutation.isPending} className="btn-primary px-8 flex items-center gap-2">
              {postJobMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Publish Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
