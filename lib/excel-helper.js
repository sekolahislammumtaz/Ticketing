import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { generateTicketCode } from './ticket-generator';

// Parse Excel or CSV file to participant list with auto-generated 8-char ticket codes
export function parseExcelParticipants(fileBuffer, existingCodesSet = new Set()) {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to json array
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const participants = [];

  for (const row of rawData) {
    // Flexible header mapping (case-insensitive)
    let name = '';
    let division = '';
    let whatsapp = '';
    let email = '';

    for (const key of Object.keys(row)) {
      const lowerKey = key.trim().toLowerCase();
      const val = String(row[key] || '').trim();

      if (['nama', 'name', 'nama peserta', 'full name'].includes(lowerKey)) {
        name = val;
      } else if (['divisi', 'division', 'bagian', 'departemen', 'dept'].includes(lowerKey)) {
        division = val;
      } else if (['whatsapp', 'wa', 'no whatsapp', 'no hp', 'phone', 'telepon'].includes(lowerKey)) {
        whatsapp = val;
      } else if (['email', 'alamat email', 'e-mail'].includes(lowerKey)) {
        email = val;
      }
    }

    // Skip empty rows where name is missing
    if (!name) continue;

    const ticketCode = generateTicketCode(existingCodesSet);
    existingCodesSet.add(ticketCode);

    participants.push({
      name,
      division: division || 'Umum',
      whatsapp: whatsapp || '',
      email: email || '',
      ticket_code: ticketCode,
      status: '', // empty status means not scanned yet
      scanned_at: null,
      scanned_by: null,
    });
  }

  return participants;
}

// Export participants data to Excel file
export function exportParticipantsToExcel(eventName, participants) {
  if (!participants || participants.length === 0) {
    alert('Tidak ada data peserta untuk di-ekspor!');
    return;
  }

  const exportData = participants.map((p, index) => ({
    'No': index + 1,
    'Nama Peserta': p.name,
    'Divisi': p.division,
    'Nomor WhatsApp': p.whatsapp || '-',
    'Email': p.email || '-',
    'Kode Tiket': p.ticket_code,
    'Status Kehadiran': p.status === 'Hadir' ? 'Hadir' : 'Belum Hadir',
    'Waktu Scan': p.scanned_at ? new Date(p.scanned_at).toLocaleString('id-ID') : '-',
    'Petugas Scan': p.scanned_by || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Peserta');

  // Auto-width columns
  const colWidths = [
    { wch: 5 },  // No
    { wch: 25 }, // Nama
    { wch: 20 }, // Divisi
    { wch: 18 }, // WhatsApp
    { wch: 25 }, // Email
    { wch: 15 }, // Kode Tiket
    { wch: 18 }, // Status
    { wch: 22 }, // Waktu Scan
    { wch: 18 }, // Petugas Scan
  ];
  worksheet['!cols'] = colWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  const fileName = `Data_Peserta_${(eventName || 'Acara').replace(/\s+/g, '_')}.xlsx`;
  saveAs(blob, fileName);
}
