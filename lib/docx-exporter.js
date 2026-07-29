import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, BorderStyle, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { generateQRCodeDataUrl } from './ticket-generator';

// Helper to convert dataURL (base64) to Uint8Array
function dataURLToUint8Array(dataURL) {
  const base64 = dataURL.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function exportTicketsToWord(eventInfo, participants) {
  if (!participants || participants.length === 0) {
    alert('Tidak ada data peserta untuk di-ekspor!');
    return;
  }

  // Create document elements
  const tableRows = [];

  // Header Section
  const headerParagraphs = [
    new Paragraph({
      children: [
        new TextRun({
          text: `DAFTAR TIKET PESERTA - ${eventInfo?.name?.toUpperCase() || 'ACARA'}`,
          bold: true,
          size: 28,
          color: '0369A1',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Tanggal: ${eventInfo?.date || '-'} | Waktu: ${eventInfo?.time || '-'} | Lokasi: ${eventInfo?.location || '-'}`,
          italic: true,
          size: 20,
          color: '475569',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  // Process participants in pairs (2 tickets per row grid)
  for (let i = 0; i < participants.length; i += 2) {
    const pair = participants.slice(i, i + 2);
    const cells = [];

    for (const participant of pair) {
      const qrDataUrl = await generateQRCodeDataUrl(participant.ticket_code);
      const qrBytes = dataURLToUint8Array(qrDataUrl);

      cells.push(
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '0284C7' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '0284C7' },
            left: { style: BorderStyle.SINGLE, size: 6, color: '0284C7' },
            right: { style: BorderStyle.SINGLE, size: 6, color: '0284C7' },
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: eventInfo?.name || 'TIKET MASUK',
                  bold: true,
                  size: 20,
                  color: '0369A1',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: qrBytes,
                  transformation: { width: 140, height: 140 },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: participant.ticket_code,
                  bold: true,
                  size: 24,
                  color: '0F172A',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: participant.name,
                  bold: true,
                  size: 22,
                  color: '1E293B',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Divisi: ${participant.division || '-'}`,
                  size: 18,
                  color: '64748B',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            }),
          ],
        })
      );
    }

    // If odd number of participants in final row, add empty spacer cell
    if (cells.length === 1) {
      cells.push(
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          children: [new Paragraph({ text: '' })],
        })
      );
    }

    tableRows.push(
      new TableRow({
        children: cells,
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...headerParagraphs,
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `Tiket_${(eventInfo?.name || 'Acara').replace(/\s+/g, '_')}.docx`;
  saveAs(blob, fileName);
}
