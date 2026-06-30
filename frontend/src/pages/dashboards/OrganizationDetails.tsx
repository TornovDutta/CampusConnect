import React from 'react';
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

  if (isError || !data) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
        Failed to load organization details.
      </div>
    );
  }

  const { organization, students } = data;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/dashboard/admin')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Organization Header Card */}
      <div className="card p-8 bg-white/80 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center text-brand-600 shadow-sm border border-brand-100/50">
            {organization.role === 'college' ? <GraduationCap size={40} /> : <Building2 size={40} />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {organization.name || organization.email}
              </h1>
              {organization.is_suspended ? (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                  <ShieldAlert size={14} /> Suspended
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                  <ShieldCheck size={14} /> Active
                </span>
              )}
            </div>
            <p className="text-slate-500 font-medium capitalize flex items-center gap-2">
              {organization.role} Account
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100 relative z-10">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email Address</p>
              <p className="font-medium text-slate-800">{organization.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-slate-600">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Registration Date</p>
              <p className="font-medium text-slate-800">{new Date(organization.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Students Section (Only for Colleges) */}
      {organization.role === 'college' && (
        <div className="card">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Associated Students</h2>
            <p className="text-sm text-slate-500 mt-1">Students registered under this institution.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium border-b border-slate-100">Student Name</th>
                  <th className="px-6 py-4 font-medium border-b border-slate-100">Email</th>
                  <th className="px-6 py-4 font-medium border-b border-slate-100">Joined</th>
                  <th className="px-6 py-4 font-medium border-b border-slate-100">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {students?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <GraduationCap size={32} className="mb-2 opacity-50" />
                        <p>No students found for this college.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students?.map((student: any) => (
                    <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{student.name || 'Unnamed Student'}</td>
                      <td className="px-6 py-4 text-slate-600">{student.email}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{new Date(student.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                          Student
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
