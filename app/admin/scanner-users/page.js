'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, UserPlus, Trash2, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getScannerUsers, addScannerUser, deleteScannerUser, SCHOOL_DIVISIONS } from '@/lib/data-service';
import AppLogo, { DivisionLogo } from '@/components/Logo';

export default function ScannerUsersPage() {
  const router = useRouter();
  const [adminSession, setAdminSession] = useState(null);
  const [scanners, setScanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [division, setDivision] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('ticketing_admin_auth') === 'true';
    const savedSession = localStorage.getItem('ticketing_admin_session');
    if (!isAuth) {
      router.push('/admin');
      return;
    }

    let parsed = null;
    if (savedSession) {
      try {
        parsed = JSON.parse(savedSession);
        setAdminSession(parsed);
      } catch (e) {
        // fallback
      }
    }

    const currentDiv = parsed?.isSuperAdmin ? null : (parsed?.division || null);
    setDivision(parsed?.division || 'TK Islam Nazhirah');
    loadScanners(currentDiv);
  }, [router]);

  async function loadScanners(divFilter = null) {
    setLoading(true);
    try {
      const data = await getScannerUsers(divFilter);
      setScanners(data || []);
    } catch (err) {
      console.error('Failed to load scanner users:', err);
    } finally {
      setLoading(false);
    }
  }

  const isSuperAdmin = Boolean(adminSession?.isSuperAdmin);
  const maxLimit = isSuperAdmin ? 10 : 5;
  const currentDivisionName = adminSession?.division || 'Divisi';

  async function handleAddScanner(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username || !password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    const targetDiv = isSuperAdmin ? (division || 'Sekolah Islam Mumtaz') : adminSession?.division;

    try {
      await addScannerUser(username, password, name, targetDiv);
      setSuccessMsg(`User scanner "${username}" (${targetDiv}) berhasil dibuat.`);
      setUsername('');
      setPassword('');
      setName('');
      loadScanners(isSuperAdmin ? null : adminSession?.division);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  async function handleDeleteScanner(id, uname) {
    if (!confirm(`Hapus akun scanner "${uname}"? Akun ini tidak bisa dipakai masuk lagi.`)) return;
    try {
      await deleteScannerUser(id);
      loadScanners(isSuperAdmin ? null : adminSession?.division);
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
            <div className="flex items-center gap-3">
              {adminSession?.isSuperAdmin ? (
                <AppLogo className="w-8 h-8 object-contain drop-shadow" />
              ) : (
                <DivisionLogo division={adminSession?.division} className="w-8 h-8 object-contain drop-shadow" />
              )}
              <div>
                <h1 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                  Kelola user scanner
                </h1>
                <p className="text-xs text-slate-400">
                  {isSuperAdmin ? 'SUPER ADMIN YAYASAN MUNAZARAH' : `ADMIN ${currentDivisionName.toUpperCase()}`}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
            {scanners.length} dari {maxLimit} user
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
              <h2 className="text-lg font-bold text-white">Tambah user scanner</h2>
              <p className="text-xs text-slate-400">
                Maksimal {maxLimit} user scanner untuk {isSuperAdmin ? 'keseluruhan acara' : `divisi ${currentDivisionName}`}
              </p>
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

          <form onSubmit={handleAddScanner} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username *</label>
              <input
                type="text"
                required
                placeholder="scanner_tk1"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama / Pintu *</label>
              <input
                type="text"
                required
                placeholder="Pintu Gerbang TK"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Divisi</label>
              {isSuperAdmin ? (
                <select
                  value={division}
                  onChange={e => setDivision(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {SCHOOL_DIVISIONS.map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-sky-400 font-semibold truncate">
                  {currentDivisionName}
                </div>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={scanners.length >= maxLimit}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Simpan user scanner ({scanners.length}/{maxLimit})
              </button>
            </div>
          </form>
        </section>

        {/* List of Active Scanner Users */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-400" /> Daftar user scanner ({scanners.length})
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3">Nama / Pintu</th>
                  <th className="px-4 py-3">Divisi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                {scanners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Belum ada user scanner. Buat akun pertama lewat formulir di atas.
                    </td>
                  </tr>
                ) : (
                  scanners.map((s, index) => (
                    <tr key={s.id || index} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-sky-300 font-mono">{s.username}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{s.password}</td>
                      <td className="px-4 py-3 text-slate-300">{s.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-950 border border-slate-800 text-purple-300">
                          {s.division || 'Umum / Yayasan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteScanner(s.id, s.username)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Hapus user scanner"
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
