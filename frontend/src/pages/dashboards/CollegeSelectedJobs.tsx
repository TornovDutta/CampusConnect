import { useQuery } from '@tanstack/react-query';
import { Loader2, Award, Building, Briefcase, Calendar, User, Download } from 'lucide-react';
import { api } from '../../services/api';
import { downloadRowsAsCsv } from '../../utils/csvExport';

export default function CollegeSelectedJobs() {
  const { data: selectedJobs = [], isLoading: isLoadingSelectedJobs } = useQuery({
    queryKey: ['collegeSelectedJobs'],
    queryFn: async () => {
      const response = await api.get('/college/selected-jobs');
      return response.data;
    },
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
          <p className="text-slate-500 text-sm mt-1">
            Full details of campus students shortlisted, offered, or hired across recruitment drives
          </p>
        </div>

        {selectedJobs.length > 0 && (
          <button
            onClick={() => downloadRowsAsCsv('college-selected-placements', selectedJobs)}
            className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
          >
            <Download size={14} /> Export Placements CSV
          </button>
        )}
      </div>

      {selectedJobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Award className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-700">No placements confirmed yet</h3>
          <p className="text-slate-500 text-sm mt-1">
            Shortlisted, offered, and hired students will automatically show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {selectedJobs.map((item: any) => (
            <div key={item._id} className="card p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {item.job_title || item.title || 'Placement Offer'}
                    </h3>
                    <p className="text-xs font-semibold text-brand-600 flex items-center gap-1 mt-1">
                      <Building size={14} /> {item.company_name || 'Company'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold shrink-0">
                    {item.status || 'Selected'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">{item.student_name || 'Student'}</span>
                  </div>
                  {item.student_email && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-slate-400" />
                      <span className="truncate">{item.student_email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span>
                      Updated {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
