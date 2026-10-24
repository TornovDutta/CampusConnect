import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, GraduationCap, Mail, Calendar, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function OrganizationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['organizationDetails', id],
    queryFn: async () => {
      const response = await api.get(`/admin/organization/${id}`);
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

  if (isError || !data?.organization) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load organization details.
      </div>
    );
  }

  const { organization, students } = data;
  const isCollege = organization.role === 'college';

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/dashboard/admin')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Organizations
      </button>

      {/* Organization Info Header */}
      <div className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            {isCollege ? <GraduationCap size={32} /> : <Building2 size={32} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">{organization.name || organization.email}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                organization.role === 'college' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
              }`}>
                {organization.role.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <Mail size={14} /> {organization.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="text-right flex-1 md:flex-none">
            <span className="text-xs text-slate-400 block">Status</span>
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
              organization.is_suspended ? 'text-red-600' : 'text-green-600'
            }`}>
              {organization.is_suspended ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
              {organization.is_suspended ? 'Suspended' : 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* If College, show their students */}
      {isCollege && (
        <div className="card">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Registered Students ({students?.length || 0})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students?.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      No students registered for this college yet.
                    </td>
                  </tr>
                ) : (
                  students?.map((s: any) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{s.name || 'Unnamed'}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          s.is_suspended ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {s.is_suspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(s.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
