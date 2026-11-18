import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Trash2, Search, Loader2, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { api } from '../../services/api';

interface SkillItem {
  id: string;
  name: string;
  demand_count: number;
}

export default function AdminSkills() {
  const queryClient = useQueryClient();
  const [newSkills, setNewSkills] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminSkillsCatalog'],
    queryFn: async () => {
      const res = await api.get('/admin/skills');
      return res.data as { total: number; skills: SkillItem[]; top_demanded: SkillItem[] };
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/skills', { names: newSkills });
    },
    onSuccess: () => {
      setNewSkills('');
      queryClient.invalidateQueries({ queryKey: ['adminSkillsCatalog'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkillsCatalog'] });
    },
  });

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newSkills.trim()) return;
    addMutation.mutate();
  };

  const skills = (data?.skills || []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const topDemanded = (data?.top_demanded || []).filter((s) => s.demand_count > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <Tag className="text-brand-500" size={26} />
          Skills & Eligibility Catalog
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Standardize skills and eligibility prerequisites suggested to corporate recruiters when posting jobs, and track hiring demand.
        </p>
      </div>

      {/* Top In-Demand Skills Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-500" />
              Most Requested Skills & Prerequisites in Job Postings
            </h3>
            <p className="text-xs text-slate-500">Live count of jobs referencing each catalog item</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">
            {data?.total ?? 0} catalog tags
          </span>
        </div>

        <div className="h-64 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-brand-500" size={26} />
            </div>
          ) : topDemanded.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              Job demand bars will appear here as companies attach prerequisites to job postings.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDemanded} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#475569" fontSize={11} width={140} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="demand_count" name="Jobs Requiring" fill="#14b8a6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Add & Manage Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 h-fit">
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Plus size={18} className="text-brand-500" />
            Add Skills / Prerequisites
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Enter a single tag or multiple comma-separated tags (e.g., <code>Docker, System Design, Min 7.5 CGPA</code>).
          </p>
          <form onSubmit={handleAdd} className="space-y-3">
            <textarea
              rows={3}
              value={newSkills}
              onChange={(e) => setNewSkills(e.target.value)}
              placeholder="e.g. Kubernetes, GraphQL, Min 7.5 CGPA"
              className="input-field text-sm resize-none"
              required
            />
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5"
            >
              {addMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add to Catalog
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-800">Active Catalog ({skills.length})</h3>
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter skills..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {isError ? (
            <p className="text-sm text-red-600">Failed to load catalog.</p>
          ) : skills.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No matching skills found.</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 hover:border-brand-300 transition-colors"
                >
                  <span className="font-medium">{skill.name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      skill.demand_count > 0 ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
                    }`}
                    title={`${skill.demand_count} job(s) require this`}
                  >
                    {skill.demand_count}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(skill.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                    title="Remove from catalog"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
