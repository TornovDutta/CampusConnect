import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Building,
  Briefcase,
  Download,
  AlertCircle,
  Loader2,
  ExternalLink,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudentCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'interview' | 'deadline' | 'drive_deadline'>('all');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['studentCalendarEvents'],
    queryFn: async () => {
      const res = await api.get('/student/calendar-events');
      return res.data;
    }
  });

  // Filter events
  const filteredEvents = events.filter((ev: any) => {
    if (typeFilter === 'all') return true;
    return ev.event_type === typeFilter;
  });

  // Map events by date (YYYY-MM-DD)
  const eventsByDate: Record<string, any[]> = {};
  filteredEvents.forEach((ev: any) => {
    const d = ev.date;
    if (!d) return;
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(ev);
  });

  // Calendar math
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Generate iCal (.ics) download
  const handleExportICS = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CampusConnect//Placement Calendar//EN',
      'CALSCALE:GREGORIAN'
    ];

    events.forEach((ev: any) => {
      const dateClean = (ev.date || '').replace(/-/g, '');
      if (!dateClean) return;
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${ev.id}@campusconnect.edu`);
      icsContent.push(`DTSTAMP:${dateClean}T090000Z`);
      icsContent.push(`DTSTART:${dateClean}T100000Z`);
      icsContent.push(`DTEND:${dateClean}T110000Z`);
      icsContent.push(`SUMMARY:${ev.title}`);
      icsContent.push(`DESCRIPTION:${ev.company_name ? 'Company: ' + ev.company_name : ''} ${ev.link || ''}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `CampusConnect_Placement_Calendar.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedDayEvents = eventsByDate[selectedDate] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-brand-600" size={28} />
            Job Application & Drive Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stay on top of upcoming drive deadlines, test slots, and scheduled interview rounds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportICS}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-sm flex items-center gap-2"
          >
            <Download size={15} />
            Sync with Google/iCal (.ics)
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Events' },
          { id: 'interview', label: 'Scheduled Interviews', color: 'bg-emerald-500' },
          { id: 'deadline', label: 'Application Deadlines', color: 'bg-amber-500' },
          { id: 'drive_deadline', label: 'Campus Drives', color: 'bg-purple-500' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(t.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
              typeFilter === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.color && <span className={`w-2 h-2 rounded-full ${t.color}`} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Calendar Grid + Selected Day Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Visual Grid */}
        <div className="lg:col-span-2 card p-6 space-y-4">
          {/* Month Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => {
                  setCurrentYear(today.getFullYear());
                  setCurrentMonth(today.getMonth());
                }}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider py-1">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} className="h-20 bg-slate-50/50 rounded-xl border border-transparent" />
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
              const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

              const isSelected = selectedDate === dateKey;
              const isToday = today.toISOString().split('T')[0] === dateKey;
              const dayEvents = eventsByDate[dateKey] || [];

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`h-20 p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/40 shadow-sm ring-2 ring-brand-100'
                      : isToday
                      ? 'border-blue-300 bg-blue-50/20'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-brand-600 text-white'
                          : isSelected
                          ? 'text-brand-700 font-extrabold'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges Snippets */}
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev: any, evIdx: number) => (
                      <div
                        key={evIdx}
                        className={`text-[10px] px-1 py-0.5 rounded truncate font-medium ${
                          ev.event_type === 'interview'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ev.event_type === 'drive_deadline'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ev.title.split(':')[0]}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 block text-right font-semibold">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Day Agenda */}
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Day Agenda</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </h3>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <CalendarIcon className="mx-auto text-slate-300" size={32} />
                <p className="text-xs text-slate-500">No deadlines or interviews scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((ev: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      ev.event_type === 'interview'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : ev.event_type === 'drive_deadline'
                        ? 'bg-purple-50/70 border-purple-200'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          ev.event_type === 'interview'
                            ? 'bg-emerald-200 text-emerald-800'
                            : ev.event_type === 'drive_deadline'
                            ? 'bg-purple-200 text-purple-800'
                            : 'bg-amber-200 text-amber-800'
                        }`}
                      >
                        {ev.event_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <Clock size={12} />
                        {ev.time || 'All Day'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>

                    {ev.company_name && (
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Building size={13} className="text-slate-400" />
                        {ev.company_name}
                      </p>
                    )}

                    {ev.link && (
                      <a
                        href={ev.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 pt-1"
                      >
                        <Video size={13} />
                        Join Virtual Meeting
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
