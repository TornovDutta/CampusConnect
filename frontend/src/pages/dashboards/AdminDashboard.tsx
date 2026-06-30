import React from 'react';
import { Users, Building2, GraduationCap, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Users</p>
            <p className="text-2xl font-bold text-slate-800">1,248</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Colleges</p>
            <p className="text-2xl font-bold text-slate-800">42</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Companies</p>
            <p className="text-2xl font-bold text-slate-800">156</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-slate-800">12</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Pending Approvals</h2>
          <button className="text-sm text-brand-600 font-medium hover:text-brand-700">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Organization Name</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Date Applied</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Tech University', type: 'College', date: '2026-06-29', status: 'Pending' },
                { name: 'Global Innovators Inc.', type: 'Company', date: '2026-06-28', status: 'Pending' },
                { name: 'National Institute', type: 'College', date: '2026-06-25', status: 'Pending' },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                  <td className="px-6 py-4 text-slate-600">{item.type}</td>
                  <td className="px-6 py-4 text-slate-600">{item.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-brand-600 hover:text-brand-700 font-medium text-sm mr-3">Approve</button>
                    <button className="text-red-600 hover:text-red-700 font-medium text-sm">Reject</button>
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
