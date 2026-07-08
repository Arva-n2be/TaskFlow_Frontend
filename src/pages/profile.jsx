import { useState, useEffect, useContext } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function Profile() {
    const { user, updateUser } = useContext(AuthContext);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                setForm({ name: response.data.name || '', email: response.data.email || '', password: '' });
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal memuat profil.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setSaving(true);
        try {
            const payload = { name: form.name.trim(), email: form.email.trim() };
            if (form.password.trim() !== '') payload.password = form.password.trim();

            const response = await api.put('/auth/me', payload);
            setMessage(response.data.message || 'Profil berhasil diperbarui.');
            setForm((prev) => ({ ...prev, password: '' }));
            updateUser(response.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memperbarui profil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-slate-500">Memuat profil...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden">
                <div className="p-6 md:p-8 space-y-4">
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
                        <User size={18} /> Profil Pengguna
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Kelola Profil</h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-300">
                            Perbarui nama lengkap, email, atau sandi masuk Anda. Perubahan akan segera diterapkan secara langsung.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 items-stretch">
                <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Informasi Akun</h2>
                        <div className="space-y-4 text-slate-600 text-sm">
                            <div className="rounded-2xl bg-white border border-slate-200/60 p-4 shadow-sm">
                                <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Nama</span>
                                <span className="font-semibold text-slate-950 text-base">{user?.name}</span>
                            </div>
                            <div className="rounded-2xl bg-white border border-slate-200/60 p-4 shadow-sm">
                                <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Email</span>
                                <span className="font-semibold text-slate-950 text-base">{user?.email}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 rounded-2xl bg-blue-50/50 border border-blue-100 p-4 text-xs text-blue-700 leading-5">
                        Kosongkan kata sandi pada formulir jika tidak berniat mengubahnya.
                    </div>
                </div>

                <div className="rounded-[32px] bg-white p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                    {message && (
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm font-semibold text-emerald-700 animate-fade-in">{message}</div>
                    )}
                    {error && (
                        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm font-semibold text-rose-700 animate-fade-in">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                            <div className="relative rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                                <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-slate-450"><User size={16} /></div>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full rounded-3xl border-none bg-transparent pl-11 text-slate-900 focus:outline-none font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Alamat Email</label>
                            <div className="relative rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                                <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-slate-450"><Mail size={16} /></div>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full rounded-3xl border-none bg-transparent pl-11 text-slate-900 focus:outline-none font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Kata Sandi Baru</label>
                            <div className="relative rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                                <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-slate-450"><Lock size={16} /></div>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    className="w-full rounded-3xl border-none bg-transparent pl-11 text-slate-900 focus:outline-none font-medium"
                                    placeholder="Kosongkan jika tidak ingin mengubah"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-blue-600 px-6 py-3.5 text-white font-semibold shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 hover:bg-blue-700 transition disabled:opacity-70 cursor-pointer"
                            >
                                {saving ? 'Menyimpan...' : <><CheckCircle2 size={18} /> Simpan Perubahan</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
