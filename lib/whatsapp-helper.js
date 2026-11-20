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
    ? 'Akhwat (pintu ungu)'
    : 'Ikhwan (pintu biru navy)';

  const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
    `Yth. Bapak/Ibu wali murid dari *${participant.name}*,\n\n` +
    `Berikut e-tiket masuk *${eventInfo?.name || 'Kajian Akbar Yayasan Munazarah'}*:\n\n` +
    `*Nama peserta:* ${participant.name}\n` +
    `*Divisi sekolah:* ${participant.division || '-'}\n` +
    (participant.class_name ? `*Kelas:* ${participant.class_name}\n` : '') +
    (participant.ticket_type ? `*Jenis tiket:* ${participant.ticket_type}\n` : '') +
    `*Pintu masuk:* ${trackText}\n` +
    `*Kode tiket:* ${participant.ticket_code}\n` +
    `*Tanggal:* ${eventInfo?.date || '-'}\n` +
    `*Waktu:* ${eventInfo?.time || '-'}\n` +
    `*Lokasi:* ${eventInfo?.location || '-'}\n\n` +
    `Buka kode QR tiket lewat tautan ini:\n` +
    `${ticketPageUrl}\n\n` +
    `_Tunjukkan kode QR di tautan atas ke petugas scanner di pintu masuk sesuai jalur._\n\n` +
    `Jazaakumullahu Khairan Katsiran.\n` +
    `*Panitia Acara Yayasan Munazarah*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
