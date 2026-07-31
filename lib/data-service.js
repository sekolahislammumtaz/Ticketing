import { supabase, isSupabaseConfigured } from './supabase';

export { isSupabaseConfigured };


const STORAGE_KEYS = {
  EVENT: 'ticketing_event_info',
  PARTICIPANTS: 'ticketing_participants',
  SCANNERS: 'ticketing_scanner_users',
};

// Default Initial Scanner Users if empty
const DEFAULT_SCANNERS = [
  { id: '1', username: 'scanner1', password: '123', name: 'Petugas Pintu 1' },
  { id: '2', username: 'scanner2', password: '123', name: 'Petugas Pintu 2' },
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

// ==========================================
// EVENT SERVICES
// ==========================================
export async function getEventInfo() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('events').select('*').limit(1).single();
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
    if (existing && existing.id && !existing.id.startsWith('local-')) {
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
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  return getLocal(STORAGE_KEYS.PARTICIPANTS, []);
}

export async function addParticipant(eventId, participantData) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('participants')
      .insert([{
        event_id: eventId || null,
        name: participantData.name,
        division: participantData.division,
        whatsapp: participantData.whatsapp || '',
        email: participantData.email || '',
        ticket_code: participantData.ticket_code,
        status: '',
      }])
      .select()
      .single();
    if (!error && data) return data;
  }

  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const newItem = {
    id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    event_id: eventId,
    ...participantData,
    status: '',
    scanned_at: null,
    scanned_by: null,
    created_at: new Date().toISOString(),
  };
  list.unshift(newItem);
  setLocal(STORAGE_KEYS.PARTICIPANTS, list);
  return newItem;
}

export async function importParticipants(eventId, newParticipantsList) {
  if (isSupabaseConfigured) {
    const toInsert = newParticipantsList.map(p => ({
      event_id: eventId || null,
      name: p.name,
      division: p.division,
      whatsapp: p.whatsapp || '',
      email: p.email || '',
      ticket_code: p.ticket_code,
      status: '',
    }));
    const { data, error } = await supabase.from('participants').insert(toInsert).select();
    if (!error && data) return data;
  }

  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const formattedNewList = newParticipantsList.map(p => ({
    id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    event_id: eventId,
    ...p,
    created_at: new Date().toISOString(),
  }));
  const updatedList = [...formattedNewList, ...list];
  setLocal(STORAGE_KEYS.PARTICIPANTS, updatedList);
  return formattedNewList;
}

export async function updateParticipant(id, updatedData) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('participants')
      .update({
        name: updatedData.name,
        division: updatedData.division,
        whatsapp: updatedData.whatsapp || '',
        email: updatedData.email || '',
      })
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
      name: updatedData.name,
      division: updatedData.division,
      whatsapp: updatedData.whatsapp || '',
      email: updatedData.email || '',
    };
    setLocal(STORAGE_KEYS.PARTICIPANTS, list);
    return list[idx];
  }
  return null;
}

export async function markWhatsAppSent(id) {
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('participants')
      .update({ wa_sent: true })
      .eq('id', id)
      .select()
      .single();
    if (data) return data;
  }

  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const idx = list.findIndex(p => p.id === id);
  if (idx !== -1) {
    list[idx].wa_sent = true;
    setLocal(STORAGE_KEYS.PARTICIPANTS, list);
    return list[idx];
  }
  return null;
}

export async function deleteParticipant(id) {
  if (isSupabaseConfigured) {
    await supabase.from('participants').delete().eq('id', id);
  }
  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const updated = list.filter(p => p.id !== id);
  setLocal(STORAGE_KEYS.PARTICIPANTS, updated);
}

export async function clearAllParticipants() {
  if (isSupabaseConfigured) {
    await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  setLocal(STORAGE_KEYS.PARTICIPANTS, []);
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
      return { success: false, reason: 'NOT_FOUND', message: 'Tiket tidak ditemukan di database!' };
    }

    if (participant.status === 'Hadir') {
      return { 
        success: false, 
        reason: 'ALREADY_USED', 
        message: `Tiket Sudah Pernah di Scan oleh ${participant.scanned_by || 'Petugas Scanner'}`, 
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
      return { success: false, reason: 'ERROR', message: 'Gagal meng-update status tiket di database.' };
    }

    return { 
      success: true, 
      message: 'Tiket berhasil di Scan', 
      participant: updated 
    };
  }

  // LocalStorage Fallback
  const list = getLocal(STORAGE_KEYS.PARTICIPANTS, []);
  const idx = list.findIndex(p => p.ticket_code?.trim().toUpperCase() === code);

  if (idx === -1) {
    return { success: false, reason: 'NOT_FOUND', message: 'Tiket tidak ditemukan!' };
  }

  const participant = list[idx];

  if (participant.status === 'Hadir') {
    return { 
      success: false, 
      reason: 'ALREADY_USED', 
      message: `Tiket Sudah Pernah di Scan oleh ${participant.scanned_by || 'Petugas Scanner'}`, 
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
    message: 'Tiket berhasil di Scan', 
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
    throw new Error('Batas maksimum 10 user tiket scanner telah tercapai!');
  }

  const exists = currentScanners.some(s => s.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    throw new Error('Username scanner sudah digunakan!');
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
