import { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { Folder, Plus, Trash2, Calendar, Clock3, LayoutGrid, AlertTriangle, Pencil, UserPlus, Link as LinkIcon, ExternalLink, X, LogOut, Crown, Bell, Check, UserMinus } from 'lucide-react';

function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function Projects() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [deadline, setDeadline] = useState('');
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, projectId: null });
    const [editProjectState, setEditProjectState] = useState({ show: false, project: null });
    const [editProjectData, setEditProjectData] = useState({ name: '', description: '', deadline: '' });
    const [inviteState, setInviteState] = useState({ show: false, projectId: null, email: '' });
    const [addLinkState, setAddLinkState] = useState({ show: false, projectId: null, title: '', url: '' });
    const [projectAlerts, setProjectAlerts] = useState({ invitations: [], notifications: [] });
    const [leaveConfirm, setLeaveConfirm] = useState({ show: false, project: null });

    const currentUserId = user?.id;
    const getUserRole = (project) => project.members?.find((member) => Number(member.id) === Number(currentUserId))?.role;
    const isOwner = (project) => getUserRole(project) === 'owner';
    const projectMembersOnly = (project) => project.members?.filter((member) => member.role !== 'owner') || [];

    const fetchProjectAlerts = async () => {
        try {
            const response = await api.get('/projects/notifications');
            setProjectAlerts(response.data);
        } catch (error) {
            console.error('Gagal mengambil notifikasi project', error);
        }
    };

    const handleAddLink = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${addLinkState.projectId}/links`, {
                title: addLinkState.title,
                url: addLinkState.url
            });
            setAddLinkState({ show: false, projectId: null, title: '', url: '' });
            fetchProjects();
            showToast('Link project berhasil ditambahkan!', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menambahkan link', 'error');
        }
    };

    const handleDeleteLink = async (projectId, linkId) => {
        try {
            await api.delete(`/projects/${projectId}/links/${linkId}`);
            fetchProjects();
            showToast('Link project berhasil dihapus!', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal menghapus link', 'error');
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/projects/${inviteState.projectId}/members`, { email: inviteState.email });
            setInviteState({ show: false, projectId: null, email: '' });
            fetchProjectAlerts();
            showToast(res.data.message || 'Anggota berhasil diundang!', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal mengundang anggota', 'error');
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Gagal mengambil data project', error);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchProjectAlerts();
    }, []);

    const handleInvitationResponse = async (invitationId, action) => {
        try {
            const res = await api.post(`/projects/invitations/${invitationId}/respond`, { action });
            fetchProjects();
            fetchProjectAlerts();
            showToast(res.data.message, 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal memproses undangan', 'error');
        }
    };

    const handleReadNotification = async (notificationId) => {
        try {
            await api.patch(`/projects/notifications/${notificationId}/read`);
            fetchProjectAlerts();
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal memperbarui notifikasi', 'error');
        }
    };

    const handleKickMember = async (projectId, memberId) => {
        if (!window.confirm('Keluarkan anggota ini dari project?')) return;
        try {
            await api.delete(`/projects/${projectId}/members/${memberId}`);
            fetchProjects();
            showToast('Anggota berhasil dikeluarkan.', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal mengeluarkan anggota', 'error');
        }
    };

    const handleLeaveProject = async (project, ownerAction = null) => {
        try {
            const res = await api.post(`/projects/${project.id}/leave`, { ownerAction });
            setLeaveConfirm({ show: false, project: null });
            fetchProjects();
            showToast(res.data.message, 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal keluar dari project', 'error');
        }
    };

    const openLeaveProject = (project) => {
        if (isOwner(project) && projectMembersOnly(project).length > 0) {
            setLeaveConfirm({ show: true, project });
            return;
        }
        if (isOwner(project)) {
            showToast('Owner terakhir tidak bisa keluar tanpa menghapus project atau menambahkan anggota baru.', 'error');
            return;
        }
        if (window.confirm('Keluar dari project ini?')) {
            handleLeaveProject(project);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        try {
            await api.post('/projects', { name, description, deadline });
            setName('');
            setDescription('');
            setDeadline('');
            fetchProjects();
            showToast('Project berhasil dibuat!', 'success');
        } catch (error) {
            showToast('Gagal membuat project.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const triggerDeleteProject = (id) => {
        setDeleteConfirm({ show: true, projectId: id });
    };

    const openEditProject = (project) => {
        let formattedDate = '';
        if (project.deadline) {
            const d = new Date(project.deadline);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
            }
        }
        setEditProjectData({ name: project.name || '', description: project.description || '', deadline: formattedDate });
        setEditProjectState({ show: true, project });
    };

    const submitEditProject = async () => {
        try {
            await api.put(`/projects/${editProjectState.project.id}`, editProjectData);
            setEditProjectState({ show: false, project: null });
            fetchProjects();
            showToast('Project berhasil diperbarui!', 'success');
        } catch (error) {
            showToast('Gagal memperbarui project.', 'error');
        }
    };

    const confirmDeleteProject = async () => {
        const id = deleteConfirm.projectId;
        setDeleteConfirm({ show: false, projectId: null });
        try {
            await api.delete(`/projects/${id}`);
            fetchProjects();
            showToast('Project berhasil dihapus!', 'success');
        } catch (error) {
            showToast('Gagal menghapus project.', 'error');
        }
    };

    const totalProgress = useMemo(() => {
        if (projects.length === 0) return 0;
        return Math.round(projects.reduce((sum, item) => sum + (Number(item.progress) || 0), 0) / projects.length);
    }, [projects]);

    const dueSoonCount = useMemo(() => {
        const limit = new Date();
        limit.setDate(limit.getDate() + 7);
        return projects.filter((project) => {
            if (!project.deadline) return false;
            const date = new Date(project.deadline);
            return date >= new Date() && date <= limit;
        }).length;
    }, [projects]);

    return (
        <div className="space-y-6">
            <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden">
                <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
                            <Folder size={18} /> Project Workspace
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Manajemen Project</h1>
                            <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                                Buat, pantau, dan rapikan project dengan tampilan yang konsisten bersama halaman lain di Taskflow.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                <LayoutGrid size={16} /> {projects.length} total project
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                                <Clock3 size={16} /> {dueSoonCount} deadline dekat
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Total</p>
                            <p className="mt-3 text-3xl font-bold">{projects.length}</p>
                        </div>
                        <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Rata-rata</p>
                            <p className="mt-3 text-3xl font-bold">{totalProgress}%</p>
                        </div>
                        <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Deadline</p>
                            <p className="mt-3 text-3xl font-bold">{dueSoonCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {(projectAlerts.invitations.length > 0 || projectAlerts.notifications.length > 0) && (
                <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-900">
                        <Bell size={18} className="text-blue-600" />
                        <h2 className="text-lg font-bold">Notifikasi Project</h2>
                    </div>
                    <div className="mt-4 space-y-3">
                        {projectAlerts.invitations.map((invitation) => (
                            <div key={invitation.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Undangan join project {invitation.project_name}</p>
                                    <p className="mt-1 text-xs text-slate-600">Dari {invitation.inviter_name} ({invitation.inviter_email})</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleInvitationResponse(invitation.id, 'reject')} className="inline-flex items-center gap-1 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
                                        <X size={14} /> Reject
                                    </button>
                                    <button onClick={() => handleInvitationResponse(invitation.id, 'accept')} className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                                        <Check size={14} /> Accept
                                    </button>
                                </div>
                            </div>
                        ))}
                        {projectAlerts.notifications.map((notification) => (
                            <div key={notification.id} className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-semibold text-slate-800">{notification.message}</p>
                                <button onClick={() => handleReadNotification(notification.id)} className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                    <Check size={14} /> Mengerti
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Form Buat Project Baru */}
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Buat Project Baru</h2>
                        <p className="mt-1 text-sm text-slate-500">Isi nama, deskripsi, dan deadline agar project lebih mudah dipantau.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <Plus className="text-blue-600" size={18} /> Form project
                    </div>
                </div>

                <form onSubmit={handleCreateProject} className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Nama Project</label>
                        <input
                            type="text"
                            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Contoh: Skripsi Taskflow"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Deskripsi Singkat</label>
                        <input
                            type="text"
                            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Target selesai bulan depan..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Target / Deadline</label>
                        <input
                            type="date"
                            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-blue-600 px-5 py-3 text-white font-semibold shadow-lg shadow-blue-500/10 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? 'Menyimpan...' : <><Plus size={18} /> Buat Project</>}
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                        {projects.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                                <p className="text-lg font-semibold text-slate-900">Belum ada project</p>
                                <p className="mt-2 text-sm text-slate-500">Buat project pertama untuk mulai mengelompokkan task.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {projects.map((project) => (
                                    <article
                                        key={project.id}
                                        onClick={(e) => {
                                            if (e.target.closest('button')) return;
                                            navigate(`/tasks?project=${project.id}`);
                                        }}
                                        className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow cursor-pointer hover:border-blue-400 hover:ring-1 hover:ring-blue-100"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900">{project.name}</h3>
                                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                                    {project.description || 'Tidak ada deskripsi singkat'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => setInviteState({ show: true, projectId: project.id, email: '' })}
                                                    disabled={!isOwner(project)}
                                                    className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-blue-50 p-1.5 text-xs text-blue-600 transition hover:bg-blue-100"
                                                    aria-label={`Invite member to project ${project.name}`}
                                                    title="Undang Anggota"
                                                >
                                                    <UserPlus size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setAddLinkState({ show: true, projectId: project.id, title: '', url: '' })}
                                                    className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-blue-50 p-1.5 text-xs text-blue-600 transition hover:bg-blue-100"
                                                    aria-label={`Add link to project ${project.name}`}
                                                    title="Tambah Link"
                                                >
                                                    <LinkIcon size={14} />
                                                </button>
                                                <button
                                                    onClick={() => openEditProject(project)}
                                                    disabled={!isOwner(project)}
                                                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-xs text-slate-700 transition hover:bg-slate-100"
                                                    aria-label={`Edit project ${project.name}`}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => triggerDeleteProject(project.id)}
                                                    disabled={!isOwner(project)}
                                                    className="inline-flex items-center justify-center rounded-xl border border-rose-100 bg-rose-50 p-1.5 text-xs text-rose-600 transition hover:bg-rose-100"
                                                    aria-label={`Hapus project ${project.name}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => openLeaveProject(project)}
                                                    className="inline-flex items-center justify-center rounded-xl border border-amber-100 bg-amber-50 p-1.5 text-xs text-amber-700 transition hover:bg-amber-100"
                                                    aria-label={`Keluar dari project ${project.name}`}
                                                    title="Keluar Project"
                                                >
                                                    <LogOut size={14} />
                                                </button>
                                            </div>
                                        </div>
 
                                        <div className="mt-2.5 rounded-full bg-slate-100 p-0.5">
                                            <div className="h-1.5 rounded-full bg-blue-600 transition-all" style={{ width: `${project.progress}%` }} />
                                        </div>
 
                                        <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-600">
                                            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1">
                                                <Calendar size={12} />
                                                {formatDate(project.deadline)}
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-1">
                                                <span>Progress</span>
                                                <span className="font-semibold text-slate-900">{project.progress}%</span>
                                            </div>
                                        </div>

                                        {project.members && project.members.length > 0 && (
                                            <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                                                <span className="text-[11px] text-slate-500 font-semibold mr-1">Anggota:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {project.members.map((member) => (
                                                        <span
                                                            key={member.id}
                                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                                                                member.role === 'owner'
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                    : 'bg-slate-50 text-slate-700 border-slate-100'
                                                            }`}
                                                            title={`${member.name} (${member.email})`}
                                                        >
                                                            {member.name} {member.role === 'owner' && <Crown size={10} />}
                                                            {isOwner(project) && member.role !== 'owner' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleKickMember(project.id, member.id);
                                                                    }}
                                                                    className="ml-1 text-rose-500 hover:text-rose-700"
                                                                    title="Kick anggota"
                                                                >
                                                                    <UserMinus size={10} />
                                                                </button>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}


                                        {project.links && project.links.length > 0 && (
                                            <div className="mt-2.5 flex items-start gap-1 flex-col">
                                                <span className="text-[11px] text-slate-500 font-semibold">Tautan Proyek:</span>
                                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                    {project.links.map((link) => (
                                                        <div key={link.id} className="inline-flex items-center gap-1 rounded-xl bg-blue-50/50 border border-blue-100/60 px-2.5 py-1 text-[11px] hover:bg-blue-50 transition">
                                                            <a
                                                                href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="font-medium text-blue-700 hover:underline flex items-center gap-1"
                                                            >
                                                                <ExternalLink size={10} />
                                                                {link.title}
                                                            </a>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteLink(project.id, link.id);
                                                                }}
                                                                className="text-slate-400 hover:text-rose-600 transition ml-0.5"
                                                                title="Hapus tautan"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
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
                                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Hapus Project?</h3>
                                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                    Apakah Anda yakin ingin menghapus project ini? Semua tugas dan subtasks di dalamnya juga akan terhapus secara permanen.
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setDeleteConfirm({ show: false, projectId: null })}
                                        className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmDeleteProject}
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

            {editProjectState.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] p-6 max-w-lg w-full shadow-2xl border border-slate-100">
                        <h3 className="text-xl font-bold mb-3">Edit Project</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-semibold">Nama Project</label>
                                <input value={editProjectData.name} onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })} className="mt-2 w-full rounded-2xl border px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold">Deskripsi</label>
                                <input value={editProjectData.description} onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })} className="mt-2 w-full rounded-2xl border px-3 py-2" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold">Deadline</label>
                                <input type="date" value={editProjectData.deadline || ''} onChange={(e) => setEditProjectData({ ...editProjectData, deadline: e.target.value })} className="mt-2 w-full rounded-2xl border px-3 py-2" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setEditProjectState({ show: false, project: null })} className="px-4 py-2 rounded-2xl border">Batal</button>
                                <button onClick={submitEditProject} className="px-4 py-2 rounded-2xl bg-blue-600 text-white">Simpan</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {inviteState.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-in">
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Undang Anggota</h3>
                        <p className="text-slate-500 text-sm mb-4">Masukkan alamat email teman yang ingin diundang ke project ini.</p>
                        <form onSubmit={handleInviteMember} className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Email Anggota</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="contoh@domain.com"
                                    value={inviteState.email}
                                    onChange={(e) => setInviteState({ ...inviteState, email: e.target.value })}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setInviteState({ show: false, projectId: null, email: '' })}
                                    className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-sm transition cursor-pointer"
                                >
                                    Undang
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {addLinkState.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-in">
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Tambah Tautan</h3>
                        <p className="text-slate-500 text-sm mb-4">Masukkan nama tautan dan alamat URL (misal: link repo, Google Drive, doc, dll).</p>
                        <form onSubmit={handleAddLink} className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Nama Tautan</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Repository GitHub, Google Drive"
                                    value={addLinkState.title}
                                    onChange={(e) => setAddLinkState({ ...addLinkState, title: e.target.value })}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700">Alamat URL</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="https://github.com/..."
                                    value={addLinkState.url}
                                    onChange={(e) => setAddLinkState({ ...addLinkState, url: e.target.value })}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAddLinkState({ show: false, projectId: null, title: '', url: '' })}
                                    className="px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-sm transition cursor-pointer"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {leaveConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-in">
                        <h3 className="text-xl font-bold mb-2 text-slate-900">Keluar sebagai Owner?</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Project ini masih punya anggota. Pilih semua anggota dikeluarkan, atau jadikan anggota pertama sebagai owner baru.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleLeaveProject(leaveConfirm.project, 'transfer_first')}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
                            >
                                <Crown size={16} /> Jadikan anggota pertama owner
                            </button>
                            <button
                                onClick={() => handleLeaveProject(leaveConfirm.project, 'kick_all')}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100"
                            >
                                <UserMinus size={16} /> Kick semua anggota
                            </button>
                            <button
                                onClick={() => setLeaveConfirm({ show: false, project: null })}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
