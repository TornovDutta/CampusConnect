import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, FileText, CheckSquare, Plus, Loader2, UserCheck, X } from 'lucide-react';
import { api } from '../../services/api';

export default function CollegeDashboard() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['collegeDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/college/dashboard-stats');
      return response.data;
    }
  });

  const { data: pendingStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['collegePendingStudents'],
    queryFn: async () => {
      const response = await api.get('/college/pending-students');
      return response.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await api.patch(`/college/approve-student/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collegeDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['collegePendingStudents'] });
    }
  });

  const addStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      await api.post('/college/add-student', studentData);
    },
    onSuccess: () => {
      setIsAddModalOpen(false);
      setNewStudent({ name: '', email: '', password: '' });
      queryClient.invalidateQueries({ queryKey: ['collegeDashboardStats'] });
      alert('Student added successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to add student');
    }
  });

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    addStudentMutation.mutate(newStudent);
  };

  if (isLoadingStats || isLoadingStudents) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  const stats = statsData?.stats || { registered_students: 0, drive_invitations: 0, students_placed: 0 };
  const recent_invitations = statsData?.recent_invitations || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Placement Cell Overview</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Add Students
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Registered Students</p>
            <p className="text-2xl font-bold text-slate-800">{stats.registered_students}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Drive Invitations</p>
            <p className="text-2xl font-bold text-slate-800">{stats.drive_invitations}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Students Placed</p>
            <p className="text-2xl font-bold text-slate-800">{stats.students_placed}</p>
          </div>
        </div>
      </div>

      {/* Pending Students Section */}
      <div className="card border-orange-100/50">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-orange-50/30">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck size={20} className="text-orange-500" /> Pending Student Approvals
          </h2>
          <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
            {pendingStudents.length} Requests
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Student Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Request Date</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No pending student requests.
                  </td>
                </tr>
              ) : (
                pendingStudents.map((student: any) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{student.name}</td>
                    <td className="px-6 py-4 text-slate-600">{student.email}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(student.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => approveMutation.mutate(student._id)}
                        disabled={approveMutation.isPending}
                        className="btn-primary text-sm px-4 py-1.5 h-auto bg-green-600 hover:bg-green-700"
                      >
                        Approve Student
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Drive Invitations</h2>
        </div>
        <div className="p-6 space-y-4">
          {recent_invitations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No pending drive invitations from companies.
            </div>
          ) : (
            recent_invitations.map((invite: any) => (
              <div key={invite.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-100 rounded-lg">
                <div className="mb-4 sm:mb-0">
                  <h3 className="font-bold text-slate-800">{invite.title}</h3>
                  <p className="text-sm text-slate-500">{invite.company_name} • {invite.package_details}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary text-sm px-4">Accept</button>
                  <button className="btn-secondary text-sm px-4">Decline</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add New Student</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700" 
                  placeholder="John Doe"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700" 
                  placeholder="john@example.com"
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700" 
                  placeholder="••••••••"
                  value={newStudent.password}
                  onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addStudentMutation.isPending}
                  className="btn-primary flex-1 flex justify-center items-center gap-2"
                >
                  {addStudentMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
