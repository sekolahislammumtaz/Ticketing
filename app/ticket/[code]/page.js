'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Clock, CheckCircle2, Ticket, QrCode, AlertCircle, Share2, ArrowLeft } from 'lucide-react';
import { getEventInfo, getParticipants } from '@/lib/data-service';
import { generateQRCodeDataUrl } from '@/lib/ticket-generator';
import AppLogo, { DivisionLogo } from '@/components/Logo';

export default function DigitalTicketPage() {
  const params = useParams();
  const ticketCode = params?.code || '';

  const [eventInfo, setEventInfo] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTicketData() {
      if (!ticketCode) return;
      setLoading(true);
      try {
        const evt = await getEventInfo();
        setEventInfo(evt);

        const pts = await getParticipants(evt?.id);
        const found = pts.find(p => p.ticket_code?.trim().toUpperCase() === ticketCode.trim().toUpperCase());

        if (found) {
          setParticipant(found);
          const qr = await generateQRCodeDataUrl(found.ticket_code);
          setQrDataUrl(qr);
        } else {
          setError('Tiket dengan kode itu tidak ditemukan.');
        }
      } catch (err) {
        console.error('Error loading digital ticket:', err);
        setError('Gagal memuat data tiket.');
      } finally {
        setLoading(false);
      }
    }

    loadTicketData();
  }, [ticketCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Memuat e-tiket…</p>
        </div>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Tiket tidak ditemukan</h2>
          <p className="text-xs text-slate-400">{error || 'Kode tiket tidak valid atau belum terdaftar.'}</p>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300">
            <ArrowLeft className="w-3.5 h-3.5" /> Buat tiket baru di beranda
          </Link>
        </div>
      </div>
    );
  }

  const isAkhwat = participant.track === 'Akhwat' || participant.ticket_type === 'Bunda' || participant.ticket_type === 'Akhwat';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <main className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* Ticket Card Container */}
        <div className={`bg-gradient-to-b from-slate-900 to-slate-900/95 border rounded-3xl overflow-hidden shadow-2xl ${
          isAkhwat ? 'border-purple-500/30 shadow-purple-500/10' : 'border-sky-500/30 shadow-sky-500/10'
        }`}>
          
          {/* Top Header */}
          <div className={`p-6 text-center text-white space-y-2 ${
            isAkhwat 
              ? 'bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-950 border-b border-purple-500/30' 
              : 'bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 border-b border-blue-500/30'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <AppLogo className="w-12 h-12 object-contain drop-shadow" />
              {participant.division && (
                <>
                  <span className="text-white/40 font-bold text-lg">/</span>
                  <div className="w-12 h-12 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/10">
                    <DivisionLogo
                      division={participant.division}
                      className="w-full h-full object-contain filter drop-shadow"
                      alt={`Logo ${participant.division}`}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase mb-1">
              <Ticket className="w-3.5 h-3.5" /> E-tiket resmi
            </div>
            <h1 className="text-xl font-black leading-tight">{eventInfo?.name || 'Kajian Akbar Yayasan Munazarah'}</h1>
            
            {/* Entrance Track Indicator */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isAkhwat 
                ? 'bg-purple-500/20 text-purple-200 border-purple-500/40' 
                : 'bg-blue-500/20 text-sky-200 border-blue-500/40'
            }`}>
              {isAkhwat ? 'Jalur akhwat (pintu ungu)' : 'Jalur ikhwan (pintu biru navy)'}
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-6 text-center space-y-4 bg-slate-900/60">
            <div className="bg-white p-4 rounded-2xl inline-block shadow-xl border border-slate-200">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Kode QR tiket" className="w-52 h-52 mx-auto" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">Membuat kode QR…</div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className={`font-mono text-2xl font-black tracking-widest ${
                isAkhwat ? 'text-purple-400' : 'text-sky-400'
              }`}>
                {participant.ticket_code}
              </div>
              <h2 className="text-xl font-bold text-white">{participant.name}</h2>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 shadow-sm">
                  <DivisionLogo division={participant.division} className="w-4 h-4 object-contain inline-block" />
                  {participant.division || '-'}
                </span>
                {participant.class_name && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    Kelas: {participant.class_name}
                  </span>
                )}
                {participant.ticket_type && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isAkhwat ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-blue-500/20 text-sky-300 border-blue-500/40'
                  }`}>
                    {participant.ticket_type}
                  </span>
                )}
              </div>
            </div>

            {/* Attendance Status Badge */}
            {participant.status === 'Hadir' ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Sudah di-scan (hadir)
              </div>
            ) : (
              <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-semibold ${
                isAkhwat 
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                  : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
              }`}>
                <QrCode className="w-4 h-4" /> Siap di-scan di pintu masuk
              </div>
            )}
          </div>

          {/* Event Details Footer Section */}
          <div className="border-t border-slate-800 p-6 bg-slate-950/60 space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>Tanggal: <strong className="text-white">{eventInfo?.date || '-'}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span>Waktu: <strong className="text-white">{eventInfo?.time || '-'}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <span className="truncate">Lokasi: <strong className="text-white">{eventInfo?.location || '-'}</strong></span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Simpan tangkapan layar halaman ini. Tunjukkan kode QR ke petugas di pintu masuk.
        </p>
      </main>

      <footer className="py-4 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Yayasan Munazarah Ticketing
      </footer>
    </div>
  );
}
