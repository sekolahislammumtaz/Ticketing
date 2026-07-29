'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Calendar, MapPin, Clock, Users, Upload, Download, FileText, FileSpreadsheet, 
  Plus, Trash2, Search, ArrowLeft, CheckCircle2, ShieldCheck, QrCode, RefreshCw, 
  UserPlus, AlertCircle, Database, Lock, Eye, X, Check
} from 'lucide-react';
import { 
  getEventInfo, saveEventInfo, getParticipants, addParticipant, 
  importParticipants, deleteParticipant, clearAllParticipants, isSupabaseConfigured 
} from '@/lib/data-service';
import { generateTicketCode, generateQRCodeDataUrl } from '@/lib/ticket-generator';
import { parseExcelParticipants, exportParticipantsToExcel } from '@/lib/excel-helper';
import { exportTicketsToWord } from '@/lib/docx-exporter';

export default function AdminPage() {
  const [eventInfo, setEventInfo] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
  });
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, HADIR, BELUM

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(null); // participant object
  const [showImportSuccessToast, setShowImportSuccessToast] = useState('');
  const [qrModalDataUrl, setQrModalDataUrl] = useState('');

  // New Participant Form State
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    division: '',
    whatsapp: '',
    email: '',
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const evt = await getEventInfo();
      if (evt) setEventInfo(evt);
      const pts = await getParticipants(evt?.id);
      setParticipants(pts || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Save Event Details Form
  async function handleSaveEvent(e) {
    e.preventDefault();
    setIsSavingEvent(true);
    try {
      const saved = await saveEventInfo(eventInfo);
      setEventInfo(saved);
      alert('Detail Acara berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan detail acara: ' + err.message);
    } finally {
      setIsSavingEvent(false);
    }
  }

  // Handle Excel File Import (Req #4, #5, #1, #2)
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Get set of existing ticket codes to guarantee uniqueness per event
      const existingCodes = new Set(participants.map(p => p.ticket_code));
      
      const parsedList = parseExcelParticipants(arrayBuffer, existingCodes);

      if (parsedList.length === 0) {
        alert('File Excel tidak berisi data peserta yang valid (pastikan ada kolom Nama & Divisi).');
        return;
      }

      const imported = await importParticipants(eventInfo.id, parsedList);
      setShowImportSuccessToast(`Berhasil mengimpor ${imported.length} peserta baru dengan nomor tiket QR unik!`);
      setTimeout(() => setShowImportSuccessToast(''), 5000);

      // Refresh list
      const updatedPts = await getParticipants(eventInfo.id);
      setParticipants(updatedPts);
    } catch (err) {
      console.error('Import error:', err);
      alert('Gagal mengimpor file Excel: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Handle Add Single Participant (Req #12)
  async function handleAddParticipant(e) {
    e.preventDefault();
    if (!newParticipant.name || !newParticipant.division) {
      alert('Nama dan Divisi wajib diisi!');
      return;
    }

    try {
      const existingCodes = new Set(participants.map(p => p.ticket_code));
      const ticketCode = generateTicketCode(existingCodes);

      await addParticipant(eventInfo.id, {
        name: newParticipant.name,
        division: newParticipant.division,
        whatsapp: newParticipant.whatsapp,
        email: newParticipant.email,
        ticket_code: ticketCode,
      });

      setNewParticipant({ name: '', division: '', whatsapp: '', email: '' });
      setShowAddModal(false);

      const updated = await getParticipants(eventInfo.id);
      setParticipants(updated);
    } catch (err) {
      alert('Gagal menambah peserta: ' + err.message);
    }
  }

  // Delete Single Participant (Req #12)
  async function handleDeleteParticipant(id, name) {
    if (!confirm(`Hapus peserta "${name}"?`)) return;
    try {
      await deleteParticipant(id);
      setParticipants(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  }

  // Clear All Participants (Req #12)
  async function handleClearAll() {
    if (!confirm('PERHATIAN: Apakah Anda yakin ingin MENGHAPUS SEMUA data peserta acara ini?')) return;
    try {
      await clearAllParticipants();
      setParticipants([]);
    } catch (err) {
      alert('Gagal menghapus data: ' + err.message);
    }
  }

  // Open QR Code Preview Modal
  async function openQrModal(participant) {
    setShowQrModal(participant);
    const dataUrl = await generateQRCodeDataUrl(participant.ticket_code);
    setQrModalDataUrl(dataUrl);
  }

  // Filter Participants
  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.division?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ticket_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.whatsapp?.includes(searchQuery) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'HADIR') return matchesSearch && p.status === 'Hadir';
    if (statusFilter === 'BELUM') return matchesSearch && p.status !== 'Hadir';
    return matchesSearch;
  });

  const totalHadir = participants.filter(p => p.status === 'Hadir').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-xl text-white flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-sky-400" /> Dashboard Admin Acara
              </h1>
              <p className="text-xs text-slate-400">Pengelolaan Acara, Peserta & Tiket QR Code</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/scanner-users"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs font-semibold hover:bg-sky-500/20 transition-all"
            >
              <Lock className="w-4 h-4 text-sky-400" /> User Scanner (Max 10)
            </Link>

            <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isSupabaseConfigured 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <Database className="w-3 h-3" />
              {isSupabaseConfigured ? 'Supabase Active' : 'Local Storage Mode'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Database Warning / Guide Banner if on Local Storage Mode */}
        {!isSupabaseConfigured && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-200 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-semibold block text-sm">Supabase Belum Dikonfigurasi</strong>
                Aplikasi saat ini berjalan di mode <strong>Local Storage</strong>. Untuk menyambungkan ke database Supabase gratis di Vercel, masukkan <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di file <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300">.env.local</code>. File SQL schema telah disediakan di folder <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-300">supabase/schema.sql</code>.
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Event Info Form (Req #3) */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Detail & Informasi Acara</h2>
                <p className="text-xs text-slate-400">Nama acara, tanggal, jam, dan lokasi tempat pelaksanaan</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveEvent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Acara *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Gathering Tahunan 2026"
                value={eventInfo.name}
                onChange={e => setEventInfo({ ...eventInfo, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Acara *</label>
              <input
                type="date"
                required
                value={eventInfo.date}
                onChange={e => setEventInfo({ ...eventInfo, date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Waktu / Jam *</label>
              <input
                type="text"
                required
                placeholder="Contoh: 08:00 WIB"
                value={eventInfo.time}
                onChange={e => setEventInfo({ ...eventInfo, time: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lokasi Acara *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Grand Ballroom Hall A"
                value={eventInfo.location}
                onChange={e => setEventInfo({ ...eventInfo, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSavingEvent}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2"
              >
                {isSavingEvent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Simpan Detail Acara
              </button>
            </div>
          </form>
        </section>

        {/* Toast Notification for Import */}
        {showImportSuccessToast && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{showImportSuccessToast}</span>
            </div>
            <button onClick={() => setShowImportSuccessToast('')} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section 2: Action Toolbar (Impor Excel, Ekspor Word, Ekspor Excel, Tambah Manual) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action Card 1: Import Excel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">Impor Data Peserta</h3>
              <p className="text-xs text-slate-400">Unggah file Excel (.xlsx) dengan kolom: Nama, Divisi, WA, Email.</p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload-input"
            />
            <label
              htmlFor="excel-upload-input"
              className="w-full cursor-pointer py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 text-center"
            >
              <Upload className="w-4 h-4" /> Impor Excel (.xlsx)
            </label>
          </div>

          {/* Action Card 2: Export Tickets to Word (.docx) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">Ekspor Tiket Word</h3>
              <p className="text-xs text-slate-400">Unduh dokumen Word (.docx) berisi QR code, Nama, Divisi siap cetak.</p>
            </div>

            <button
              onClick={() => exportTicketsToWord(eventInfo, participants)}
              disabled={participants.length === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
            >
              <Download className="w-4 h-4" /> Ekspor Tiket Word (.docx)
            </button>
          </div>

          {/* Action Card 3: Export Data to Excel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">Ekspor Excel Attendance</h3>
              <p className="text-xs text-slate-400">Unduh laporan Excel berisi data lengkap + status kehadiran (Hadir/Belum).</p>
            </div>

            <button
              onClick={() => exportParticipantsToExcel(eventInfo.name, participants)}
              disabled={participants.length === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/20"
            >
              <Download className="w-4 h-4" /> Ekspor Excel (.xlsx)
            </button>
          </div>

          {/* Action Card 4: Add Manual & Quick Stats */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">Tambah Peserta</h3>
              <p className="text-xs text-slate-400">Tambah data 1 peserta secara manual ke sistem.</p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" /> Tambah Peserta Baru
            </button>
          </div>
        </section>

        {/* Section 3: Participants Table & Filter */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" /> Daftar Peserta ({participants.length})
              </h2>
              <p className="text-xs text-slate-400">
                Total Peserta: <strong className="text-white">{participants.length}</strong> | 
                Hadir: <strong className="text-emerald-400">{totalHadir}</strong> | 
                Belum Scan: <strong className="text-slate-400">{participants.length - totalHadir}</strong>
              </p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama, divisi, tiket..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 w-full sm:w-60"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === 'ALL' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('HADIR')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === 'HADIR' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hadir ({totalHadir})
                </button>
                <button
                  onClick={() => setStatusFilter('BELUM')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === 'BELUM' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Belum ({participants.length - totalHadir})
                </button>
              </div>

              {participants.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs transition-colors"
                  title="Hapus Semua Peserta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Nama Peserta</th>
                  <th className="px-4 py-3">Divisi</th>
                  <th className="px-4 py-3">No. WhatsApp</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Kode Tiket (8 Karakter)</th>
                  <th className="px-4 py-3 text-center">Status Scan</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      {participants.length === 0 
                        ? 'Belum ada data peserta. Silakan impor file Excel atau tambah manual.' 
                        : 'Tidak ada data peserta yang cocok dengan pencarian/filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, index) => (
                    <tr key={p.id || index} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white">{p.name}</td>
                      <td className="px-4 py-3 text-slate-300">{p.division || '-'}</td>
                      <td className="px-4 py-3 text-slate-400">{p.whatsapp || '-'}</td>
                      <td className="px-4 py-3 text-slate-400">{p.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-sky-300">
                          {p.ticket_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.status === 'Hadir' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Belum Scanned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openQrModal(p)}
                            className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
                            title="Lihat QR Code Tiket"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteParticipant(p.id, p.name)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Hapus Peserta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal Add Participant */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Tambah Peserta Manual</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Budi Santoso"
                  value={newParticipant.name}
                  onChange={e => setNewParticipant({ ...newParticipant, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Divisi / Bagian *</label>
                <input
                  type="text"
                  required
                  placeholder="IT / Marketing / Tamu"
                  value={newParticipant.division}
                  onChange={e => setNewParticipant({ ...newParticipant, division: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp (Opsional)</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={newParticipant.whatsapp}
                  onChange={e => setNewParticipant({ ...newParticipant, whatsapp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="budi@example.com"
                  value={newParticipant.email}
                  onChange={e => setNewParticipant({ ...newParticipant, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20"
                >
                  Simpan & Generate Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal QR Code Preview */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
              {qrModalDataUrl ? (
                <img src={qrModalDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">Generating QR...</div>
              )}
            </div>

            <div>
              <div className="font-mono text-xl font-bold text-sky-400 tracking-wider mb-1">
                {showQrModal.ticket_code}
              </div>
              <h4 className="font-bold text-white text-lg">{showQrModal.name}</h4>
              <p className="text-xs text-slate-400">Divisi: {showQrModal.division || '-'}</p>
            </div>

            {showQrModal.status === 'Hadir' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Telah Di-Scan (Hadir)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
