# PRD — Web App Member Beauty Kendari

## 1. Ringkasan

Web app (PWA) untuk member Beauty Kendari yang menampilkan **kartu member digital**, **saldo & riwayat poin**, dan **informasi/ketentuan penukaran poin**. Penukaran poin tetap dilakukan manual di kasir outlet — app ini murni informasi, bukan transaksional.

Data member diambil real-time dari **API Member Affari Retail** (`https://api.affariretail.id/beauty/`), tanpa database sendiri. Login tanpa password — cukup input nomor HP atau nomor kartu, diverifikasi ke API. Nomor HP/kartu dipastikan tidak pernah dobel antar member (termasuk dalam satu keluarga), jadi hasil pencarian login selalu satu objek member.

**Branding:** logo Beauty Kendari — ikon hati dengan huruf "b" di tengah, warna utama pink magenta `#FE3E9F` di atas dasar putih. Jadi acuan warna primary kartu member & tema UI.

## 2. Tujuan

- Member bisa cek saldo poin & riwayat transaksi poin sendiri, tanpa tanya kasir/CS
- Member punya kartu member digital yang bisa ditunjukkan di outlet (pengganti kartu fisik/scan barcode)
- Mengurangi pertanyaan repetitif ke kasir soal "poin saya berapa" dan "syarat tukar poin apa"
- Membangun kanal digital pertama Beauty Kendari yang langsung terhubung ke data member asli

## 3. Target Pengguna

Member aktif program loyalti Beauty Kendari, mengakses dari HP (mayoritas), kemungkinan besar bukan pengguna teknis — UI harus sangat sederhana.

## 4. Lingkup (Scope)

### 4.1 Fitur inti (MVP)
1. **Login member** — input nomor HP atau nomor kartu → cari ke API → kalau ketemu, buat sesi
2. **Kartu member digital** — nama, nomor kartu, tier (`JMember`: GOLD/dst), **QR code standar berisi nomor kartu sebagai teks** (bukan format barcode fisik Code128/EAN — kasir cukup scan dan baca isinya sebagai teks)
3. **Saldo poin** — `PointAkhir`, tanggal berakhir kartu (`TglBerakhir`)
4. **Riwayat poin** — list transaksi (tanggal, keterangan, nominal belanja, poin didapat/dipakai), dari `/api/listhistoripoint`
5. **Info & ketentuan penukaran poin** — halaman statis (bukan dari API — lihat pertanyaan §7)
6. **PWA** — bisa di-"Install to Home Screen", ada app icon & splash screen sesuai branding Beauty Kendari

### 4.2 Di luar lingkup (eksplisit)
- Penukaran poin dari app (tetap manual di kasir)
- Pendaftaran member baru dari app (tetap di kasir/CS, kecuali dinyatakan lain nanti)
- Edit profil member dari app (PUT ke API berisiko tinggi kalau salah kirim field — lihat catatan dokumentasi soal PUT yang overwrite penuh; MVP read-only dulu)
- Notifikasi push

## 5. Alur Pengguna

### 5.1 Login
1. Buka app → form input nomor HP/kartu
2. Submit → server route Next.js panggil `GET /api/member?field=kode&value=<input>`
3. Kalau hasil objek tunggal → buat sesi (signed cookie berisi `Kode` member, masa berlaku terbatas) → redirect ke halaman kartu
4. Kalau hasil `{}` (kosong) → tampilkan pesan "Nomor tidak ditemukan, pastikan nomor benar atau hubungi outlet terdekat"
5. Hasil array tidak akan terjadi (dikonfirmasi: satu nomor HP/kartu selalu unik ke satu member) — tetap ditangani sebagai fallback error di kode (ambil elemen pertama + log), bukan alur UI resmi

### 5.2 Lihat kartu & poin
- Halaman utama setelah login: kartu member (visual) + saldo poin di bagian atas, tab/scroll ke riwayat poin di bawah
- Riwayat poin default menarik dari tanggal jauh ke belakang (misal awal tahun) supaya lengkap — sesuai temuan testing bahwa parameter `tanggal` adalah "sejak tanggal ini", bukan tanggal spesifik

### 5.3 Info penukaran poin
- Halaman statis terpisah, berisi syarat & ketentuan
- **MVP: konten dummy/placeholder** (belum ada teks final dari tim/manajemen) — dibuat mudah diedit (misal satu file config/CMS sederhana) supaya gampang diganti begitu konten resmi tersedia, tanpa perlu ubah kode

## 6. Kebutuhan Teknis

| Aspek | Keputusan |
|---|---|
| Framework | Next.js (App Router) |
| Database | Tidak ada — konsumsi API Affari real-time |
| Sesi login | Signed cookie (JWT), berisi kode member, masa berlaku pendek-menengah (misal 7 hari) |
| Auth ke API Affari | Header `affari_token`, dipanggil dari **server route Next.js** (bukan client-side) supaya token tidak bocor ke browser |
| Platform | PWA — manifest.json, service worker, app icon dari branding Beauty Kendari (ikon hati+"b", `#FE3E9F`) |
| Deploy | Vercel |
| Keamanan sesi | Cukup nomor HP/kartu tanpa OTP untuk MVP — lapisan verifikasi tambahan belum diperlukan sekarang, bisa ditambah di iterasi berikutnya kalau perlu |

### 6.1 Penanganan error & edge case wajib (mengikuti [[scoring-playbook]])
- Semua pemanggilan API harus cek **HTTP status DAN `IsSuccess`** — dokumentasi API menegaskan gagal bisa muncul sebagai HTTP 200
- State loading eksplisit di setiap fetch (login, ambil poin, ambil riwayat)
- State error eksplisit dan bisa dibedakan pesannya: "member tidak ditemukan" vs "gagal terhubung ke server" vs "sesi habis, login ulang"
- Riwayat poin kosong (`[]`) ditampilkan sebagai "Belum ada riwayat transaksi", bukan halaman kosong/blank
- Tanggal lahir dengan penanda lama `1900/01/01` (disebut di dokumentasi) tidak ditampilkan sebagai tanggal asli kalau field itu dipakai di UI manapun
- Sesi expired ditangani dengan redirect halus ke login, bukan error mentah

## 7. Keputusan Final (sudah dikonfirmasi)

| # | Topik | Keputusan |
|---|---|---|
| 1 | Nomor HP/kartu dobel | Tidak pernah terjadi — login selalu dapat objek tunggal |
| 2 | Ketentuan penukaran poin | Belum ada teks final → dummy/placeholder untuk MVP, mudah diganti nanti |
| 3 | Deploy target | Vercel |
| 4 | Keamanan sesi tambahan (OTP dll) | Belum diperlukan untuk MVP |
| 5 | Branding | Logo hati+"b", pink `#FE3E9F` — sudah diterima |
| 6 | Format QR/barcode kartu | QR standar berisi nomor kartu sebagai teks (bukan Code128/EAN) |

PRD ini sudah final untuk memulai tahap wireframe/struktur halaman dan build.
