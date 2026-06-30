import React from 'react';
import { Briefcase, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Applications</p>
            <p className="text-2xl font-bold text-slate-800">12</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-yellow-50 text-yellow-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">In Review</p>
            <p className="text-2xl font-bold text-slate-800">4</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Shortlisted</p>
            <p className="text-2xl font-bold text-slate-800">2</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-slate-800">6</p>
          </div>
        </div>
      </div>

      {/* Available Jobs vs Applied Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Jobs */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recommended Jobs</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-lg hover:border-brand-200 hover:shadow-md transition-all cursor-pointer">
                <h3 className="font-bold text-slate-800">Software Engineer Intern</h3>
                <p className="text-sm text-slate-500 mb-3">Tech Innovators Inc. • Remote</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">React</span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">Node.js</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Applications</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border border-slate-100 rounded-lg">
              <div>
                <h3 className="font-bold text-slate-800">Frontend Developer</h3>
                <p className="text-sm text-slate-500">Global Tech</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">In Review</span>
            </div>
            <div className="flex justify-between items-center p-4 border border-slate-100 rounded-lg">
              <div>
                <h3 className="font-bold text-slate-800">Backend Engineer</h3>
                <p className="text-sm text-slate-500">FinTech Solutions</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Shortlisted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
