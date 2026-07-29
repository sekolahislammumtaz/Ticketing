# Event Ticketing & QR Scanner App

Aplikasi Web Ticketing Acara lengkap berbasis **Next.js (App Router)**, **Tailwind CSS**, **Supabase PostgreSQL**, **Docx Exporter**, **SheetJS Excel**, dan **Kamera Smartphone QR Scanner**.

---

## 🌟 Fitur Utama (Sesuai Spesifikasi Request)

1. **Nomor Tiket QR 8 Alfanumerik Unik**:
   - Kode tiket di-generate otomatis oleh sistem dengan kombinasi 8 karakter alfanumerik acak (contoh: `A7K9M2P4`).
   - Kode dijamin unik untuk setiap peserta dalam 1 acara.

2. **Dashboard Admin**:
   - Input/Edit detail acara: Nama Acara, Tanggal, Jam/Waktu, dan Lokasi.
   - Impor data peserta dari file Excel (`.xlsx` / `.csv`) dengan kolom: Nama, Divisi, No WhatsApp (Opsional), Email (Opsional).
   - Ekspor tiket ke berkas **Microsoft Word (`.docx`)** berisi QR code, Nama, dan Divisi di bawah QR code siap cetak (grid 2x4 layout).
   - Ekspor data peserta ke file Excel (`.xlsx`) lengkap dengan status kehadiran & timestamp scan.
   - Tambah data peserta manual, edit, hapus peserta, dan hapus semua data peserta.

3. **User Ticket Scanner (Hingga 10 Akun)**:
   - Pengelolaan akun petugas tiket scanner (Username & Password) langsung melalui halaman Admin (`/admin/scanner-users`).

4. **Kamera QR Ticket Scanner Smartphone (`/scan`)**:
   - Menggunakan kamera smartphone secara langsung untuk scan tiket QR code peserta.
   - Memasukkan status `"Hadir"` ke database saat tiket valid.
   - Jika tiket QR yang sama di-scan lagi, sistem menolak dan menginformasikan **"Tiket telah digunakan!"** serta waktu scan sebelumnya.
   - Efek suara bip/beep, notifikasi popup nama & divisi peserta, serta animasi haptic/confetti saat scan berhasil.

5. **Optimasi Penyimpanan Database**:
   - Hanya nomor tiket alfanumerik (8 karakter) yang disimpan di database Supabase. Gambar QR code tidak disimpan di DB, melainkan di-render secara dinamis di browser dan dokumen Word.

---

## 🚀 Panduan Setup Database Supabase Gratis (3 Menit)

1. Buat akun gratis di [Supabase.com](https://supabase.com).
2. Buat Project Baru (pilih wilayah Singapore / Jakarta).
3. Buka menu **SQL Editor** di sidebar Supabase.
4. Salin (copy) seluruh isi file `supabase/schema.sql` di project ini, lalu paste ke SQL Editor dan klik **Run**.
5. Buka menu **Project Settings -> API** di Supabase, lalu salin:
   - `Project URL`
   - `anon public key`

---

## ⚡ Panduan Deploy Gratis di Vercel

1. Buat akun gratis di [Vercel.com](https://vercel.com).
2. Upload / push repositori project ini ke GitHub / GitLab.
3. Di Vercel, klik **Add New Project** -> Import repositori GitHub Anda.
4. Pada bagian **Environment Variables**, tambahkan 2 variabel dari Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Project URL dari Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Anon Public Key dari Supabase)
5. Klik **Deploy**. Aplikasi akan online dalam 1 menit dengan URL gratis `https://nama-aplikasi.vercel.app`!

---

## 💻 Jalankan Lokal (Development)

```bash
# 1. Install dependencies
npm install

# 2. Jalankan server lokal
npm run dev
```

Buka `http://localhost:3000` di browser Anda.

---

## 📁 Struktur Project

- `app/page.js`: Beranda / Portal Navigasi Admin & Scanner.
- `app/admin/page.js`: Portal Admin (Acara, Impor Excel, Generate Tiket, Ekspor Word/Excel).
- `app/admin/scanner-users/page.js`: Manajemen 10 User Tiket Scanner.
- `app/scan/login/page.js`: Halaman Login Petugas Scanner.
- `app/scan/page.js`: Aplikasi Kamera Scanner Smartphone.
- `lib/data-service.js`: Adapter Database Supabase + LocalStorage Fallback.
- `lib/docx-exporter.js`: Pembuat Berkas Word (`.docx`) Tiket QR Siap Cetak.
- `lib/excel-helper.js`: Reader & Writer File Excel (`.xlsx`).
- `lib/ticket-generator.js`: Generator Kode Tiket 8 Alfanumerik Unik & QR Code.
- `supabase/schema.sql`: Script SQL Pembuatan Database PostgreSQL Supabase.
