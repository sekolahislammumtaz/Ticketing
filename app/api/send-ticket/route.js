import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      studentName,
      division,
      className,
      ticketCode,
      tickets: rawTickets,
      eventInfo,
    } = body;

    const resendApiKey = process.env.RESEND_API_KEY || '';
    let resend = null;

    if (resendApiKey) {
      try {
        const { Resend } = await import('resend');
        resend = new Resend(resendApiKey);
      } catch (e) {
        console.warn('Resend package not available:', e);
      }
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Alamat email tidak valid.' }, { status: 400 });
    }

    // 1. Normalize Tickets (supports single ticket or multi-ticket array)
    let ticketList = [];
    if (Array.isArray(rawTickets) && rawTickets.length > 0) {
      ticketList = rawTickets;
    } else if (ticketCode || name) {
      ticketList = [
        {
          name: name || studentName || 'Peserta',
          division: division || '-',
          class_name: className || '',
          ticket_code: ticketCode,
          ticket_type: body.ticket_type || (name?.includes('Ayah') ? 'Ayah' : name?.includes('Bunda') ? 'Bunda' : name?.includes('Akhwat') ? 'Akhwat' : name?.includes('Ikhwan') ? 'Ikhwan' : 'Peserta'),
          track: body.track || null,
        },
      ];
    }

    if (ticketList.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada tiket yang akan dikirim.' }, { status: 400 });
    }

    // 2. Process each ticket (Generate QR & derive track)
    const processedTickets = await Promise.all(
      ticketList.map(async (t) => {
        const rawType = t.ticket_type || (t.name?.includes('Bunda') ? 'Bunda' : t.name?.includes('Akhwat') ? 'Akhwat' : t.name?.includes('Ayah') ? 'Ayah' : 'Peserta');
        const track = t.track || (rawType === 'Bunda' || rawType === 'Akhwat' ? 'Akhwat' : 'Ikhwan');
        const isAkhwat = track === 'Akhwat';
        const code = t.ticket_code || t.ticketCode || 'TICKET';

        // QR Code generation with color theme
        const qrDarkColor = isAkhwat ? '#3b0764' : '#0f172a';
        const qrDataUrl = await QRCode.toDataURL(code, {
          width: 260,
          margin: 2,
          color: { dark: qrDarkColor, light: '#ffffff' },
          errorCorrectionLevel: 'H',
        });

        return {
          ...t,
          ticket_type: rawType,
          track,
          isAkhwat,
          code,
          qrDataUrl,
        };
      })
    );

    const displayName = studentName || name || processedTickets[0]?.name || 'Wali Murid';
    const displayDivision = division || processedTickets[0]?.division || 'Yayasan Munazarah';
    const displayClass = className || processedTickets[0]?.class_name || '';

    const eventName = eventInfo?.name || 'Kajian Akbar Yayasan Munazarah';
    const eventDate = eventInfo?.date || '-';
    const eventTime = eventInfo?.time || '-';
    const eventLoc = eventInfo?.location || '-';

    // 3. Build Ticket Cards HTML with strict Navy vs Ungu visual separation
    const ticketCardsHtml = processedTickets
      .map((t) => {
        const theme = t.isAkhwat
          ? {
              cardBg: '#1e112a',
              border: '#7e22ce',
              badgeBg: '#581c87',
              badgeBorder: '#a855f7',
              badgeText: '#f3e8ff',
              badgeLabel: '🟣 JALUR AKHWAT',
              titleColor: '#ffffff',
              subtitleColor: '#d8b4fe',
              doorDesc: 'Pintu Masuk Khusus Akhwat (Ungu)',
              codeColor: '#c084fc',
              infoNote: 'Tunjukkan barcode ini kepada petugas scanner di pintu masuk <strong>Akhwat (Ungu)</strong>',
            }
          : {
              cardBg: '#0c1527',
              border: '#2563eb',
              badgeBg: '#1e3a8a',
              badgeBorder: '#3b82f6',
              badgeText: '#dbeafe',
              badgeLabel: '🔵 JALUR IKHWAN',
              titleColor: '#ffffff',
              subtitleColor: '#93c5fd',
              doorDesc: 'Pintu Masuk Khusus Ikhwan (Biru Navy)',
              codeColor: '#38bdf8',
              infoNote: 'Tunjukkan barcode ini kepada petugas scanner di pintu masuk <strong>Ikhwan (Biru Navy)</strong>',
            };

        return `
          <div style="background: ${theme.cardBg}; border: 2px solid ${theme.border}; border-radius: 16px; padding: 22px 18px; margin-bottom: 22px; text-align: center;">
            <!-- Badge Jalur -->
            <div style="display: inline-block; padding: 5px 14px; border-radius: 9999px; background: ${theme.badgeBg}; border: 1px solid ${theme.badgeBorder}; color: ${theme.badgeText}; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;">
              ${theme.badgeLabel}
            </div>

            <!-- Ticket Title -->
            <h3 style="margin: 0 0 4px 0; font-size: 19px; font-weight: 800; color: ${theme.titleColor};">
              Tiket ${t.ticket_type}
            </h3>
            <p style="margin: 0 0 16px 0; font-size: 12px; color: ${theme.subtitleColor}; font-weight: 500;">
              ${theme.doorDesc}
            </p>

            <!-- QR Code Container -->
            <div style="background: #ffffff; padding: 12px; border-radius: 14px; display: inline-block; margin: 0 auto; box-shadow: 0 6px 16px rgba(0,0,0,0.35);">
              <img src="${t.qrDataUrl}" alt="QR Code ${t.code}" width="180" height="180" style="display: block; margin: 0 auto;" />
            </div>

            <!-- Ticket Code -->
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 21px; font-weight: 800; color: ${theme.codeColor}; letter-spacing: 2px; margin-top: 14px;">
              ${t.code}
            </div>

            <!-- Direction Note -->
            <div style="margin-top: 10px; font-size: 11px; color: #94a3b8; line-height: 1.4;">
              ${theme.infoNote}
            </div>
          </div>
        `;
      })
      .join('');

    // 4. Complete Responsive HTML Email Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>E-Tiket Resmi Kajian Yayasan Munazarah</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070b14; color: #f8fafc; margin: 0; padding: 24px 12px;">
          <div style="max-width: 560px; margin: 0 auto; background: #0f172a; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.5);">
            
            <!-- Header with Gradient Branding -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b0764 100%); padding: 26px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <h1 style="margin: 0; font-size: 19px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                KAJIAN YAYASAN MUNAZARAH
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #93c5fd; font-weight: 600;">
                E-Tiket Masuk Resmi &bull; Barcode Masuk Acara
              </p>
            </div>

            <!-- Content Area -->
            <div style="padding: 24px 20px;">
              <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #cbd5e1; line-height: 1.6;">
                Assalamu'alaikum Warahmatullahi Wabarakatuh,<br />
                Berikut adalah E-Tiket resmi masuk kajian untuk ananda <strong style="color: #ffffff;">${displayName}</strong> 
                (${displayDivision}${displayClass ? ` &bull; ${displayClass}` : ''}):
              </p>

              <!-- Event Details Box -->
              <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 14px; padding: 14px 16px; margin-bottom: 22px;">
                <table width="100%" cellpadding="3" cellspacing="0" style="font-size: 12.5px; border-collapse: collapse;">
                  <tr>
                    <td style="color: #64748b; width: 32%;">Nama Acara:</td>
                    <td style="font-weight: 700; color: #ffffff;">${eventName}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Tanggal:</td>
                    <td style="font-weight: 700; color: #ffffff;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Waktu:</td>
                    <td style="font-weight: 700; color: #ffffff;">${eventTime}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Lokasi:</td>
                    <td style="font-weight: 700; color: #ffffff;">${eventLoc}</td>
                  </tr>
                </table>
              </div>

              <!-- Ticket Cards (Navy for Ikhwan, Ungu for Akhwat) -->
              ${ticketCardsHtml}

              <!-- Security & Guide Box -->
              <div style="background: #1e293b; border-radius: 12px; padding: 14px 16px; font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 10px;">
                <p style="margin: 0 0 6px 0; font-weight: 700; color: #f1f5f9;">Petunjuk Penting Masuk Acara:</p>
                <ul style="margin: 0; padding-left: 18px; color: #cbd5e1;">
                  <li style="margin-bottom: 4px;">Pintu masuk dipisahkan antara <strong>Jalur Ikhwan (Biru Navy)</strong> dan <strong>Jalur Akhwat (Ungu)</strong>.</li>
                  <li style="margin-bottom: 4px;">Tunjukkan barcode ini langsung dari layar ponsel Anda kepada petugas scanner.</li>
                  <li>Setiap barcode hanya berlaku untuk <strong>1 kali pemindaian masuk</strong> (check-in).</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #090d16; padding: 16px 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 4px 0;">&copy; 2026 Yayasan Munazarah Ticketing System</p>
              <p style="margin: 0;">Pesan ini dikirimkan otomatis ke alamat email wali murid terkonfirmasi.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailSubject = `[E-TIKET RESMI] ${eventName} (${processedTickets.length} Tiket) - ${displayName}`;

    // 5. Send actual email if RESEND_API_KEY is configured
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Yayasan Munazarah <onboarding@resend.dev>',
        to: [email],
        subject: emailSubject,
        html: htmlContent,
      });

      if (error) {
        console.error('Resend API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Email tiket (${processedTickets.length} tiket) berhasil dikirim ke ${email}`,
        data,
      });
    } else {
      // Simulation mode if RESEND_API_KEY is not configured
      console.log(`[SIMULATION MODE] Email ticket sent to ${email} for student ${displayName} (${processedTickets.length} tickets)`);
      return NextResponse.json({
        success: true,
        simulated: true,
        ticketCount: processedTickets.length,
        message: `[Simulasi] Email ${processedTickets.length} tiket disiapkan untuk ${email}. Masukkan RESEND_API_KEY di Vercel/.env.local untuk pengiriman fisik.`,
      });
    }
  } catch (err) {
    console.error('Send ticket route error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
