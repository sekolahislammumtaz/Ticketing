'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, LogOut, 
  RotateCw, Volume2, Flashlight, KeyRound, User, Check, RefreshCw 
} from 'lucide-react';
import { scanTicket } from '@/lib/data-service';
import confetti from 'canvas-confetti';
import AppLogo from '@/components/Logo';

export default function TicketScannerPage() {
  const router = useRouter();
  const [activeScannerUser, setActiveScannerUser] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { status: 'SUCCESS'|'USED'|'NOT_FOUND', participant, message }
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const [scanHistory, setScanHistory] = useState([]);

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-viewport';

  useEffect(() => {
    // Check logged in scanner user session
    const sessionStr = localStorage.getItem('ticketing_active_scanner');
    if (!sessionStr) {
      router.push('/scan/login');
      return;
    }
    try {
      const user = JSON.parse(sessionStr);
      setActiveScannerUser(user);
    } catch (e) {
      router.push('/scan/login');
    }
  }, [router]);

  useEffect(() => {
    if (activeScannerUser) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [activeScannerUser, cameraFacing]);

  // Audio Beep Generator using Web Audio API
  function playAudioBeep(type = 'SUCCESS') {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'SUCCESS') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }

      // Haptic Vibration if supported on mobile
      if (navigator.vibrate) {
        navigator.vibrate(type === 'SUCCESS' ? [100, 50, 100] : [300, 100, 300]);
      }
    } catch (e) {
      console.log('Audio API not available:', e);
    }
  }

  async function startScanner() {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: cameraFacing },
        config,
        onQrCodeSuccess,
        onQrCodeError
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setIsScanning(false);
    }
  }

  async function stopScanner() {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping QR scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  }

  const isProcessingRef = useRef(false);
  const lastScanCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);

  // Handle scanned code
  const onQrCodeSuccess = async (decodedText) => {
    processTicketCode(decodedText);
  };

  const onQrCodeError = (error) => {
    // Ignore minor frame read errors
  };

  function pauseScanner() {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.pause(true);
      }
    } catch (e) {
      console.log('Pause scanner error:', e);
    }
  }

  function resumeScanner() {
    try {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.resume();
      }
    } catch (e) {
      console.log('Resume scanner error:', e);
      startScanner();
    }
  }

  async function processTicketCode(codeToScan) {
    const cleanCode = (codeToScan || '').trim().toUpperCase();
    const now = Date.now();

    if (!cleanCode) return;
    if (isProcessingRef.current) return;
    if (lastScanCodeRef.current === cleanCode && now - lastScanTimeRef.current < 4000) return;

    isProcessingRef.current = true;
    lastScanCodeRef.current = cleanCode;
    lastScanTimeRef.current = now;
    setIsProcessing(true);

    // Immediately pause camera feed so no subsequent frames are read while pop-up modal is open
    pauseScanner();

    try {
      const result = await scanTicket(
        cleanCode, 
        activeScannerUser?.name || activeScannerUser?.username || 'Petugas Scanner'
      );

      if (result.success) {
        playAudioBeep('SUCCESS');
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });

        const scanObj = {
          status: 'SUCCESS',
          message: 'Tiket berhasil di Scan', // Requirement 10
          participant: result.participant,
          time: new Date().toLocaleTimeString('id-ID'),
        };

        setScanResult(scanObj);
        setScanHistory(prev => [scanObj, ...prev.slice(0, 9)]);
      } else if (result.reason === 'ALREADY_USED') {
        playAudioBeep('ERROR');

        const scannerName = result.participant?.scanned_by || 'Petugas Scanner';
        const scanObj = {
          status: 'USED',
          message: result.message || `Tiket Sudah Pernah di Scan oleh ${scannerName}`,
          participant: result.participant,
          time: new Date().toLocaleTimeString('id-ID'),
        };

        setScanResult(scanObj);
        setScanHistory(prev => [scanObj, ...prev.slice(0, 9)]);
      } else {
        playAudioBeep('ERROR');

        const scanObj = {
          status: 'NOT_FOUND',
          message: 'Tiket Tidak Ditemukan!',
          code: cleanCode,
          time: new Date().toLocaleTimeString('id-ID'),
        };

        setScanResult(scanObj);
        setScanHistory(prev => [scanObj, ...prev.slice(0, 9)]);
      }
    } catch (err) {
      console.error('Scan processing error:', err);
      resumeScanner();
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }

  function handleCloseModalAndContinue() {
    setScanResult(null);
    resumeScanner();
    setTimeout(() => {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }, 500);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processTicketCode(manualCode);
    setManualCode('');
  }

  function handleSwitchCamera() {
    setCameraFacing(prev => (prev === 'environment' ? 'user' : 'environment'));
  }

  function handleLogout() {
    localStorage.removeItem('ticketing_active_scanner');
    router.push('/scan/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppLogo className="w-8 h-8 object-contain drop-shadow" />
            <div>
              <h1 className="font-bold text-xs text-white leading-tight">KAJIAN YAYASAN MUNAZARAH</h1>
              <p className="text-[11px] text-emerald-400 font-medium">
                Petugas: {activeScannerUser?.name || activeScannerUser?.username || 'Scanner'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Logout Petugas"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </header>

      {/* Main Scanner Container */}
      <main className="max-w-md w-full mx-auto p-4 flex-1 flex flex-col justify-start space-y-4">

        {/* Live QR Camera Feed */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl aspect-square flex flex-col justify-center items-center">
          <div id={scannerContainerId} className="w-full h-full object-cover"></div>

          {/* Camera Flip Overlay Button */}
          <button
            onClick={handleSwitchCamera}
            className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md border border-slate-700 hover:bg-slate-800 transition-all"
            title="Ganti Kamera Depan/Belakang"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          {!isScanning && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center">
              <Camera className="w-12 h-12 text-slate-500 animate-pulse mb-3" />
              <p className="text-xs text-slate-400 mb-4">Mengaktifkan kamera smartphone...</p>
              <button
                onClick={startScanner}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Buka Kamera Lagi
              </button>
            </div>
          )}
        </div>

      {/* Pop-up Modal Result (Camera Paused until OK is clicked) */}
      {scanResult && (() => {
        const p = scanResult.participant;
        const isAkhwat = p && (
          p.track === 'Akhwat' || 
          p.ticket_type === 'Bunda' || 
          p.ticket_type === 'Akhwat'
        );
        const isSuccess = scanResult.status === 'SUCCESS';
        const isUsed = scanResult.status === 'USED';
        const isNotFound = scanResult.status === 'NOT_FOUND';

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className={`border rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 ${
              isSuccess 
                ? (isAkhwat 
                    ? 'bg-gradient-to-b from-slate-900 to-[#1e112a] border-purple-500/60 shadow-purple-950/60' 
                    : 'bg-gradient-to-b from-slate-900 to-[#0c1527] border-blue-500/60 shadow-blue-950/60')
                : isUsed 
                  ? 'bg-slate-900 border-amber-500/60 shadow-amber-950/50' 
                  : 'bg-slate-900 border-red-500/60 shadow-red-950/50'
            }`}>
              
              {/* Entrance Track Banner (Special for Ikhwan Navy vs Akhwat Purple) */}
              {p && (
                <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border shadow-md animate-pulse ${
                  isAkhwat 
                    ? 'bg-purple-950/90 text-purple-200 border-purple-500/50' 
                    : 'bg-blue-950/90 text-sky-200 border-blue-500/50'
                }`}>
                  {isAkhwat ? '🟣 JALUR AKHWAT (PINTU UNGU)' : '🔵 JALUR IKHWAN (PINTU BIRU NAVY)'}
                </div>
              )}

              {/* Status Header Icon */}
              <div className="flex justify-center pt-1">
                {isSuccess && (
                  <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center shadow-xl animate-bounce ${
                    isAkhwat 
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-purple-500/30' 
                      : 'bg-blue-500/20 border-blue-400 text-sky-300 shadow-blue-500/30'
                  }`}>
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                )}
                {isUsed && (
                  <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/20 animate-pulse">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                )}
                {isNotFound && (
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 text-red-400 flex items-center justify-center shadow-xl shadow-red-500/20">
                    <XCircle className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Title & Message */}
              <div className="space-y-1">
                <h2 className={`text-xl font-black ${
                  isSuccess 
                    ? (isAkhwat ? 'text-purple-300' : 'text-sky-300')
                    : isUsed 
                      ? 'text-amber-400' 
                      : 'text-red-400'
                }`}>
                  {isSuccess 
                    ? 'Tiket Berhasil di-Scan!' 
                    : isUsed 
                      ? 'PERINGATAN: Tiket Sudah Digunakan!' 
                      : 'Tiket Tidak Ditemukan!'}
                </h2>
                <p className={`text-xs font-semibold ${
                  isSuccess 
                    ? (isAkhwat ? 'text-purple-400' : 'text-sky-400') 
                    : isUsed ? 'text-amber-300/90' : 'text-slate-400'
                }`}>
                  {scanResult.message}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">Waktu Scan: {scanResult.time}</p>
              </div>

              {/* Participant Details Card */}
              {p ? (
                <div className={`border rounded-2xl p-4 text-left space-y-2.5 ${
                  isAkhwat ? 'bg-purple-950/40 border-purple-500/30' : 'bg-slate-950/80 border-slate-800'
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Nama Siswa / Peserta</span>
                    <div className="text-lg font-black text-white">{p.name}</div>
                  </div>

                  {/* Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 border border-slate-700 text-sky-300">
                      {p.division || '-'}
                    </span>
                    {p.class_name && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 border border-slate-700 text-slate-300">
                        Kelas: {p.class_name}
                      </span>
                    )}
                    {p.ticket_type && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                        isAkhwat ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-blue-500/20 text-sky-300 border-blue-500/40'
                      }`}>
                        {p.ticket_type}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/80">
                    <span className="text-slate-400">Kode Tiket:</span>
                    <span className={`font-mono font-bold ${isAkhwat ? 'text-purple-300' : 'text-sky-300'}`}>
                      {p.ticket_code}
                    </span>
                  </div>

                  {isUsed && p.scanned_at && (
                    <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 space-y-0.5">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Telah Di-Scan Sebelumnya
                      </div>
                      <div>Waktu: {new Date(p.scanned_at).toLocaleString('id-ID')}</div>
                      {p.scanned_by && <div>Petugas: {p.scanned_by}</div>}
                    </div>
                  )}
                </div>
              ) : (
                scanResult.code && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-xs font-mono text-red-300">
                    Kode Tiket: {scanResult.code}
                  </div>
                )
              )}

              {/* OK / Continue Scan Button */}
              <button
                onClick={handleCloseModalAndContinue}
                className={`w-full py-3.5 rounded-2xl font-black text-sm text-white transition-all shadow-xl flex items-center justify-center gap-2 ${
                  isSuccess
                    ? (isAkhwat ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30')
                    : isUsed
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                      : 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                }`}
              >
                <Check className="w-5 h-5" /> OK / Lanjutkan Scan
              </button>
            </div>
          </div>
        );
      })()}

        {/* Manual Input Backup */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ketik kode tiket (misal: MZ-TK-AY-123456)..."
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              maxLength={32}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
            >
              Scan
            </button>
          </form>
        </div>

        {/* Recent Scan History */}
        {scanHistory.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Riwayat Scan Terakhir</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {scanHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full ${
                      item.status === 'SUCCESS' ? 'bg-emerald-400' : item.status === 'USED' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    <span className="font-semibold text-white truncate">
                      {item.participant?.name || item.code || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Yayasan Munazarah Ticketing
      </footer>
    </div>
  );
}
