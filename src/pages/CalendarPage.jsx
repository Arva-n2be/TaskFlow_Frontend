import { useState, useEffect, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../api/axiosConfig';
import { Calendar as CalendarIcon, Plus, X, Clock3, BadgeInfo, CheckCircle2, FolderKanban, Pencil, Link as LinkIcon } from 'lucide-react';

const EVENT_STYLES = {
    task: {
        dot: 'bg-blue-500',
        chip: 'bg-blue-50 text-blue-700 ring-blue-100',
        label: 'Task',
    },
    project: {
        dot: 'bg-violet-500',
        chip: 'bg-violet-50 text-violet-700 ring-violet-100',
        label: 'Project',
    },
    default: {
        dot: 'bg-emerald-500',
        chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        label: 'Agenda',
    },
};

function getEventStyle(type) {
    return EVENT_STYLES[type] || EVENT_STYLES.default;
}

function formatDate(value, options) {
    return new Date(value).toLocaleDateString('id-ID', options);
}

function getEventDate(event) {
    return event.start || event.startStr || event.extendedProps?.event_date || '';
}

export default function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [newEvent, setNewEvent] = useState({ title: '', event_date: '', description: '', link: '' });
    const [toast, setToast] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [editingEvent, setEditingEvent] = useState(false);
    const [editEventData, setEditEventData] = useState({ title: '', description: '', event_date: '', link: '' });
    const [tooltip, setTooltip] = useState(null);
    const calendarRef = useRef(null);
    const calendarWrapperRef = useRef(null);

    const fetchCalendarData = async () => {
        try {
            const res = await api.get('/calendar');
            setEvents(res.data);
        } catch (error) {
            console.error('Gagal mengambil data kalender', error);
        }
    };

    useEffect(() => {
        fetchCalendarData();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!calendarWrapperRef.current || !window.ResizeObserver) return;

        const observer = new ResizeObserver(() => {
            calendarRef.current?.getApi().updateSize();
        });

        observer.observe(calendarWrapperRef.current);
        return () => observer.disconnect();
    }, []);

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => new Date(getEventDate(a)) - new Date(getEventDate(b)));
    }, [events]);

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return sortedEvents
            .filter((event) => {
                const date = new Date(getEventDate(event));
                return !Number.isNaN(date.getTime()) && date >= today;
            })
            .slice(0, 5);
    }, [sortedEvents]);

    const totalTasks = useMemo(() => events.filter((item) => item.extendedProps?.type === 'task').length, [events]);
    const totalProjects = useMemo(() => events.filter((item) => item.extendedProps?.type === 'project').length, [events]);

    const handleDateClick = (info) => {
        const clickedDate = info.dateStr;
        setSelectedDate(clickedDate);

        setNewEvent({ title: '', description: '', event_date: clickedDate, link: '' });
        setShowModal(true);
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/calendar/events', newEvent);
            await fetchCalendarData();
            setNewEvent({ title: '', description: '', event_date: '', link: '' });
            setShowModal(false);
            showToast('Kegiatan berhasil ditambahkan!', 'success');
        } catch (error) {
            showToast('Gagal menyimpan kegiatan', 'error');
        }
    };

    const handleEventClick = (info) => {
        info.jsEvent.preventDefault();
        const event = info.event;
        setSelectedEvent({
            id: event.id,
            title: event.title,
            type: event.extendedProps.type,
            date: getEventDate(event),
            description: event.extendedProps.description || '',
            link: event.extendedProps.link || '',
        });
        setEditingEvent(false);
    };

    const openEventDetail = (event) => {
        setSelectedEvent({
            id: event.id,
            title: event.title,
            type: event.extendedProps?.type,
            date: getEventDate(event),
            description: event.extendedProps?.description || '',
            link: event.extendedProps?.link || '',
        });
        setEditingEvent(false);
    };

    const handleDayCellDidMount = (info) => {
        const cellDate = info.date;
        const cellDateStr = cellDate.toISOString().substring(0, 10);
        const dayEvents = events.filter((evt) => getEventDate(evt).substring(0, 10) === cellDateStr);

        if (dayEvents.length === 0) return;

        const onMouseEnter = () => {
            const rect = info.el.getBoundingClientRect();
            setTooltip({
                date: cellDateStr,
                x: rect.left + rect.width / 2,
                y: rect.top - 10,
                items: dayEvents.map(evt => ({
                    title: evt.title,
                    type: evt.extendedProps?.type,
                    link: evt.extendedProps?.link || null
                })),
                total: dayEvents.length,
            });
        };

        const onMouseLeave = () => {
            setTooltip(null);
        };

        info.el.addEventListener('mouseenter', onMouseEnter);
        info.el.addEventListener('mouseleave', onMouseLeave);
    };

    const openEditEvent = () => {
        if (!selectedEvent) return;
        let formattedDate = '';
        if (selectedEvent.date) {
            const d = new Date(selectedEvent.date);
            if (!isNaN(d.getTime())) {
                // Adjust timezone offset to avoid date shifting
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
            }
        }
        setEditEventData({
            title: selectedEvent.title || '',
            description: selectedEvent.description || '',
            event_date: formattedDate,
            link: selectedEvent.link || ''
        });
        setEditingEvent(true);
    };

    const submitEditEvent = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/calendar/events/${selectedEvent.id.split('-').pop()}`, editEventData);
            await fetchCalendarData();
            setSelectedEvent(null);
            setEditingEvent(false);
            showToast('Event berhasil diperbarui', 'success');
        } catch (err) {
            showToast('Gagal memperbarui event', 'error');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden">
                <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
                            <CalendarIcon size={18} /> Jadwal & Kalender
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Kalender</h1>
                            <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                                Lihat agenda, project, dan task dalam tampilan yang lebih rapi. Hover untuk melihat ringkasan cepat, klik tanggal untuk menambah agenda baru.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setShowModal(true)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
                            >
                                <Plus size={18} /> Tambah Kegiatan
                            </button>
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                <Clock3 size={16} /> {upcomingEvents.length} agenda terdekat
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:p-5 backdrop-blur-sm">
                            <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em] text-slate-300">Total</p>
                            <p className="mt-1.5 sm:mt-3 text-xl sm:text-3xl font-bold">{events.length}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:p-5 backdrop-blur-sm">
                            <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em] text-slate-300">Task</p>
                            <p className="mt-1.5 sm:mt-3 text-xl sm:text-3xl font-bold">{totalTasks}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/8 p-3 sm:p-5 backdrop-blur-sm">
                            <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.24em] text-slate-300">Project</p>
                            <p className="mt-1.5 sm:mt-3 text-xl sm:text-3xl font-bold">{totalProjects}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div ref={calendarWrapperRef} className="min-w-0 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Kalender Bulanan</h2>
                            <p className="mt-1 text-sm text-slate-500">Klik tanggal untuk membuat agenda baru atau klik event untuk melihat detail.</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
                            Total jadwal: <span className="font-semibold text-slate-900">{events.length}</span>
                        </div>
                    </div>

                    <div className="calendar-shell mt-5 overflow-hidden rounded-[28px] border border-slate-200">
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={events}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            dayCellDidMount={handleDayCellDidMount}
                            displayEventTime={false}
                            height="auto"
                            fixedWeekCount={false}
                            firstDay={1}
                            dayMaxEventRows={3}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth',
                            }}
                            buttonText={{
                                today: 'Hari Ini',
                                month: 'Bulan',
                            }}
                            titleFormat={{ month: 'long', year: 'numeric' }}
                            dayHeaderFormat={{ weekday: 'short' }}
                            moreLinkContent={(args) => `+${args.num} lainnya`}
                            eventClassNames={(eventInfo) => {
                                const type = eventInfo.event.extendedProps?.type || 'default';
                                const style = getEventStyle(type);
                                return [
                                    'calendar-event-card',
                                    style.chip,
                                ];
                            }}
                            eventContent={(eventInfo) => {
                                const type = eventInfo.event.extendedProps?.type || 'default';
                                const isDeadline = type === 'task' || type === 'project';

                                // Deadlines get a red dot, custom events get a green dot
                                const dotColorClass = isDeadline
                                    ? 'bg-rose-500 ring-2 ring-rose-200'
                                    : 'bg-emerald-500 ring-2 ring-emerald-100';

                                // Task deadlines get "Deadline: " prepended
                                const displayTitle = type === 'task'
                                    ? `Deadline: ${eventInfo.event.title}`
                                    : eventInfo.event.title;

                                return (
                                    <div className="calendar-event-wrapper flex items-center gap-2 rounded-xl px-2 py-1.5 w-full">
                                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotColorClass}`} />
                                        <span className="event-title truncate text-[0.8rem] font-semibold">{displayTitle}</span>
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Upcoming Agenda</h3>
                                <p className="mt-1 text-sm text-slate-500">Agenda terdekat yang akan datang.</p>
                            </div>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {upcomingEvents.length} item
                            </span>
                        </div>

                        <div className="mt-5 space-y-3">
                            {upcomingEvents.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                                    Belum ada agenda terdekat. Tambahkan kegiatan baru dulu.
                                </div>
                            ) : (
                                upcomingEvents.map((event) => {
                                    const style = getEventStyle(event.extendedProps?.type);
                                    const dateValue = getEventDate(event);

                                    return (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={() => openEventDetail(event)}
                                            className="group w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-slate-900 transition group-hover:text-slate-950">{event.title}</p>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                                                            <BadgeInfo size={12} />
                                                            {formatDate(dateValue, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 ${style.chip}`}>
                                                            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                                            {style.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                                    Detail
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">

                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span>Task</span>
                                </div>
                                <CheckCircle2 size={16} className="text-blue-500" />
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="h-3 w-3 rounded-full bg-violet-500" />
                                    <span>Project</span>
                                </div>
                                <FolderKanban size={16} className="text-violet-500" />
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                                    <span>Event</span>
                                </div>
                                <BadgeInfo size={16} className="text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {tooltip && (
                <div
                    style={{ left: tooltip.x, top: tooltip.y }}
                    className="fixed z-50 -translate-x-1/2 max-w-[280px] rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-2xl"
                >
                    <p className="font-semibold text-slate-900 truncate">{tooltip.total > 1 ? `${tooltip.total} agenda hari ini` : tooltip.items[0]?.title}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 truncate">{tooltip.items[0]?.type || 'Agenda'}</p>
                    <p className="text-xs text-slate-500 truncate">{formatDate(tooltip.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {tooltip.items[0]?.link && tooltip.total === 1 && (
                        <p className="mt-1 text-xs text-blue-600 truncate font-medium flex items-center gap-1">
                            <LinkIcon size={10} /> {tooltip.items[0].link}
                        </p>
                    )}
                    {tooltip.total > 1 && (
                        <div className="mt-2 space-y-1">
                            {tooltip.items.map((item, index) => (
                                <div key={index} className="text-xs text-slate-700">
                                    <p className="truncate font-medium">• {item.title}</p>
                                    {item.link && (
                                        <p className="pl-2.5 text-[10px] text-blue-600 truncate flex items-center gap-1">
                                            <LinkIcon size={8} /> {item.link}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 text-slate-800 shadow-2xl">
                    <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
                    <p className="text-sm font-bold text-slate-700">{toast.message}</p>
                </div>
            )}

            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Detail Jadwal</h2>
                                <p className="mt-1 text-sm text-slate-500">Informasi lengkap dari event yang dipilih.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedEvent.type === 'event' && (
                                    <button
                                        onClick={openEditEvent}
                                        className="rounded-2xl bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
                                        aria-label="Edit event"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={() => { setSelectedEvent(null); setEditingEvent(false); }}
                                    className="rounded-2xl bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
                                    aria-label="Tutup detail jadwal"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4 text-slate-700">
                            {editingEvent ? (
                                <form onSubmit={submitEditEvent} className="space-y-3">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Judul</label>
                                        <input value={editEventData.title} onChange={(e) => setEditEventData({ ...editEventData, title: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Tanggal</label>
                                        <input type="date" value={editEventData.event_date} onChange={(e) => setEditEventData({ ...editEventData, event_date: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Deskripsi</label>
                                        <textarea value={editEventData.description} onChange={(e) => setEditEventData({ ...editEventData, description: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" rows={3} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Link Pertemuan</label>
                                        <input value={editEventData.link} onChange={(e) => setEditEventData({ ...editEventData, link: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="https://..." />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setEditingEvent(false)} className="px-4 py-2 rounded-2xl border text-sm">Batal</button>
                                        <button type="submit" className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm">Simpan</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] ring-1 ${getEventStyle(selectedEvent.type).chip}`}>
                                                {getEventStyle(selectedEvent.type).label}
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Judul</p>
                                        <p className="mt-1.5 text-lg font-semibold text-slate-900">{selectedEvent.title}</p>
                                    </div>
                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Tanggal</p>
                                        <p className="mt-2 text-slate-900">
                                            {formatDate(selectedEvent.date, {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    {selectedEvent.description && (
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Deskripsi</p>
                                            <p className="mt-2 whitespace-pre-line text-slate-700">{selectedEvent.description}</p>
                                        </div>
                                    )}
                                    {selectedEvent.link && (
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Link Pertemuan / Meeting</p>
                                            <p className="mt-2">
                                                <a href={selectedEvent.link.startsWith('http') ? selectedEvent.link : `https://${selectedEvent.link}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:underline">
                                                    <LinkIcon size={14} /> Buka Link Meeting
                                                </a>
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm md:px-6">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Tambah Kegiatan Baru</h2>
                                <p className="mt-1 text-sm text-slate-500">Tambahkan agenda custom yang ingin ditampilkan di kalender.</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-2xl bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
                                aria-label="Tutup form kegiatan"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900">Tanggal terpilih</p>
                            <p className="mt-1">
                                {selectedDate
                                    ? formatDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                    : 'Belum ada tanggal yang dipilih'}
                            </p>
                        </div>

                        <form onSubmit={handleSaveEvent} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-800">Nama Kegiatan</label>
                                <input
                                    type="text"
                                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="Contoh: Bimbingan Skripsi Bab 4"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-800">Tanggal</label>
                                <input
                                    type="date"
                                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    value={newEvent.event_date}
                                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-800">Deskripsi</label>
                                <textarea
                                    rows={3}
                                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="Opsional, tuliskan detail agenda..."
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-800">Link Kegiatan (Contoh: Zoom, Google Meet)</label>
                                <input
                                    type="text"
                                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="Contoh: https://meet.google.com/abc-defg-hij"
                                    value={newEvent.link}
                                    onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-3xl border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                >
                                    Simpan Kegiatan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
