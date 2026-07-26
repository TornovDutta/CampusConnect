import React from 'react';
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
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users size={20} className="text-brand-500" /> All Approved Students
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-3 font-medium">Student Name</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Joined Date</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!students || students.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No approved students yet.
                </td>
              </tr>
            ) : (
              Array.isArray(students) && students.map((student: any) => (
                <tr 
                  key={student._id} 
                  onClick={() => navigate(`/dashboard/college/students/${student._id}`)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">{student.name}</td>
                  <td className="px-6 py-4 text-slate-600">{student.email}</td>
                  <td className="px-6 py-4">
                    {student.is_suspended ? (
                      <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{new Date(student.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSuspensionMutation.mutate(student._id);
                      }}
                      disabled={toggleSuspensionMutation.isPending}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        student.is_suspended
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {student.is_suspended ? <CheckCircle size={14} /> : <Ban size={14} />}
                      {student.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
