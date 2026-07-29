'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, ShieldCheck, Ticket, Calendar, MapPin, Clock, Users, FileSpreadsheet, FileText, Camera, Database, CheckCircle2 } from 'lucide-react';
import { getEventInfo, getParticipants, isSupabaseConfigured } from '@/lib/data-service';

export default function HomePage() {
  const [eventInfo, setEventInfo] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const evt = await getEventInfo();
        const pts = await getParticipants(evt?.id);
        setEventInfo(evt);
        setParticipantCount(pts.length);
        setScannedCount(pts.filter(p => p.status === 'Hadir').length);
      } catch (err) {
        console.error('Failed to load homepage stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">Event Ticket Pass</h1>
              <p className="text-xs text-sky-400 font-medium">System Ticketing & Scanner QR</p>
            </div>
          </div>

          {/* Database Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isSupabaseConfigured 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <Database className="w-3.5 h-3.5" />
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage Mode'}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold tracking-wide uppercase">
            <QrCode className="w-4 h-4 text-sky-400" /> System Ticketing QR-Code Unik
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Kelola Acara & Scan Tiket <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Lebih Cepat & Mudah</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Impor peserta dari Excel, generate nomor tiket alfanumerik 8 karakter, ekspor ke berkas Word (.docx) siap cetak, dan scan tiket dengan kamera HP.
          </p>
        </div>

        {/* Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full mb-12">
          {/* Admin Portal Card */}
          <Link 
            href="/admin"
            className="group relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 p-8 hover:border-sky-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all"></div>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                Portal Admin Acara
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Input detail acara, impor data peserta dari Excel, generate QR code, ekspor berkas tiket ke Word (.docx) & Excel, serta kelola akun petugas scanner.
              </p>
            </div>
            <div className="flex items-center font-semibold text-sky-400 group-hover:text-sky-300 text-sm gap-2">
              Masuk Dashboard Admin &rarr;
            </div>
          </Link>

          {/* Ticket Scanner Portal Card */}
          <Link 
            href="/scan/login"
            className="group relative rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 p-8 hover:border-emerald-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Kamera Tiket Scanner
              </h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Buka scanner kamera di smartphone untuk memindai QR code tiket peserta saat masuk lokasi acara. Langsung mencatat status "Hadir" di database.
              </p>
            </div>
            <div className="flex items-center font-semibold text-emerald-400 group-hover:text-emerald-300 text-sm gap-2">
              Buka Tiket Scanner &rarr;
            </div>
          </Link>
        </div>

        {/* Current Event Summary Widget */}
        {eventInfo && (
          <div className="max-w-4xl mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Acara Aktif</span>
                <h4 className="text-xl font-bold text-white">{eventInfo.name}</h4>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-slate-700">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Total Peserta: <strong className="text-white">{participantCount}</strong></span>
                </div>
                <div className="bg-emerald-500/10 text-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Hadir: <strong className="text-white">{scannedCount}</strong></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{eventInfo.date || '-'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{eventInfo.time || '-'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{eventInfo.location || '-'}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Event Ticketing System &bull; Deployed on Vercel & Supabase</p>
      </footer>
    </div>
  );
}
