# Self-Service Ticketing & Attendance Wali Murid Yayasan Munazarah

## Problem Statement
Bagaimana kita memfasilitasi pembagian tiket kajian mandiri bagi wali murid dari 4 divisi sekolah Yayasan Munazarah secara cepat, akurat (maks 2 tiket per siswa dengan pemisahan jalur Ikhwan & Akhwat), tanpa friksi login, serta menyediakan pemantauan kehadiran real-time bagi pihak yayasan dan admin sekolah?

## Recommended Direction
Membangun portal **Self-Service Cascading** langsung di halaman utama publik (`/`):
1. **Langkah 1 (Pilih Sekolah, Kelas, & Siswa):**
   - 4 Divisi Sekolah:
     1. TK Islam Nazhirah (Admin WA: 0899-9783-882)
     2. SD Islam Nazhirah (Admin WA: 0899-7711-234)
     3. SMP & SMA Islam Nazhirah (Admin WA: 0896-1860-0656)
     4. Sekolah Islam Mumtaz (Admin WA: 0899-974-1234)
   - Dropdown Kelas dinamis/fleksibel mengikuti data Excel master siswa yang diunggah Admin.
   - Dropdown Nama Siswa (searchable / autocomplete agar mudah dicari di HP).
2. **Langkah 2 (Pilih Jenis Tiket):**
   - Checkbox: Ayah, Bunda, Ikhwan, Akhwat (Maksimal 2 tiket).
   - Validasi: 1 siswa hanya dapat mengklaim 1 kali. Nama siswa langsung terkunci setelah klaim berhasil.
3. **Langkah 3 (Verifikasi Kontak):**
   - Menampilkan nomor WhatsApp & Email tersensor demi privasi (contoh: `0899-****-882`, `a***@gmail.com`).
   - Tombol **"Data Salah / Perbarui"** -> Mengarahkan ke WhatsApp Admin divisi terkait dengan pesan template otomatis:
     *"Assalamu'alaikum Admin [Divisi], saya wali murid dari [Nama Siswa] ([Kelas]). Data kontak saya di sistem ticketing kajian perlu diperbarui..."*
   - Tombol **"Konfirmasi & Terbitkan Tiket"** -> Menerbitkan tiket.
4. **Langkah 4 (Pengiriman Tiket Aman via Email):**
   - Tiket QR-Code **HANYA dikirim otomatis ke alamat email orang tua yang terdaftar** via Resend API.
   - Layar HP setelah konfirmasi HANYA menampilkan notifikasi sukses klaim tiket (misal: *"Alhamdulillah, tiket berhasil diterbitkan dan dikirim ke email [email terdaftar]. Silakan periksa Inbox atau folder Spam Anda"*).
   - **Rasional Keamanan:** Mencegah orang tua/orang lain sembarangan mengklaim nama anak dan mengambil QR-Code langsung dari layar HP publik. Alamat email berfungsi sebagai pintu validasi autentikasi kepemilikan tiket yang sah.
5. **Admin Dashboard & Fitur WhatsApp:**
   - Halaman login admin dilengkapi pilihan divisi sekolah (atau Superadmin Yayasan).
   - Admin divisi mengelola & mengunggah data siswa di divisinya, serta dapat memantau status tiket yang sudah diklaim oleh orang tua.
   - **Fitur Kirim Tiket via WhatsApp di Halaman Admin:**
     - Admin dapat melihat status tiket peserta.
     - Tombol **"Kirim Tiket via WhatsApp"** per peserta dengan template pesan resmi dan link tiket digital (membuka `wa.me` ke nomor WA orang tua).
     - Tombol memiliki indikator warna yang persisten (**Hijau** = belum dikirim via WA, **Biru** = sudah dikirim via WA).
     - Fitur ini menjadi solusi resmi jika orang tua mengalami kendala membuka email saat hari H.
   - Superadmin Yayasan memantau statistik real-time seluruh divisi: total tiket diklaim vs total kehadiran per divisi dan per kelas.
   - Ekspor Excel 2 sheet (Hadir & Belum Hadir) terurut per divisi dan nama siswa.
6. **Scanner Petugas:**
   - Universal untuk semua divisi. Petugas scanner dapat memindai tiket dari divisi sekolah mana pun di pintu kajian.

## Key Assumptions to Validate
- [ ] Wali murid dapat menemukan nama anaknya dengan mudah lewat searchable dropdown di ponsel.
- [ ] Format file Excel master siswa dari admin 4 divisi konsisten (Divisi, Kelas, Nama Siswa, No WhatsApp, Email).
- [ ] Pengiriman email via Resend API berjalan lancar; jika email bermasalah, admin siap mengirimkan tiket via WhatsApp dari dashboard admin.

## MVP Scope
- Portal Self-Service di Homepage (`/`).
- Database Supabase: pembaruan skema untuk master siswa per divisi/kelas dan status klaim tiket.
- Template import Excel master siswa untuk admin divisi.
- Login admin per divisi sekolah + ringkasan yayasan (termasuk tombol kirim tiket WhatsApp berindikator warna).
- Scanner tiket universal dengan penanda visual jalur Ikhwan (Biru Navy) dan Akhwat (Ungu).

## Not Doing (and Why)
- **Tidak ada registrasi/akun login wali murid** — mencegah lupa password dan antrean panjang.
- **Tidak menampilkan barcode/QR-code langsung di layar browser publik** — demi mencegah pembajakan/salah ambil tiket oleh pihak yang tidak berhak.
- **Tidak menggunakan gateway WhatsApp berbayar** — mengandalkan pengiriman email otomatis via Resend dan tombol `wa.me` manual dari admin jika diperlukan.
- **Tidak menggabungkan QR jika memilih 2 tiket** — tiket Ayah dan Bunda dipisah agar proses antrean Ikhwan dan Akhwat dipisah rapi.

## Open Questions & Next Steps
- Siapkan rencana implementasi (Implementation Plan) bertahap:
  1. Penyesuaian skema database Supabase & helper data service.
  2. Implementasi portal self-service di halaman utama (`/`).
  3. Penyesuaian login admin dengan pilihan divisi & dashboard monitoring yayasan (beserta fitur WA sender).
  4. Penyempurnaan tampilan email & modal scanner dengan visual Biru Navy (Ikhwan) dan Akhwat (Ungu).
