import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Home, CheckSquare, Folder, User, LogOut, Menu, Calendar, Settings } from 'lucide-react';

export default function Layout() {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth < 1024);

    const handleMenuClick = () => {
        if (window.innerWidth < 1024) {
            setIsCollapsed(true);
        }
    };

    // Fungsi untuk menandai menu mana yang sedang aktif
    const isActive = (path) => location.pathname === path ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100';
    const isHome = () => location.pathname === '/dashboard' || location.pathname === '/' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100';

    return (
        <div className="relative flex min-h-screen bg-slate-100 text-slate-900">
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="fixed top-4 left-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-lg shadow-slate-900/5 transition hover:bg-slate-50 active:scale-90 duration-200"
                aria-label={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            >
                <Menu size={22} className="transition-transform duration-300 hover:rotate-90" />
            </button>

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 bottom-0 h-screen bg-white border-slate-200 shadow-sm flex flex-col transition-all duration-300 overflow-hidden z-20 ${isCollapsed ? 'w-0 -translate-x-0 border-r-0' : 'w-60 border-r'}`}>
                {/* Agar lebar konten di dalam sidebar tetap konsisten saat collapse */}
                <div className="w-60 flex flex-col h-full">
                    {/* Brand Header */}
                    <div className="p-5 border-b border-slate-200 h-16 shrink-0 pl-16">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight transition-transform duration-300 hover:scale-102">Taskflow</h2>
                    </div>

                    {/* Menu Navigasi */}
                    <nav className="flex-1 p-4 space-y-2 mt-4">
                        <Link to="/dashboard" onClick={handleMenuClick} className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 active:scale-95 group font-medium ${isActive('/dashboard')}`}>
                            <Home size={20} className="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" /> Dashboard
                        </Link>
                        <Link to="/calendar" onClick={handleMenuClick} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 active:scale-95 group font-medium ${isActive('/calendar')}`}>
                            <Calendar size={20} className="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" /> Calendar
                        </Link>
                        <Link to="/tasks" onClick={handleMenuClick} className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 active:scale-95 group font-medium ${isActive('/tasks')}`}>
                            <CheckSquare size={20} className="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" /> Tasks
                        </Link>
                        <Link to="/projects" onClick={handleMenuClick} className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 active:scale-95 group font-medium ${isActive('/projects')}`}>
                            <Folder size={20} className="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" /> Projects
                        </Link>
                        <Link to="/profile" onClick={handleMenuClick} className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 active:scale-95 group font-medium ${isActive('/profile')}`}>
                            <User size={20} className="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" /> Profile
                        </Link>
                        <Link to="/settings" onClick={handleMenuClick} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 active:scale-95 group font-medium ${isActive('/settings')}`}>
                            <Settings size={20} className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-45" /> Settings
                        </Link>
                    </nav>
                </div>
            </aside>

            {/* Backdrop overlay untuk mobile view saat sidebar terbuka */}
            {!isCollapsed && (
                <div
                    onClick={() => setIsCollapsed(true)}
                    className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-10 lg:hidden transition-opacity duration-300"
                />
            )}

            {/* Area Utama */}
            <div className={`flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ${isCollapsed ? 'ml-0' : 'ml-0 lg:ml-60'}`}>
                {/* Header Navbar */}
                <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0">
                    <div className="flex items-center">
                        <div className="w-10 h-10" />
                    </div>

                    {/* Sisi Kanan: Profil User & Logout */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Logged in as</p>
                            <p className="font-bold text-slate-700 text-sm">{user?.name}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 transition font-semibold text-sm cursor-pointer"
                            title="Logout"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </header>

                {/* Konten Halaman */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-[1500px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}