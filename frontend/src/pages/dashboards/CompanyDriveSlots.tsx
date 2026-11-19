import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Video,
  CheckCircle2,
  Building,
  Loader2,
  X,
  ExternalLink,
  MapPin,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function CompanyDriveSlots() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  // Form state
  const [slotTitle, setSlotTitle] = useState('Day 1 - Morning Technical Slot');
  const [driveDate, setDriveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');
  const [capacity, setCapacity] = useState(10);
  const [roundName, setRoundName] = useState('Technical Round 1');
  const [venueOrLink, setVenueOrLink] = useState('CampusConnect In-Portal Live Suite');
  const [notes, setNotes] = useState('Candidates must be ready with photo ID and resume copy.');

  // Fetch drive slots
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['companyDriveSlots'],
    queryFn: async () => {
      const res = await api.get('/company/drive-slots');
      return res.data;
    }
  });

  // Create slot mutation
  const createSlotMutation = useMutation({
    mutationFn: async () => {
      await api.post('/company/drive-slots', {
        slot_title: slotTitle,
        drive_date: driveDate,
        start_time: startTime,
        end_time: endTime,
        capacity: Number(capacity),
        round_name: roundName,
        venue_or_link: venueOrLink,
        notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyDriveSlots'] });
      setShowCreateModal(false);
      alert('Recruitment Drive Slot created successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to create drive slot.');
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-brand-600" size={28} />
            Campus Drive Days & Interview Slot Coordinator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize high-volume placement drives into organized interview batches and time slots.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus size={16} />
          Create Drive Slot
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-brand-600">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Scheduled Slots</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{slots.length}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Drive time slots active</span>
        </div>

        <div className="card p-5 border-l-4 border-l-purple-600">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Interview Capacity</span>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {slots.reduce((acc: number, s: any) => acc + (s.capacity || 0), 0)} Candidates
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Across all scheduled batches</span>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-600">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Allocated Candidates</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {slots.reduce((acc: number, s: any) => acc + ((s.assigned_candidates || []).length), 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Assigned to drive slots</span>
        </div>
      </div>

      {/* Drive Slots List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-brand-600" size={32} />
        </div>
      ) : slots.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <Calendar className="mx-auto text-slate-300" size={48} />
          <h3 className="text-lg font-bold text-slate-800">No Drive Slots Scheduled Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create time slots for your campus interview drives to organize batches and schedule candidates automatically.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus size={15} />
            Schedule First Drive Slot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {slots.map((slot: any) => {
            const assigned = slot.assigned_candidates || [];
            const cap = slot.capacity || 10;
            const pct = Math.min(100, Math.round((assigned.length / cap) * 100));

            return (
              <div key={slot.id || slot._id} className="card p-5 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {slot.round_name || 'Interview Round'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{slot.slot_title}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {slot.status || 'scheduled'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">{slot.drive_date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    <span>{slot.start_time} - {slot.end_time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="truncate">{slot.venue_or_link}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-500">Candidate Slots:</span>
                    <span className="text-slate-800">{assigned.length} / {cap} allocated ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        pct >= 100 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-brand-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Candidate Thumbnails */}
                {assigned.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Allocated Candidates:
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {assigned.slice(0, 3).map((c: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg">
                          <span className="font-semibold text-slate-800 truncate">{c.student_name}</span>
                          {c.student_cgpa && <span className="text-emerald-700 font-bold">CGPA {c.student_cgpa}</span>}
                        </div>
                      ))}
                      {assigned.length > 3 && (
                        <span className="text-[10px] text-slate-400 italic block">
                          +{assigned.length - 3} more candidate(s)...
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    to="/dashboard/company/interviews"
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Video size={14} />
                    Launch Live Suite
                  </Link>
                  <button
                    onClick={() => setSelectedSlot(slot)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE DRIVE SLOT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-brand-600" />
                Schedule New Campus Drive Slot
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Slot Title / Batch Name</label>
                <input
                  type="text"
                  value={slotTitle}
                  onChange={(e) => setSlotTitle(e.target.value)}
                  placeholder="e.g. Day 1 - Morning Technical Round"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Drive Date</label>
                  <input
                    type="date"
                    value={driveDate}
                    onChange={(e) => setDriveDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Candidate Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="01:00 PM"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Round Type</label>
                  <select
                    value={roundName}
                    onChange={(e) => setRoundName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Technical Round 1">Technical Round 1</option>
                    <option value="Technical Round 2">Technical Round 2</option>
                    <option value="Behavioral / HR Round">Behavioral / HR Round</option>
                    <option value="Managerial Discussion">Managerial Discussion</option>
                    <option value="Coding Assessment Walkthrough">Coding Assessment Walkthrough</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Meeting Venue or Link</label>
                  <input
                    type="text"
                    value={venueOrLink}
                    onChange={(e) => setVenueOrLink(e.target.value)}
                    placeholder="CampusConnect In-Portal Suite or Link"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Instructions / Note for Candidates</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions sent to students allocated to this slot..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createSlotMutation.isPending || !slotTitle.trim()}
                onClick={() => createSlotMutation.mutate()}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
              >
                {createSlotMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm & Create Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLOT DETAILS MODAL */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase">{selectedSlot.round_name}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedSlot.slot_title}</h3>
              </div>
              <button onClick={() => setSelectedSlot(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Date: {selectedSlot.drive_date} ({selectedSlot.start_time} - {selectedSlot.end_time})</div>
              <div>Venue / Link: {selectedSlot.venue_or_link}</div>
              <div>Capacity: {(selectedSlot.assigned_candidates || []).length} / {selectedSlot.capacity || 10}</div>
              {selectedSlot.notes && <div className="text-[11px] text-slate-500 italic">Notes: {selectedSlot.notes}</div>}
            </div>

            <div>
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">Allocated Candidates</h4>
              {(selectedSlot.assigned_candidates || []).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No candidates assigned yet. Use the "Assign to Drive Slot" action on the Application Monitoring table to allocate candidates.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(selectedSlot.assigned_candidates || []).map((c: any, i: number) => (
                    <div key={i} className="p-2.5 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{c.student_name}</div>
                        <div className="text-[11px] text-slate-400">{c.student_email}</div>
                      </div>
                      {c.student_cgpa && (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          CGPA: {c.student_cgpa}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
