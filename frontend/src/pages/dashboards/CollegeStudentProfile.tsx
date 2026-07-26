import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, Calendar, Activity, Loader2 } from 'lucide-react';
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
        <button onClick={() => navigate(-1)} className="mt-4 text-brand-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/dashboard/college/students')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Students List
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-indigo-600"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white p-2 shadow-lg">
                <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-brand-600">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-slate-800">{student.name}</h1>
                <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                  <User size={16} /> Student Profile
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 pb-2">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                student.is_suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {student.is_suspended ? 'Suspended' : 'Active'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Contact Information</h3>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email Address</p>
                  <p className="font-medium text-slate-800">{student.email}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Account Details</h3>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Joined Date</p>
                  <p className="font-medium text-slate-800">{new Date(student.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
