import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CheckCircle, AlertCircle, Clock, Layout as LayoutIcon, Flame, ArrowRight } from 'lucide-react'; 
import ShortcutPanel from '../components/ShortcutPanel';

// Registrasi komponen Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [priorityTasks, setPriorityTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    // Update tanggal dan jam real-time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Jalankan 2 API secara bersamaan agar cepat
                const [statsRes, priorityRes] = await Promise.all([
                    api.get('/dashboard'),
                    api.get('/dashboard/priority')
                ]);
                setStats(statsRes.data);
                setPriorityTasks(priorityRes.data); // <--- SIMPAN DATA PRIORITAS
            } catch (error) {
                console.error("Gagal mengambil data dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="text-center mt-20 text-xl font-semibold text-gray-500">Memuat Dashboard...</div>;
    if (!stats) return <div className="text-center mt-20 text-red-500">Gagal memuat data.</div>;

    // Data untuk Grafik Donat (Doughnut Chart)
    const chartData = {
        labels: ['Aktif', 'Selesai', 'Terlambat'],
        datasets: [
            {
                data: [stats.task_stats.active, stats.task_stats.completed, stats.task_stats.overdue],
                backgroundColor: ['#3b82f6', '#10b981', '#ef4444'], // Blue, Green, Red
                borderWidth: 0,
            },
        ],
    };

    const isSameDay = (dateA, dateB) =>
        dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate();

    const isTomorrow = (dateA, dateB) => {
        const tomorrow = new Date(dateB);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return isSameDay(dateA, tomorrow);
    };

    const formatPriorityDeadline = (task) => {
        if (!task.due_date) return null;

        const dueDate = new Date(task.due_date);
        const now = new Date();
        const diffTime = dueDate - now;

        if (diffTime < 0) {
            const overdueDays = Math.max(1, Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24)));
            return `Terlambat ${overdueDays} hari`;
        }

        if (isSameDay(dueDate, now)) {
            return 'Deadline Hari Ini';
        }

        if (isTomorrow(dueDate, now)) {
            return 'Deadline Besok';
        }

        return task.days_left != null ? `Deadline H-${task.days_left}` : null;
    };

    return (
        
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8 items-stretch">
            <div className="space-y-8 min-w-0">
                <div className="rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-800 to-blue-700 text-white p-5 md:p-6 shadow-2xl overflow-hidden">
                    <div className="max-w-4xl">
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Dashboard</p>
                        <h1 className="text-3xl font-extrabold mt-2 md:text-4xl">Selamat datang, {user?.name}!</h1>
                        <p className="text-xs text-slate-300 mt-1 md:text-sm">
                            {currentDateTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                        <div onClick={() => navigate('/tasks?filter=all')} className="rounded-2xl sm:rounded-3xl bg-white/10 border border-white/10 p-3 sm:p-5 backdrop-blur-sm hover:scale-105 hover:bg-white/15 hover:shadow-lg hover:border-white/20 transition-all duration-350 cursor-pointer group">
                            <div className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/15 text-blue-200 mb-1.5 sm:mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"><LayoutIcon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                            <p className="text-[10px] sm:text-xs text-slate-300">Total Tasks</p>
                            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{stats.task_stats.total}</p>
                        </div>
                        <div onClick={() => navigate('/tasks?filter=active')} className="rounded-2xl sm:rounded-3xl bg-white/10 border border-white/10 p-3 sm:p-5 backdrop-blur-sm hover:scale-105 hover:bg-white/15 hover:shadow-lg hover:border-white/20 transition-all duration-350 cursor-pointer group">
                            <div className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/15 text-yellow-200 mb-1.5 sm:mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"><Clock className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                            <p className="text-[10px] sm:text-xs text-slate-300">Task Aktif</p>
                            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{stats.task_stats.active}</p>
                        </div>
                        <div onClick={() => navigate('/tasks?filter=completed')} className="rounded-2xl sm:rounded-3xl bg-white/10 border border-white/10 p-3 sm:p-5 backdrop-blur-sm hover:scale-105 hover:bg-white/15 hover:shadow-lg hover:border-white/20 transition-all duration-350 cursor-pointer group">
                            <div className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/15 text-emerald-200 mb-1.5 sm:mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                            <p className="text-[10px] sm:text-xs text-slate-300">Task Selesai</p>
                            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{stats.task_stats.completed}</p>
                        </div>
                        <div onClick={() => navigate('/tasks?filter=overdue')} className="rounded-2xl sm:rounded-3xl bg-white/10 border border-white/10 p-3 sm:p-5 backdrop-blur-sm hover:scale-105 hover:bg-white/15 hover:shadow-lg hover:border-white/20 transition-all duration-350 cursor-pointer group">
                            <div className="inline-flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/15 text-rose-200 mb-1.5 sm:mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"><AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                            <p className="text-[10px] sm:text-xs text-slate-300">Task Terlambat</p>
                            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{stats.task_stats.overdue}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        
                        <h2 className="text-xl font-bold text-gray-800">Today's Priority</h2>
                    </div>

                    {priorityTasks.length === 0 ? (
                        <div className="bg-gray-50 border border-dashed rounded-xl p-6 text-center text-gray-500">
                            Tidak ada tugas yang mendesak. Selamat bersantai! 🎉
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {priorityTasks.map((task, index) => (
                                <button
                                    key={task.id}
                                    type="button"
                                    onClick={() => navigate(`/tasks?selected=${task.id}`)}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] duration-250 group cursor-pointer"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors" title={task.title}>{task.title}</h3>
                                            {formatPriorityDeadline(task) && (
                                                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Clock size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                    <span className="group-hover:text-blue-500 transition-colors">{formatPriorityDeadline(task)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="shrink-0 flex items-center gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${task.color}`}>
                                                    {task.urgencyLabel}
                                                </span>
                                                {index === 0 && (
                                                    <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                                                        KERJAKAN SEKARANG!
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-100 text-slate-400 transition-all duration-300 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 group-hover:translate-x-0.5">
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 transition-transform duration-300 hover:scale-[1.01]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Statistik Tugas</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Distribusi status tugas terbaru.</p>
                            </div>
                        </div>
                        <div className="w-full min-h-[220px] max-h-[240px]">
                            <Doughnut data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } } }} />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 transition-transform duration-300 hover:scale-[1.01]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Project Terbaru</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Total project aktif: {stats.project_stats.total}</p>
                            </div>
                        </div>

                        {stats.project_stats.overview.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">Belum ada project. Buat project pertamamu nanti!</div>
                        ) : (
                            <ul className="space-y-3">
                                {stats.project_stats.overview.map(project => (
                                    <li key={project.id}>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/tasks?project=${project.id}`)}
                                            className="w-full text-left rounded-2xl border border-slate-200 p-4 shadow-sm bg-slate-50 hover:bg-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200 active:scale-[0.99] cursor-pointer block group"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                                                    <p className="text-xs text-slate-500 mt-0.5">{project.description || 'Tidak ada deskripsi singkat'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-flex rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold transition-all group-hover:bg-blue-100">{project.progress}%</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                                <div className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${project.progress}%` }} />
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                
            </div>

            <ShortcutPanel />
        </div>
    );
}