import React from 'react';
import { Briefcase, FileSignature, CheckCircle, Plus } from 'lucide-react';

export default function CompanyDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Recruitment Overview</h2>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Post New Job
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-xl">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Jobs</p>
            <p className="text-2xl font-bold text-slate-800">5</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <FileSignature size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Applications</p>
            <p className="text-2xl font-bold text-slate-800">342</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Offers Sent</p>
            <p className="text-2xl font-bold text-slate-800">18</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Job Postings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Job Title</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Applications</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { title: 'Frontend Developer', loc: 'Remote', apps: 124, status: 'Active' },
                { title: 'Backend Engineer Intern', loc: 'New York', apps: 89, status: 'Active' },
                { title: 'UI/UX Designer', loc: 'Remote', apps: 45, status: 'Closed' },
              ].map((job, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{job.title}</td>
                  <td className="px-6 py-4 text-slate-600">{job.loc}</td>
                  <td className="px-6 py-4 text-slate-600">{job.apps}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-brand-600 hover:text-brand-700 font-medium text-sm mr-3">View Candidates</button>
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
