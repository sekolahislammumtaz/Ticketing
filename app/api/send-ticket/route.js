import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import QRCode from 'qrcode';

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, division, ticketCode, eventInfo } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Alamat email tidak valid.' }, { status: 400 });
    }

    // Generate QR Code as Data URL
    const qrDataUrl = await QRCode.toDataURL(ticketCode, {
      width: 250,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });

    const eventName = eventInfo?.name || 'Acara Tiket';
    const eventDate = eventInfo?.date || '-';
    const eventTime = eventInfo?.time || '-';
    const eventLoc = eventInfo?.location || '-';

    // HTML Email Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 550px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; font-family: sans-serif; }
            .header { background: linear-gradient(135deg, #0284c7, #0369a1); padding: 24px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
            .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
            .body { padding: 24px; text-align: center; }
            .qr-box { background: white; padding: 16px; border-radius: 16px; display: inline-block; margin: 16px 0; border: 1px solid #e2e8f0; }
            .qr-img { width: 180px; height: 180px; display: block; margin: 0 auto; }
            .ticket-code { font-family: monospace; font-size: 24px; font-weight: bold; color: #38bdf8; letter-spacing: 3px; margin: 8px 0; }
            .participant-info { background: #0f172a; padding: 16px; border-radius: 12px; margin-top: 16px; text-align: left; border: 1px solid #334155; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .info-label { color: #94a3b8; }
            .info-val { font-weight: bold; color: #f8fafc; }
            .footer { background: #0f172a; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #334155; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${eventName}</h1>
              <p>Tiket Masuk Resmi Acara</p>
            </div>
            <div class="body">
              <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 12px;">Halo <strong>${name}</strong>, berikut adalah E-Tiket QR-Code Anda:</p>
              
              <div class="qr-box">
                <img src="${qrDataUrl}" class="qr-img" alt="QR Code Tiket" />
              </div>

              <div class="ticket-code">${ticketCode}</div>

              <div class="participant-info">
                <table width="100%" style="font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;">Nama Peserta:</td>
                    <td style="font-weight: bold; color: #ffffff; text-align: right;">${name}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;">Divisi:</td>
                    <td style="font-weight: bold; color: #ffffff; text-align: right;">${division || '-'}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;">Tanggal Acara:</td>
                    <td style="font-weight: bold; color: #ffffff; text-align: right;">${eventDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;">Waktu:</td>
                    <td style="font-weight: bold; color: #ffffff; text-align: right;">${eventTime}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;">Lokasi:</td>
                    <td style="font-weight: bold; color: #ffffff; text-align: right;">${eventLoc}</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">Tunjukkan E-Tiket QR Code ini kepada petugas scanner saat memasuki lokasi acara.</p>
            </div>
            <div class="footer">
              E-Tiket ini dihasilkan secara otomatis oleh Event Ticketing System.
            </div>
          </div>
        </body>
      </html>
    `;

    // If Resend API Key is set, send actual email
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Tiket Acara <onboarding@resend.dev>',
        to: [email],
        subject: `[TIKET MASUK] ${eventName} - ${name}`,
        html: htmlContent,
      });

      if (error) {
        console.error('Resend API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Email tiket berhasil dikirim ke ${email}`, data });
    } else {
      // Simulation mode if RESEND_API_KEY is not set yet
      console.log(`[SIMULATION MODE] Email ticket sent to ${email} for participant ${name} (${ticketCode})`);
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `[Simulasi] Email tiket disiapkan untuk ${email}. Masukkan RESEND_API_KEY di Vercel untuk pengiriman asli.`,
      });
    }
  } catch (err) {
    console.error('Send ticket route error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
