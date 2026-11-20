import { supabase, isSupabaseConfigured } from './supabase.js';

export { isSupabaseConfigured };

export const STORAGE_KEYS = {
  EVENT: 'ticketing_event_info',
  PARTICIPANTS: 'ticketing_participants',
  SCANNERS: 'ticketing_scanner_users',
  WA_SENT_IDS: 'ticketing_wa_sent_ids',
  STUDENTS: 'ticketing_students',
  ADMIN_PASSWORDS: 'ticketing_admin_passwords',
  ADMIN_SESSION: 'ticketing_admin_session',
};

export const SCHOOL_DIVISIONS = [
  'TK Islam Nazhirah',
  'SD Islam Nazhirah',
  'SMP & SMA Islam Nazhirah',
  'Sekolah Islam Mumtaz',
];

export const TICKET_TYPES = [
  { id: 'Ayah', label: 'Ayah', track: 'Ikhwan', description: 'Jalur Ikhwan' },
  { id: 'Bunda', label: 'Bunda', track: 'Akhwat', description: 'Jalur Akhwat' },
  { id: 'Ikhwan', label: 'Ikhwan', track: 'Ikhwan', description: 'Jalur Ikhwan' },
  { id: 'Akhwat', label: 'Akhwat', track: 'Akhwat', description: 'Jalur Akhwat' },
];

// Data Kontak Resmi Admin 4 Divisi Sekolah
export const DIVISION_ADMIN_CONTACTS = {
  'TK Islam Nazhirah': {
    name: 'Admin TK Islam Nazhirah',
    phone: '0899-9783-882',
    phoneClean: '628999783882',
    waUrl: 'https://wa.me/628999783882',
  },
  'SD Islam Nazhirah': {
    name: 'Admin SD Islam Nazhirah',
    phone: '0899-7711-234',
    phoneClean: '628997711234',
    waUrl: 'https://wa.me/628997711234',
  },
  'SMP & SMA Islam Nazhirah': {
    name: 'Admin SMP & SMA Islam Nazhirah',
    phone: '0896-1860-0656',
    phoneClean: '6289618600656',
    waUrl: 'https://wa.me/6289618600656',
  },
  'Sekolah Islam Mumtaz': {
    name: 'Admin Sekolah Islam Mumtaz',
    phone: '0899-974-1234',
    phoneClean: '628999741234',
    waUrl: 'https://wa.me/628999741234',
  },
};

// Fungsi Masking Kontak
export function maskPhoneNumber(phone) {
  if (!phone) return '-';
  const clean = String(phone).replace(/\s+/g, '');
  if (clean.length < 8) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}-****-${end}`;
}

export function maskEmail(email) {
  if (!email || !email.includes('@')) return '-';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user}***@${domain}`;
  }
  const prefix = user.slice(0, 2);
  return `${prefix}***@${domain}`;
}

// Default Initial Scanner Users if empty
const DEFAULT_SCANNERS = [
  { id: '1', username: 'scanner1', password: '123', name: 'Petugas Pintu 1' },
  { id: '2', username: 'scanner2', password: '123', name: 'Petugas Pintu 2' },
];

// Initial Sample Data for Students across 4 Divisions
const DEFAULT_STUDENTS = [
  // 1. TK Islam Nazhirah
  {
    id: 'std-tk-01',
    division: 'TK Islam Nazhirah',
    class_name: 'TK A (Al-Fatih)',
    student_name: 'Ahmad Fathan Al-Ghifari',
    parent_whatsapp: '081234567801',
    parent_email: 'fathan.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'std-tk-02',
    division: 'TK Islam Nazhirah',
    class_name: 'TK A (Al-Fatih)',
    student_name: 'Aisyah Humaira Putri',
    parent_whatsapp: '081234567802',
    parent_email: 'aisyah.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:05:00.000Z',
  },
  {
    id: 'std-tk-03',
    division: 'TK Islam Nazhirah',
    class_name: 'TK B (Ibnu Sina)',
    student_name: 'Rayyan Alfarizqi Pratama',
    parent_whatsapp: '081234567803',
    parent_email: 'rayyan.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:10:00.000Z',
  },
  {
    id: 'std-tk-04',
    division: 'TK Islam Nazhirah',
    class_name: 'TK B (Ibnu Sina)',
    student_name: 'Maryam Azzahra',
    parent_whatsapp: '081234567804',
    parent_email: 'maryam.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:15:00.000Z',
  },

  // 2. SD Islam Nazhirah
  {
    id: 'std-sd-01',
    division: 'SD Islam Nazhirah',
    class_name: '1 Abu Bakar',
    student_name: 'Bilal bin Rabah Kurniawan',
    parent_whatsapp: '081234567811',
    parent_email: 'bilal.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:20:00.000Z',
  },
  {
    id: 'std-sd-02',
    division: 'SD Islam Nazhirah',
    class_name: '1 Abu Bakar',
    student_name: 'Fatimah Azzahra Santoso',
    parent_whatsapp: '081234567812',
    parent_email: 'fatimah.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:25:00.000Z',
  },
  {
    id: 'std-sd-03',
    division: 'SD Islam Nazhirah',
    class_name: '2 Umar bin Khattab',
    student_name: 'Zaid bin Tsabit Hidayat',
    parent_whatsapp: '081234567813',
    parent_email: 'zaid.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:30:00.000Z',
  },
  {
    id: 'std-sd-04',
    division: 'SD Islam Nazhirah',
    class_name: '3 Utsman bin Affan',
    student_name: 'Nuha Salsabila Wijaya',
    parent_whatsapp: '081234567814',
    parent_email: 'nuha.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:35:00.000Z',
  },

  // 3. SMP & SMA Islam Nazhirah
  {
    id: 'std-smp-01',
    division: 'SMP & SMA Islam Nazhirah',
    class_name: '7 Thariq bin Ziyad',
    student_name: 'Muhammad Al-Fatih Pratama',
    parent_whatsapp: '081234567821',
    parent_email: 'alfatih.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:40:00.000Z',
  },
  {
    id: 'std-smp-02',
    division: 'SMP & SMA Islam Nazhirah',
    class_name: '8 Shalahuddin',
    student_name: 'Sarah Amira Nurhaliza',
    parent_whatsapp: '081234567822',
    parent_email: 'sarah.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:45:00.000Z',
  },
  {
    id: 'std-sma-01',
    division: 'SMP & SMA Islam Nazhirah',
    class_name: '10 MIPA',
    student_name: 'Khalid bin Walid Siregar',
    parent_whatsapp: '081234567823',
    parent_email: 'khalid.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:50:00.000Z',
  },
  {
    id: 'std-sma-02',
    division: 'SMP & SMA Islam Nazhirah',
    class_name: '11 IPS',
    student_name: 'Yasmin Zahira Putri',
    parent_whatsapp: '081234567824',
    parent_email: 'yasmin.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T08:55:00.000Z',
  },

  // 4. Sekolah Islam Mumtaz
  {
    id: 'std-mtz-01',
    division: 'Sekolah Islam Mumtaz',
    class_name: 'Primary 1 Mumtaz',
    student_name: 'Kenzo Danendra Arkan',
    parent_whatsapp: '081234567831',
    parent_email: 'kenzo.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'std-mtz-02',
    division: 'Sekolah Islam Mumtaz',
    class_name: 'Primary 1 Mumtaz',
    student_name: 'Luna Zafira Maheswari',
    parent_whatsapp: '081234567832',
    parent_email: 'luna.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T09:05:00.000Z',
  },
  {
    id: 'std-mtz-03',
    division: 'Sekolah Islam Mumtaz',
    class_name: 'Primary 2 Mumtaz',
    student_name: 'Fikri Ramadhan Kusuma',
    parent_whatsapp: '081234567833',
    parent_email: 'fikri.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T09:10:00.000Z',
  },
  {
    id: 'std-mtz-04',
    division: 'Sekolah Islam Mumtaz',
    class_name: 'Primary 3 Mumtaz',
    student_name: 'Hana Syakira Anindita',
    parent_whatsapp: '081234567834',
    parent_email: 'hana.parent@example.com',
    is_claimed: false,
    claimed_at: null,
    created_at: '2026-01-10T09:15:00.000Z',
  },
];

// Helper for LocalStorage fallback
const getLocal = (key, defaultVal) => {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const setLocal = (key, val) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

const getLocalStudents = () => {
  const data = getLocal(STORAGE_KEYS.STUDENTS, null);
  if (!data || !Array.isArray(data) || data.length === 0) {
    setLocal(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS);
    return DEFAULT_STUDENTS;
  }
  return data;
};

const isValidUuid = (str) =>
  typeof str === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Helper for ticket generator
function getDivisionCode(division = '', className = '') {
  const div = String(division).toUpperCase();
  const cls = String(className).toUpperCase();
  if (div.includes('TK')) return 'TK';
  if (div.includes('SD')) return 'SD';
  if (div.includes('SMP') || div.includes('SMA')) {
    if (cls.includes('SMA') || cls.includes('10') || cls.includes('11') || cls.includes('12')) {
      return 'SMA';
    }
    return 'SMP';
  }
  if (div.includes('MUMTAZ')) return 'MTZ';
  const clean = div.replace(/[^A-Z0-9]/g, '');
  return clean.substring(0, 3) || 'GEN';
}

function getTicketTypeCode(ticketType = '') {
  const norm = String(ticketType).trim().toUpperCase();
  if (norm === 'AYAH') return 'AYAH';
  if (norm === 'BUNDA') return 'BUNDA';
  if (norm === 'IKHWAN') return 'IKHWAN';
  if (norm === 'AKHWAT') return 'AKHWAT';
  return norm.replace(/[^A-Z0-9]/g, '').substring(0, 6) || 'TIK';
}

function mapTicketTrack(ticketType = '') {
  const norm = String(ticketType).trim().toLowerCase();
  if (norm === 'ayah' || norm === 'ikhwan') return 'Ikhwan';
  if (norm === 'bunda' || norm === 'akhwat') return 'Akhwat';
  return 'Ikhwan';
}

function normalizeTicketType(ticketType = '') {
  const norm = String(ticketType).trim().toLowerCase();
  if (norm === 'ayah') return 'Ayah';
  if (norm === 'bunda') return 'Bunda';
  if (norm === 'ikhwan') return 'Ikhwan';
  if (norm === 'akhwat') return 'Akhwat';
  return String(ticketType).trim();
}

function generateRandom6Chars() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateStudentTicketCode(division, className, ticketType) {
  const divCode = getDivisionCode(division, className);
  const typeCode = getTicketTypeCode(ticketType);
  const rand6 = generateRandom6Chars();
  return `MZ-${divCode}-${typeCode}-${rand6}`;
}

// ==========================================
// EVENT SERVICES
// ==========================================
export async function getEventInfo() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) return data;
  }
  return getLocal(STORAGE_KEYS.EVENT, {
    id: 'local-event-1',
    name: 'Acara Seminar & Gathering 2026',
    date: '2026-08-15',
    time: '08:00 WIB',
    location: 'Grand Ballroom Jakarta',
  });
}

export async function saveEventInfo(eventData) {
  if (isSupabaseConfigured) {
    const existing = await getEventInfo();
    if (existing && existing.id && isValidUuid(existing.id)) {
      const { data, error } = await supabase
        .from('events')
        .update({
          name: eventData.name,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (!error && data) return data;
    } else {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          name: eventData.name,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
        }])
        .select()
        .single();
      if (!error && data) return data;
    }
  }
  
  const updated = { id: 'local-event-1', ...eventData };
  setLocal(STORAGE_KEYS.EVENT, updated);
  return updated;
}

// ==========================================
// PARTICIPANT SERVICES
// ==========================================
export async function getParticipants(eventId) {
  let list = [];
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) list = data;
    else list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  } else {
    list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  }

  // Merge persistent WA sent status
  const sentIds = getLocal(STORAGE_KEYS.WA_SENT_IDS, []);
  if (sentIds && sentIds.length > 0) {
    const sentSet = new Set(sentIds);
    list = list.map(p => ({
      ...p,
      wa_sent: Boolean(p.wa_sent || sentSet.has(p.id) || (p.ticket_code && sentSet.has(p.ticket_code))),
    }));
  } else {
    list = list.map(p => ({
      ...p,
      wa_sent: Boolean(p.wa_sent),
    }));
  }

  return list;
}

export async function addParticipant(eventId, participantData) {
  let safeEventId = isValidUuid(eventId) ? eventId : null;

  if (isSupabaseConfigured) {
    // If safeEventId is null, check if there's an existing event row in Supabase
    if (!safeEventId) {
      try {
        const { data: latestEvt } = await supabase
          .from('events')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestEvt?.id && isValidUuid(latestEvt.id)) {
          safeEventId = latestEvt.id;
        }
      } catch (e) {
        // ignore
      }
    }

    const insertPayload = {
      event_id: safeEventId,
      student_id: isValidUuid(participantData.student_id) ? participantData.student_id : null,
      name: participantData.name,
      division: participantData.division,
      class_name: participantData.class_name || null,
      ticket_type: participantData.ticket_type || null,
      track: participantData.track || null,
      whatsapp: participantData.whatsapp || '',
      email: participantData.email || '',
      ticket_code: participantData.ticket_code,
      status: participantData.status || '',
    };

    let { data, error } = await supabase
      .from('participants')
      .insert([insertPayload])
      .select()
      .single();

    // If foreign key constraint failed, retry with event_id: null
    if (error && (error.code === '23503' || String(error.message).includes('foreign key'))) {
      const retry = await supabase
        .from('participants')
        .insert([{ ...insertPayload, event_id: null }])
        .select()
        .single();
      if (!retry.error && retry.data) {
        data = retry.data;
        error = null;
      }
    }

    if (error) {
      console.error('Supabase addParticipant error:', error);
      throw new Error('Database Error: ' + (error.message || 'Gagal menyimpan ke database'));
    }

    if (data) {
      const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
      list.unshift(data);
      setLocal(STORAGE_KEYS.PARTICIPANTS, list);
      return data;
    }
  }

  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const newItem = {
    id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    event_id: safeEventId || eventId,
    ...participantData,
    status: participantData.status || '',
    wa_sent: false,
    scanned_at: null,
    scanned_by: null,
    created_at: new Date().toISOString(),
  };
  list.unshift(newItem);
  setLocal(STORAGE_KEYS.PARTICIPANTS, list);
  return newItem;
}

export async function importParticipants(eventId, newParticipantsList) {
  let safeEventId = isValidUuid(eventId) ? eventId : null;

  if (isSupabaseConfigured) {
    if (!safeEventId) {
      try {
        const { data: latestEvt } = await supabase
          .from('events')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestEvt?.id && isValidUuid(latestEvt.id)) {
          safeEventId = latestEvt.id;
        }
      } catch (e) {
        // ignore
      }
    }

    const toInsert = newParticipantsList.map(p => ({
      event_id: safeEventId,
      student_id: isValidUuid(p.student_id) ? p.student_id : null,
      name: p.name,
      division: p.division,
      class_name: p.class_name || null,
      ticket_type: p.ticket_type || null,
      track: p.track || null,
      whatsapp: p.whatsapp || '',
      email: p.email || '',
      ticket_code: p.ticket_code,
      status: p.status || '',
    }));

    let { data, error } = await supabase.from('participants').insert(toInsert).select();

    // If foreign key constraint failed, retry with event_id: null
    if (error && (error.code === '23503' || String(error.message).includes('foreign key'))) {
      const retryList = toInsert.map(p => ({ ...p, event_id: null }));
      const retry = await supabase.from('participants').insert(retryList).select();
      if (!retry.error && retry.data) {
        data = retry.data;
        error = null;
      }
    }

    if (error) {
      console.error('Supabase importParticipants error:', error);
      throw new Error('Database Error: ' + (error.message || 'Gagal mengimpor ke database'));
    }

    if (data) {
      const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
      setLocal(STORAGE_KEYS.PARTICIPANTS, [...data, ...list]);
      return data;
    }
  }

  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const formattedNewList = newParticipantsList.map(p => ({
    id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    event_id: eventId,
    ...p,
    wa_sent: false,
    created_at: new Date().toISOString(),
  }));
  const updatedList = [...formattedNewList, ...list];
  setLocal(STORAGE_KEYS.PARTICIPANTS, updatedList);
  return formattedNewList;
}

export async function updateParticipant(id, updatedData) {
  if (isSupabaseConfigured) {
    const updatePayload = {
      name: updatedData.name,
      division: updatedData.division,
      whatsapp: updatedData.whatsapp || '',
      email: updatedData.email || '',
    };
    if (updatedData.class_name !== undefined) updatePayload.class_name = updatedData.class_name;
    if (updatedData.ticket_type !== undefined) updatePayload.ticket_type = updatedData.ticket_type;
    if (updatedData.track !== undefined) updatePayload.track = updatedData.track;

    const { data, error } = await supabase
      .from('participants')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data;
  }

  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const idx = list.findIndex(p => p.id === id);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...updatedData,
      name: updatedData.name ?? list[idx].name,
      division: updatedData.division ?? list[idx].division,
      whatsapp: updatedData.whatsapp !== undefined ? updatedData.whatsapp : list[idx].whatsapp,
      email: updatedData.email !== undefined ? updatedData.email : list[idx].email,
    };
    setLocal(STORAGE_KEYS.PARTICIPANTS, list);
    return list[idx];
  }
  return null;
}

export async function markWhatsAppSent(id, ticketCode) {
  // Always update persistent local storage sent IDs set
  const sentIds = getLocal(STORAGE_KEYS.WA_SENT_IDS, []);
  const sentSet = new Set(sentIds);
  if (id) sentSet.add(id);
  if (ticketCode) sentSet.add(ticketCode);
  setLocal(STORAGE_KEYS.WA_SENT_IDS, Array.from(sentSet));

  // Update local storage participants list
  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const idx = list.findIndex(p => p.id === id || (ticketCode && p.ticket_code === ticketCode));
  if (idx !== -1) {
    list[idx].wa_sent = true;
    setLocal(STORAGE_KEYS.PARTICIPANTS, list);
  }

  // Update Supabase if configured
  if (isSupabaseConfigured && id) {
    try {
      await supabase.from('participants').update({ wa_sent: true }).eq('id', id);
    } catch (e) {
      console.warn('Supabase wa_sent column update notice:', e);
    }
  }

  return true;
}

export async function deleteParticipant(id) {
  if (isSupabaseConfigured) {
    await supabase.from('participants').delete().eq('id', id);
  }
  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const updated = list.filter(p => p.id !== id);
  setLocal(STORAGE_KEYS.PARTICIPANTS, updated);

  const sentIds = getLocal(STORAGE_KEYS.WA_SENT_IDS, []);
  setLocal(STORAGE_KEYS.WA_SENT_IDS, sentIds.filter(sId => sId !== id));
}

export async function clearAllParticipants() {
  if (isSupabaseConfigured) {
    await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  setLocal(STORAGE_KEYS.PARTICIPANTS, []);
  setLocal(STORAGE_KEYS.WA_SENT_IDS, []);
}

// ==========================================
// TICKET SCANNER SERVICE (Requirements 8, 9, 10)
// ==========================================
export async function scanTicket(ticketCode, scannerUsername = 'Petugas Scanner') {
  const code = (ticketCode || '').trim().toUpperCase();

  if (isSupabaseConfigured) {
    // 1. Fetch participant by ticket_code
    const { data: participant, error } = await supabase
      .from('participants')
      .select('*')
      .eq('ticket_code', code)
      .single();

    if (error || !participant) {
      return { success: false, reason: 'NOT_FOUND', message: 'Tiket tidak ditemukan.' };
    }

    if (participant.status === 'Hadir') {
      return { 
        success: false, 
        reason: 'ALREADY_USED', 
        message: `Tiket sudah di-scan oleh ${participant.scanned_by || 'petugas lain'}`, 
        participant 
      };
    }

    // 2. Mark as Hadir in Supabase
    const scannedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('participants')
      .update({
        status: 'Hadir',
        scanned_at: scannedAt,
        scanned_by: scannerUsername,
      })
      .eq('id', participant.id)
      .select()
      .single();

    if (updateError || !updated) {
      return { success: false, reason: 'ERROR', message: 'Status tiket gagal diperbarui.' };
    }

    return { 
      success: true, 
      message: 'Tiket berhasil di-scan', 
      participant: updated 
    };
  }

  // LocalStorage Fallback
  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const idx = list.findIndex(p => p.ticket_code?.trim().toUpperCase() === code);

  if (idx === -1) {
    return { success: false, reason: 'NOT_FOUND', message: 'Tiket tidak ditemukan.' };
  }

  const participant = list[idx];

  if (participant.status === 'Hadir') {
    return { 
      success: false, 
      reason: 'ALREADY_USED', 
      message: `Tiket sudah di-scan oleh ${participant.scanned_by || 'petugas lain'}`, 
      participant 
    };
  }

  // Update participant status
  participant.status = 'Hadir';
  participant.scanned_at = new Date().toISOString();
  participant.scanned_by = scannerUsername;
  list[idx] = participant;

  setLocal(STORAGE_KEYS.PARTICIPANTS, list);

  return { 
    success: true, 
    message: 'Tiket berhasil di-scan', 
    participant 
  };
}

// ==========================================
// SCANNER USER MANAGEMENT (Requirements 7 - up to 10 users)
// ==========================================
export async function getScannerUsers() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('scanner_users').select('*');
    if (!error && data) return data;
  }
  return getLocal(STORAGE_KEYS.SCANNERS, DEFAULT_SCANNERS);
}

export async function addScannerUser(username, password, name) {
  const currentScanners = await getScannerUsers();
  if (currentScanners.length >= 10) {
    throw new Error('User scanner sudah 10, batas maksimal.');
  }

  const exists = currentScanners.some(s => s.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    throw new Error('Username sudah dipakai.');
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('scanner_users')
      .insert([{ username, password, name }])
      .select()
      .single();
    if (!error && data) return data;
  }

  const newScanner = {
    id: 's-' + Date.now(),
    username,
    password,
    name: name || username,
  };
  currentScanners.push(newScanner);
  setLocal(STORAGE_KEYS.SCANNERS, currentScanners);
  return newScanner;
}

export async function deleteScannerUser(id) {
  if (isSupabaseConfigured) {
    await supabase.from('scanner_users').delete().eq('id', id);
  }
  const currentScanners = await getScannerUsers();
  const updated = currentScanners.filter(s => s.id !== id);
  setLocal(STORAGE_KEYS.SCANNERS, updated);
}

export async function verifyScannerLogin(username, password) {
  const scanners = await getScannerUsers();
  const user = scanners.find(
    s => s.username.toLowerCase() === username.trim().toLowerCase() && s.password === password.trim()
  );
  return user || null;
}

// ==========================================
// ADMIN MULTI-DIVISI AUTH & PASSWORD SERVICES
// ==========================================
export const DEFAULT_ADMIN_PASSWORDS = {
  'Sekolah Islam Mumtaz': 'simumtaz123',
  'TK Islam Nazhirah': 'simumtaz123',
  'SD Islam Nazhirah': 'simumtaz123',
  'SMP & SMA Islam Nazhirah': 'simumtaz123',
};

export function getAdminPasswords() {
  return getLocal(STORAGE_KEYS.ADMIN_PASSWORDS, DEFAULT_ADMIN_PASSWORDS);
}

export function verifyAdminPassword(division, inputPassword) {
  const passwords = getAdminPasswords();
  const targetPass = passwords[division] || 'simumtaz123';
  return (inputPassword || '').trim().toLowerCase() === targetPass.trim().toLowerCase();
}

export function updateAdminPassword(division, newPassword) {
  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('Password baru minimal 4 karakter.');
  }
  const passwords = getAdminPasswords();
  passwords[division] = newPassword.trim();
  setLocal(STORAGE_KEYS.ADMIN_PASSWORDS, passwords);
  return true;
}

// ==========================================
// MASTER DATA SISWA & TICKET CLAIM SERVICES
// ==========================================

export async function getStudents(filters = {}) {
  if (isSupabaseConfigured) {
    let query = supabase.from('students').select('*');

    if (filters.division) {
      query = query.eq('division', filters.division);
    }
    if (filters.class_name) {
      query = query.eq('class_name', filters.class_name);
    }
    if (typeof filters.is_claimed === 'boolean') {
      query = query.eq('is_claimed', filters.is_claimed);
    }
    if (filters.search && filters.search.trim()) {
      query = query.ilike('student_name', `%${filters.search.trim()}%`);
    }

    query = query.order('student_name', { ascending: true });

    const { data, error } = await query;
    if (!error && data) return data;
    console.warn('Supabase getStudents fallback to local:', error?.message);
  }

  // LocalStorage Fallback
  let list = getLocalStudents();

  if (filters.division) {
    list = list.filter(s => s.division === filters.division);
  }
  if (filters.class_name) {
    list = list.filter(s => s.class_name === filters.class_name);
  }
  if (typeof filters.is_claimed === 'boolean') {
    list = list.filter(s => Boolean(s.is_claimed) === filters.is_claimed);
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(s => s.student_name?.toLowerCase().includes(q));
  }

  return [...list].sort((a, b) => (a.student_name || '').localeCompare(b.student_name || '', 'id'));
}

export async function getStudentById(id) {
  if (!id) return null;

  if (isSupabaseConfigured && isValidUuid(id)) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) return data;
  }

  const list = getLocalStudents();
  return list.find(s => String(s.id) === String(id)) || null;
}

export async function getClassesByDivision(division) {
  const students = await getStudents(division ? { division } : {});
  const classSet = new Set();
  students.forEach(s => {
    if (s.class_name && s.class_name.trim()) {
      classSet.add(s.class_name.trim());
    }
  });

  return Array.from(classSet).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
}

export async function getStudentsByClass(division, className) {
  return getStudents({ division, class_name: className });
}

export async function importStudents(studentsList) {
  if (!Array.isArray(studentsList) || studentsList.length === 0) return [];

  const formatted = studentsList.map(s => ({
    division: s.division,
    class_name: s.class_name,
    student_name: s.student_name,
    parent_whatsapp: s.parent_whatsapp || '',
    parent_email: s.parent_email || '',
    is_claimed: Boolean(s.is_claimed || false),
    claimed_at: s.claimed_at || null,
  }));

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('students').insert(formatted).select();
    if (!error && data) {
      const localList = getLocalStudents();
      setLocal(STORAGE_KEYS.STUDENTS, [...data, ...localList]);
      return data;
    }
    console.error('Supabase importStudents error:', error);
  }

  const localList = getLocalStudents();
  const newItems = formatted.map(s => ({
    id: 'std-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    ...s,
    created_at: new Date().toISOString(),
  }));
  setLocal(STORAGE_KEYS.STUDENTS, [...newItems, ...localList]);
  return newItems;
}

export async function claimStudentTickets({ studentId, tickets, parentWhatsapp, parentEmail, eventId }) {
  // 1. Validasi: siswa harus ada
  const student = await getStudentById(studentId);
  if (!student) {
    throw new Error('Siswa tidak ditemukan.');
  }

  // 2. Validasi: is_claimed harus false
  if (student.is_claimed) {
    throw new Error('Tiket ananda ini sudah pernah diklaim.');
  }

  // 3. Validasi: panjang array tickets minimal 1 dan MAKSIMAL 2 tiket per siswa
  if (!Array.isArray(tickets) || tickets.length === 0) {
    throw new Error('Pilih minimal 1 tiket.');
  }
  if (tickets.length > 2) {
    throw new Error('Maksimal 2 tiket per siswa.');
  }

  // Resolusi eventId yang valid jika ada
  let safeEventId = isValidUuid(eventId) ? eventId : null;
  if (!safeEventId && isSupabaseConfigured) {
    try {
      const { data: latestEvt } = await supabase
        .from('events')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestEvt?.id && isValidUuid(latestEvt.id)) {
        safeEventId = latestEvt.id;
      }
    } catch (e) {
      // ignore
    }
  }

  const finalWhatsapp = (parentWhatsapp || student.parent_whatsapp || '').trim();
  const finalEmail = (parentEmail || student.parent_email || '').trim();
  const claimedAt = new Date().toISOString();

  // 4. Siapkan tiket-tiket yang akan dibuat
  const newParticipants = tickets.map(t => {
    const rawType = typeof t === 'string' ? t : (t.ticket_type || t.type || 'Peserta');
    const ticketType = normalizeTicketType(rawType);
    const track = mapTicketTrack(ticketType);
    const ticketCode = generateStudentTicketCode(student.division, student.class_name, ticketType);

    return {
      event_id: safeEventId,
      student_id: isValidUuid(student.id) ? student.id : null,
      name: `${student.student_name} (${ticketType})`,
      division: student.division,
      class_name: student.class_name,
      ticket_type: ticketType,
      track: track,
      whatsapp: finalWhatsapp,
      email: finalEmail,
      ticket_code: ticketCode,
      status: '',
      wa_sent: false,
    };
  });

  let createdParticipants = [];

  // 5. Simpan ke Supabase jika aktif
  if (isSupabaseConfigured) {
    let { data, error } = await supabase
      .from('participants')
      .insert(newParticipants)
      .select();

    // If foreign key constraint failed on event_id, retry with event_id: null
    if (error && (error.code === '23503' || String(error.message).includes('foreign key'))) {
      const retryList = newParticipants.map(p => ({ ...p, event_id: null }));
      const retry = await supabase.from('participants').insert(retryList).select();
      if (!retry.error && retry.data) {
        data = retry.data;
        error = null;
      }
    }

    if (error) {
      console.error('Supabase claimStudentTickets error:', error);
      throw new Error('Database Error: ' + (error.message || 'Gagal menyimpan tiket ke database'));
    }

    createdParticipants = data || [];

    // Update status siswa di Supabase
    const updateStudentPayload = {
      is_claimed: true,
      claimed_at: claimedAt,
    };
    if (finalWhatsapp) updateStudentPayload.parent_whatsapp = finalWhatsapp;
    if (finalEmail) updateStudentPayload.parent_email = finalEmail;

    if (isValidUuid(student.id)) {
      await supabase
        .from('students')
        .update(updateStudentPayload)
        .eq('id', student.id);
    }
  }

  // Fallback ke LocalStorage jika Supabase tidak aktif atau data kosong
  if (createdParticipants.length === 0) {
    createdParticipants = newParticipants.map(p => ({
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      ...p,
      event_id: p.event_id || eventId || 'local-event-1',
      created_at: new Date().toISOString(),
    }));
  }

  // Simpan tiket baru ke LocalStorage
  const localParts = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  setLocal(STORAGE_KEYS.PARTICIPANTS, [...createdParticipants, ...localParts]);

  // Update status siswa di LocalStorage
  const localStudents = getLocalStudents();
  const sIdx = localStudents.findIndex(s => String(s.id) === String(student.id));
  const updatedStudentObj = {
    ...student,
    is_claimed: true,
    claimed_at: claimedAt,
    parent_whatsapp: finalWhatsapp || student.parent_whatsapp,
    parent_email: finalEmail || student.parent_email,
  };

  if (sIdx !== -1) {
    localStudents[sIdx] = updatedStudentObj;
    setLocal(STORAGE_KEYS.STUDENTS, localStudents);
  } else {
    localStudents.unshift(updatedStudentObj);
    setLocal(STORAGE_KEYS.STUDENTS, localStudents);
  }

  return {
    success: true,
    student: updatedStudentObj,
    tickets: createdParticipants,
  };
}

export async function resetStudentClaim(studentId) {
  if (isSupabaseConfigured) {
    try {
      if (isValidUuid(studentId)) {
        await supabase.from('participants').delete().eq('student_id', studentId);
        await supabase
          .from('students')
          .update({ is_claimed: false, claimed_at: null })
          .eq('id', studentId);
      }
    } catch (e) {
      console.warn('Supabase resetStudentClaim notice:', e);
    }
  }

  // LocalStorage update
  // 1. Hapus tiket yang dibuat untuk siswa ini
  const partList = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const updatedPartList = partList.filter(p => String(p.student_id) !== String(studentId));
  setLocal(STORAGE_KEYS.PARTICIPANTS, updatedPartList);

  // 2. Reset status siswa di LocalStorage
  const studentList = getLocalStudents();
  const sIdx = studentList.findIndex(s => String(s.id) === String(studentId));
  if (sIdx !== -1) {
    studentList[sIdx] = {
      ...studentList[sIdx],
      is_claimed: false,
      claimed_at: null,
    };
    setLocal(STORAGE_KEYS.STUDENTS, studentList);
    return { success: true, student: studentList[sIdx] };
  }

  return { success: true };
}
