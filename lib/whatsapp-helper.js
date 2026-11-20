// Helper function to format Indonesian phone numbers into international format (628xxx)
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, ''); // remove non-digits
  
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
}

// Generate WhatsApp Click-to-Chat URL with pre-filled ticket message
export function createWhatsAppTicketUrl(participant, eventInfo, baseUrl = '') {
  const phone = formatPhoneNumber(participant.whatsapp);
  if (!phone) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : baseUrl;
  const ticketPageUrl = `${currentOrigin}/ticket/${participant.ticket_code}`;

  const trackText = participant.track === 'Akhwat' 
    ? '🟣 Jalur Akhwat (Pintu Masuk Ungu)' 
    : '🔵 Jalur Ikhwan (Pintu Masuk Biru Navy)';

  const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
    `Yth. Orang Tua / Wali Murid dari *${participant.name}*,\n\n` +
    `Berikut adalah konfirmasi E-Tiket Masuk Resmi untuk menghadiri *${eventInfo?.name || 'Kajian Akbar Yayasan Munazarah'}*:\n\n` +
    `📌 *Nama Peserta:* ${participant.name}\n` +
    `🏢 *Divisi Sekolah:* ${participant.division || '-'}\n` +
    (participant.class_name ? `🏫 *Kelas:* ${participant.class_name}\n` : '') +
    (participant.ticket_type ? `🎟️ *Jenis Tiket:* ${participant.ticket_type}\n` : '') +
    `🚪 *Pintu Masuk:* ${trackText}\n` +
    `🔢 *Kode Tiket:* ${participant.ticket_code}\n` +
    `📅 *Tanggal:* ${eventInfo?.date || '-'}\n` +
    `⏰ *Waktu:* ${eventInfo?.time || '-'}\n` +
    `📍 *Lokasi:* ${eventInfo?.location || '-'}\n\n` +
    `📲 *Buka QR-Code Tiket Anda melalui tautan resmi berikut:*\n` +
    `${ticketPageUrl}\n\n` +
    `_Catatan: Harap tunjukkan QR-Code tiket di tautan atas kepada petugas scanner di pintu masuk sesuai jalur masing-masing._\n\n` +
    `Jazaakumullahu Khairan Katsiran.\n` +
    `*Panitia Acara Yayasan Munazarah*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
