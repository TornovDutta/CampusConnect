import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Plus,
  Search,
  Sparkles,
  Building2,
  Users,
  Calendar,
  HelpCircle,
  Activity,
  MapPin,
  Clock,
  Phone,
  Edit3,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type CategoryType = 'activity' | 'facility' | 'club' | 'event' | 'faq';

interface KnowledgeItem {
  id: string;
  college_id: string;
  college_name: string;
  category: CategoryType;
  title: string;
  description: string;
  location: string;
  schedule: string;
  contact_info: string;
  tags: string[];
  updated_at: string;
}

const CATEGORIES: Array<{ id: 'all' | CategoryType; label: string }> = [
  { id: 'all', label: 'All Entries' },
  { id: 'activity', label: 'Campus Activities' },
  { id: 'facility', label: 'Facilities' },
  { id: 'club', label: 'Clubs & Societies' },
  { id: 'event', label: 'Events' },
  { id: 'faq', label: 'FAQs' },
];

export default function CampusKnowledgeManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<'all' | CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  const [category, setCategory] = useState<CategoryType>('faq');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [schedule, setSchedule] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const { data: statusData } = useQuery({
    queryKey: ['assistantStatus'],
    queryFn: async () => {
      const res = await api.get('/assistant/status');
      return res.data as { configured: boolean; model: string; provider: string };
    },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campusKnowledge', activeCategory, searchQuery],
    queryFn: async () => {
      const res = await api.get('/assistant/knowledge', {
        params: {
          category: activeCategory === 'all' ? undefined : activeCategory,
          search: searchQuery.trim() || undefined,
        },
      });
      return res.data as { items: KnowledgeItem[]; total: number };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        category,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        schedule: schedule.trim(),
        contact_info: contactInfo.trim(),
        tags,
      };

      if (editingItem) {
        const res = await api.put(`/assistant/knowledge/${editingItem.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/assistant/knowledge', {
          ...payload,
          scope: user?.role === 'super_admin' ? 'global' : 'college',
        });
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campusKnowledge'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || 'Failed to save entry.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assistant/knowledge/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campusKnowledge'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.detail || 'Failed to delete entry.');
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setCategory('activity');
    setTitle('');
    setDescription('');
    setLocation('');
    setSchedule('');
    setContactInfo('');
    setTagsInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setCategory(item.category);
    setTitle(item.title);
    setDescription(item.description);
    setLocation(item.location || '');
    setSchedule(item.schedule || '');
    setContactInfo(item.contact_info || '');
    setTagsInput((item.tags || []).join(', '));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    saveMutation.mutate();
  };

  const getCategoryMeta = (cat: CategoryType) => {
    switch (cat) {
      case 'activity':
        return { label: 'Activity', badge: 'bg-indigo-100 text-indigo-700', icon: <Activity size={14} /> };
      case 'facility':
        return { label: 'Facility', badge: 'bg-emerald-100 text-emerald-700', icon: <Building2 size={14} /> };
      case 'club':
        return { label: 'Club', badge: 'bg-violet-100 text-violet-700', icon: <Users size={14} /> };
      case 'event':
        return { label: 'Event', badge: 'bg-amber-100 text-amber-800', icon: <Calendar size={14} /> };
      default:
        return { label: 'FAQ', badge: 'bg-blue-100 text-blue-700', icon: <HelpCircle size={14} /> };
    }
  };

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Bot className="text-indigo-600 shrink-0" size={26} />
            <span>AI Campus Assistant Knowledge Base</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publish real campus activities, facilities, clubs, events, and FAQs so students receive instant, accurate answers from Groq AI.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0 w-full sm:w-auto"
        >
          <Plus size={16} />
          <span>Add Campus Entry</span>
        </button>
      </div>

      {/* Groq Status Banner */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/70 border border-indigo-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900">Groq AI Engine</span>
              {statusData?.configured ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                  <CheckCircle2 size={12} /> Connected ({statusData.model})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  <AlertCircle size={12} /> Set GROP_APIKEY in backend .env
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Every entry below is stored in MongoDB and automatically retrieved by the floating Campus AI assistant.
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs, facilities, events..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Knowledge Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-indigo-600" size={30} />
        </div>
      ) : isError ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          Failed to load campus knowledge entries.
        </div>
      ) : items.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center space-y-3">
          <Bot size={40} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No campus entries published yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Add your college&apos;s real clubs, library/lab timings, upcoming campus events, and student FAQs so the AI Campus Assistant can answer student questions accurately.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary inline-flex items-center gap-2 text-xs"
          >
            <Plus size={15} /> Create First Entry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const meta = getCategoryMeta(item.category);
            const canEdit =
              user?.role === 'super_admin' ||
              (user?.role === 'college' && item.college_id === user?.id);

            return (
              <div
                key={item.id}
                className="card p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.badge}`}
                    >
                      {meta.icon}
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                      {item.college_name}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {item.description}
                  </p>

                  <div className="space-y-1 pt-1 text-[11px] text-slate-500">
                    {item.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                    {item.schedule && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{item.schedule}</span>
                      </div>
                    )}
                    {item.contact_info && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{item.contact_info}</span>
                      </div>
                    )}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${item.title}"?`)) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Campus Knowledge Entry' : 'Add Campus Knowledge Entry'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="input-field text-sm"
                >
                  <option value="activity">Campus Activity</option>
                  <option value="facility">College Facility</option>
                  <option value="club">Club / Student Society</option>
                  <option value="event">Upcoming Event</option>
                  <option value="faq">General FAQ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Central Library, Robotics Club, Annual Tech Fest"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Details / Answer *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide accurate details, eligibility, registration steps, or FAQ answers..."
                  className="input-field min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Block B, 2nd Floor"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Timings / Date (Optional)
                  </label>
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="e.g., Mon-Sat, 9 AM - 8 PM"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Contact Info (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g., clubs@college.edu"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g., coding, library, hostel"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary text-xs inline-flex items-center justify-center gap-2"
                >
                  {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Publish to AI Assistant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
