'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Calendar, MapPin, Clock, Users, Upload, Download, FileText, FileSpreadsheet, 
  Plus, Trash2, Search, ArrowLeft, CheckCircle2, ShieldCheck, QrCode, RefreshCw, 
  UserPlus, AlertCircle, Database, Lock, Eye, X, Check, LogOut, Pencil, Mail, Send, MessageSquare, Phone,
  Key, GraduationCap, Layers, RotateCcw, HelpCircle
} from 'lucide-react';
import { 
  getEventInfo, saveEventInfo, getParticipants, addParticipant, 
  importParticipants, updateParticipant, markWhatsAppSent, deleteParticipant, clearAllParticipants, isSupabaseConfigured,
  getStudents, importStudents, resetStudentClaim,
  SCHOOL_DIVISIONS, verifyAdminPassword, updateAdminPassword,
} from '@/lib/data-service';
import { generateTicketCode, generateQRCodeDataUrl } from '@/lib/ticket-generator';
import { 
  parseExcelParticipants, exportParticipantsToExcel,
  downloadStudentExcelTemplate, parseExcelStudents,
} from '@/lib/excel-helper';
import { exportTicketsToWord } from '@/lib/docx-exporter';
import { createWhatsAppTicketUrl } from '@/lib/whatsapp-helper';
import AppLogo, { DivisionLogo } from '@/components/Logo';

export default function AdminPage() {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminSession, setAdminSession] = useState(null);
  const [loginDivision, setLoginDivision] = useState('Sekolah Islam Mumtaz');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPassError, setAdminPassError] = useState('');

  // Active Tab: 'PARTICIPANTS', 'STUDENTS', 'EVENT'
  const [activeTab, setActiveTab] = useState('PARTICIPANTS');

  // Change Password Modal State
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [changePassForm, setChangePassForm] = useState({
    oldPass: '',
    newPass: '',
    confirmPass: '',
    error: '',
    success: '',
  });

  // Master Data Siswa State
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDivisionFilter, setStudentDivisionFilter] = useState('ALL');
  const [studentClassFilter, setStudentClassFilter] = useState('ALL');
  const [studentClaimFilter, setStudentClaimFilter] = useState('ALL');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    student_name: '',
    division: 'Sekolah Islam Mumtaz',
    class_name: '',
    parent_whatsapp: '',
    parent_email: '',
  });

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
  const [waFilter, setWaFilter] = useState('ALL'); // ALL, SENT, UNSENT
  const [exportDivision, setExportDivision] = useState('ALL'); // Division filter for Word export

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null); // participant object being edited
  const [showQrModal, setShowQrModal] = useState(null); // participant object
  const [showImportSuccessToast, setShowImportSuccessToast] = useState('');
  const [qrModalDataUrl, setQrModalDataUrl] = useState('');
  const [sendingEmailId, setSendingEmailId] = useState(null);

  // New Participant Form State
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    division: '',
    whatsapp: '',
    email: '',
  });

  // Edit Participant Form State
  const [editForm, setEditForm] = useState({
    name: '',
    division: '',
    whatsapp: '',
    email: '',
  });

  const fileInputRef = useRef(null);
  const studentFileInputRef = useRef(null);

  useEffect(() => {
    const isAuth = localStorage.getItem('ticketing_admin_auth') === 'true';
    const savedSession = localStorage.getItem('ticketing_admin_session');
    if (isAuth && savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setAdminSession(parsed);
      } catch (e) {
        setAdminSession({ division: 'Sekolah Islam Mumtaz', isSuperAdmin: true, title: 'Super Admin Yayasan' });
      }
    }
    setIsAdminAuth(isAuth);
    loadAllData();
  }, []);

  function handleAdminLogin(e) {
    e.preventDefault();
    const isValid = verifyAdminPassword(loginDivision, adminPasswordInput);
    if (isValid) {
      const isSuperAdmin = loginDivision === 'Sekolah Islam Mumtaz';
      const session = {
        division: loginDivision,
        isSuperAdmin,
        title: isSuperAdmin ? 'Super Admin Yayasan' : `Admin ${loginDivision}`,
      };
      localStorage.setItem('ticketing_admin_session', JSON.stringify(session));
      localStorage.setItem('ticketing_admin_auth', 'true');
      setAdminSession(session);
      setIsAdminAuth(true);
      setAdminPassError('');
      setAdminPasswordInput('');
    } else {
      setAdminPassError('Password Admin salah! (Default awal: simumtaz123)');
    }
  }

  function handleAdminLogout() {
    localStorage.removeItem('ticketing_admin_auth');
    localStorage.removeItem('ticketing_admin_session');
    setIsAdminAuth(false);
    setAdminSession(null);
  }

  function handleChangePasswordSubmit(e) {
    e.preventDefault();
    const div = adminSession?.division || 'Sekolah Islam Mumtaz';
    if (!verifyAdminPassword(div, changePassForm.oldPass)) {
      setChangePassForm(prev => ({ ...prev, error: 'Password lama salah!' }));
      return;
    }
    if (!changePassForm.newPass || changePassForm.newPass.trim().length < 4) {
      setChangePassForm(prev => ({ ...prev, error: 'Password baru minimal 4 karakter!' }));
      return;
    }
    if (changePassForm.newPass !== changePassForm.confirmPass) {
      setChangePassForm(prev => ({ ...prev, error: 'Konfirmasi password baru tidak cocok!' }));
      return;
    }

    try {
      updateAdminPassword(div, changePassForm.newPass);
      setChangePassForm({ oldPass: '', newPass: '', confirmPass: '', error: '', success: 'Password berhasil diperbarui!' });
      setTimeout(() => {
        setShowChangePassModal(false);
        setChangePassForm({ oldPass: '', newPass: '', confirmPass: '', error: '', success: '' });
      }, 1500);
    } catch (err) {
      setChangePassForm(prev => ({ ...prev, error: err.message }));
    }
  }

  async function loadAllData() {
    setLoading(true);
    try {
      const evt = await getEventInfo();
      if (evt) setEventInfo(evt);
      const pts = await getParticipants(evt?.id);
      setParticipants(pts || []);
      const stds = await getStudents();
      setStudents(stds || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Excel Import for Master Siswa
  async function handleStudentExcelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const defaultDiv = adminSession?.isSuperAdmin ? null : adminSession?.division;
      const parsed = parseExcelStudents(arrayBuffer, defaultDiv);

      if (parsed.length === 0) {
        alert('Tidak ada baris data siswa yang valid di file Excel ini.');
        return;
      }

      await importStudents(parsed);
      const updatedList = await getStudents();
      setStudents(updatedList);
      setShowImportSuccessToast(`Berhasil mengimpor ${parsed.length} master data siswa!`);
      setTimeout(() => setShowImportSuccessToast(''), 4000);
    } catch (err) {
      console.error('Error importing students Excel:', err);
      alert('Gagal membaca file Excel siswa: ' + err.message);
    } finally {
      if (studentFileInputRef.current) {
        studentFileInputRef.current.value = '';
      }
    }
  }

  // Handle Reset Klaim Siswa
  async function handleResetStudentClaim(student) {
    const confirmReset = window.confirm(
      `Apakah Anda yakin ingin me-reset klaim tiket untuk ananda ${student.student_name} (${student.class_name})? Tiket yang sudah terbit akan dibatalkan sehingga orang tua dapat memesan ulang.`
    );
    if (!confirmReset) return;

    try {
      await resetStudentClaim(student.id);
      const updatedList = await getStudents();
      setStudents(updatedList);
      const pts = await getParticipants(eventInfo?.id);
      setParticipants(pts || []);
      alert(`Klaim tiket ananda ${student.student_name} berhasil di-reset.`);
    } catch (err) {
      console.error('Error resetting claim:', err);
      alert('Gagal me-reset klaim: ' + err.message);
    }
  }

  // Handle Manual Add Student
  async function handleSaveNewStudent(e) {
    e.preventDefault();
    if (!newStudentForm.student_name.trim() || !newStudentForm.class_name.trim()) {
      alert('Nama Siswa dan Kelas wajib diisi.');
      return;
    }

    const divisionToUse = adminSession?.isSuperAdmin
      ? (newStudentForm.division || 'Sekolah Islam Mumtaz')
      : adminSession?.division;

    try {
      await importStudents([
        {
          division: divisionToUse,
          class_name: newStudentForm.class_name.trim(),
          student_name: newStudentForm.student_name.trim(),
          parent_whatsapp: newStudentForm.parent_whatsapp.trim(),
          parent_email: newStudentForm.parent_email.trim(),
          is_claimed: false,
        },
      ]);

      const updatedList = await getStudents();
      setStudents(updatedList);
      setShowAddStudentModal(false);
      setNewStudentForm({
        student_name: '',
        division: adminSession?.division || 'Sekolah Islam Mumtaz',
        class_name: '',
        parent_whatsapp: '',
        parent_email: '',
      });
      alert('Siswa berhasil ditambahkan ke master data.');
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Gagal menambahkan siswa: ' + err.message);
    }
  }

  // Trigger Send Ticket Email (Req: Kirim email tiket otomatis jika ada email)
  async function triggerSendTicketEmail(participant, silent = false) {
    if (!participant.email || !participant.email.includes('@')) {
      if (!silent) alert('Peserta tidak memiliki alamat email yang valid.');
      return;
    }
    setSendingEmailId(participant.id);
    try {
      const res = await fetch('/api/send-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: participant.email,
          name: participant.name,
          division: participant.division,
          ticketCode: participant.ticket_code,
          eventInfo,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (!silent) {
          alert(data.message || `Email tiket berhasil dikirim ke ${participant.email}!`);
        }
      } else {
        if (!silent) alert(`Gagal mengirim email: ${data.message}`);
      }
    } catch (err) {
      console.error('Send email error:', err);
      if (!silent) alert(`Terjadi kesalahan pengiriman email: ${err.message}`);
    } finally {
      setSendingEmailId(null);
    }
  }

  // Open WhatsApp with pre-filled ticket message & link
  async function handleOpenWhatsApp(participant) {
    const url = createWhatsAppTicketUrl(participant, eventInfo);
    if (!url) {
      alert('Nomor WhatsApp peserta tidak valid atau kosong.');
      return;
    }
    window.open(url, '_blank');

    try {
      await markWhatsAppSent(participant.id, participant.ticket_code);
      setParticipants(prev =>
        prev.map(p => (p.id === participant.id ? { ...p, wa_sent: true } : p))
      );
    } catch (err) {
      console.error('Error marking WA sent:', err);
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

  // Handle Excel File Import (Req #4, #5, #1, #2 & Automatic Ticket Emailing)
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

      // Refresh list
      const updatedPts = await getParticipants(eventInfo.id);
      setParticipants(updatedPts);

      // Trigger automatic email sending for imported participants with email
      const withEmail = imported.filter(p => p.email && p.email.includes('@'));
      if (withEmail.length > 0) {
        setShowImportSuccessToast(`Mengimpor ${imported.length} peserta. Mengirim ${withEmail.length} email tiket otomatis...`);
        for (const p of withEmail) {
          await triggerSendTicketEmail(p, true);
        }
        setShowImportSuccessToast(`Berhasil mengimpor ${imported.length} peserta! Tiket QR otomatis dikirim ke ${withEmail.length} email.`);
      } else {
        setShowImportSuccessToast(`Berhasil mengimpor ${imported.length} peserta baru dengan nomor tiket QR unik!`);
      }
      setTimeout(() => setShowImportSuccessToast(''), 6000);
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

      const created = await addParticipant(eventInfo.id, {
        name: newParticipant.name,
        division: newParticipant.division,
        whatsapp: newParticipant.whatsapp,
        email: newParticipant.email,
        ticket_code: ticketCode,
      });

      setNewParticipant({ name: '', division: '', whatsapp: '', email: '' });
      setShowAddModal(false);

      if (created) {
        setParticipants(prev => [created, ...prev.filter(p => p.id !== created.id)]);
      }

      if (created?.email && created?.email.includes('@')) {
        triggerSendTicketEmail(created, true);
        alert(`Peserta "${created.name}" berhasil ditambahkan & email tiket otomatis dikirim!`);
      } else {
        alert(`Peserta "${created?.name || newParticipant.name}" berhasil ditambahkan!`);
      }

      const updated = await getParticipants(eventInfo.id);
      if (updated && updated.length > 0) {
        setParticipants(updated);
      }
    } catch (err) {
      alert('Gagal menambah peserta: ' + err.message);
    }
  }

  // Open Edit Modal
  function openEditModal(participant) {
    setShowEditModal(participant);
    setEditForm({
      name: participant.name || '',
      division: participant.division || '',
      whatsapp: participant.whatsapp || '',
      email: participant.email || '',
    });
  }

  // Save Edit Participant
  async function handleSaveEditParticipant(e) {
    e.preventDefault();
    if (!editForm.name || !editForm.division) {
      alert('Nama dan Divisi wajib diisi!');
      return;
    }

    try {
      await updateParticipant(showEditModal.id, editForm);
      setShowEditModal(null);

      const updated = await getParticipants(eventInfo.id);
      setParticipants(updated);
      alert('Data peserta berhasil diperbarui!');
    } catch (err) {
      alert('Gagal meng-edit data peserta: ' + err.message);
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

  // Extract list of unique divisions
  const uniqueDivisions = Array.from(
    new Set(participants.map(p => (p.division || 'Umum').trim()))
  ).filter(Boolean).sort();

  function handleWordExport() {
    const filtered = exportDivision === 'ALL'
      ? participants
      : participants.filter(p => (p.division || 'Umum').trim().toLowerCase() === exportDivision.toLowerCase());

    if (filtered.length === 0) {
      alert(`Tidak ada data peserta untuk divisi "${exportDivision}"!`);
      return;
    }

    exportTicketsToWord(
      eventInfo, 
      filtered, 
      exportDivision === 'ALL' ? '' : exportDivision
    );
  }

  // Scoped & Filtered Participants based on Admin Role
  const scopedParticipants = participants.filter(p => {
    if (adminSession && !adminSession.isSuperAdmin) {
      return p.division === adminSession.division;
    }
    if (exportDivision !== 'ALL') {
      return (p.division || 'Umum').trim().toLowerCase() === exportDivision.toLowerCase();
    }
    return true;
  });

  const filteredParticipants = scopedParticipants.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.division?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.class_name && p.class_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.ticket_type && p.ticket_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.ticket_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.whatsapp?.includes(searchQuery) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'HADIR' && p.status !== 'Hadir') return false;
    if (statusFilter === 'BELUM' && p.status === 'Hadir') return false;

    if (waFilter === 'SENT' && !p.wa_sent) return false;
    if (waFilter === 'UNSENT' && p.wa_sent) return false;

    return true;
  });

  const totalHadir = scopedParticipants.filter(p => p.status === 'Hadir').length;
  const totalBelumHadir = scopedParticipants.length - totalHadir;
  const totalWaSent = scopedParticipants.filter(p => p.wa_sent).length;
  const totalWaUnsent = scopedParticipants.length - totalWaSent;
  const attendanceRate = scopedParticipants.length > 0
    ? Math.round((totalHadir / scopedParticipants.length) * 100)
    : 0;

  // Breakdown statistics per School Division (for Yayasan Monitoring)
  const divisionStats = SCHOOL_DIVISIONS.map(div => {
    const divTickets = participants.filter(p => (p.division || '').trim().toLowerCase() === div.toLowerCase());
    const divHadir = divTickets.filter(p => p.status === 'Hadir').length;
    const divBelum = divTickets.length - divHadir;
    const rate = divTickets.length > 0 ? Math.round((divHadir / divTickets.length) * 100) : 0;
    return { division: div, total: divTickets.length, hadir: divHadir, belum: divBelum, rate };
  });

  // Breakdown statistics per Track (Ikhwan vs Akhwat)
  const ikhwanTickets = scopedParticipants.filter(p => p.track === 'Ikhwan' || p.ticket_type === 'Ayah' || p.ticket_type === 'Ikhwan');
  const ikhwanHadir = ikhwanTickets.filter(p => p.status === 'Hadir').length;

  const akhwatTickets = scopedParticipants.filter(p => p.track === 'Akhwat' || p.ticket_type === 'Bunda' || p.ticket_type === 'Akhwat');
  const akhwatHadir = akhwatTickets.filter(p => p.status === 'Hadir').length;

  // Scoped & Filtered Students based on Admin Role
  const scopedStudents = students.filter(s => {
    if (adminSession && !adminSession.isSuperAdmin) {
      return s.division === adminSession.division;
    }
    if (studentDivisionFilter !== 'ALL') {
      return s.division === studentDivisionFilter;
    }
    return true;
  });

  const availableClasses = Array.from(new Set(scopedStudents.map(s => s.class_name).filter(Boolean))).sort();

  const filteredStudents = scopedStudents.filter(s => {
    if (studentClassFilter !== 'ALL' && s.class_name !== studentClassFilter) {
      return false;
    }
    if (studentClaimFilter === 'CLAIMED' && !s.is_claimed) return false;
    if (studentClaimFilter === 'UNCLAIMED' && s.is_claimed) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      const matchName = s.student_name?.toLowerCase().includes(q);
      const matchClass = s.class_name?.toLowerCase().includes(q);
      const matchWA = s.parent_whatsapp?.includes(q);
      const matchEmail = s.parent_email?.toLowerCase().includes(q);
      return matchName || matchClass || matchWA || matchEmail;
    }
    return true;
  });

  const totalStudents = scopedStudents.length;
  const totalStudentsClaimed = scopedStudents.filter(s => s.is_claimed).length;
  const totalStudentsUnclaimed = totalStudents - totalStudentsClaimed;

  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4">
        <header className="py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </header>

        <main className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="text-center space-y-2">
            <AppLogo className="w-16 h-16 object-contain mx-auto drop-shadow mb-2" />
            <h1 className="text-xl font-extrabold text-white leading-tight">KAJIAN YAYASAN MUNAZARAH TICKETING</h1>
            <p className="text-xs text-slate-400">Login Administrator Sekolah & Yayasan</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4">
            {adminPassError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{adminPassError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pilih Divisi Admin</label>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 flex-shrink-0">
                    <DivisionLogo
                      division={loginDivision}
                      className="w-full h-full object-contain"
                      fallback={<AppLogo className="w-8 h-8 object-contain" />}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <select
                      value={loginDivision}
                      onChange={e => setLoginDivision(e.target.value)}
                      className="w-full bg-transparent text-sm text-white focus:outline-none font-medium cursor-pointer"
                    >
                      <option value="Sekolah Islam Mumtaz" className="bg-slate-950 text-white">Sekolah Islam Mumtaz (Super Admin Yayasan)</option>
                      <option value="TK Islam Nazhirah" className="bg-slate-950 text-white">TK Islam Nazhirah</option>
                      <option value="SD Islam Nazhirah" className="bg-slate-950 text-white">SD Islam Nazhirah</option>
                      <option value="SMP & SMA Islam Nazhirah" className="bg-slate-950 text-white">SMP & SMA Islam Nazhirah</option>
                    </select>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {loginDivision === 'Sekolah Islam Mumtaz' 
                        ? 'Super Admin Yayasan (Akses Lintas Divisi)' 
                        : `Admin Khusus ${loginDivision}`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password Admin</label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password admin"
                  value={adminPasswordInput}
                  onChange={e => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-sky-400/90 mt-1">
                  * Password default awal seluruh divisi: <code className="font-mono font-bold text-sky-300">simumtaz123</code>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold text-sm text-white transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 mt-2"
              >
                <Lock className="w-4 h-4" /> Masuk Admin
              </button>
            </form>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} Yayasan Munazarah Ticketing
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <AppLogo className="w-9 h-9 object-contain drop-shadow" />
                {!adminSession?.isSuperAdmin && adminSession?.division && (
                  <>
                    <span className="text-slate-600 font-bold hidden sm:inline">/</span>
                    <DivisionLogo
                      division={adminSession.division}
                      className="w-9 h-9 object-contain drop-shadow hidden sm:inline-block"
                      alt={`Logo ${adminSession.division}`}
                    />
                  </>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg text-white leading-tight">
                    KAJIAN YAYASAN MUNAZARAH TICKETING
                  </h1>
                  {adminSession?.isSuperAdmin ? (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Super Admin Yayasan
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                      <DivisionLogo division={adminSession?.division} className="w-4 h-4 object-contain" />
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Admin {adminSession?.division}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {adminSession?.isSuperAdmin 
                    ? 'Akses Penuh: Seluruh Divisi Sekolah & Yayasan' 
                    : `Data Terbatas: Divisi ${adminSession?.division}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setChangePassForm({ oldPass: '', newPass: '', confirmPass: '', error: '', success: '' });
                setShowChangePassModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              title="Ganti Password Admin"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Ganti Password</span>
            </button>

            {adminSession?.isSuperAdmin && (
              <Link
                href="/admin/scanner-users"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs font-semibold hover:bg-sky-500/20 transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">User Scanner (Max 10)</span>
              </Link>
            )}

            <button
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20 transition-all"
              title="Keluar Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-0">
          <button
            onClick={() => setActiveTab('PARTICIPANTS')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'PARTICIPANTS'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Tiket Diklaim ({scopedParticipants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('STUDENTS')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'STUDENTS'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Master Data Siswa ({totalStudents})</span>
          </button>

          <button
            onClick={() => setActiveTab('EVENT')}
            className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'EVENT'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Detail Acara</span>
          </button>
        </div>

        {/* Tab 1: Event Info Form */}
        {activeTab === 'EVENT' && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal Acara *</label>
                <input
                  type="date"
                  required
                  value={eventInfo.date}
                  onChange={e => setEventInfo({ ...eventInfo, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSavingEvent}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
                >
                  {isSavingEvent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Simpan Detail Acara
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Tab 2: Participants */}
        {activeTab === 'PARTICIPANTS' && (
          <>
        {/* Real-time Monitoring & Attendance Statistics for Yayasan */}
        <section className="space-y-4">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Total Tiket Terbit</p>
                <p className="text-2xl font-black text-white mt-1">{scopedParticipants.length}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Semua tiket yang diklaim</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Kehadiran (Check-In)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-black text-emerald-400">{totalHadir}</p>
                  <span className="text-xs font-bold text-emerald-300">({attendanceRate}%)</span>
                </div>
                <p className="text-[10px] text-emerald-500/80 mt-0.5">Telah scan QR code</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">Belum Hadir</p>
                <p className="text-2xl font-black text-slate-300 mt-1">{totalBelumHadir}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Menunggu kedatangan</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] font-semibold text-slate-400">WhatsApp Terkirim</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-black text-blue-400">{totalWaSent}</p>
                  <span className="text-[11px] text-slate-400">/ {scopedParticipants.length}</span>
                </div>
                <p className="text-[10px] text-blue-400/80 mt-0.5">
                  {totalWaUnsent > 0 ? `${totalWaUnsent} belum dikirim` : 'Semua terkirim'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Monitoring Detail per Divisi & Jalur (Khusus Yayasan & Super Admin atau Multi-Unit) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Division Breakdown (2 Cols) */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Statistik Kehadiran per Divisi Sekolah (Monitoring Yayasan)
                </h3>
                <span className="text-[11px] text-slate-400">Real-Time</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {divisionStats.map((d, i) => (
                  <div key={i} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate max-w-[170px]" title={d.division}>
                        {d.division}
                      </span>
                      <span className={`text-xs font-bold ${d.rate > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {d.rate}% Hadir
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${d.rate}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Total: <strong className="text-slate-200">{d.total}</strong></span>
                      <span>Hadir: <strong className="text-emerald-400">{d.hadir}</strong></span>
                      <span>Belum: <strong className="text-slate-400">{d.belum}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entrance Track Breakdown (1 Col) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="border-b border-slate-800/80 pb-2.5">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Pintu Masuk (Jalur Ikhwan vs Akhwat)
                </h3>
              </div>

              <div className="space-y-3 pt-1">
                {/* Jalur Ikhwan */}
                <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      🔵 Jalur Ikhwan (Navy)
                    </span>
                    <span className="text-xs font-bold text-sky-400">
                      {ikhwanHadir} / {ikhwanTickets.length} Hadir
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-sky-500 h-1.5 rounded-full" 
                      style={{ width: `${ikhwanTickets.length > 0 ? (ikhwanHadir / ikhwanTickets.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Jalur Akhwat */}
                <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      🟣 Jalur Akhwat (Ungu)
                    </span>
                    <span className="text-xs font-bold text-purple-400">
                      {akhwatHadir} / {akhwatTickets.length} Hadir
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-1.5 rounded-full" 
                      style={{ width: `${akhwatTickets.length > 0 ? (akhwatHadir / akhwatTickets.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
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

          {/* Action Card 2: Export Tickets to Word (.docx) per Division */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1">Ekspor Tiket Word</h3>
              <p className="text-xs text-slate-400 mb-3">Unduh dokumen Word (.docx) tiket QR per divisi / semua divisi.</p>

              {/* Division Selector */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-400">Pilih Divisi Tiket:</label>
                <select
                  value={exportDivision}
                  onChange={e => setExportDivision(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-300 focus:outline-none focus:border-sky-500 font-medium"
                >
                  <option value="ALL">Semua Divisi ({participants.length} Tiket)</option>
                  {uniqueDivisions.map((divName, idx) => {
                    const count = participants.filter(p => (p.division || 'Umum').trim().toLowerCase() === divName.toLowerCase()).length;
                    return (
                      <option key={idx} value={divName}>
                        Divisi: {divName} ({count} Tiket)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <button
              onClick={handleWordExport}
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
                <Users className="w-5 h-5 text-sky-400" /> Daftar Tiket Peserta ({scopedParticipants.length})
              </h2>
              <p className="text-xs text-slate-400">
                Total Tiket: <strong className="text-white">{scopedParticipants.length}</strong> | 
                Hadir: <strong className="text-emerald-400">{totalHadir}</strong> | 
                Belum Scan: <strong className="text-slate-400">{totalBelumHadir}</strong> | 
                WA Terkirim: <strong className="text-blue-400">{totalWaSent}</strong>
              </p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari nama, divisi, kelas, tiket..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 w-full sm:w-56"
                />
              </div>

              {/* Attendance Status Filter Buttons */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === 'ALL' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('HADIR')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === 'HADIR' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hadir ({totalHadir})
                </button>
                <button
                  onClick={() => setStatusFilter('BELUM')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === 'BELUM' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Belum ({totalBelumHadir})
                </button>
              </div>

              {/* WhatsApp Status Filter Buttons */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setWaFilter('ALL')}
                  className={`px-2 py-1 rounded-lg font-medium transition-all ${
                    waFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tampilkan semua status WhatsApp"
                >
                  Semua WA
                </button>
                <button
                  onClick={() => setWaFilter('SENT')}
                  className={`px-2 py-1 rounded-lg font-medium transition-all ${
                    waFilter === 'SENT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Hanya yang sudah dikirim via WhatsApp"
                >
                  WA Sent ({totalWaSent})
                </button>
                <button
                  onClick={() => setWaFilter('UNSENT')}
                  className={`px-2 py-1 rounded-lg font-medium transition-all ${
                    waFilter === 'UNSENT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Hanya yang belum dikirim via WhatsApp"
                >
                  Belum WA ({totalWaUnsent})
                </button>
              </div>

              {scopedParticipants.length > 0 && (
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
                  <th className="px-3.5 py-3">No</th>
                  <th className="px-3.5 py-3">Nama Siswa / Peserta</th>
                  <th className="px-3.5 py-3">Divisi & Kelas</th>
                  <th className="px-3.5 py-3">Tipe & Jalur Masuk</th>
                  <th className="px-3.5 py-3">No. WhatsApp</th>
                  <th className="px-3.5 py-3">Email</th>
                  <th className="px-3.5 py-3">Kode Tiket</th>
                  <th className="px-3.5 py-3 text-center">Status WhatsApp</th>
                  <th className="px-3.5 py-3 text-center">Status Scan</th>
                  <th className="px-3.5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                      {scopedParticipants.length === 0 
                        ? 'Belum ada data peserta/tiket. Silakan impor file Excel atau tunggu klaim wali murid.' 
                        : 'Tidak ada data peserta yang cocok dengan pencarian/filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, index) => (
                    <tr key={p.id || index} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3.5 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-3.5 py-3 font-bold text-white">{p.name}</td>
                      <td className="px-3.5 py-3">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-950 border border-slate-800 text-sky-300">
                            {p.division || '-'}
                          </span>
                          {p.class_name && (
                            <p className="text-[11px] text-slate-400 mt-0.5">Kelas: {p.class_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {p.ticket_type && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                              {p.ticket_type}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            p.track === 'Akhwat' 
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                              : 'bg-blue-500/10 text-sky-300 border-blue-500/30'
                          }`}>
                            {p.track === 'Akhwat' ? '🟣 Akhwat' : '🔵 Ikhwan'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-slate-400">{p.whatsapp || '-'}</td>
                      <td className="px-3.5 py-3 text-slate-400">{p.email || '-'}</td>
                      <td className="px-3.5 py-3">
                        <span className="font-mono font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800 text-sky-300">
                          {p.ticket_code}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        {p.wa_sent ? (
                          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full text-[11px] font-semibold" title="Tiket sudah berhasil dikirimkan via WhatsApp">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Terkirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-semibold" title="Tiket belum dikirim via WhatsApp">
                            Belum Dikirim
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        {p.status === 'Hadir' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Belum Scanned</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.whatsapp && (
                            <button
                              onClick={() => handleOpenWhatsApp(p)}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                p.wa_sent
                                  ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                              }`}
                              title={p.wa_sent ? 'Kirim Ulang Tiket via WhatsApp (Sudah Pernah Dikirim)' : 'Kirim Tiket via WhatsApp (Belum Dikirim)'}
                            >
                              <MessageSquare className={`w-4 h-4 ${p.wa_sent ? 'text-blue-400' : 'text-emerald-400'}`} />
                            </button>
                          )}
                          {p.email && p.email.includes('@') && (
                            <button
                              onClick={() => triggerSendTicketEmail(p, false)}
                              disabled={sendingEmailId === p.id}
                              className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 disabled:opacity-50 transition-colors"
                              title="Kirim / Resend Email Tiket"
                            >
                              {sendingEmailId === p.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                            title="Edit Data Peserta"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
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
        </>
        )}

        {/* Tab 3: Master Data Siswa */}
        {activeTab === 'STUDENTS' && (
          <div className="space-y-6">
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Unduh Template */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">Unduh Template Excel</h3>
                  <p className="text-xs text-slate-400">
                    Format Excel master siswa dengan kolom Divisi, Kelas, Nama Siswa, WhatsApp, dan Email.
                  </p>
                </div>
                <button
                  onClick={downloadStudentExcelTemplate}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Download className="w-4 h-4" /> Unduh Template (.xlsx)
                </button>
              </div>

              {/* Card 2: Impor Excel */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">Impor Excel Siswa</h3>
                  <p className="text-xs text-slate-400">
                    Unggah file Excel data siswa untuk klaim tiket mandiri oleh orang tua murid.
                  </p>
                </div>
                <input
                  type="file"
                  ref={studentFileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleStudentExcelUpload}
                  className="hidden"
                  id="student-excel-upload-input"
                />
                <button
                  onClick={() => studentFileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Upload className="w-4 h-4" /> Unggah File Excel (.xlsx)
                </button>
              </div>

              {/* Card 3: Tambah Manual */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">Tambah Siswa Manual</h3>
                  <p className="text-xs text-slate-400">
                    Tambahkan data 1 siswa baru secara manual ke database yayasan/sekolah.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewStudentForm({
                      student_name: '',
                      division: adminSession?.isSuperAdmin ? 'Sekolah Islam Mumtaz' : adminSession?.division,
                      class_name: '',
                      parent_whatsapp: '',
                      parent_email: '',
                    });
                    setShowAddStudentModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
                >
                  <Plus className="w-4 h-4" /> Tambah Siswa Baru
                </button>
              </div>
            </div>

            {/* Students Table Section */}
            <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              {/* Header & Stats */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-400" /> Master Data Siswa ({totalStudents})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Total Siswa: <strong className="text-white">{totalStudents}</strong> | 
                    Sudah Klaim: <strong className="text-emerald-400">{totalStudentsClaimed}</strong> | 
                    Belum Klaim: <strong className="text-amber-400">{totalStudentsUnclaimed}</strong>
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Cari siswa, kelas, WA, email..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 w-full sm:w-60"
                    />
                  </div>

                  {/* Division Filter for Super Admin */}
                  {adminSession?.isSuperAdmin && (
                    <select
                      value={studentDivisionFilter}
                      onChange={e => setStudentDivisionFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="ALL">Semua Divisi Yayasan</option>
                      {SCHOOL_DIVISIONS.map((div, idx) => (
                        <option key={idx} value={div}>{div}</option>
                      ))}
                    </select>
                  )}

                  {/* Class Filter */}
                  {availableClasses.length > 0 && (
                    <select
                      value={studentClassFilter}
                      onChange={e => setStudentClassFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-sky-300 focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="ALL">Semua Kelas ({availableClasses.length})</option>
                      {availableClasses.map((cls, idx) => (
                        <option key={idx} value={cls}>Kelas: {cls}</option>
                      ))}
                    </select>
                  )}

                  {/* Claim Status Buttons */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setStudentClaimFilter('ALL')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        studentClaimFilter === 'ALL' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setStudentClaimFilter('CLAIMED')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        studentClaimFilter === 'CLAIMED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sudah ({totalStudentsClaimed})
                    </button>
                    <button
                      onClick={() => setStudentClaimFilter('UNCLAIMED')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        studentClaimFilter === 'UNCLAIMED' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Belum ({totalStudentsUnclaimed})
                    </button>
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Divisi</th>
                      <th className="px-4 py-3">Kelas</th>
                      <th className="px-4 py-3">Nama Siswa</th>
                      <th className="px-4 py-3">No. WhatsApp Ortu</th>
                      <th className="px-4 py-3">Email Ortu</th>
                      <th className="px-4 py-3 text-center">Status Klaim Tiket</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          {scopedStudents.length === 0
                            ? 'Belum ada data master siswa. Silakan unduh template & impor file Excel.'
                            : 'Tidak ada data siswa yang cocok dengan pencarian/filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s, index) => (
                        <tr key={s.id || index} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-950 border border-slate-800 text-sky-300">
                              {s.division}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-300">{s.class_name}</td>
                          <td className="px-4 py-3 font-bold text-white">{s.student_name}</td>
                          <td className="px-4 py-3 text-slate-400">{s.parent_whatsapp || '-'}</td>
                          <td className="px-4 py-3 text-slate-400">{s.parent_email || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            {s.is_claimed ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Diklaim ({s.tickets_count || 1} Tiket)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full text-[11px]">
                                Belum Diklaim
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {s.is_claimed ? (
                              <button
                                onClick={() => handleResetStudentClaim(s)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold transition-colors"
                                title="Reset status klaim agar orang tua dapat memesan ulang tiket"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Reset Klaim
                              </button>
                            ) : (
                              <span className="text-slate-500 italic text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
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

      {/* Modal Edit Participant */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Edit Data Peserta</h3>
              <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditParticipant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Divisi / Bagian *</label>
                <input
                  type="text"
                  required
                  value={editForm.division}
                  onChange={e => setEditForm({ ...editForm, division: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp (Opsional)</label>
                <input
                  type="text"
                  value={editForm.whatsapp}
                  onChange={e => setEditForm({ ...editForm, whatsapp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Email (Opsional)</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Change Password */}
      {showChangePassModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">Ganti Password Admin</h3>
              </div>
              <button 
                onClick={() => setShowChangePassModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Ubah password untuk divisi: <strong className="text-sky-300">{adminSession?.division}</strong>
            </p>

            {changePassForm.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{changePassForm.error}</span>
              </div>
            )}

            {changePassForm.success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{changePassForm.success}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password Lama *</label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password lama"
                  value={changePassForm.oldPass}
                  onChange={e => setChangePassForm(prev => ({ ...prev, oldPass: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password Baru * (Min 4 karakter)</label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password baru"
                  value={changePassForm.newPass}
                  onChange={e => setChangePassForm(prev => ({ ...prev, newPass: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi password baru"
                  value={changePassForm.confirmPass}
                  onChange={e => setChangePassForm(prev => ({ ...prev, confirmPass: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangePassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/20"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Student Manual */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">Tambah Siswa Manual</h3>
              </div>
              <button 
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Divisi Sekolah *</label>
                {adminSession?.isSuperAdmin ? (
                  <select
                    value={newStudentForm.division}
                    onChange={e => setNewStudentForm(prev => ({ ...prev, division: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SCHOOL_DIVISIONS.map((div, idx) => (
                      <option key={idx} value={div}>{div}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={adminSession?.division}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1A / TK B / 7A"
                  value={newStudentForm.class_name}
                  onChange={e => setNewStudentForm(prev => ({ ...prev, class_name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Siswa *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fulan"
                  value={newStudentForm.student_name}
                  onChange={e => setNewStudentForm(prev => ({ ...prev, student_name: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">No. WhatsApp Orang Tua (Opsional)</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={newStudentForm.parent_whatsapp}
                  onChange={e => setNewStudentForm(prev => ({ ...prev, parent_whatsapp: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Orang Tua (Opsional)</label>
                <input
                  type="email"
                  placeholder="ortu@example.com"
                  value={newStudentForm.parent_email}
                  onChange={e => setNewStudentForm(prev => ({ ...prev, parent_email: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
