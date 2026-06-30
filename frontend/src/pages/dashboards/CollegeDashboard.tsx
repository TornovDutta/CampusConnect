import React from 'react';
import { Users, FileText, CheckSquare, Plus } from 'lucide-react';

export default function CollegeDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Placement Cell Overview</h2>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Students
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Registered Students</p>
            <p className="text-2xl font-bold text-slate-800">450</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Drive Invitations</p>
            <p className="text-2xl font-bold text-slate-800">8</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Students Placed</p>
            <p className="text-2xl font-bold text-slate-800">120</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Drive Invitations</h2>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-100 rounded-lg">
              <div className="mb-4 sm:mb-0">
                <h3 className="font-bold text-slate-800">Software Engineer Campus Drive</h3>
                <p className="text-sm text-slate-500">Tech Innovators Inc. • Package: 12 LPA</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary text-sm px-4">Accept</button>
                <button className="btn-secondary text-sm px-4">Decline</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
