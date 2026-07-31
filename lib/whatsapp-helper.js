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

  const message = `Assalamu'alaikum *${participant.name}*,\n\nBerikut adalah E-Tiket Masuk Resmi Anda untuk acara *${eventInfo?.name || 'Acara'}*:\n\n` +
    `📌 *Nama Peserta:* ${participant.name}\n` +
    `🏢 *Divisi:* ${participant.division || '-'}\n` +
    `🎟️ *Kode Tiket:* ${participant.ticket_code}\n` +
    `📅 *Tanggal:* ${eventInfo?.date || '-'}\n` +
    `⏰ *Waktu:* ${eventInfo?.time || '-'}\n` +
    `📍 *Lokasi:* ${eventInfo?.location || '-'}\n\n` +
    `📱 Buka dan tunjukkan QR-Code tiket Anda melalui link berikut saat memasuki lokasi acara:\n` +
    `${ticketPageUrl}\n\n` +
    `Jazaakumullahu Khairan!`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
