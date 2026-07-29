import QRCode from 'qrcode';

// Generate 8-character unique alphanumeric ticket code (Uppercase letters & digits)
export function generateTicketCode(existingCodes = new Set()) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude easily confused chars (0, O, 1, I)
  let code = '';
  let attempts = 0;
  
  do {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
  } while (existingCodes.has(code) && attempts < 1000);

  return code;
}

// Generate QR Code as Data URL (Base64 PNG Image)
export async function generateQRCodeDataUrl(text) {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 250,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    return null;
  }
}
