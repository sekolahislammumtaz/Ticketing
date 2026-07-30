'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, Clock, CheckCircle2, Ticket, QrCode, AlertCircle, Share2 } from 'lucide-react';
import { getEventInfo, getParticipants } from '@/lib/data-service';
import { generateQRCodeDataUrl } from '@/lib/ticket-generator';

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
          setError('Tiket dengan kode tersebut tidak ditemukan.');
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
          <p className="text-xs text-slate-400">Memuat E-Tiket Digital...</p>
        </div>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Tiket Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400">{error || 'Kode tiket tidak valid atau belum terdaftar.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <main className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* Ticket Card Container */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-900/95 border border-sky-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-sky-500/10">
          
          {/* Top Header */}
          <div className="bg-gradient-to-r from-sky-600 to-blue-700 p-6 text-center text-white space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase mb-1">
              <Ticket className="w-3.5 h-3.5" /> E-Tiket Resmi
            </div>
            <h1 className="text-xl font-black leading-tight">{eventInfo?.name || 'Acara Tiket'}</h1>
          </div>

          {/* QR Code Section */}
          <div className="p-6 text-center space-y-4 bg-slate-900/60">
            <div className="bg-white p-4 rounded-2xl inline-block shadow-xl border border-slate-200">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code Tiket" className="w-52 h-52 mx-auto" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">Generating QR...</div>
              )}
            </div>

            <div className="space-y-1">
              <div className="font-mono text-2xl font-black text-sky-400 tracking-widest">
                {participant.ticket_code}
              </div>
              <h2 className="text-xl font-bold text-white">{participant.name}</h2>
              <p className="text-sm font-semibold text-slate-300">
                Divisi: <strong className="text-sky-300">{participant.division || '-'}</strong>
              </p>
            </div>

            {/* Attendance Status Badge */}
            {participant.status === 'Hadir' ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Telah Di-Scan (Hadir)
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 text-xs font-semibold">
                <QrCode className="w-4 h-4 text-sky-400" /> Siap Di-Scan Saat Masuk
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
          Simpan/Screenshot halaman ini dan tunjukkan QR-Code kepada petugas scanner di pintu masuk acara.
        </p>
      </main>

      <footer className="py-4 text-center text-xs text-slate-600">
        Event Ticket System &bull; Digital E-Pass
      </footer>
    </div>
  );
}
