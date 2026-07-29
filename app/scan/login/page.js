'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Lock, ArrowLeft, ShieldAlert, LogIn } from 'lucide-react';
import { verifyScannerLogin } from '@/lib/data-service';

export default function ScannerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await verifyScannerLogin(username, password);

      if (!user) {
        setError('Username atau Password scanner salah!');
        setLoading(false);
        return;
      }

      // Save logged in scanner session
      localStorage.setItem('ticketing_active_scanner', JSON.stringify(user));
      router.push('/scan');
    } catch (err) {
      setError('Terjadi kesalahan saat login: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4">
      <header className="py-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </header>

      <main className="max-w-sm w-full mx-auto my-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Login Tiket Scanner</h1>
          <p className="text-xs text-slate-400">Masukkan username & password petugas scanner tiket</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username Scanner</label>
              <input
                type="text"
                required
                placeholder="Masukkan username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="Masukkan password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm text-white transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Memverifikasi...' : 'Masuk ke Scanner Kamera'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2">
            Akun scanner dibuat melalui <Link href="/admin" className="text-sky-400 underline">Dashboard Admin</Link>.
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-600">
        Event Ticket Scanner App
      </footer>
    </div>
  );
}
