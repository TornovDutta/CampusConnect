import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Award, Building, Briefcase, Calendar } from 'lucide-react';
import { api } from '../../services/api';

export default function CollegeSelectedJobs() {
  const { data: selectedJobs = [], isLoading: isLoadingSelectedJobs } = useQuery({
    queryKey: ['collegeSelectedJobs'],
    queryFn: async () => {
      const response = await api.get('/college/selected-jobs');
      return response.data;
    }
  });

  if (isLoadingSelectedJobs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award size={28} className="text-green-500" /> Selected Jobs & Placements
          </h2>
          <p className="text-slate-500 mt-1">Full details of students placed in recent drives</p>
        </div>
        <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-bold rounded-full shadow-sm border border-green-200">
          Total Placements: {selectedJobs.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {selectedJobs.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-slate-500">
            <Award size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Placements Yet</h3>
            <p>Once students are selected or hired, their details will appear here.</p>
          </div>
        ) : (
          selectedJobs.map((job: any) => (
            <div key={job._id} className="card hover:shadow-lg transition-all duration-200 flex flex-col group border-t-4 border-t-green-500">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {job.status}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(job.applied_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1 line-clamp-1" title={job.student_name}>
                  {job.student_name}
                </h3>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Briefcase size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-700 line-clamp-1">{job.job_title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <Building size={16} className="text-slate-400" />
                    <span className="line-clamp-1">{job.company_name}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 mt-auto rounded-b-2xl">
                <p className="text-xs text-slate-500 flex justify-between items-center">
                  <span>Application ID</span>
                  <span className="font-mono text-slate-400 truncate w-24 text-right" title={job._id}>{job._id.slice(-6)}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
