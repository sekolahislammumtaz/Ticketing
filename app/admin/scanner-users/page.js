'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, UserPlus, Trash2, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getScannerUsers, addScannerUser, deleteScannerUser } from '@/lib/data-service';

export default function ScannerUsersPage() {
  const [scanners, setScanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    loadScanners();
  }, []);

  async function loadScanners() {
    setLoading(true);
    try {
      const data = await getScannerUsers();
      setScanners(data || []);
    } catch (err) {
      console.error('Failed to load scanner users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddScanner(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username || !password) {
      setErrorMsg('Username dan Password wajib diisi!');
      return;
    }

    try {
      await addScannerUser(username, password, name);
      setSuccessMsg(`Berhasil membuat user tiket scanner: "${username}"`);
      setUsername('');
      setPassword('');
      setName('');
      loadScanners();
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleDeleteScanner(id, uname) {
    if (!confirm(`Hapus akun scanner "${uname}"?`)) return;
    try {
      await deleteScannerUser(id);
      loadScanners();
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-xl text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-sky-400" /> Kelola User Tiket Scanner
              </h1>
              <p className="text-xs text-slate-400">Buat hingga 10 akun petugas scanner tiket (Requirement #7)</p>
            </div>
          </div>

          <div className="text-xs px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
            {scanners.length} / 10 User Aktif
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Form Add Scanner */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Tambah User Scanner Baru</h2>
              <p className="text-xs text-slate-400">Username & password untuk login di halaman scanner mobile</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddScanner} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username *</label>
              <input
                type="text"
                required
                placeholder="scanner1"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password *</label>
              <input
                type="text"
                required
                placeholder="123456"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Petugas / Pintu (Opsional)</label>
              <input
                type="text"
                placeholder="Petugas Gate Utama"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={scanners.length >= 10}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Simpan User Scanner
              </button>
            </div>
          </form>
        </section>

        {/* List of Active Scanner Users */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-400" /> Daftar User Scanner Aktif ({scanners.length})
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3">Nama / Pintu Gate</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                {scanners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Belum ada user scanner yang dibuat.
                    </td>
                  </tr>
                ) : (
                  scanners.map((s, index) => (
                    <tr key={s.id || index} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-sky-300 font-mono">{s.username}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{s.password}</td>
                      <td className="px-4 py-3 text-slate-300">{s.name || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteScanner(s.id, s.username)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Hapus User Scanner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
