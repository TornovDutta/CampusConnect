import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Loader2, Ban, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function CollegeStudentsList() {
  const { data: students, isLoading } = useQuery({
    queryKey: ['collegeStudents'],
    queryFn: async () => {
      const response = await api.get('/college/students');
      return response.data;
    }
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const toggleSuspensionMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await api.patch(`/college/students/${studentId}/toggle-suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collegeStudents'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={28} className="text-brand-500" /> College Student Directory
          </h2>
          <p className="text-slate-500 mt-1">Manage verified and enrolled students eligible for drives</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students?.map((student: any) => (
                <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    <button
                      onClick={() => navigate(`/dashboard/college/students/${student._id}`)}
                      className="text-brand-600 hover:text-brand-700 font-semibold text-left"
                    >
                      {student.name || 'Unnamed Student'}
                    </button>
                  </td>
                  <td className="px-6 py-4">{student.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      student.is_suspended 
                        ? 'bg-red-50 text-red-700' 
                        : student.is_college_approved 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {student.is_suspended ? 'Suspended' : student.is_college_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(student.created_at || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => navigate(`/dashboard/college/students/${student._id}`)}
                      className="text-xs btn-secondary px-3 py-1.5"
                    >
                      View
                    </button>
                    <button
                      onClick={() => toggleSuspensionMutation.mutate(student._id)}
                      disabled={toggleSuspensionMutation.isPending}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                        student.is_suspended
                          ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                          : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      {student.is_suspended ? (
                        <span className="flex items-center gap-1"><CheckCircle size={14} /> Unsuspend</span>
                      ) : (
                        <span className="flex items-center gap-1"><Ban size={14} /> Suspend</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
