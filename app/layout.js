import './globals.css';

export const metadata = {
  title: 'Event Ticket System - Aplikasi Ticketing Acara & QR Scanner',
  description: 'Sistem manajemen tiket acara dengan QR code unik 8 alfanumerik, ekspor Word (.docx), scanner kamera mobile, dan sinkronisasi Supabase.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
