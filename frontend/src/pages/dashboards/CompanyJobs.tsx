import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Briefcase, Plus, Globe, Building, Clock, MapPin, Users } from 'lucide-react';
import { api } from '../../services/api';

export default function CompanyJobs() {
  const navigate = useNavigate();
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['companyAllJobs'],
    queryFn: async () => {
      const response = await api.get('/company/all-jobs');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase size={28} className="text-brand-500" /> Manage Postings
          </h2>
          <p className="text-slate-500 mt-1">View and manage all your active and past job postings</p>
        </div>
        <button onClick={() => navigate('/dashboard/company/post-job')} className="btn-primary flex items-center gap-2 shadow-md">
          <Plus size={18} /> Post New Job
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-slate-500">
            <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Jobs Posted Yet</h3>
            <p className="mb-6">Create your first job posting to start receiving applications.</p>
            <button onClick={() => navigate('/dashboard/company/post-job')} className="btn-primary mx-auto">
              Post your first job
            </button>
          </div>
        ) : (
          jobs.map((job: any) => (
            <div key={job._id} className="card hover:shadow-lg transition-all duration-200 flex flex-col group border-t-4 border-t-brand-500">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border flex items-center gap-1 ${
                    job.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${job.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                    {job.status.toUpperCase()}
                  </span>
                  
                  {job.visibility === 'requested_college' ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 inline-flex items-center gap-1">
                      <Building size={12} /> Campus Drive
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                      <Globe size={12} /> Public
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1" title={job.title}>
                  {job.title}
                </h3>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="line-clamp-1">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Clock size={16} className="text-slate-400" />
                    <span>{job.employment_type} • {job.job_type}</span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 mt-auto rounded-b-2xl flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Users size={18} className="text-brand-500" />
                  <span>{job.applications_count || 0} Applicants</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => navigate(`/dashboard/company/edit-job/${job._id}`)} className="text-slate-600 hover:text-brand-700 text-sm font-bold hover:underline transition-all">
                    Edit
                  </button>
                  <button onClick={() => navigate('/dashboard/company')} className="text-brand-600 hover:text-brand-700 text-sm font-bold hover:underline transition-all">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
