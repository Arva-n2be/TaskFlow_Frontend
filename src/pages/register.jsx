import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Eye, EyeOff, Sparkles, Brain, Calendar, Users } from 'lucide-react';
import api from '../api/axiosConfig';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/register', { name, email, password });
            alert('Registrasi berhasil! Silakan login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal registrasi');
        } finally {
            setLoading(false);
        }
    };

    const perks = [
        { icon: <Brain size={18} />, title: 'AI Powered', desc: 'Buat tugas otomatis dengan perintah bahasa alami' },
        { icon: <Calendar size={18} />, title: 'Kalender Interaktif', desc: 'Visualisasi jadwal lengkap dengan link meeting' },
        { icon: <Users size={18} />, title: 'Tim Kolaboratif', desc: 'Undang anggota dan kelola tugas bersama' },
        { icon: <Sparkles size={18} />, title: 'Gratis Selamanya', desc: 'Nikmati semua fitur tanpa biaya apapun' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-900 overflow-hidden relative flex items-center justify-center px-4 py-10">
            {/* ═══ Background Effects ═══ */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[150px]" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
            }} />

            {/* ═══ Back to Home ═══ */}
            <Link
                to="/"
                className="absolute top-6 left-6 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-slate-300 hover:text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-sm font-medium backdrop-blur-sm"
            >
                <ArrowLeft size={16} /> Halaman Utama
            </Link>

            {/* ═══ Main Card (White & Slate Accent) ═══ */}
            <div className="relative w-full max-w-[920px] grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[32px] bg-white border border-slate-200 shadow-2xl shadow-slate-900/30 overflow-hidden">

                {/* ─── Left Panel: Branding (Soft Violet/Blue Light Gradients) ─── */}
                <div className="relative p-8 lg:p-10 flex flex-col justify-between bg-slate-50 border-r border-slate-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5" />

                    <div className="relative space-y-8">
                        {/* Logo */}
                        <div>
                            <Link to="/" className="text-2xl font-extrabold tracking-tight text-slate-900">Taskflow</Link>
                            <p className="mt-1 text-xs font-semibold text-violet-600 tracking-widest uppercase">Task Management Platform</p>
                        </div>

                        {/* Heading */}
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
                                Bergabung dan
                                <span className="block bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent mt-1">
                                    Mulai Sekarang
                                </span>
                            </h1>
                            <p className="mt-4 text-slate-600 text-sm leading-relaxed max-w-sm">
                                Buat akun gratis Anda dan mulai rasakan kemudahan manajemen tugas modern.
                            </p>
                        </div>

                        {/* Perks */}
                        <div className="space-y-3">
                            {perks.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-slate-700 group">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-slate-200 text-violet-600 shrink-0 mt-0.5 shadow-sm transition-all duration-300">
                                        {item.icon}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-900 transition-colors">{item.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom footer on left panel */}
                    <p className="relative mt-10 text-[11px] text-slate-400 hidden lg:block">
                        &copy; {new Date().getFullYear()} Taskflow. All rights reserved.
                    </p>
                </div>

                {/* ─── Right Panel: Form (Solid White) ─── */}
                <div className="relative p-8 lg:p-10 flex flex-col justify-center bg-white">
                    <div className="relative space-y-6">
                        <div className="text-center lg:text-left">
                            <h2 className="text-xl font-bold text-slate-900">Buat Akun Baru</h2>
                            <p className="mt-1 text-sm text-slate-500">Isi data di bawah untuk mendaftar.</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Lengkap</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-950 text-sm placeholder-slate-400 outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                    placeholder="Nama lengkapmu"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-950 text-sm placeholder-slate-400 outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full px-4 py-3 pr-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-950 text-sm placeholder-slate-400 outline-none transition-all duration-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                        placeholder="Minimal 6 karakter"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/20 transition-all duration-300 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 mt-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus size={18} />
                                        Daftar Sekarang
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-3 text-xs text-slate-400 bg-white">atau</span>
                            </div>
                        </div>

                        <p className="text-center text-sm text-slate-500">
                            Sudah punya akun?{' '}
                            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-500 transition-colors">
                                Masuk
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}