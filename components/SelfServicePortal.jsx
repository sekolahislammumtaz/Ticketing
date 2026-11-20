'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Baby,
  BookOpen,
  GraduationCap,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Ticket,
  User,
  Users,
  Phone,
  Mail,
  ArrowRight,
  Lock,
  RefreshCw,
  X,
  ChevronRight,
  Check,
  ShieldCheck,
  ExternalLink,
  MessageCircle,
  Send,
} from 'lucide-react';
import {
  getClassesByDivision,
  getStudentsByClass,
  claimStudentTickets,
  SCHOOL_DIVISIONS,
  TICKET_TYPES,
  DIVISION_ADMIN_CONTACTS,
  maskPhoneNumber,
  maskEmail,
} from '@/lib/data-service';
import { DivisionLogo } from '@/components/Logo';

// Metadata and visual styling for the 4 school divisions
const DIVISION_CONFIG = {
  'TK Islam Nazhirah': {
    title: 'TK Islam Nazhirah',
    subtitle: 'Taman Kanak-Kanak & PAUD',
    icon: Baby,
    theme: 'amber',
    badge: 'PAUD / TK',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/20',
    iconBg: 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950',
  },
  'SD Islam Nazhirah': {
    title: 'SD Islam Nazhirah',
    subtitle: 'Sekolah Dasar Islam',
    icon: BookOpen,
    theme: 'sky',
    badge: 'Sekolah Dasar',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    activeBorder: 'border-sky-500 ring-2 ring-sky-500/30 bg-sky-950/20',
    iconBg: 'bg-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950',
  },
  'SMP & SMA Islam Nazhirah': {
    title: 'SMP & SMA Islam Nazhirah',
    subtitle: 'Pendidikan Menengah Pertama & Atas',
    icon: GraduationCap,
    theme: 'emerald',
    badge: 'SMP & SMA',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/20',
    iconBg: 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950',
  },
  'Sekolah Islam Mumtaz': {
    title: 'Sekolah Islam Mumtaz',
    subtitle: 'Tahfidz & Full Day School',
    icon: Sparkles,
    theme: 'purple',
    badge: 'Mumtaz School',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    activeBorder: 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-950/20',
    iconBg: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950',
  },
};

// Ticket Option Specifications
const TICKET_CONFIGS = [
  {
    id: 'Ayah',
    label: 'Ayah',
    track: 'Ikhwan',
    trackLabel: 'Jalur Ikhwan',
    description: 'Tiket untuk ayah atau wali laki-laki',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    accentBorder: 'hover:border-sky-500/50',
    checkedBorder: 'border-sky-500 bg-sky-950/30 ring-1 ring-sky-500/40',
    checkColor: 'bg-sky-500 text-white',
  },
  {
    id: 'Bunda',
    label: 'Bunda',
    track: 'Akhwat',
    trackLabel: 'Jalur Akhwat',
    description: 'Tiket untuk bunda atau wali perempuan',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    accentBorder: 'hover:border-purple-500/50',
    checkedBorder: 'border-purple-500 bg-purple-950/30 ring-1 ring-purple-500/40',
    checkColor: 'bg-purple-500 text-white',
  },
  {
    id: 'Ikhwan',
    label: 'Ikhwan',
    track: 'Ikhwan',
    trackLabel: 'Jalur Ikhwan',
    description: 'Tiket pendamping atau tamu keluarga ikhwan (pria)',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    accentBorder: 'hover:border-sky-500/50',
    checkedBorder: 'border-sky-500 bg-sky-950/30 ring-1 ring-sky-500/40',
    checkColor: 'bg-sky-500 text-white',
  },
  {
    id: 'Akhwat',
    label: 'Akhwat',
    track: 'Akhwat',
    trackLabel: 'Jalur Akhwat',
    description: 'Tiket pendamping atau tamu keluarga akhwat (wanita)',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    accentBorder: 'hover:border-purple-500/50',
    checkedBorder: 'border-purple-500 bg-purple-950/30 ring-1 ring-purple-500/40',
    checkColor: 'bg-purple-500 text-white',
  },
];

export default function SelfServicePortal({ eventId = null, eventInfo = null, onTicketClaimed = null }) {
  // 1. Division Selection State
  const [selectedDivision, setSelectedDivision] = useState('');

  // 2. Class Selection State
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(false);

  // 3. Student Selection State
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // 4. Ticket Selection State (Max 2 Checkboxes)
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [ticketNotice, setTicketNotice] = useState('');

  // 5. Confirmation & Contact Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [parentWhatsapp, setParentWhatsapp] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [claimResult, setClaimResult] = useState(null);

  // Load Classes when Division changes
  useEffect(() => {
    if (!selectedDivision) {
      setClasses([]);
      setSelectedClass('');
      setStudents([]);
      setSelectedStudent(null);
      setSelectedTickets([]);
      return;
    }

    let isMounted = true;
    async function fetchClasses() {
      setLoadingClasses(true);
      try {
        const clsList = await getClassesByDivision(selectedDivision);
        if (isMounted) {
          setClasses(clsList);
          // Reset downstream selections
          setSelectedClass('');
          setStudents([]);
          setSelectedStudent(null);
          setSelectedTickets([]);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      } finally {
        if (isMounted) setLoadingClasses(false);
      }
    }

    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, [selectedDivision]);

  // Load Students when Class changes
  useEffect(() => {
    if (!selectedDivision || !selectedClass) {
      setStudents([]);
      setSelectedStudent(null);
      setSelectedTickets([]);
      setStudentSearch('');
      return;
    }

    let isMounted = true;
    async function fetchStudents() {
      setLoadingStudents(true);
      try {
        const stdList = await getStudentsByClass(selectedDivision, selectedClass);
        if (isMounted) {
          setStudents(stdList);
          setSelectedStudent(null);
          setSelectedTickets([]);
          setStudentSearch('');
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        if (isMounted) setLoadingStudents(false);
      }
    }

    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, [selectedDivision, selectedClass]);

  // Pre-fill parent contact info when student is selected
  useEffect(() => {
    if (selectedStudent) {
      setParentWhatsapp(selectedStudent.parent_whatsapp || '');
      setParentEmail(selectedStudent.parent_email || '');
    } else {
      setParentWhatsapp('');
      setParentEmail('');
    }
  }, [selectedStudent]);

  // Filtered Students list based on real-time search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const query = studentSearch.trim().toLowerCase();
    return students.filter(s => s.student_name && s.student_name.toLowerCase().includes(query));
  }, [students, studentSearch]);

  // Handle Division Selection
  const handleSelectDivision = (divName) => {
    if (selectedDivision === divName) return;
    setSelectedDivision(divName);
  };

  // Handle Class Selection
  const handleSelectClass = (clsName) => {
    if (selectedClass === clsName) return;
    setSelectedClass(clsName);
  };

  // Handle Student Selection
  const handleSelectStudent = (student) => {
    if (student.is_claimed) return; // Prevent selecting already claimed student
    setSelectedStudent(student);
    setSelectedTickets([]); // Reset tickets on student switch
    setTicketNotice('');
  };

  // Handle Ticket Checkbox Toggle (Strict Max 2 Rules)
  const handleToggleTicket = (ticketId) => {
    setTicketNotice('');

    if (selectedTickets.includes(ticketId)) {
      // Uncheck
      setSelectedTickets(prev => prev.filter(t => t !== ticketId));
    } else {
      // Check
      if (selectedTickets.length >= 2) {
        setTicketNotice('Ananda ini sudah punya 2 tiket. Batasnya maksimal 2.');
        return;
      }
      setSelectedTickets(prev => [...prev, ticketId]);
    }
  };

  // Open Confirmation Modal
  const handleProceedToConfirmation = () => {
    if (!selectedStudent) {
      alert('Pilih nama ananda dulu.');
      return;
    }
    if (selectedTickets.length === 0) {
      alert('Pilih minimal 1 tiket.');
      return;
    }
    setSubmitError('');
    setShowConfirmModal(true);
  };

  // Submit Claim Tickets
  const handleConfirmClaim = async (e) => {
    e?.preventDefault();
    if (selectedTickets.length === 0) {
      setSubmitError('Pilih minimal 1 tiket.');
      return;
    }

    if (!parentEmail || !parentEmail.trim() || !parentEmail.includes('@')) {
      setSubmitError('Email wajib diisi. Kode QR tiket dikirim ke email ini.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await claimStudentTickets({
        studentId: selectedStudent.id,
        tickets: selectedTickets,
        parentWhatsapp: parentWhatsapp.trim(),
        parentEmail: parentEmail.trim(),
        eventId: eventId,
      });

      setClaimResult(result);

      // Trigger Email Dispatch to /api/send-ticket for the claimed tickets
      try {
        await fetch('/api/send-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: parentEmail.trim(),
            studentName: selectedStudent?.student_name,
            division: selectedDivision,
            className: selectedClass,
            eventInfo: eventInfo,
            tickets: result.tickets,
          }),
        });
      } catch (mailErr) {
        console.warn('Dispatch ticket email notice:', mailErr);
      }

      // Trigger Confetti Celebration if available
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if confetti fails
      }

      // Update student local list
      setStudents(prev =>
        prev.map(s => (s.id === selectedStudent.id ? { ...s, is_claimed: true } : s))
      );

      if (onTicketClaimed) {
        onTicketClaimed(result);
      }
    } catch (err) {
      console.error('Error claiming tickets:', err);
      setSubmitError(err.message || 'Tiket gagal diproses. Coba lagi; kalau tetap gagal, hubungi admin divisi Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset all for a fresh order
  const handleResetOrder = () => {
    setSelectedDivision('');
    setSelectedClass('');
    setSelectedStudent(null);
    setSelectedTickets([]);
    setStudentSearch('');
    setShowConfirmModal(false);
    setClaimResult(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Self Service Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold tracking-wide uppercase">
              <Ticket className="w-3.5 h-3.5" /> Portal pemesanan mandiri wali murid
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pemesanan tiket masuk kajian
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Pilih divisi sekolah, kelas, lalu nama ananda untuk klaim tiket masuk kajian. Setiap ananda bisa klaim maksimal <strong className="text-sky-300">2 tiket</strong>.
            </p>
          </div>

          {(selectedDivision || selectedClass || selectedStudent) && (
            <button
              onClick={handleResetOrder}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition self-start md:self-center"
              title="Mulai ulang pemilihan"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Mulai ulang
            </button>
          )}
        </div>

        {/* Stepper Progress Indicator */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
            selectedDivision ? 'bg-sky-500/10 border-sky-500/30 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              selectedDivision ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedDivision ? <Check className="w-3.5 h-3.5" /> : '1'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Langkah 1</p>
              <p className="text-xs font-bold truncate">{selectedDivision ? selectedDivision.replace(' Islam Nazhirah', '').replace(' Sekolah Islam', '') : 'Divisi sekolah'}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
            selectedClass ? 'bg-sky-500/10 border-sky-500/30 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              selectedClass ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedClass ? <Check className="w-3.5 h-3.5" /> : '2'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Langkah 2</p>
              <p className="text-xs font-bold truncate">{selectedClass || 'Pilih kelas'}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
            selectedStudent ? 'bg-sky-500/10 border-sky-500/30 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              selectedStudent ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedStudent ? <Check className="w-3.5 h-3.5" /> : '3'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Langkah 3</p>
              <p className="text-xs font-bold truncate">{selectedStudent ? selectedStudent.student_name : 'Pilih ananda'}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
            selectedTickets.length > 0 ? 'bg-sky-500/10 border-sky-500/30 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              selectedTickets.length > 0 ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedTickets.length > 0 ? selectedTickets.length : '4'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Langkah 4</p>
              <p className="text-xs font-bold truncate">{selectedTickets.length > 0 ? `${selectedTickets.length} tiket` : 'Jenis tiket'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LANGKAH 1: PEMILIHAN DIVISI SEKOLAH (4 Divisi Kartu Interaktif) */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <h3 className="text-lg font-bold text-white">Pilih divisi sekolah</h3>
          </div>
          {selectedDivision && (
            <span className="text-xs text-sky-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Terpilih: {selectedDivision}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SCHOOL_DIVISIONS.map((divName) => {
            const config = DIVISION_CONFIG[divName] || {
              title: divName,
              subtitle: 'Divisi Sekolah',
              icon: BookOpen,
              badge: 'Divisi',
              badgeClass: 'bg-slate-700 text-slate-300',
              activeBorder: 'border-sky-500 ring-2 ring-sky-500/30',
              iconBg: 'bg-slate-800 text-slate-400',
            };
            const Icon = config.icon;
            const isSelected = selectedDivision === divName;

            return (
              <button
                key={divName}
                onClick={() => handleSelectDivision(divName)}
                className={`group relative text-left rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg ${
                  isSelected
                    ? `${config.activeBorder} shadow-sky-500/10`
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-14 h-14 rounded-2xl p-2 flex items-center justify-center border transition-all duration-300 shadow-sm ${
                        isSelected
                          ? 'bg-slate-950/80 border-sky-400 ring-2 ring-sky-400/40 scale-105'
                          : 'bg-slate-950/50 border-slate-800/80 group-hover:scale-105 group-hover:border-slate-700'
                      }`}
                    >
                      <DivisionLogo
                        division={divName}
                        className="w-full h-full object-contain filter drop-shadow"
                        fallback={<Icon className="w-7 h-7" />}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                    >
                      {config.badge}
                    </span>
                  </div>

                  <div>
                    <h4
                      className={`font-bold text-base leading-snug transition-colors ${
                        isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {config.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {config.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-sky-400 font-bold' : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  >
                    {isSelected ? 'Divisi aktif' : 'Pilih divisi'}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-sky-500 border-sky-400 text-slate-950'
                        : 'border-slate-700 bg-slate-800/60 text-slate-500 group-hover:border-slate-600'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <ChevronRight className="w-3 h-3" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* LANGKAH 2: PEMILIHAN KELAS (Dinamis dari Divisi) */}
      {/* ============================================================ */}
      {selectedDivision && (
        <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Pilih kelas</h3>
                <p className="text-xs text-slate-400">Daftar kelas aktif untuk {selectedDivision}</p>
              </div>
            </div>
            {selectedClass && (
              <span className="text-xs text-sky-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Kelas: {selectedClass}
              </span>
            )}
          </div>

          {loadingClasses ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
              <span>Memuat daftar kelas {selectedDivision}…</span>
            </div>
          ) : classes.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Divisi ini belum punya kelas.</p>
              <p className="text-xs text-slate-500 mt-1">Hubungi admin divisi atau pilih divisi lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {classes.map((clsName) => {
                const isSelected = selectedClass === clsName;
                return (
                  <button
                    key={clsName}
                    onClick={() => handleSelectClass(clsName)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-center flex flex-col items-center justify-center gap-1.5 shadow-sm ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold ring-2 ring-sky-400/30 scale-[1.02]'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="truncate w-full">{clsName}</span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Terpilih' : 'Pilih'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* LANGKAH 3: PEMILIHAN SISWA (Searchable & Responsive) */}
      {/* ============================================================ */}
      {selectedDivision && selectedClass && (
        <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Pilih nama ananda</h3>
                <p className="text-xs text-slate-400">
                  {students.length} ananda terdaftar di {selectedClass}
                </p>
              </div>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama ananda…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              />
              {studentSearch && (
                <button
                  onClick={() => setStudentSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loadingStudents ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
              <span>Memuat data ananda kelas {selectedClass}…</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                {studentSearch ? `Tidak ada ananda yang cocok dengan "${studentSearch}"` : 'Belum ada data ananda di kelas ini.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Cek ejaan nama, atau hapus kata kunci pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredStudents.map((student) => {
                const isClaimed = Boolean(student.is_claimed);
                const isSelected = selectedStudent?.id === student.id;

                return (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className={`relative rounded-2xl p-4 border transition-all flex items-start justify-between gap-3 ${
                      isClaimed
                        ? 'bg-slate-900/40 border-slate-800/80 opacity-70 cursor-not-allowed'
                        : isSelected
                        ? 'bg-sky-950/30 border-sky-500 ring-2 ring-sky-500/30 cursor-pointer shadow-lg shadow-sky-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isClaimed
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : isSelected
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isClaimed ? (
                          <Lock className="w-4 h-4" />
                        ) : isSelected ? (
                          <Check className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`font-bold text-sm truncate ${
                              isClaimed ? 'text-slate-400 line-through' : isSelected ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {student.student_name}
                          </h4>
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                              <Lock className="w-3 h-3" /> Sudah klaim
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              Tersedia
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-0.5">
                          {student.class_name} &bull; {student.division}
                        </p>

                        {isClaimed ? (
                          <p className="text-[11px] text-rose-400/90 mt-2 flex items-center gap-1 bg-rose-500/5 px-2 py-1 rounded-md border border-rose-500/10">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            Tiket ananda ini sudah dipesan.
                          </p>
                        ) : (
                          <p className="text-[11px] text-sky-400/80 mt-1">
                            Pilih ananda ini &rarr;
                          </p>
                        )}
                      </div>
                    </div>

                    {!isClaimed && (
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-sky-500 border-sky-400 text-slate-950'
                              : 'border-slate-700 bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============================================================ */}
      {/* LANGKAH 4: PEMILIHAN JENIS TIKET (Checkbox, Maksimal 2) */}
      {/* ============================================================ */}
      {selectedStudent && !selectedStudent.is_claimed && (
        <section className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold">
                4
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">Pilih jenis tiket (maksimal 2)</h3>
                <p className="text-xs text-slate-400">
                  Untuk ananda: <strong className="text-sky-300">{selectedStudent.student_name}</strong> ({selectedStudent.class_name})
                </p>
              </div>
            </div>

            {/* Ticket Counter Badge */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <div
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  selectedTickets.length === 2
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : selectedTickets.length === 1
                    ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Tiket terpilih: <strong>{selectedTickets.length}/2</strong></span>
              </div>
            </div>
          </div>

          {/* Warning banner when max 2 tickets selected or notice */}
          {ticketNotice && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>{ticketNotice}</span>
            </div>
          )}

          {selectedTickets.length === 2 && !ticketNotice && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Batas 2 tiket sudah tercapai. Pilihan lain dikunci.</span>
            </div>
          )}

          {/* 4 Ticket Checkbox Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TICKET_CONFIGS.map((tConfig) => {
              const isChecked = selectedTickets.includes(tConfig.id);
              const isMaxReached = selectedTickets.length >= 2;
              const isDisabled = !isChecked && isMaxReached;

              return (
                <div
                  key={tConfig.id}
                  onClick={() => !isDisabled && handleToggleTicket(tConfig.id)}
                  className={`relative rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                    isChecked
                      ? tConfig.checkedBorder
                      : isDisabled
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-50 cursor-not-allowed'
                      : `bg-slate-900/80 border-slate-800 ${tConfig.accentBorder} hover:bg-slate-900 cursor-pointer shadow-md`
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{tConfig.label}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tConfig.badgeClass}`}>
                          {tConfig.trackLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tConfig.description}
                      </p>
                    </div>

                    {/* Custom Checkbox */}
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                        isChecked
                          ? `${tConfig.checkColor} border-transparent shadow-sm`
                          : isDisabled
                          ? 'border-slate-800 bg-slate-900/60'
                          : 'border-slate-700 bg-slate-800/80 hover:border-slate-500'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {isDisabled ? 'Batas 2 tiket tercapai' : isChecked ? 'Sudah dipilih' : 'Klik untuk memilih'}
                    </span>
                    <span
                      className={`font-semibold ${
                        isChecked ? 'text-sky-400' : isDisabled ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {isChecked ? 'Terpilih' : isDisabled ? 'Terkunci' : 'Tersedia'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button: Lanjutkan Konfirmasi Data & Kontak */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div>
              <p className="text-sm font-bold text-white">
                {selectedTickets.length === 0
                  ? 'Pilih minimal 1 tiket untuk lanjut'
                  : `${selectedTickets.length} tiket dipilih (${selectedTickets.join(' + ')})`}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Berikutnya: pastikan nomor WhatsApp dan email penerima tiket.
              </p>
            </div>

            <button
              onClick={handleProceedToConfirmation}
              disabled={selectedTickets.length === 0}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-xl ${
                selectedTickets.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02]'
              }`}
            >
              <span>Lanjut konfirmasi data</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* MODAL / DIALOG KONFIRMASI DATA & KONTAK WALI MURID */}
      {/* ============================================================ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Konfirmasi pemesanan tiket</h3>
                  <p className="text-xs text-slate-400">Pastikan data ananda dan kontak wali murid sudah benar</p>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const adminContact = DIVISION_ADMIN_CONTACTS[selectedDivision];
              const adminWaCorrectionUrl = adminContact
                ? `https://wa.me/${adminContact.phoneClean}?text=${encodeURIComponent(
                    `Assalamu'alaikum Admin ${selectedDivision}, saya wali murid dari ananda ${selectedStudent?.student_name} (${selectedClass}). Saya ingin mengoreksi data nomor WhatsApp / Email untuk penerimaan e-tiket kajian Yayasan Munazarah.`
                  )}`
                : '#';
              const adminWaHelpUrl = adminContact
                ? `https://wa.me/${adminContact.phoneClean}?text=${encodeURIComponent(
                    `Assalamu'alaikum Admin ${selectedDivision}, saya wali murid dari ananda ${selectedStudent?.student_name} (${selectedClass}). Saya sudah pesan tiket tapi emailnya belum masuk. Mohon bantuannya.`
                  )}`
                : '#';

              if (claimResult) {
                // Success Screen inside Modal (STRICTLY NO ON-SCREEN QR CODES PER SECURITY RULE)
                return (
                  <div className="py-5 space-y-5 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-xl font-extrabold text-white">Pemesanan tiket berhasil</h4>
                      <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                        Alhamdulillah, tiket masuk kajian untuk ananda <strong className="text-white">{selectedStudent?.student_name}</strong> sudah terbit.
                      </p>
                    </div>

                    {/* Email Delivery Confirmation Box */}
                    <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 flex items-start gap-3 text-left">
                      <Mail className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-white">Kode QR tiket dikirim ke email</p>
                        <p className="text-sky-300 font-mono text-xs font-bold">
                          {maskEmail(parentEmail || selectedStudent?.parent_email)}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Cek kotak masuk atau folder spam. Tiket berisi kode QR untuk ditunjukkan di pintu masuk.
                        </p>
                      </div>
                    </div>

                    {/* Security Guarantee Notice */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3 text-left">
                      <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-amber-300">Kode QR tidak tampil di sini</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Demi keamanan, kode QR tidak ditampilkan di layar ini. Kode hanya dikirim ke email wali murid.
                        </p>
                      </div>
                    </div>

                    {/* Issued Tickets Reference List (Without public QR links) */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2.5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ringkasan tiket terbit</p>
                      <div className="space-y-2">
                        {claimResult.tickets?.map((t, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                          >
                            <div className="space-y-0.5">
                              <p className="font-bold text-white flex items-center gap-1.5">
                                <Ticket className="w-3.5 h-3.5 text-sky-400" />
                                {t.ticket_type} ({t.track})
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                Ref: <span className="text-sky-300 font-bold">{t.ticket_code}</span>
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Terkirim ke email
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin Assistance Button if email didn't arrive */}
                    {adminContact && (
                      <div className="pt-1">
                        <a
                          href={adminWaHelpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1.5 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Email belum masuk? Hubungi admin {selectedDivision} di WhatsApp</span>
                        </a>
                      </div>
                    )}

                    <button
                      onClick={handleResetOrder}
                      className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
                    >
                      Selesai, pesan ananda lain
                    </button>
                  </div>
                );
              }

              // Form Content
              return (
                <form onSubmit={handleConfirmClaim} className="py-5 space-y-5">
                  {/* Order Summary Box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                      <span className="text-slate-400">Divisi dan kelas</span>
                      <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                        <DivisionLogo division={selectedDivision} className="w-4 h-4 object-contain inline-block" />
                        {selectedDivision} &bull; {selectedClass}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                      <span className="text-slate-400">Nama ananda</span>
                      <span className="text-white font-bold">{selectedStudent?.student_name}</span>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <span className="text-slate-400">Tiket terpilih ({selectedTickets.length})</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedTickets.map((tId) => {
                          const tConf = TICKET_CONFIGS.find(c => c.id === tId);
                          return (
                            <span
                              key={tId}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${tConf?.badgeClass || 'bg-slate-800 text-slate-200'}`}
                            >
                              {tId} ({tConf?.trackLabel})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Registered Contact Preview Box (Masked) */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Kontak terdaftar di sekolah</span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Disamarkan</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block">WhatsApp:</span>
                        <strong className="text-slate-300 font-mono">
                          {maskPhoneNumber(selectedStudent?.parent_whatsapp)}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-[11px] text-slate-500 block">Email:</span>
                        <strong className="text-slate-300 font-mono truncate block">
                          {maskEmail(selectedStudent?.parent_email)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Parent Contact Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nomor WhatsApp wali murid <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="Contoh: 081234567890"
                          value={parentWhatsapp}
                          onChange={(e) => setParentWhatsapp(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Email wali murid <span className="text-rose-400">*</span></span>
                        <span className="text-[10px] text-sky-400 font-normal">Kode QR dikirim ke sini</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="wali.murid@example.com"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Action Buttons: Wrong Data (WA Admin) vs Confirm & Send */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <a
                      href={adminWaCorrectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>Data salah? Hubungi admin</span>
                    </a>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setShowConfirmModal(false)}
                        className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-sky-500/20"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Mengirim tiket…</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Konfirmasi dan kirim</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
