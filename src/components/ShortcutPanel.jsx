import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Pencil, X, Check, GripVertical } from 'lucide-react';

function faviconUrl(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function ShortcutIcon({ shortcut, size = 'md' }) {
    const [failed, setFailed] = useState(false);
    const box = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
    const text = size === 'sm' ? 'text-xs' : 'text-sm';

    if (failed) {
        return (
            <div className={`flex ${box} items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 ${text} font-bold text-white shadow-sm`}>
                {shortcut.name.charAt(0).toUpperCase()}
            </div>
        );
    }

    return (
        <img
            src={faviconUrl(shortcut.domain)}
            alt={shortcut.name}
            className={`${box} rounded-lg object-contain`}
            onError={() => setFailed(true)}
        />
    );
}

function ShortcutSkeleton() {
    return (
        <div className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] border border-slate-100 animate-pulse">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200" />
            <div className="h-4 w-24 rounded-lg bg-slate-200" />
        </div>
    );
}

function ShortcutEditModal({ catalog, selectedIds, onClose, onSave, saving }) {
    const [draft, setDraft] = useState(new Set(selectedIds));

    const toggle = (id) => {
        setDraft((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSave = () => onSave([...draft]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Atur Shortcut</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Centang app yang ingin ditampilkan.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
                        aria-label="Tutup"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto px-4 py-4 space-y-2">
                    {catalog.map((item) => {
                        const checked = draft.has(item.id);
                        return (
                            <label
                                key={item.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 shadow-sm border transition ${
                                    checked
                                        ? 'border-blue-200 bg-blue-50/70 shadow-[0_2px_12px_rgba(59,130,246,0.1)]'
                                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(item.id)}
                                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
                                    <ShortcutIcon shortcut={item} size="sm" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{item.domain}</p>
                                </div>
                            </label>
                        );
                    })}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-70"
                    >
                        {saving ? 'Menyimpan...' : <><Check size={16} /> Simpan</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ShortcutPanel() {
    const [catalog, setCatalog] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [draggedIndex, setDraggedIndex] = useState(null);

    useEffect(() => {
        const fetchShortcuts = async () => {
            try {
                const response = await api.get('/shortcuts');
                setCatalog(response.data.catalog || []);
                setSelectedIds(response.data.selectedIds || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal memuat shortcut.');
            } finally {
                setLoading(false);
            }
        };
        fetchShortcuts();
    }, []);

    const selectedShortcuts = selectedIds
        .map((id) => catalog.find((s) => s.id === id))
        .filter(Boolean);

    const handleSave = async (ids) => {
        setSaving(true);
        setError('');
        try {
            const response = await api.put('/shortcuts', { selectedIds: ids });
            setSelectedIds(response.data.selectedIds);
            setEditOpen(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan shortcut.');
        } finally {
            setSaving(false);
        }
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const reordered = [...selectedIds];
        const draggedId = reordered[draggedIndex];
        
        reordered.splice(draggedIndex, 1);
        reordered.splice(index, 0, draggedId);
        
        setDraggedIndex(index);
        setSelectedIds(reordered);
    };

    const handleDragEnd = async () => {
        setDraggedIndex(null);
        try {
            await api.put('/shortcuts', { selectedIds });
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan urutan shortcut.');
        }
    };

    return (
        <>
            <aside className="sticky top-8 w-full xl:w-[300px] shrink-0">
                <div className="rounded-3xl bg-white/80 backdrop-blur-sm p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-slate-200/80">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Shortcut</h2>
                        <button
                            type="button"
                            onClick={() => setEditOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-sm hover:bg-slate-200 hover:text-slate-700 active:scale-95 transition"
                            title="Atur shortcut"
                            aria-label="Atur shortcut"
                        >
                            <Pencil size={18} strokeWidth={2.25} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-2.5">
                            <ShortcutSkeleton />
                            <ShortcutSkeleton />
                            <ShortcutSkeleton />
                        </div>
                    ) : selectedShortcuts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                            <p className="text-sm text-slate-500">Belum ada shortcut.</p>
                            <button
                                type="button"
                                onClick={() => setEditOpen(true)}
                                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                <Pencil size={14} /> Tambah shortcut
                            </button>
                        </div>
                    ) : (
                        <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                            <ul className="space-y-3">
                                {selectedShortcuts.map((shortcut, index) => (
                                    <li
                                        key={shortcut.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-2 transition-opacity duration-200 ${draggedIndex === index ? 'opacity-40' : ''}`}
                                    >
                                        <a
                                            href={shortcut.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 group flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[0_1px_8px_rgba(15,23,42,0.05)] border border-slate-100 hover:shadow-[0_3px_14px_rgba(59,130,246,0.1)] hover:border-blue-100 hover:-translate-y-px active:translate-y-0 transition-all duration-200"
                                            title={`Buka ${shortcut.name}`}
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-1.5 ring-1 ring-slate-100 group-hover:bg-blue-50/80 group-hover:ring-blue-100 transition">
                                                <ShortcutIcon shortcut={shortcut} />
                                            </div>
                                            <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors text-sm truncate">
                                                {shortcut.name}
                                            </span>
                                        </a>

                                        {/* Drag Handle */}
                                        <div
                                            className="flex h-10 w-8 cursor-grab active:cursor-grabbing items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0"
                                            title="Tarik untuk mengubah urutan"
                                        >
                                            <GripVertical size={18} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </aside>

            {editOpen && (
                <ShortcutEditModal
                    catalog={catalog}
                    selectedIds={selectedIds}
                    onClose={() => setEditOpen(false)}
                    onSave={handleSave}
                    saving={saving}
                />
            )}
        </>
    );
}
