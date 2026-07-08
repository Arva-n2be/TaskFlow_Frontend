import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Settings as SettingsIcon, Mail, MessageCircle, Save } from 'lucide-react';

export default function Settings() {
    const [settings, setSettings] = useState({
        email: '',
        whatsapp_number: '',
        notif_email: false,
        notif_whatsapp: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/settings');
                // Mengubah format 1/0 dari database SQL menjadi true/false untuk React
                setSettings({
                    email: res.data.email || '',
                    whatsapp_number: res.data.whatsapp_number || '',
                    notif_email: res.data.notif_email === 1,
                    notif_whatsapp: res.data.notif_whatsapp === 1
                });
            } catch (error) {
                console.error("Gagal load settings", error);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await api.put('/settings', settings);
            setMessage('Pengaturan berhasil disimpan!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Gagal menyimpan pengaturan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden">
                <div className="p-6 md:p-8 space-y-4">
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 backdrop-blur">
                        <SettingsIcon size={18} /> Pengaturan Aplikasi
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Pengaturan Akun</h1>
                        <p className="max-w-2xl text-sm leading-6 text-slate-300">
                            Preferensi notifikasi pengingat H-1 sebelum tenggat waktu tugas (deadline) melalui metode pilihan Anda.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6 items-stretch">
                <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Metode Reminder</h2>
                        <p className="text-sm text-slate-500 leading-6 mb-4">
                            Sistem akan secara otomatis memicu pengingat email atau WhatsApp H-1 sebelum tugas berakhir.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-blue-50/50 border border-blue-100 p-4 text-xs text-blue-700 leading-5">
                        Pastikan data email dan nomor WhatsApp sudah benar sebelum mengaktifkan reminder.
                    </div>
                </div>

                <div className="rounded-[32px] bg-white p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                    {message && (
                        <div className={`rounded-2xl p-4 text-sm font-semibold animate-fade-in ${message.includes('berhasil') ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-rose-50 border border-rose-100 text-rose-700'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Setting Email */}
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl"><Mail size={22} /></div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Email Reminder</h3>
                                    <p className="text-xs text-slate-500 mt-1">Kirim ke: <span className="font-semibold text-slate-700">{settings.email}</span></p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={settings.notif_email} onChange={(e) => setSettings({ ...settings, notif_email: e.target.checked })} />
                                <div className="w-11 h-6 bg-slate-350 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Setting WhatsApp */}
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl"><MessageCircle size={22} /></div>
                                <div className="flex-1 min-w-[180px]">
                                    <h3 className="font-bold text-slate-800">WhatsApp Reminder</h3>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 08123456789"
                                        className="mt-2 w-full text-sm px-4 py-2 border border-slate-200 rounded-2xl bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 focus:outline-none font-medium"
                                        value={settings.whatsapp_number}
                                        onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                                    />
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input type="checkbox" className="sr-only peer" checked={settings.notif_whatsapp} onChange={(e) => setSettings({ ...settings, notif_whatsapp: e.target.checked })} />
                                <div className="w-11 h-6 bg-slate-350 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-3xl hover:-translate-y-0.5 hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition flex items-center gap-2 cursor-pointer animate-fade-in"
                            >
                                <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}