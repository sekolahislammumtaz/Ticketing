# Implementation Plan: Self-Service Ticketing & Multi-Divisi Yayasan Munazarah

## Overview
Mentransformasikan sistem ticketing Yayasan Munazarah menjadi portal pemesanan tiket mandiri (*self-service*) bagi wali murid dari 4 divisi sekolah (TK Islam Nazhirah, SD Islam Nazhirah, SMP & SMA Islam Nazhirah, Sekolah Islam Mumtaz) dengan alur *cascading dropdown*, pembatasan 2 tiket per siswa, pemisahan visual Ikhwan (Navy) vs Akhwat (Ungu), autentikasi kepemilikan melalui pengiriman QR-Code via email (tanpa menampilkan QR di layar publik), fitur pengiriman tiket via WhatsApp dari admin dashboard dengan indikator warna status, serta *scanner* universal.

---

## Architecture Decisions

1. **Skema Database & Data Service (`supabase/schema.sql`, `lib/data-service.js`):**
   - Penambahan entitas master siswa (`students`) yang dikelompokkan berdasarkan divisi (`division`) dan kelas (`class_name`).
   - Relasi ke tabel `participants` untuk membatasi klaim maksimal 2 tiket per siswa dan melacak status kehadiran (`status = 'Hadir'`).
   - Dukungan mode fallback `localStorage` (`STORAGE_KEYS.STUDENTS`) jika konfigurasi database Supabase belum terhubung.

2. **Portal Self-Service Publik (`app/page.js`):**
   - Dropdown *cascading*: Divisi -> Kelas -> Siswa (dengan fitur *searchable*).
   - Pemilihan jenis tiket: Ayah, Bunda, Ikhwan, Akhwat (maksimal total 2 tiket per siswa dengan validasi instan).
   - Input nomor WhatsApp & Email wali murid, dengan konfirmasi kontak tersensor (*masked*).
   - Notifikasi sukses pemesanan di layar **tanpa** menampilkan QR code publik demi keamanan, mengarahkan wali murid untuk mengecek email.

3. **Pengiriman Email Ber-QR (`app/api/send-ticket/route.js`):**
   - Integrasi layanan pengiriman email (Nodemailer / Resend API) yang melampirkan QR Code unik untuk setiap tiket.
   - Desain template email responsif dengan pemisahan tema visual: **Navy** untuk jalur Ikhwan dan **Ungu** untuk jalur Akhwat.

4. **Admin Multi-Divisi & WhatsApp Sender (`app/admin/page.js`):**
   - Halaman login admin dengan pilihan akses multi-divisi (atau super admin Yayasan).
   - Fitur *Import Master Siswa* via file Excel/CSV (`xlsx` parser).
   - Dashboard monitoring statistik kehadiran secara *real-time* per kelas dan divisi.
   - Tombol pengiriman tiket via WhatsApp dengan indikator warna status (Hijau = belum dikirim/perlu follow-up, Biru = sudah dikirim).

5. **Scanner Universal (`app/scan/page.js`):**
   - Pemindaian QR Code peserta menggunakan kamera/pemindai universal.
   - Modal hasil scan yang menampilkan badge dan tema warna **Navy** (Ikhwan) atau **Ungu** (Akhwat) secara jelas beserta data siswa dan status check-in.

---

## Task List & Phases

- **Phase 1: Foundation**
  - [x] Task 1: Skema Database & Data Service Master Siswa + Klaim Tiket
  - *Checkpoint 1*: Verifikasi skema database dan mock/service layer (SELESAI).

- **Phase 2: Core Self-Service Flow**
  - [x] Task 2: UI Dropdown Cascading & Searchable Siswa di Homepage
  - [x] Task 3: Verifikasi Kontak, WhatsApp Admin Redirect & Pengamanan Klaim
  - *Checkpoint 2*: Pengujian alur self-service dari pemilihan siswa hingga konfirmasi berhasil (SELESAI).

- **Phase 3: Secure Email Delivery**
  - [x] Task 4: API & Template Email Multi-Tiket Jalur Ikhwan & Akhwat
  - *Checkpoint 3*: Verifikasi pengiriman email dengan QR Code dan tema warna yang sesuai (SELESAI).

- **Phase 4: Admin Portal & WhatsApp Sender**
  - [ ] Task 5: Admin Login Multi-Divisi & Import Master Siswa Excel
  - [ ] Task 6: Manajemen Tiket Diklaim, WhatsApp Sender & Dashboard Monitoring Yayasan
  - *Checkpoint 4*: Pengujian dashboard admin, import siswa, dan status pengiriman WhatsApp.

- **Phase 5: Universal Scanner Enhancement**
  - [ ] Task 7: Modal Scanner Universal dengan Penanda Jalur Ikhwan (Navy) & Akhwat (Ungu)
  - *Checkpoint 5*: Pengujian *end-to-end* dari pemesanan hingga *scanning* tiket di gerbang acara.

---

## Risks and Mitigations Table

| Risk Description | Impact | Probability | Mitigation Strategy |
|------------------|--------|------------|---------------------|
| Wali murid salah memasukkan data siswa atau duplikasi klaim lebih dari 2 tiket. | Tinggi | Sedang | Validasi ketat berbasis ID siswa di database dengan batas maksimal 2 tiket per siswa serta pencarian interaktif. |
| QR Code bocor atau disalahgunakan di layar publik. | Tinggi | Rendah | QR Code **tidak pernah** ditampilkan di layar web publik; hanya dikirimkan secara privat melalui email terverifikasi. |
| Kegagalan pengiriman email saat lonjakan trafik pemesanan. | Sedang | Sedang | Sediakan mekanisme *retry*, *fallback log* di admin dashboard, serta tombol kirim ulang via WhatsApp/Email oleh admin. |
| Kendala jaringan/koneksi internet saat pemindaian di gerbang acara. | Tinggi | Rendah | Implementasi cache lokal pada aplikasi scanner dan dukungan sinkronisasi offline. |

---

## Kontak Resmi 4 Divisi Sekolah

1. **TK Islam Nazhirah:**
   - WhatsApp Admin: `0899-9783-882`
2. **SD Islam Nazhirah:**
   - WhatsApp Admin: `0899-7711-234`
3. **SMP & SMA Islam Nazhirah:**
   - WhatsApp Admin: `0896-1860-0656`
4. **Sekolah Islam Mumtaz:**
   - WhatsApp Admin: `0899-974-1234`
