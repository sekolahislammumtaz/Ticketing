# Task Checklist: Self-Service Ticketing & Multi-Divisi Yayasan Munazarah

- [x] **Task 1: Skema Database & Data Service Master Siswa + Klaim Tiket**
  - **Description:** Membuat struktur database (dan data service dengan dukungan fallback localStorage) untuk entitas master siswa (`students`) per 4 divisi (TK Islam Nazhirah, SD Islam Nazhirah, SMP & SMA Islam Nazhirah, Sekolah Islam Mumtaz), kelas, serta tabel tiket/klaim di `participants` yang membatasi maksimal 2 tiket per siswa.
  - **Acceptance Criteria:**
    - [x] Tabel/model `students` mencakup `id`, `division`, `class_name`, `student_name`, `parent_whatsapp`, `parent_email`, `is_claimed`.
    - [x] Tabel/model `participants` mencakup relasi ke `student_id`, `ticket_type` (Ayah/Bunda/Ikhwan/Akhwat), `track` (Ikhwan/Akhwat), `status`, dan `ticket_code` unik.
    - [x] Batasan (*constraint*) maksimal 2 tiket per siswa diterapkan pada service layer.
    - [x] Dukungan fallback localStorage tersimpan saat Supabase offline.
  - **Verification:** `npm run build` dan verifikasi pemanggilan fungsi data service.
  - **Dependencies:** None
  - **Files likely touched:** `supabase/schema.sql`, `lib/data-service.js`
  - **Estimated scope:** M

- [x] **Checkpoint 1**

- [x] **Task 2: UI Dropdown Cascading & Searchable Siswa di Homepage**
  - **Description:** Membangun antarmuka *self-service* di `app/page.js` dengan alur *cascading dropdown* (Divisi -> Kelas -> Siswa) yang dilengkapi fitur pencarian (*searchable*), serta pilihan jenis tiket (Ayah, Bunda, Ikhwan, Akhwat) dengan validasi batas maksimal 2 tiket.
  - **Acceptance Criteria:**
    - [x] Dropdown Divisi memuat 4 unit sekolah Yayasan Munazarah.
    - [x] Pemilihan divisi memfilter daftar kelas, dan pemilihan kelas memfilter daftar siswa secara *real-time*.
    - [x] Kotak pencarian nama siswa berfungsi responsif.
    - [x] Pilihan tiket divalidasi agar total tiket yang dipilih per siswa tidak melebihi 2.
  - **Verification:** Pengujian interaksi UI di browser.
  - **Dependencies:** Task 1
  - **Files likely touched:** `app/page.js`, `components/SelfServiceForm.jsx`
  - **Estimated scope:** L

- [x] **Task 3: Verifikasi Kontak, WhatsApp Admin Redirect & Pengamanan Klaim**
  - **Description:** Menambahkan input nomor WhatsApp dan email pada form pemesanan, menampilkan konfirmasi kontak tersensor (*masked*), serta tombol *redirect* WhatsApp admin untuk bantuan klaim jika diperlukan, serta memastikan QR Code **tidak** ditampilkan di layar publik.
  - **Acceptance Criteria:**
    - [x] Input nomor WhatsApp & Email tervalidasi dengan format yang benar.
    - [x] Layar konfirmasi menampilkan nomor kontak tersensor (contoh: `0812-****-7801`, `fa***@example.com`).
    - [x] Halaman sukses pemesanan menampilkan pesan instruksi untuk memeriksa email dan **tidak** menampilkan QR code secara publik.
    - [x] Tombol bantuan WhatsApp admin tersedia dengan tautan resmi 4 divisi sekolah.
  - **Verification:** Uji alur submission form dan pengecekan ketiadaan QR code di UI publik.
  - **Dependencies:** Task 2
  - **Files likely touched:** `app/page.js`, `components/ConfirmationModal.jsx`, `components/SuccessView.jsx`
  - **Estimated scope:** M

- [x] **Checkpoint 2**

- [x] **Task 4: API & Template Email Multi-Tiket Jalur Ikhwan & Akhwat**
  - **Description:** Mengembangkan endpoint API (`app/api/send-ticket/route.js`) untuk menghasilkan dan mengirimkan email berisi 1 atau 2 tiket ber-QR Code dengan pemisahan tema visual: **Navy** untuk jalur Ikhwan dan **Ungu** untuk jalur Akhwat.
  - **Acceptance Criteria:**
    - [x] Endpoint API menerima data pemesanan dan menghasilkan QR Code unik per tiket.
    - [x] Template email responsif dengan styling tema Navy (Ikhwan) dan Ungu (Akhwat).
    - [x] Integrasi pengiriman email (Nodemailer / Mock service dengan log).
  - **Verification:** Pengujian pengiriman email uji coba dan validasi tampilan QR.
  - **Dependencies:** Task 3
  - **Files likely touched:** `app/api/send-ticket/route.js`, `lib/ticket-generator.js`
  - **Estimated scope:** M

- [x] **Checkpoint 3**

- [x] **Task 5: Admin Login Multi-Divisi & Import Master Siswa Excel**
  - **Description:** Membuat halaman login admin (`app/admin/page.js`) dengan pilihan akses multi-divisi dan fitur *Import Master Siswa* via file Excel/CSV.
  - **Acceptance Criteria:**
    - [x] Form login admin mendukung pemilihan divisi sekolah atau akses Superadmin Yayasan (Sekolah Islam Mumtaz).
    - [x] Password default awal `'simumtaz123'` untuk semua divisi dengan fitur ganti password admin persisten.
    - [x] Fitur unduh template Excel & unggah file Excel untuk import data master siswa (`Divisi`, `Kelas`, `Nama Siswa`, `No WhatsApp`, `Email`).
    - [x] Validasi baris data Excel sebelum disimpan ke tabel `students` beserta fitur reset klaim siswa.
  - **Verification:** `npm run build` berhasil dengan exit code 0 dan verifikasi fitur master siswa di dashboard.
  - **Dependencies:** Task 1
  - **Files likely touched:** `app/admin/page.js`, `lib/excel-helper.js`, `lib/data-service.js`
  - **Estimated scope:** M

- [x] **Task 6: Manajemen Tiket Diklaim, WhatsApp Sender & Dashboard Monitoring Yayasan**
  - **Description:** Melengkapi dashboard admin dengan tabel manajemen tiket yang diklaim, tombol pengiriman tiket via WhatsApp dengan template chat resmi dan indikator warna status persisten (Hijau = belum dikirim, Biru = sudah dikirim), serta statistik kehadiran *real-time* per kelas dan divisi.
  - **Acceptance Criteria:**
    - [x] Tabel daftar tiket menampilkan detail siswa, divisi, kelas, jenis tiket, dan status WhatsApp.
    - [x] Indikator warna status WhatsApp (Hijau & Biru) persisten di browser/DB.
    - [x] Tombol aksi membuka link wa.me ke nomor WhatsApp orang tua dengan pesan resmi & link e-tiket.
    - [x] Ringkasan statistik kehadiran *real-time* per divisi dan per kelas untuk monitoring yayasan.
    - [x] Ekspor Excel 2 sheet (Hadir & Belum Hadir) terurut per divisi dan nama siswa dengan kolom lengkap.
  - **Verification:** Uji fungsionalitas tombol WhatsApp, warna status, verifikasi data ekspor Excel, dan build Next.js lulus 100%.
  - **Dependencies:** Task 4, Task 5
  - **Files likely touched:** `app/admin/page.js`, `lib/whatsapp-helper.js`, `lib/excel-helper.js`
  - **Estimated scope:** L

- [x] **Checkpoint 4**

- [x] **Task 7: Modal Scanner Universal dengan Penanda Jalur Ikhwan (Navy) & Akhwat (Ungu)**
  - **Description:** Mengembangkan halaman *scanner* universal (`app/scan/page.js`) yang memindai QR code tiket, menampilkan modal hasil scan dengan badge dan tema warna **Biru Navy** (Ikhwan) atau **Ungu** (Akhwat) secara jelas beserta informasi siswa dan status kehadiran.
  - **Acceptance Criteria:**
    - [x] Scanner universal dapat memindai tiket dari divisi mana pun.
    - [x] Modal hasil scan mendeteksi jalur tiket dan menerapkan tema warna **Biru Navy** untuk Ikhwan dan **Ungu** untuk Akhwat.
    - [x] Menampilkan status check-in (berhasil / sudah pernah scan sebelumnya / tiket tidak valid).
  - **Verification:** Pengujian pemindaian simulasi QR code Ikhwan dan Akhwat, serta `npm run build` sukses 100%.
  - **Dependencies:** Task 1, Task 4
  - **Files likely touched:** `app/scan/page.js`
  - **Estimated scope:** M

- [x] **Checkpoint 5: Pengujian End-to-End & Verifikasi Build**
  - **Description:** Melakukan uji coba menyeluruh (*End-to-End*) dari alur pemesanan publik, pengiriman email, pengelolaan admin & WhatsApp sender, hingga pemindaian tiket dengan scanner universal, serta memastikan `npm run build` sukses tanpa error.
  - **Acceptance Criteria:**
    - [x] Seluruh skenario alur kerja berjalan mulus.
    - [x] Perintah `npm run build` berhasil dieksekusi (*success*, exit code 0).
  - **Verification:** `npm run build` dan simulasi E2E sukses.
  - **Dependencies:** Task 1 s.d. Task 7
  - **Files likely touched:** Seluruh berkas proyek.
  - **Estimated scope:** S
