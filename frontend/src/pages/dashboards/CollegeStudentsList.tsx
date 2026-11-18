import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Loader2,
  Ban,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  Edit3,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { downloadRowsAsCsv } from '../../utils/csvExport';

export default function CollegeStudentsList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [placementFilter, setPlacementFilter] = useState('all');
  const [minCgpaFilter, setMinCgpaFilter] = useState('');

  // Excel import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);

  // Edit academic profile modal state
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    cgpa: '',
    batch: '',
    branch: '',
    roll_number: '',
    backlogs: '0',
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['collegeStudents'],
    queryFn: async () => {
      const response = await api.get('/college/students');
      return response.data as any[];
    },
  });

  const toggleSuspensionMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await api.patch(`/college/students/${studentId}/toggle-suspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collegeStudents'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/college/import-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (res) => {
      setImportResult(res);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['collegeStudents'] });
      queryClient.invalidateQueries({ queryKey: ['collegeDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['collegeAnalytics'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to import students file');
    },
  });

  const updateAcademicMutation = useMutation({
    mutationFn: async () => {
      if (!editingStudent) return;
      await api.put(`/college/students/${editingStudent._id}`, {
        name: editForm.name,
        cgpa: editForm.cgpa.trim() ? parseFloat(editForm.cgpa) : null,
        batch: editForm.batch,
        branch: editForm.branch,
        roll_number: editForm.roll_number,
        backlogs: parseInt(editForm.backlogs || '0', 10),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collegeStudents'] });
      queryClient.invalidateQueries({ queryKey: ['collegeAnalytics'] });
      setEditingStudent(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to update student profile');
    },
  });

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/college/students-template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campusconnect-students-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download template.');
    }
  };

  const openEditModal = (s: any) => {
    setEditingStudent(s);
    setEditForm({
      name: s.name || '',
      cgpa: s.cgpa !== undefined && s.cgpa !== null ? String(s.cgpa) : '',
      batch: s.batch || '',
      branch: s.branch || '',
      roll_number: s.roll_number || '',
      backlogs: String(s.backlogs ?? 0),
    });
  };

  const handleImportSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setImportResult(null);
    importMutation.mutate(selectedFile);
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateAcademicMutation.mutate();
  };

  const uniqueBranches = Array.from(new Set(students.map((s) => s.branch).filter(Boolean))) as string[];
  const uniqueBatches = Array.from(new Set(students.map((s) => s.batch).filter(Boolean))) as string[];

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.roll_number || '').toLowerCase().includes(q);
    const matchesBranch = branchFilter === 'all' || (s.branch || '') === branchFilter;
    const matchesBatch = batchFilter === 'all' || (s.batch || '') === batchFilter;
    const matchesPlacement = placementFilter === 'all' || s.placement_status === placementFilter;
    const minCgpaVal = minCgpaFilter.trim() ? parseFloat(minCgpaFilter) : null;
    const matchesCgpa = minCgpaVal === null || (typeof s.cgpa === 'number' && s.cgpa >= minCgpaVal);
    return matchesSearch && matchesBranch && matchesBatch && matchesPlacement && matchesCgpa;
  });

  const handleExportCsv = () => {
    const rows = filtered.map((s) => ({
      name: s.name || '',
      email: s.email || '',
      roll_number: s.roll_number || '',
      cgpa: s.cgpa ?? '',
      batch: s.batch || '',
      branch: s.branch || '',
      backlogs: s.backlogs ?? 0,
      applications: s.performance?.total_applications ?? 0,
      shortlisted: s.performance?.shortlisted ?? 0,
      offers_hired: (s.performance?.offers ?? 0) + (s.performance?.hired ?? 0),
      placement_status: s.placement_status || '',
      suspended: s.is_suspended ? 'Yes' : 'No',
    }));
    downloadRowsAsCsv('college-students-performance', rows);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={28} className="text-brand-500" /> Student Directory & Performance Tracker
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Bulk-import students from Excel/CSV, manage CGPA/batch/branch records, and track individual placement progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => {
              setImportResult(null);
              setSelectedFile(null);
              setShowImportModal(true);
            }}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <FileSpreadsheet size={15} /> Import Excel / CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or roll number..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">All Branches</option>
            {uniqueBranches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">All Batches</option>
            {uniqueBatches.map((b) => (
              <option key={b} value={b}>Batch {b}</option>
            ))}
          </select>

          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
          >
            <option value="all">All Placement Stages</option>
            <option value="Placed">Placed</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Applying">Applying</option>
            <option value="Not Applied">Not Applied (Lag)</option>
          </select>

          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={minCgpaFilter}
            onChange={(e) => setMinCgpaFilter(e.target.value)}
            placeholder="Min CGPA"
            className="w-24 px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Academic Profile</th>
                <th className="px-5 py-3.5">Applications / Outcomes</th>
                <th className="px-5 py-3.5">Placement Stage</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No students match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((student: any) => {
                  const perf = student.performance || {};
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/dashboard/college/students/${student._id}`)}
                          className="text-brand-600 hover:text-brand-700 font-semibold text-left block"
                        >
                          {student.name || 'Unnamed Student'}
                        </button>
                        <p className="text-xs text-slate-400">{student.email}</p>
                        {student.roll_number && (
                          <p className="text-[11px] font-mono text-slate-500">Roll: {student.roll_number}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                            CGPA: {student.cgpa ?? '—'}
                          </span>
                          {student.branch && (
                            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-medium">
                              {student.branch}
                            </span>
                          )}
                          {student.batch && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                              {student.batch}
                            </span>
                          )}
                          {(student.backlogs ?? 0) > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium">
                              {student.backlogs} Backlog(s)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className="font-semibold text-slate-800">{perf.total_applications ?? 0}</span> apps ·{' '}
                        <span className="font-semibold text-purple-700">{perf.shortlisted ?? 0}</span> shortlisted ·{' '}
                        <span className="font-semibold text-emerald-700">{(perf.offers ?? 0) + (perf.hired ?? 0)}</span> offers
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              student.is_suspended
                                ? 'bg-red-100 text-red-700'
                                : student.placement_status === 'Placed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : student.placement_status === 'Shortlisted'
                                ? 'bg-purple-100 text-purple-700'
                                : student.placement_status === 'Applying'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {student.is_suspended ? 'Suspended' : student.placement_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                            title="Edit Academic Details (CGPA, Batch, Branch)"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/college/notifications?studentId=${student._id}`)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            title="Send Notification to Student"
                          >
                            <Send size={14} />
                          </button>
                          <button
                            onClick={() => toggleSuspensionMutation.mutate(student._id)}
                            disabled={toggleSuspensionMutation.isPending}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                              student.is_suspended
                                ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                                : 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                            }`}
                          >
                            {student.is_suspended ? (
                              <span className="flex items-center gap-1"><CheckCircle size={13} /> Unsuspend</span>
                            ) : (
                              <span className="flex items-center gap-1"><Ban size={13} /> Suspend</span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel / CSV Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={22} />
                Bulk Add Students via Excel / CSV
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p>
                Upload an <strong>.xlsx</strong> (Excel) or <strong>.csv</strong> file with row 1 headers:
              </p>
              <code className="block bg-white px-2.5 py-1.5 rounded border border-slate-200 text-[11px] text-slate-800">
                name, email, password, cgpa, batch, branch, roll_number, backlogs
              </code>
              <p className="text-[11px] text-slate-500">
                Only <strong>name</strong> and <strong>email</strong> are mandatory (blank password defaults to <code>Student@123</code>).
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-brand-600 hover:underline font-semibold inline-flex items-center gap-1"
              >
                <Download size={13} /> Download Sample Template (.csv / Excel-ready)
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <label className="block border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/40">
                <Upload className="mx-auto text-slate-400 mb-2" size={28} />
                <p className="text-sm font-semibold text-slate-700">
                  {selectedFile ? selectedFile.name : 'Click to choose .xlsx or .csv file'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports Microsoft Excel (.xlsx) and CSV files</p>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || importMutation.isPending}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  Upload & Import Students
                </button>
              </div>
            </form>

            {importResult && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{importResult.message}</span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 max-h-40 overflow-y-auto">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle size={14} /> Skipped Rows ({importResult.skipped_count}):
                    </p>
                    {importResult.errors.map((err: any, idx: number) => (
                      <p key={idx}>
                        Row {err.row} ({err.email}): {err.reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Academic Profile Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Update Academic Details</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">CGPA (0 - 10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editForm.cgpa}
                    onChange={(e) => setEditForm({ ...editForm, cgpa: e.target.value })}
                    className="input-field text-sm"
                    placeholder="e.g. 8.95"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={editForm.backlogs}
                    onChange={(e) => setEditForm({ ...editForm, backlogs: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Batch Year</label>
                  <input
                    type="text"
                    value={editForm.batch}
                    onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                    className="input-field text-sm"
                    placeholder="e.g. 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Branch / Dept</label>
                  <input
                    type="text"
                    value={editForm.branch}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    className="input-field text-sm"
                    placeholder="e.g. CSE"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Roll Number</label>
                <input
                  type="text"
                  value={editForm.roll_number}
                  onChange={(e) => setEditForm({ ...editForm, roll_number: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g. CS2026001"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" disabled={updateAcademicMutation.isPending} className="btn-primary text-xs px-5 py-2">
                  {updateAcademicMutation.isPending ? 'Saving...' : 'Save Academic Info'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
