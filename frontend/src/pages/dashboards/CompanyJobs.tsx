import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Briefcase, Plus, Building, Clock, MapPin, Users } from 'lucide-react';
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
          <p className="text-slate-500 mt-1">View and edit your broadcasted recruitment drives</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/company/post-job')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Post New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700">No jobs posted yet</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            Create your first campus recruitment opening to receive applications from students.
          </p>
          <button
            onClick={() => navigate('/dashboard/company/post-job')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} /> Post Job Opening
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: any) => (
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
                    Active
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{job.location || 'Remote / Hybrid'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <span>{job.job_type || 'Full Time'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <span>{job.applicants_count || 0} Applicants</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{job.salary || 'Competitive'}</span>
                <button
                  onClick={() => navigate(`/dashboard/company/edit-job/${job._id}`)}
                  className="text-xs btn-secondary px-3 py-1.5"
                >
                  Edit Opening
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
