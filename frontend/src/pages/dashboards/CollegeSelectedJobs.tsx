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
      </div>

      {selectedJobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Award className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700">No placements confirmed yet</h3>
          <p className="text-slate-500 text-sm mt-1">
            Confirmed jobs and placed students will automatically show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedJobs.map((job: any) => (
            <div key={job._id} className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                    <p className="text-sm font-medium text-brand-600 flex items-center gap-1 mt-1">
                      <Building size={16} /> {job.company_name}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                    {job.placed_students_count || 1} Placed
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" />
                    <span>Role: {job.role_type || 'Full Time'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span>Confirmed on {new Date(job.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Package Offered</span>
                <span className="text-sm font-bold text-slate-800">{job.salary || 'Negotiable'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
