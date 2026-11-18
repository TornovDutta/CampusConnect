import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, Calendar, Loader2, GraduationCap, Briefcase, Award, Send } from 'lucide-react';
import { api } from '../../services/api';

export default function CollegeStudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: student, isLoading } = useQuery({
    queryKey: ['collegeStudent', id],
    queryFn: async () => {
      const response = await api.get(`/college/students/${id}`);
      return response.data;
    },
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

  const applications = student.applications || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Students
        </button>
        <button
          onClick={() => navigate(`/dashboard/college/notifications?studentId=${student._id}`)}
          className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
        >
          <Send size={14} /> Send Notification
        </button>
      </div>

      <div className="card p-7">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-2xl">
              {student.name ? student.name[0].toUpperCase() : student.email[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{student.name || 'Unnamed Student'}</h1>
              <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                <Mail size={14} /> {student.email}
              </p>
              {student.roll_number && (
                <p className="text-xs font-mono text-slate-400 mt-0.5">Roll No: {student.roll_number}</p>
              )}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              student.is_suspended
                ? 'bg-red-50 text-red-700'
                : student.is_college_approved
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {student.is_suspended ? 'Suspended' : student.is_college_approved ? 'Approved' : 'Pending Approval'}
          </span>
        </div>

        {/* Academic Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100">
            <p className="text-xs font-semibold text-purple-600">CGPA</p>
            <p className="text-2xl font-extrabold text-purple-800 mt-1">{student.cgpa ?? '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-100">
            <p className="text-xs font-semibold text-teal-600">Branch</p>
            <p className="text-xl font-bold text-teal-800 mt-1">{student.branch || '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600">Batch</p>
            <p className="text-xl font-bold text-blue-800 mt-1">{student.batch || '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">Active Backlogs</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{student.backlogs ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <User size={15} className="text-slate-400" />
              <span>Role: <strong className="text-slate-800 capitalize">{student.role}</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar size={15} className="text-slate-400" />
              <span>Joined: {new Date(student.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <GraduationCap size={20} className="text-brand-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Placement Eligibility</p>
              <p className="text-sm font-semibold text-slate-800">
                {student.is_suspended ? 'Restricted from campus drives' : 'Eligible based on drive CGPA/batch criteria'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Performance History */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Briefcase size={18} className="text-brand-500" />
            Job Application History ({applications.length})
          </h3>
        </div>
        {applications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            This student has not applied to any job drives yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Job Role</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {applications.map((app: any) => (
                  <tr key={app.id}>
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{app.job_title}</td>
                    <td className="px-6 py-3.5 text-slate-600">{app.company_name}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">
                        <Award size={11} /> {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
