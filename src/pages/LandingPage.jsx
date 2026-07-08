import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    CheckSquare, Folder, Brain, Calendar, Users, Zap,
    ArrowRight, Sparkles, Shield, BarChart3, Clock, ChevronDown
} from 'lucide-react';

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [visibleSections, setVisibleSections] = useState({});

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisibleSections(prev => ({ ...prev, [entry.target.id]: true }));
                    }
                });
            },
            { threshold: 0.15 }
        );

        document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const features = [
        {
            icon: <Brain size={24} />,
            title: 'AI Smart Task Creation',
            desc: 'Ketik perintah dalam bahasa sehari-hari, AI akan mengekstrak dan membuat tugas terstruktur secara otomatis.',
            color: 'from-violet-500 to-purple-600',
            bg: 'bg-violet-50',
            iconColor: 'text-violet-600'
        },
        {
            icon: <Zap size={24} />,
            title: 'AI Task Breakdown',
            desc: 'Pecah tugas besar menjadi sub-tugas kecil yang actionable hanya dalam hitungan detik.',
            color: 'from-amber-500 to-orange-600',
            bg: 'bg-amber-50',
            iconColor: 'text-amber-600'
        },
        {
            icon: <BarChart3 size={24} />,
            title: 'Prioritas Otomatis',
            desc: 'Algoritma Weighted Scoring menentukan prioritas tugas berdasarkan deadline dan status secara real-time.',
            color: 'from-blue-500 to-cyan-600',
            bg: 'bg-blue-50',
            iconColor: 'text-blue-600'
        },
        {
            icon: <Users size={24} />,
            title: 'Kolaborasi Tim',
            desc: 'Undang anggota tim, tugaskan pekerjaan, dan dapatkan notifikasi real-time saat ada progress.',
            color: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50',
            iconColor: 'text-emerald-600'
        },
        {
            icon: <Calendar size={24} />,
            title: 'Kalender Interaktif',
            desc: 'Visualisasi jadwal dengan kalender drag-and-drop, lengkap dengan link meeting.',
            color: 'from-rose-500 to-pink-600',
            bg: 'bg-rose-50',
            iconColor: 'text-rose-600'
        },
        {
            icon: <Folder size={24} />,
            title: 'Project Tracking',
            desc: 'Pantau progress proyek dengan progress bar visual dan kelola referensi link bersama tim.',
            color: 'from-slate-500 to-slate-700',
            bg: 'bg-slate-50',
            iconColor: 'text-slate-600'
        },
    ];

    const stats = [
        { value: 'AI', label: 'Powered by Groq' },
        { value: 'Real-time', label: 'Kolaborasi Instan' },
        { value: '100%', label: 'Gratis untuk Tim' },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            {/* ═══════════ NAVBAR ═══════════ */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/85 backdrop-blur-2xl border-b border-slate-200/80 shadow-lg shadow-slate-900/5' : 'bg-transparent'}`}>
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-1 group">
                        <span className={`text-xl font-extrabold tracking-tight transition-all duration-300 group-hover:scale-105 ${scrolled ? 'text-slate-900' : 'text-white'}`}>Taskflow</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link to="/login" className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${scrolled ? 'text-slate-600 hover:text-slate-950' : 'text-slate-300 hover:text-white'}`}>
                            Masuk
                        </Link>
                        <Link to="/register" className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/25 transition-all duration-200 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-95">
                            Daftar Gratis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══════════ HERO SECTION ═══════════ */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
                    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[150px]" />
                </div>

                {/* Grid Pattern */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }} />

                <div className="relative max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-8 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                        <Sparkles size={14} className="animate-pulse" />
                        Diperkuat oleh Kecerdasan Buatan
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                        Kelola Tugas Lebih
                        <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mt-1">
                            Cerdas & Efisien
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                        Taskflow membantu kamu mengelola tugas, proyek, dan jadwal dengan kekuatan AI.
                        Cukup ketik perintahmu, biarkan AI yang bekerja.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
                        <Link to="/register" className="group flex items-center gap-2 px-8 py-3.5 text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-600/25 transition-all duration-300 hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95">
                            Mulai Sekarang
                            <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                        <Link to="/login" className="group flex items-center gap-2 px-8 py-3.5 text-base font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95">
                            Sudah Punya Akun
                        </Link>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-center gap-8 sm:gap-12 animate-fade-in" style={{ animationDelay: '1s', animationFillMode: 'both' }}>
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-600">
                        <ChevronDown size={24} />
                    </div>
                </div>
            </section>

            {/* ═══════════ FEATURES SECTION (Clean White & Slate Accent) ═══════════ */}
            <section className="relative py-28 px-6 bg-white text-slate-900">
                <div className="relative max-w-6xl mx-auto">
                    <div id="features-header" data-animate className={`text-center mb-16 transition-all duration-700 ${visibleSections['features-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Fitur Unggulan</p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                            Semua yang Kamu Butuhkan
                        </h2>
                        <p className="mt-4 text-slate-600 max-w-xl mx-auto">
                            Dari pembuatan tugas otomatis hingga kolaborasi real-time, Taskflow dirancang untuk produktivitas maksimal.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                id={`feature-${i}`}
                                data-animate
                                className={`group relative p-7 rounded-3xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/50 hover:border-slate-300 transition-all duration-500 hover:-translate-y-1 ${visibleSections[`feature-${i}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                {/* Gradient glow on hover */}
                                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                <div className="relative">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${f.bg} ${f.iconColor} mb-5 transition-transform duration-300 group-hover:scale-110`}>
                                        {f.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ HOW IT WORKS ═══════════ */}
            <section className="relative py-28 px-6">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900/30" />

                <div className="relative max-w-5xl mx-auto">
                    <div id="how-header" data-animate className={`text-center mb-16 transition-all duration-700 ${visibleSections['how-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3">Cara Kerja</p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                            Tiga Langkah Sederhana
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Daftar & Buat Project',
                                desc: 'Buat akun gratis dalam hitungan detik, lalu buat project pertamamu.',
                                icon: <Shield size={28} />
                            },
                            {
                                step: '02',
                                title: 'Ketik Perintah ke AI',
                                desc: '"Buat tugas meeting besok jam 10 dan submit laporan hari Jumat."',
                                icon: <Sparkles size={28} />
                            },
                            {
                                step: '03',
                                title: 'Kelola & Kolaborasi',
                                desc: 'Tugaskan ke anggota tim, pantau progress, dan lihat prioritas otomatis.',
                                icon: <CheckSquare size={28} />
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                id={`step-${i}`}
                                data-animate
                                className={`relative text-center p-8 transition-all duration-700 ${visibleSections[`step-${i}`] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${i * 150}ms` }}
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6">
                                    {item.icon}
                                </div>
                                <p className="text-xs font-bold text-blue-400 tracking-widest mb-2">{item.step}</p>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ CTA SECTION ═══════════ */}
            <section className="relative py-28 px-6">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[150px]" />
                </div>

                <div id="cta-section" data-animate className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${visibleSections['cta-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
                        Siap Meningkatkan Produktivitasmu?
                    </h2>
                    <p className="text-slate-400 mb-10 max-w-lg mx-auto">
                        Bergabung sekarang dan rasakan kemudahan mengelola tugas dengan kecerdasan buatan. Gratis selamanya.
                    </p>
                    <Link to="/register" className="group inline-flex items-center gap-2 px-10 py-4 text-base font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl shadow-blue-600/25 transition-all duration-300 hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95">
                        Daftar Gratis Sekarang
                        <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </section>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer className="border-t border-white/5 py-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-extrabold text-white">Taskflow</span>
                    </div>
                    <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} Taskflow. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
