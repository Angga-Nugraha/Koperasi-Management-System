# Task Breakdown — Sistem Manajemen Koperasi (Simko)

Total: **84 tasks** | Estimasi: **~6-8 minggu**

---

## Phase 0: Project Foundation (3-5 hari)

| # | Task | Detail |
|---|------|--------|
| 0.1 | Inisialisasi Next.js 14+ (App Router) + TypeScript | `create-next-app` dengan strict tsconfig |
| 0.2 | Setup Tailwind CSS + shadcn/ui | Install dan konfigurasi komponen base (button, card, form, table, dialog) |
| 0.3 | Setup Prisma + MySQL | `prisma init`, konfigurasi datasource, buat file `schema.prisma` |
| 0.4 | Setup NextAuth.js v5 | Konfigurasi adapter Prisma, credentials provider, JWT callback |
| 0.5 | Setup folder struktur project | `src/app`, `src/components`, `src/lib`, `src/actions`, `src/types` |
| 0.6 | Setup linting & formatting | ESLint + Prettier konfigurasi |

---

## Phase 1: Database Schema & Models (3-5 hari)

| # | Task | Detail |
|---|------|--------|
| 1.1 | Model User + Role enum | `User` (id, email, password, role: PENGURUS/ANGGOTA/PENGAWAS, anggotaId?) |
| 1.2 | Model Anggota | `Anggota` (id, nik, noAnggota `KDMP-CBR-{6digitNIK}`, nama, alamat, pekerjaan, penghasilan, tglMasuk, status: AKTIF/NONAKTIF/KELUAR) |
| 1.3 | Model Akun (Chart of Accounts) | `Akun` (kode, nama, tipe, saldoNormal, isActive) — seed 30+ akun dari COA |
| 1.4 | Model Simpanan + TransaksiSimpanan | `Simpanan` (anggotaId, jenis: POKOK/WAJIB/SUKARELA, saldo) transaksi terpisah untuk mutasi |
| 1.5 | Model Pinjaman + Angsuran | `Pinjaman` (anggotaId, jumlah, tenor, bunga, status, tglCair) + `Angsuran` (pinjamanId, ke-, pokok, jasa, denda, jatuhTempo, status) |
| 1.6 | Model JurnalUmum + DetailJurnal | `JurnalUmum` (tanggal, keterangan) + `DetailJurnal` (jurnalId, akunKode, debit, kredit) |
| 1.7 | Model SHU + AlokasiSHU | `SHU` (tahun, totalSHU, status) + `AlokasiSHU` (shuId, pos, persentase, nominal) + `SHUAnggota` (anggotaId, shuId, jasaModal, jasaUsaha, total) |
| 1.8 | Model AuditLog | `AuditLog` (userId, action, entityType, entityId, oldValue, newValue, ipAddress) |
| 1.9 | Model Konfigurasi | `Konfigurasi` (key, value, tipeData, keterangan) — key-value store untuk aturan bisnis |
| 1.10 | Seed Data | Seed akun COA, akun admin default, konfigurasi default |

---

## Phase 2: Authentication & RBAC (2-3 hari)

| # | Task | Detail |
|---|------|--------|
| 2.1 | Halaman Login | Form login (email + password), redirect berdasarkan role |
| 2.2 | NextAuth config | Credentials provider, authorize dengan bcrypt compare, JWT encode role |
| 2.3 | Middleware RBAC | Next.js middleware untuk proteksi route berdasarkan role |
| 2.4 | Layout per Role | 3 layout berbeda: Pengurus (sidebar navigasi lengkap), Anggota (dashboard terbatas), Pengawas (read-only + audit) |
| 2.5 | Halaman Profile & Ganti Password | Untuk semua role |

---

## Phase 3: EPIC 1 — Manajemen Anggota (4-5 hari)

| # | Task | Detail |
|---|------|--------|
| 3.1 | Form Registrasi Anggota | Validasi Zod: NIK (16 digit), noAnggota auto-generate `KDMP-CBR-{6 digit NIK}`, cek duplikat NIK |
| 3.2 | Daftar Anggota (DataTable) | Server-side pagination, search by nama/NIK, filter status |
| 3.3 | Detail Anggota | Tab: profil, simpanan, pinjaman, riwayat transaksi |
| 3.4 | Edit Anggota | Form edit data anggota (kecuali NIK readonly) |
| 3.5 | Ubah Status Anggota | Aktif/Nonaktif/Keluar — validasi: nonaktif tidak bisa pinjam |
| 3.6 | Hapus Anggota | Soft delete atau validasi dependensi |
| 3.7 | Import Anggota dari CSV/Excel | Upload file, map kolom, validasi massal |
| 3.8 | Generate Kartu Anggota PDF | `@react-pdf/renderer` untuk cetak kartu digital |

---

## Phase 4: EPIC 2 — Simpanan (4-5 hari)

| # | Task | Detail |
|---|------|--------|
| 4.1 | Halaman Jenis Simpanan | Overview: Pokok (1×), Wajib (bulanan), Sukarela (fleksibel) |
| 4.2 | Form Setor Simpanan | Form untuk bendahara: pilih anggota, jenis, nominal -> update saldo + jurnal otomatis (Debit: Kas, Kredit: Simpanan Pokok/Wajib/Sukarela) |
| 4.3 | Form Tarik Simpanan (Sukarela) | Khusus sukarela, validasi saldo cukup, generate jurnal |
| 4.4 | Mutasi Simpanan per Anggota | Tabel filter tanggal, jenis, saldo berjalan |
| 4.5 | Portal Anggota: Lihat Saldo & Mutasi | Read-only view untuk anggota login, real-time saldo |
| 4.6 | Tagihan Simpanan Wajib | Generate daftar anggota yang belum bayar wajib bulan ini |
| 4.7 | Notifikasi Setoran | Web notification/email ke anggota saat saldo bertambah |

---

## Phase 5: EPIC 3 — Pinjaman (5-7 hari)

| # | Task | Detail |
|---|------|--------|
| 5.1 | Halaman Pengajuan Pinjaman (Anggota) | Form: jumlah, tenor. Plafon otomatis cek `3x saldo` (ambil dari konfigurasi). Validasi status aktif & tidak punya pinjaman aktif |
| 5.2 | Antrian Persetujuan (Pengurus) | Dasbor list pengajuan pending: detail anggota, riwayat angsuran, perhitungan otomatis angsuran flat |
| 5.3 | Aksi Setujui/Tolak | Modal konfirmasi + catatan wajib -> jika setuju, generate jadwal angsuran & update status |
| 5.4 | Generate Jadwal Angsuran Flat | Rumus: `angsuranPokok = pokok / tenor`, `jasa = pokok x rate x tenor / tenor`, total tetap per bulan |
| 5.5 | Form Bayar Angsuran (Bendahara) | Input nominal, deteksi kelebihan/kekurangan, cek denda otomatis dari tgl jatuh tempo |
| 5.6 | Kalkulator Denda Otomatis | `denda = angsuran x rateDenda x hariTerlambat` — configurable dari tabel Konfigurasi |
| 5.7 | Dashboard Pinjaman Anggota | Status: diajukan -> disetujui -> dicairkan -> (lunas/gagal) |
| 5.8 | Portal Anggota: Tagihan & Riwayat | Lihat jadwal angsuran, status lunas/belum, total terbayar |
| 5.9 | Rekap Pinjaman | Per periode, per status, total outstanding |
| 5.10 | Generate Surat Perjanjian Pinjaman PDF | Template otomatis setelah disetujui |

---

## Phase 6: EPIC 4 — Buku Besar & Jurnal (4-6 hari)

| # | Task | Detail |
|---|------|--------|
| 6.1 | Jurnal Otomatis dari Transaksi | Service/business logic: setiap transaksi (setor, tarik, cair pinjaman, bayar angsuran, biaya) -> insert jurnal + detail jurnal dalam satu Prisma transaction |
| 6.2 | Jurnal Manual (Biaya Operasional) | Form entry jurnal manual untuk bendahara: pilih akun, debit/kredit, keterangan |
| 6.3 | Buku Besar per Akun | Tampilkan semua transaksi per akun dengan saldo berjalan, filter periode |
| 6.4 | Neraca Saldo (Trial Balance) | List semua akun + saldo debit/kredit dalam periode, harus balance |
| 6.5 | Laporan Neraca | Aset = Liabilitas + Ekuitas, per periode |
| 6.6 | Laporan Laba-Rugi | Pendapatan - Beban = SHU, per periode |
| 6.7 | Laporan Arus Kas | Klasifikasi operasi, investasi, pendanaan |
| 6.8 | Laporan SHU (Kasar) | SHU sebelum alokasi |
| 6.9 | Export PDF | Semua laporan bisa diekspor ke PDF, layout rapi |
| 6.10 | Export Excel | Data mentah report ke `.xlsx` pakai `exceljs` |
| 6.11 | Audit Log Viewer | Pengawas bisa lihat seluruh log: filter by user, entity, tanggal |

---

## Phase 7: EPIC 5 — SHU (4-5 hari)

| # | Task | Detail |
|---|------|--------|
| 7.1 | Tutup Buku (Generate SHU) | Hitung Pendapatan - Beban = SHU total. Masukkan ke model SHU dengan status `DRAFT` |
| 7.2 | Konfigurasi Alokasi SHU | Form set persentase 6 pos (default: JM 30%, JU 30%, Cad 15%, Pengurus 10%, Pengawas 5%, Pend/Sos 10%). Simpan di tabel Konfigurasi |
| 7.3 | Hitung SHU per Anggota | Service: JM = %JM x (saldo anggota / total saldo), JU = %JU x (total angsuran anggota / total angsuran) |
| 7.4 | Review & Verifikasi SHU | Pengurus review perhitungan, setujui/tolak. Jika setuju, status jadi `FINAL` |
| 7.5 | Portal Anggota: Lihat SHU | Anggota lihat SHU yang diterima, breakdown JM + JU |
| 7.6 | Laporan SHU Final | Per anggota + total alokasi per pos |
| 7.7 | Jurnal Penutup | Otomatis jurnal: Debit SHU Tahun Berjalan, Kredit masing-masing pos alokasi |

---

## Phase 8: Konfigurasi & Settings (2-3 hari)

| # | Task | Detail |
|---|------|--------|
| 8.1 | Halaman Konfigurasi Koperasi | UI untuk update parameter dari tabel Konfigurasi: plafon, rate bunga, denda, grace period, % SHU |
| 8.2 | Manajemen Jenis Pinjaman | CRUD jenis pinjaman (nama, default bunga, keterangan). Data sudah di-seed di Phase 5, halaman management di `/pengurus/konfigurasi` |
| 8.3 | Validasi Perubahan Konfigurasi | Beberapa parameter hanya bisa diubah di periode tertentu (sebelum tutup buku) |
| 8.4 | Audit Log untuk Konfigurasi | Setiap perubahan konfigurasi tercatat |
| 8.5 | Manajemen Akun (COA) | Pengurus bisa tambah/nonaktifkan akun, tidak bisa hapus (riwayat jurnal) |

---

## Phase 9: Dashboard & Navigasi (3-4 hari)

| # | Task | Detail |
|---|------|--------|
| 9.1 | Dashboard Pengurus | Kartu statistik: total anggota, total simpanan, total pinjaman outstanding, SHU tahun ini. Grafik (Recharts) |
| 9.2 | Dashboard Anggota | Saldo simpanan, tagihan pinjaman aktif, status SHU |
| 9.3 | Dashboard Pengawas | Ringkasan audit, laporan keuangan terkini, indikator kesehatan koperasi |
| 9.4 | Sidebar Navigasi Responsif | Per role, mobile-friendly |

---

## Phase 10: Testing (5-7 hari, paralel)

| # | Task | Detail |
|---|------|--------|
| 10.1 | Unit Test: Prisma Service Layer | Test setiap business logic (hitung plafon, denda, angsuran flat, SHU) |
| 10.2 | Unit Test: Validasi Zod | Test schema validasi input |
| 10.3 | Integration Test: Auth & RBAC | Test login, middleware redirect, akses terlarang |
| 10.4 | Integration Test: Alur Pinjaman | Full flow: anggota ajukan -> pengurus setujui -> hitung angsuran -> bayar -> lunas |
| 10.5 | Integration Test: Jurnal Otomatis | Test setiap transaksi menghasilkan debit/kredit yang tepat |
| 10.6 | Integration Test: SHU Calculation | Test dengan data hipotetis, verifikasi manual |
| 10.7 | E2E Test (Playwright) | Kritis flow: login pengurus -> daftar anggota -> setor -> pinjaman -> laporan |

---

## Phase 11: Deployment (2-3 hari)

| # | Task | Detail |
|---|------|--------|
| 11.1 | Dockerfile + docker-compose | Next.js app + MySQL + Nginx reverse proxy |
| 11.2 | Setup VPS / Cloud | Domain, SSL (Let's Encrypt), environment variables |
| 11.3 | CI/CD (GitHub Actions) | Lint -> test -> build -> deploy otomatis |
| 11.4 | Backup Database | Cronjob backup MySQL harian |
| 11.5 | Monitoring | Basic health check, error logging (Sentry optional) |

---

## Ringkasan Timeline

| Phase | Tasks | Estimasi |
|-------|-------|----------|
| 0 - Foundation | 6 tasks | 3-5 hari |
| 1 - Database | 10 tasks | 3-5 hari |
| 2 - Auth & RBAC | 5 tasks | 2-3 hari |
| 3 - Anggota | 8 tasks | 4-5 hari |
| 4 - Simpanan | 7 tasks | 4-5 hari |
| 5 - Pinjaman | 10 tasks | 5-7 hari |
| 6 - Buku Besar | 11 tasks | 4-6 hari |
| 7 - SHU | 7 tasks | 4-5 hari |
| 8 - Konfigurasi | 5 tasks | 2-3 hari |
| 9 - Dashboard | 4 tasks | 3-4 hari |
| 10 - Testing | 7 tasks | 5-7 hari |
| 11 - Deployment | 5 tasks | 2-3 hari |
| **Total** | **84 tasks** | **~6-8 minggu** |
