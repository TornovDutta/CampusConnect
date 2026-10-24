import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, Calendar, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function CollegeStudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: student, isLoading } = useQuery({
    queryKey: ['collegeStudent', id],
    queryFn: async () => {
      const response = await api.get(`/college/students/${id}`);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">Student not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Students
      </button>

      <div className="card p-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-2xl">
              {student.name ? student.name[0].toUpperCase() : student.email[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{student.name || 'Unnamed Student'}</h1>
              <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                <Mail size={14} /> {student.email}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            student.is_suspended 
              ? 'bg-red-50 text-red-700' 
              : student.is_college_approved 
                ? 'bg-green-50 text-green-700' 
                : 'bg-amber-50 text-amber-700'
          }`}>
            {student.is_suspended ? 'Suspended' : student.is_college_approved ? 'Approved' : 'Pending Approval'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User size={16} className="text-slate-400" />
                <span>Role: <strong className="text-slate-800 capitalize">{student.role}</strong></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Joined: {new Date(student.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Academic & Placement Status</h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Placement Eligibility</p>
              <p className="text-sm font-medium text-slate-800">
                {student.is_suspended ? 'Restricted from campus drives' : 'Eligible for all active on-campus recruitments'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
