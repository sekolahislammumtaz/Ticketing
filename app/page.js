'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Sparkles,
} from 'lucide-react';
import { getEventInfo, getParticipants } from '@/lib/data-service';
import AppLogo from '@/components/Logo';
import SelfServicePortal from '@/components/SelfServicePortal';

export default function HomePage() {
  const [eventInfo, setEventInfo] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3.5">
            <AppLogo className="w-11 h-11 object-contain drop-shadow" />
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-tight">
                KAJIAN YAYASAN MUNAZARAH TICKETING
              </h1>
              <p className="text-xs text-sky-400 font-semibold tracking-wide">
                Portal Pemesanan Tiket Mandiri Wali Murid
              </p>
            </div>
          </div>

          {/* Quick Access Nav Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition shadow-sm"
              title="Portal Admin Acara"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Portal Admin</span>
            </Link>

            <Link
              href="/scan/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 transition shadow-sm"
              title="Scanner Tiket Acara"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scanner Tiket</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-8">
        {/* Ringkasan Info Acara Aktif */}
        {eventInfo && (
          <div className="w-full max-w-5xl mx-auto bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Acara Kajian Aktif
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {eventInfo.name}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-slate-700/80">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>Total Tiket Terbit: <strong className="text-white">{participantCount}</strong></span>
                </div>
                <div className="bg-emerald-500/10 text-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Hadir: <strong className="text-white">{scannedCount}</strong></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                <Calendar className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="truncate">{eventInfo.date || 'Tanggal Segera Diumumkan'}</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                <Clock className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>{eventInfo.time || 'Waktu Segera Diumumkan'}</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="truncate">{eventInfo.location || 'Lokasi Segera Diumumkan'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fitur Utama: Self-Service Ticket Portal */}
        <SelfServicePortal
          eventId={eventInfo?.id}
          eventInfo={eventInfo}
          onTicketClaimed={() => {
            // Reload participant counts
            loadData();
          }}
        />

        {/* Shortcut Quick Cards ke Admin & Scanner */}
        <div className="w-full max-w-5xl mx-auto pt-8 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin"
            className="group rounded-2xl bg-slate-900/50 border border-slate-800/80 p-5 hover:border-sky-500/40 hover:bg-slate-900/80 transition-all flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-500 group-hover:text-slate-950 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm group-hover:text-sky-300 transition-colors">
                Portal Manajemen Admin &rarr;
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola data santri, import Excel, broadcast WhatsApp & kelola akun petugas.
              </p>
            </div>
          </Link>

          <Link
            href="/scan/login"
            className="group rounded-2xl bg-slate-900/50 border border-slate-800/80 p-5 hover:border-emerald-500/40 hover:bg-slate-900/80 transition-all flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                Kamera Scanner Petugas &rarr;
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Login petugas pos pintu masuk untuk scan QR code tiket peserta kajian.
              </p>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>&copy; 2026 Yayasan Munazarah Ticketing</p>
      </footer>
    </div>
  );
}
