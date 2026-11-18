import { useState, useEffect, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';

interface ControlsState {
  allow_student_registration: boolean;
  allow_college_registration: boolean;
  allow_company_registration: boolean;
  require_company_approval: boolean;
  require_student_college_approval: boolean;
  max_active_applications_per_student: number;
  maintenance_mode: boolean;
  maintenance_message: string;
}

export default function AdminControls() {
  const queryClient = useQueryClient();
  const [savedBanner, setSavedBanner] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminPlatformControls'],
    queryFn: async () => {
      const res = await api.get('/admin/controls');
      return res.data as ControlsState;
    },
  });

  const [form, setForm] = useState<ControlsState>({
    allow_student_registration: true,
    allow_college_registration: true,
    allow_company_registration: true,
    require_company_approval: true,
    require_student_college_approval: true,
    max_active_applications_per_student: 0,
    maintenance_mode: false,
    maintenance_message: 'CampusConnect is undergoing scheduled maintenance. Please check back shortly.',
  });

  useEffect(() => {
    if (data) {
      setForm({
        allow_student_registration: data.allow_student_registration ?? true,
        allow_college_registration: data.allow_college_registration ?? true,
        allow_company_registration: data.allow_company_registration ?? true,
        require_company_approval: data.require_company_approval ?? true,
        require_student_college_approval: data.require_student_college_approval ?? true,
        max_active_applications_per_student: Number(data.max_active_applications_per_student ?? 0),
        maintenance_mode: !!data.maintenance_mode,
        maintenance_message:
          data.maintenance_message ||
          'CampusConnect is undergoing scheduled maintenance. Please check back shortly.',
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put('/admin/controls', form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlatformControls'] });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <Sliders className="text-brand-500" size={26} />
          Platform Governance & Policy Controls
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure live registration access, verification policies, student application limits, and maintenance mode.
        </p>
      </div>

      {savedBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} /> Platform governance controls updated and enforced immediately.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Registration Access */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Registration Access</h3>
              <p className="text-xs text-slate-500">Control which account types can self-register on /register</p>
            </div>
          </div>

          {[
            {
              key: 'allow_student_registration' as const,
              title: 'Allow Student Sign-ups',
              desc: 'Students can create accounts and request college approval.',
            },
            {
              key: 'allow_college_registration' as const,
              title: 'Allow College Sign-ups',
              desc: 'New educational institutions can onboard onto CampusConnect.',
            },
            {
              key: 'allow_company_registration' as const,
              title: 'Allow Company Sign-ups',
              desc: 'Corporate recruiters can register hiring accounts.',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 cursor-pointer hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={form[item.key]}
                onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
              />
            </label>
          ))}
        </div>

        {/* Approval & Recruitment Policies */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Verification & Application Policies</h3>
              <p className="text-xs text-slate-500">Enforce placement quality and prevent application spam</p>
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-slate-800">Require Admin Approval for New Companies</p>
              <p className="text-xs text-slate-500">New company accounts start in Pending Verification until approved by an Admin.</p>
            </div>
            <input
              type="checkbox"
              checked={form.require_company_approval}
              onChange={(e) => setForm({ ...form, require_company_approval: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
            />
          </label>

          <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-slate-800">Require College Approval for New Students</p>
              <p className="text-xs text-slate-500">Students must be verified by their placement cell before applying to jobs.</p>
            </div>
            <input
              type="checkbox"
              checked={form.require_student_college_approval}
              onChange={(e) => setForm({ ...form, require_student_college_approval: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
            />
          </label>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Max Active Applications per Student</p>
              <p className="text-xs text-slate-500">
                Set to <code>0</code> for unlimited applications, or cap active non-rejected applications per student.
              </p>
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={form.max_active_applications_per_student}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_active_applications_per_student: Math.max(0, parseInt(e.target.value || '0', 10)),
                })
              }
              className="w-28 px-3 py-2 text-sm font-bold text-center bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className={`card p-6 space-y-4 border ${form.maintenance_mode ? 'border-amber-300 bg-amber-50/30' : ''}`}>
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${form.maintenance_mode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                <Lock size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Maintenance Mode</h3>
                <p className="text-xs text-slate-500">Temporarily pause new registrations and display a maintenance notice</p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.maintenance_mode}
                onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${form.maintenance_mode ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                {form.maintenance_mode ? 'Active' : 'Off'}
              </span>
            </label>
          </div>

          {form.maintenance_mode && (
            <div className="p-3 rounded-lg bg-amber-100/70 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              New registrations are currently blocked while Maintenance Mode is enabled.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">Maintenance Notice Message</label>
            <textarea
              rows={2}
              value={form.maintenance_message}
              onChange={(e) => setForm({ ...form, maintenance_message: e.target.value })}
              className="input-field text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-primary px-6 py-2.5 flex items-center gap-2"
          >
            {saveMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            Save Governance Policies
          </button>
        </div>
      </form>
    </div>
  );
}
