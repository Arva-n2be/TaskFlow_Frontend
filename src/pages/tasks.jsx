import { useState, useEffect, useMemo, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import {
    Bot,
    Sparkles,
    Loader2,
    Circle,
    CheckCircle,
    Trash2,
    ListTree,
    Pencil,
    Clock3,
    FolderKanban,
    CheckCircle2,
    AlertTriangle,
    LayoutList,
    Plus,
    Check,
    X,
    GripVertical,
} from 'lucide-react';

const socket = io('https://taskflow-backend-sooty.vercel.app');

function formatDeadline(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Tasks() {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [loadingGemini, setLoadingGemini] = useState(false);
    const [loadingGroq, setLoadingGroq] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [subtasks, setSubtasks] = useState([]);
    const [editingSubtaskId, setEditingSubtaskId] = useState(null);
    const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, taskId: null });
    const [editTaskState, setEditTaskState] = useState({ show: false, task: null });
    const [editTaskData, setEditTaskData] = useState({ title: '', description: '', due_date: '', project_id: '', assignee_id: '' });
    const [groupOrder, setGroupOrder] = useState([]);
    const [draggedGroupIndex, setDraggedGroupIndex] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const [draggedTaskProjectId, setDraggedTaskProjectId] = useState(null);

    const isTaskOverdue = (dueDate) => {
        if (!dueDate) return false;
        const now = new Date();
        const due = new Date(dueDate);
        return due < now;
    };

    const handleTaskDragStart = (e, taskId, projectId) => {
        setDraggedTaskId(taskId);
        setDraggedTaskProjectId(projectId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleTaskDragOver = (e, targetTaskId, targetProjectId) => {
        e.preventDefault();
        if (draggedTaskId === null || draggedTaskId === targetTaskId) return;
        if (draggedTaskProjectId !== targetProjectId) return;

        setTasks(prevTasks => {
            const reordered = [...prevTasks];
            const draggedIndex = reordered.findIndex(t => t.id === draggedTaskId);
            const targetIndex = reordered.findIndex(t => t.id === targetTaskId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                const [draggedTask] = reordered.splice(draggedIndex, 1);
                reordered.splice(targetIndex, 0, draggedTask);
            }
            return reordered;
        });
    };

    const handleTaskDragEnd = async () => {
        if (draggedTaskId === null) return;

        const projectActiveTasks = tasks.filter(t =>
            t.project_id === draggedTaskProjectId &&
            t.status !== 'completed' &&
            !isTaskOverdue(t.due_date)
        );
        const taskIds = projectActiveTasks.map(t => t.id);

        try {
            await api.put('/tasks/reorder', { taskIds });
            showToast('Urutan tugas berhasil diperbarui!', 'success');
        } catch (error) {
            showToast('Gagal menyimpan urutan tugas', 'error');
        }

        setDraggedTaskId(null);
        setDraggedTaskProjectId(null);
    };

    const filterProjectId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('project');
    }, [location.search]);

    const filterType = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('filter');
    }, [location.search]);

    const loadProjectMembers = async (projectId) => {
        if (!projectId) {
            setProjectMembers([]);
            return;
        }
        try {
            const res = await api.get(`/projects/${projectId}/members`);
            setProjectMembers(res.data);
        } catch (error) {
            console.error('Gagal mengambil anggota project:', error);
            setProjectMembers([]);
        }
    };

    useEffect(() => {
        loadProjectMembers(selectedProjectId);
        setSelectedAssigneeId('');
    }, [selectedProjectId]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchTasks = async () => {
        try {
            const response = await api.get('/tasks');
            setTasks(response.data);
        } catch (error) {
            console.error('Gagal mengambil task:', error);
        }
    };

    useEffect(() => {
        fetchTasks();
        api.get('/projects').then((res) => setProjects(res.data)).catch((err) => console.log(err));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const selected = params.get('selected');
        if (selected) {
            setSelectedTaskId(selected);
            setExpandedTaskId(selected);
        }
    }, [location.search]);

    useEffect(() => {
        if (filterProjectId) {
            // Masuk ke "Kamar Project"
            socket.emit('join_project', filterProjectId);
        }

        // Pasang Telinga (Listener) untuk event 'task_status_changed'
        socket.on('task_status_changed', (data) => {
            console.log("Ada update dari teman tim!", data);

            // Ubah state React secara instan TANPA REFRESH
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    String(task.id) === String(data.taskId) ? { ...task, status: data.newStatus } : task
                )
            );

            // Tampilkan toast notifikasi jika yang mengubah adalah user lain
            if (data.updatedBy && data.updatedBy !== user?.name) {
                const actionWord = data.newStatus === 'completed' ? 'menyelesaikan' : 'mengaktifkan kembali';
                showToast(`${data.updatedBy} baru saja ${actionWord} tugas: "${data.taskTitle || 'Tugas'}"`, 'success');
            }
        });

        // Bersihkan koneksi saat pindah halaman atau unmount
        return () => {
            socket.off('task_status_changed');
        };
    }, [filterProjectId, user?.name]);

    const handleSmartCreation = async () => {
        if (!prompt.trim()) return showToast('Tuliskan rencanamu dulu!', 'error');
        setLoadingGemini(true);
        try {
            const aiRes = await api.post('/ai/smart-task', { prompt });
            const generatedTasks = aiRes.data.tasks;

            for (const t of generatedTasks) {
                await api.post('/tasks', {
                    title: t.title,
                    description: t.description,
                    due_date: t.due_date,
                    project_id: selectedProjectId || null,
                    assignee_id: selectedAssigneeId || null,
                });
            }

            setPrompt('');
            fetchTasks();
            showToast('Berhasil! AI telah menambahkan tugas ke daftarmu.', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal memproses AI Smart Creation.', 'error');
        } finally {
            setLoadingGemini(false);
        }
    };

    const handleBreakdown = async (taskId) => {
        setLoadingGroq(true);
        setExpandedTaskId(taskId);
        setSubtasks([]);
        try {
            await api.post('/ai/task-breakdown', { task_id: taskId });
            fetchSubtasks(taskId);
            showToast('Subtasks berhasil di-generate!', 'success');
        } catch (error) {
            showToast('Gagal memecah tugas dengan AI.', 'error');
        } finally {
            setLoadingGroq(false);
        }
    };

    const fetchSubtasks = async (taskId) => {
        try {
            const res = await api.get(`/subtasks/task/${taskId}`);
            setSubtasks(res.data);
            setExpandedTaskId(taskId);
        } catch (error) {
            console.error('Gagal ambil subtask');
        }
    };

    const toggleTaskStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            await api.put(`/tasks/${id}/status`, { status: newStatus });
            fetchTasks();
            showToast(newStatus === 'completed' ? 'Tugas diselesaikan!' : 'Tugas diubah menjadi aktif kembali', 'success');
        } catch (error) {
            showToast('Gagal mengupdate status tugas', 'error');
        }
    };

    const triggerDeleteTask = (id) => {
        setDeleteConfirm({ show: true, taskId: id });
    };

    const openEditTask = (task) => {
        let formattedDate = '';
        if (task.due_date) {
            const d = new Date(task.due_date);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
            }
        }
        loadProjectMembers(task.project_id);
        setEditTaskData({
            title: task.title || '',
            description: task.description || '',
            due_date: formattedDate,
            project_id: task.project_id || '',
            assignee_id: task.assignee_id || '',
        });
        setEditTaskState({ show: true, task });
    };

    const submitEditTask = async () => {
        try {
            await api.put(`/tasks/${editTaskState.task.id}`, editTaskData);
            setEditTaskState({ show: false, task: null });
            fetchTasks();
            showToast('Task berhasil diperbarui!', 'success');
        } catch (error) {
            showToast('Gagal memperbarui task', 'error');
        }
    };

    const confirmDeleteTask = async () => {
        const id = deleteConfirm.taskId;
        setDeleteConfirm({ show: false, taskId: null });
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks();
            showToast('Tugas berhasil dihapus!', 'success');
        } catch (error) {
            showToast('Gagal menghapus tugas', 'error');
        }
    };

    const filterProjectName = useMemo(() => {
        if (!filterProjectId || projects.length === 0) return '';
        const found = projects.find(p => String(p.id) === String(filterProjectId));
        return found ? found.name : '';
    }, [filterProjectId, projects]);

    const filteredTasks = useMemo(() => {
        let result = tasks;
        if (filterProjectId) {
            result = result.filter(task => String(task.project_id) === String(filterProjectId));
        }
        if (filterType === 'active') {
            result = result.filter(task => task.status !== 'completed' && !isTaskOverdue(task.due_date));
        } else if (filterType === 'completed') {
            result = result.filter(task => task.status === 'completed');
        } else if (filterType === 'overdue') {
            result = result.filter(task => task.status !== 'completed' && isTaskOverdue(task.due_date));
        }
        return result;
    }, [tasks, filterProjectId, filterType]);

    const handleAddSubtask = async (taskId) => {
        if (!newSubtaskTitle.trim()) return;
        try {
            await api.post('/subtasks', { task_id: taskId, title: newSubtaskTitle });
            setNewSubtaskTitle('');
            fetchSubtasks(taskId);
            showToast('Subtask berhasil ditambahkan!', 'success');
        } catch (error) {
            showToast('Gagal menambahkan subtask', 'error');
        }
    };

    const handleToggleSubtaskStatus = async (taskId, subtaskId, currentStatus) => {
        try {
            await api.put(`/subtasks/${subtaskId}/status`, { is_completed: !currentStatus });
            fetchSubtasks(taskId);
        } catch (error) {
            showToast('Gagal mengubah status subtask', 'error');
        }
    };

    const handleUpdateSubtaskTitle = async (taskId, subtaskId) => {
        if (!editingSubtaskTitle.trim()) return;
        try {
            await api.put(`/subtasks/${subtaskId}`, { title: editingSubtaskTitle });
            setEditingSubtaskId(null);
            setEditingSubtaskTitle('');
            fetchSubtasks(taskId);
            showToast('Subtask berhasil diperbarui!', 'success');
        } catch (error) {
            showToast('Gagal memperbarui subtask', 'error');
        }
    };

    const handleDeleteSubtask = async (taskId, subtaskId) => {
        try {
            await api.delete(`/subtasks/${subtaskId}`);
            fetchSubtasks(taskId);
            showToast('Subtask berhasil dihapus!', 'success');
        } catch (error) {
            showToast('Gagal menghapus subtask', 'error');
        }
    };

    const groupedTasks = useMemo(() => {
        return Object.entries(
            filteredTasks.reduce((acc, task) => {
                const group = task.project_name || 'Tugas Lepas (Tanpa Project)';
                if (!acc[group]) acc[group] = [];
                acc[group].push(task);
                return acc;
            }, {})
        );
    }, [filteredTasks]);

    useEffect(() => {
        if (groupedTasks.length > 0) {
            const currentGroups = groupedTasks.map(([name]) => name);
            const savedOrderStr = localStorage.getItem(`task_group_order_${user?.id || 'guest'}`);
            if (savedOrderStr) {
                try {
                    const savedOrder = JSON.parse(savedOrderStr);
                    const filteredSaved = savedOrder.filter(name => currentGroups.includes(name));
                    const newGroups = currentGroups.filter(name => !savedOrder.includes(name));
                    setGroupOrder([...filteredSaved, ...newGroups]);
                } catch (e) {
                    setGroupOrder(currentGroups);
                }
            } else {
                setGroupOrder(currentGroups);
            }
        } else {
            setGroupOrder([]);
        }
    }, [groupedTasks, user?.id]);

    const sortedGroupedTasks = useMemo(() => {
        const groupMap = new Map(groupedTasks);
        const ordered = [];
        groupOrder.forEach(name => {
            if (groupMap.has(name)) {
                ordered.push([name, groupMap.get(name)]);
                groupMap.delete(name);
            }
        });
        groupMap.forEach((tasks, name) => {
            ordered.push([name, tasks]);
        });
        return ordered;
    }, [groupedTasks, groupOrder]);

    const handleGroupDragStart = (e, index) => {
        setDraggedGroupIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleGroupDragOver = (e, index) => {
        e.preventDefault();
        if (draggedGroupIndex === null || draggedGroupIndex === index) return;

        const reordered = [...groupOrder];
        const draggedName = reordered[draggedGroupIndex];

        reordered.splice(draggedGroupIndex, 1);
        reordered.splice(index, 0, draggedName);

        setDraggedGroupIndex(index);
        setGroupOrder(reordered);
    };

    const handleGroupDragEnd = () => {
        setDraggedGroupIndex(null);
        localStorage.setItem(`task_group_order_${user?.id || 'guest'}`, JSON.stringify(groupOrder));
    };

    const totalCompleted = useMemo(() => filteredTasks.filter((task) => task.status === 'completed').length, [filteredTasks]);
    const totalPending = useMemo(() => filteredTasks.filter((task) => task.status !== 'completed').length, [filteredTasks]);
    const totalDueSoon = useMemo(() => {
        const today = new Date();
        const limit = new Date();
        limit.setDate(limit.getDate() + 7);

        return filteredTasks.filter((task) => {
            if (!task.due_date) return false;
            const due = new Date(task.due_date);
            return due >= today && due <= limit;
        }).length;
    }, [filteredTasks]);

    const renderTaskCard = (task, isCompleted, isOverdue, pId) => {
        const isExpanded = expandedTaskId === task.id;
        const isDraggingActive = task.status !== 'completed' && !isOverdue;

        return (
            <article
                key={task.id}
                draggable={isDraggingActive}
                onDragStart={isDraggingActive ? (e) => handleTaskDragStart(e, task.id, pId) : undefined}
                onDragOver={isDraggingActive ? (e) => handleTaskDragOver(e, task.id, pId) : undefined}
                onDragEnd={isDraggingActive ? handleTaskDragEnd : undefined}
                className={`overflow-hidden rounded-2xl border shadow-sm transition-all duration-250 ${String(task.id) === String(selectedTaskId)
                    ? 'border-blue-300 bg-slate-50 ring-1 ring-blue-200'
                    : isOverdue
                        ? 'border-rose-200 bg-rose-50/20'
                        : isCompleted
                            ? 'border-slate-100 bg-slate-50/40 opacity-75'
                            : 'border-slate-200 bg-white'
                    } ${isDraggingActive ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedTaskId === task.id ? 'opacity-40 scale-[0.99]' : ''}`}
            >
                <div className="p-3.5 sm:p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                            <div className="flex items-center gap-1.5 shrink-0">
                                {isDraggingActive && (
                                    <GripVertical size={14} className="text-slate-400 cursor-grab shrink-0" />
                                )}
                                <button onClick={() => toggleTaskStatus(task.id, task.status)} className="mt-0.5 shrink-0 transition-transform active:scale-75 duration-200 hover:scale-110">
                                    {isCompleted ? (
                                        <CheckCircle className="text-emerald-500 transition group-hover:text-emerald-600 animate-scale-in" size={20} />
                                    ) : (
                                        <Circle className={isOverdue ? "text-rose-400" : "text-slate-400"} size={20} />
                                    )}
                                </button>
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className={`text-base font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                        {task.title}
                                    </h3>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${isCompleted
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : isOverdue
                                            ? 'bg-rose-50 text-rose-700'
                                            : 'bg-blue-50 text-blue-700'
                                        }`}>
                                        {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Active'}
                                    </span>
                                </div>
                                {task.description && <p className="mt-1 text-xs leading-5 text-slate-600">{task.description}</p>}
                                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                                    {task.project_name && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200">
                                            <FolderKanban size={10} />
                                            {task.project_name}
                                        </span>
                                    )}
                                    {task.assignee_name && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-100">
                                            Assignee: {task.assignee_name}
                                        </span>
                                    )}
                                    {task.due_date && (
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ring-1 transition-colors ${isCompleted
                                            ? 'bg-slate-50 text-slate-500 ring-slate-100'
                                            : isOverdue
                                                ? 'bg-rose-100 text-rose-700 ring-rose-200 font-bold'
                                                : 'bg-rose-50 text-rose-600 ring-rose-100 hover:bg-rose-100'
                                            }`}>
                                            <Clock3 size={10} />
                                            Deadline: {formatDeadline(task.due_date)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                            <button
                                onClick={() => (isExpanded ? setExpandedTaskId(null) : fetchSubtasks(task.id))}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white active:scale-95 duration-150 cursor-pointer"
                            >
                                <ListTree size={14} /> Subtasks
                            </button>
                            <button
                                onClick={() => openEditTask(task)}
                                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-xs text-slate-700 transition hover:bg-slate-100 active:scale-90 duration-150 cursor-pointer"
                                aria-label={`Edit task ${task.title}`}
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={() => triggerDeleteTask(task.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 active:scale-95 duration-150 cursor-pointer"
                            >
                                <Trash2 size={14} /> Hapus
                            </button>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h4 className="font-bold text-slate-900">Langkah-langkah (Subtasks)</h4>
                                <p className="mt-1 text-sm text-slate-500">Pecah task ini menjadi langkah yang lebih kecil agar lebih mudah dikerjakan.</p>
                            </div>
                            <button
                                onClick={() => handleBreakdown(task.id)}
                                disabled={loadingGroq}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                            >
                                {loadingGroq ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                                {loadingGroq ? 'Groq Memproses...' : 'AI Task Breakdown'}
                            </button>
                        </div>

                        <div className="mt-4">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleAddSubtask(task.id);
                                }}
                                className="mb-4 flex gap-2"
                            >
                                <input
                                    type="text"
                                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="Tambah subtask manual..."
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 cursor-pointer"
                                >
                                    <Plus size={16} /> Tambah
                                </button>
                            </form>

                            {loadingGroq ? (
                                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500 italic">
                                    Menghubungkan ke Groq...
                                </p>
                            ) : subtasks.length === 0 ? (
                                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500 italic">
                                    Belum ada subtask. Tambah manual di atas atau gunakan AI Task Breakdown di kanan atas.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {subtasks.map((sub) => {
                                        const isSubCompleted = sub.is_completed === 1 || sub.is_completed === true;
                                        const isSubEditing = editingSubtaskId === sub.id;

                                        return (
                                            <li key={sub.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50/50">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSubtaskStatus(task.id, sub.id, isSubCompleted)}
                                                    className="shrink-0 cursor-pointer"
                                                >
                                                    {isSubCompleted ? (
                                                        <CheckCircle className="text-emerald-500" size={18} />
                                                    ) : (
                                                        <Circle className="text-slate-400" size={18} />
                                                    )}
                                                </button>
                                                {isSubEditing ? (
                                                    <div className="flex flex-1 gap-2">
                                                        <input
                                                            type="text"
                                                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-900 outline-none"
                                                            value={editingSubtaskTitle}
                                                            onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleUpdateSubtaskTitle(task.id, sub.id);
                                                            }}
                                                            autoFocus
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateSubtaskTitle(task.id, sub.id)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingSubtaskId(null);
                                                                setEditingSubtaskTitle('');
                                                            }}
                                                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className={`flex-1 ${isSubCompleted ? 'line-through text-slate-400 font-medium' : 'text-slate-700 font-medium'}`}>
                                                            {sub.title}
                                                        </span>
                                                        <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingSubtaskId(sub.id);
                                                                    setEditingSubtaskTitle(sub.title);
                                                                }}
                                                                className="p-1.5 text-slate-500 hover:bg-slate-150 rounded-lg transition cursor-pointer"
                                                                aria-label="Edit subtask"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSubtask(task.id, sub.id)}
                                                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                                aria-label="Hapus subtask"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </article>
        );
    };

    const selectedTask = useMemo(() => tasks.find((task) => String(task.id) === String(selectedTaskId)), [tasks, selectedTaskId]);

    return (
        <div className="space-y-6">
            <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden">
                <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
                            <Sparkles size={18} /> AI Task Manager
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Manajemen Tugas</h1>
                            <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                                Kelola task harian, pecah jadi subtasks, dan gunakan AI untuk mempercepat penyusunan rencana kerja.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                <LayoutList size={16} /> {tasks.length} total task
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                <Clock3 size={16} /> {totalDueSoon} due dalam 7 hari
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Total</p>
                            <p className="mt-3 text-3xl font-bold">{tasks.length}</p>
                        </div>
                        <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Aktif</p>
                            <p className="mt-3 text-3xl font-bold">{totalPending}</p>
                        </div>
                        <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Selesai</p>
                            <p className="mt-3 text-3xl font-bold">{totalCompleted}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form AI Task Builder */}
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">AI Task Builder</h2>
                        <p className="mt-1 text-sm text-slate-500">Tulis rencana singkat, lalu biarkan AI menyusunnya menjadi task yang lebih rapi.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <Bot className="text-blue-600" size={18} /> Smart creation + breakdown
                    </div>
                </div>

                <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Project tujuan</label>
                            <select
                                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                            >
                                <option value="">Tanpa Project (Tugas Lepas)</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Assignee (Penanggung Jawab)</label>
                            <select
                                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                                value={selectedAssigneeId}
                                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                                disabled={!selectedProjectId}
                            >
                                <option value="">Pilih Anggota Project (Opsional)</option>
                                {projectMembers.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 lg:flex-row">
                        <textarea
                            className="flex-1 min-h-[140px] resize-none rounded-3xl border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            rows="2"
                            placeholder="Contoh: Besok revisi skripsi bab 1 pagi, sore olahraga 30 menit, lalu rapikan catatan..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <button
                            onClick={handleSmartCreation}
                            disabled={loadingGemini}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-blue-600 px-6 py-4 text-white font-semibold shadow-lg shadow-blue-500/10 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto"
                        >
                            {loadingGemini ? <Loader2 className="animate-spin" /> : <Bot />}
                            {loadingGemini ? 'AI Berpikir...' : 'Generate AI'}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`grid gap-6 ${selectedTask ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : 'grid-cols-1'}`}>
                <div className="space-y-6 min-w-0">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <FolderKanban className="text-blue-600" size={20} />
                                <span className="font-bold text-slate-800">Filter Berdasarkan Project</span>
                            </div>
                            <select
                                value={filterProjectId || ''}
                                onChange={(e) => {
                                    const params = new URLSearchParams(location.search);
                                    if (e.target.value) {
                                        params.set('project', e.target.value);
                                    } else {
                                        params.delete('project');
                                    }
                                    navigate(`/tasks?${params.toString()}`);
                                }}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                            >
                                <option value="">Semua Project</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {(filterProjectId || (filterType && filterType !== 'all')) && (
                            <div className="flex items-center justify-between rounded-3xl bg-blue-50 border border-blue-100 px-6 py-4 text-blue-800 shadow-sm animate-fade-in">
                                <span className="text-sm font-semibold">
                                    Menampilkan {filterType === 'active' ? 'tugas aktif' : filterType === 'completed' ? 'tugas selesai' : filterType === 'overdue' ? 'tugas terlambat' : 'tugas'}
                                    {filterProjectId && <> untuk project: <strong className="text-blue-900">{filterProjectName || 'Loading...'}</strong></>}
                                </span>
                                <button
                                    onClick={() => navigate('/tasks')}
                                    className="rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm border border-blue-200 transition hover:bg-slate-50 cursor-pointer"
                                >
                                    Tampilkan Semua
                                </button>
                            </div>
                        )}
                        {filteredTasks.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                                <p className="text-lg font-semibold text-slate-900">Belum ada tugas</p>
                                <p className="mt-2 text-sm text-slate-500">Mulai dengan menulis rencana kerja di panel AI di atas.</p>
                            </div>
                        ) : (
                            sortedGroupedTasks.map(([groupName, groupTasks], index) => {
                                const pId = groupTasks[0]?.project_id || null;
                                const activeTasks = groupTasks.filter(t => t.status !== 'completed' && !isTaskOverdue(t.due_date));
                                const overdueTasks = groupTasks.filter(t => t.status !== 'completed' && isTaskOverdue(t.due_date));
                                const completedTasks = groupTasks.filter(t => t.status === 'completed');

                                return (
                                    <section
                                        key={groupName}
                                        draggable
                                        onDragStart={(e) => handleGroupDragStart(e, index)}
                                        onDragOver={(e) => handleGroupDragOver(e, index)}
                                        onDragEnd={handleGroupDragEnd}
                                        className={`space-y-4 transition-all duration-200 ${draggedGroupIndex === index ? 'opacity-40 scale-[0.99]' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 group/project">
                                            <h3 className="rounded-full bg-slate-200 px-4 py-1.5 text-sm font-bold text-slate-700 select-none">
                                                {groupName === 'Tugas Lepas (Tanpa Project)' ? 'Tugas Lepas' : `Project: ${groupName}`}
                                            </h3>
                                            <div className="h-px flex-1 bg-slate-200" />

                                            {/* Drag Handle */}
                                            <div
                                                className="flex h-8 w-8 cursor-grab active:cursor-grabbing items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition shrink-0"
                                                title="Tarik untuk mengubah urutan project"
                                            >
                                                <GripVertical size={16} />
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            {/* Aktif */}
                                            {activeTasks.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 select-none">
                                                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                                        Aktif ({activeTasks.length})
                                                    </div>
                                                    <div className="grid gap-2.5">
                                                        {activeTasks.map(task => renderTaskCard(task, false, false, pId))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Terlambat */}
                                            {overdueTasks.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-500 mb-1 select-none">
                                                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                                                        Terlambat ({overdueTasks.length})
                                                    </div>
                                                    <div className="grid gap-2.5">
                                                        {overdueTasks.map(task => renderTaskCard(task, false, true, pId))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Selesai */}
                                            {completedTasks.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-500 mb-1 select-none">
                                                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                                        Selesai ({completedTasks.length})
                                                    </div>
                                                    <div className="grid gap-2.5">
                                                        {completedTasks.map(task => renderTaskCard(task, true, isTaskOverdue(task.due_date), pId))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                );
                            })
                        )}
                    </div>
                </div>

                {selectedTask && (
                    <aside className="space-y-6">
                        <div className="rounded-[32px] border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Detail Task</h3>
                                    <p className="mt-1 text-sm text-slate-500">Tugas yang dipilih dari Dashboard.</p>
                                </div>
                            </div>
                            <div className="mt-5 space-y-4 text-slate-700">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Judul</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{selectedTask.title}</p>
                                </div>
                                {selectedTask.description && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Deskripsi</p>
                                        <p className="mt-2 text-sm text-slate-700">{selectedTask.description}</p>
                                    </div>
                                )}
                                {selectedTask.due_date && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Deadline</p>
                                        <p className="mt-2 text-sm text-slate-700">{formatDeadline(selectedTask.due_date)}</p>
                                    </div>
                                )}
                                {selectedTask.assignee_name && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Assignee</p>
                                        <p className="mt-2 text-sm text-slate-700 font-semibold">{selectedTask.assignee_name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-slide-in flex items-center gap-3 bg-white text-slate-800 px-5 py-4 rounded-2xl shadow-2xl border border-slate-100 max-w-sm">
                    <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
                    <p className="text-sm font-bold text-slate-700">{toast.message}</p>
                </div>
            )}

            {deleteConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-scale-in">
                        <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Hapus Tugas?</h3>
                                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                    Apakah Anda yakin ingin menghapus tugas ini? Semua langkah subtasks di dalamnya juga akan terhapus secara permanen.
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setDeleteConfirm({ show: false, taskId: null })}
                                        className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmDeleteTask}
                                        className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white hover:bg-rose-700 text-sm font-bold shadow-sm shadow-rose-600/30 transition cursor-pointer"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editTaskState.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] p-6 max-w-lg w-full shadow-2xl border border-slate-100">
                        <h3 className="text-xl font-bold mb-3">Edit Task</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-semibold">Judul</label>
                                <input value={editTaskData.title} onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })} className="mt-2 w-full rounded-2xl border px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold">Deskripsi</label>
                                <textarea value={editTaskData.description} onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })} className="mt-2 w-full rounded-2xl border px-3 py-2" rows={4} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold">Due date</label>
                                    <input type="date" value={editTaskData.due_date || ''} onChange={(e) => setEditTaskData({ ...editTaskData, due_date: e.target.value })} className="mt-2 w-full rounded-2xl border px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold">Project</label>
                                    <select
                                        value={editTaskData.project_id || ''}
                                        onChange={(e) => {
                                            const newProjId = e.target.value;
                                            setEditTaskData({ ...editTaskData, project_id: newProjId, assignee_id: '' });
                                            loadProjectMembers(newProjId);
                                        }}
                                        className="mt-2 w-full rounded-2xl border px-3 py-2"
                                    >
                                        <option value="">Tanpa Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold">Assignee</label>
                                <select
                                    value={editTaskData.assignee_id || ''}
                                    onChange={(e) => setEditTaskData({ ...editTaskData, assignee_id: e.target.value })}
                                    className="mt-2 w-full rounded-2xl border px-3 py-2 disabled:opacity-60"
                                    disabled={!editTaskData.project_id}
                                >
                                    <option value="">Pilih Anggota Project (Opsional)</option>
                                    {projectMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setEditTaskState({ show: false, task: null })} className="px-4 py-2 rounded-2xl border">Batal</button>
                                <button onClick={submitEditTask} className="px-4 py-2 rounded-2xl bg-blue-600 text-white">Simpan</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
