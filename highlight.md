# Highlight Pekerjaan — Koperasi Simko

## Phase 0: Project Foundation

| Task | Status | Detail |
|------|--------|--------|
| 0.1 Inisialisasi Next.js | ✅ | Next.js 16.2.6 App Router + TypeScript strict |
| 0.2 Tailwind + shadcn/ui | ✅ | Komponen: button, card, form, table, dialog, badge, dll |
| 0.3 Prisma + MariaDB | ✅ | Prisma 7.8.0, adapter `@prisma/adapter-mariadb`, schema 12 model |
| 0.4 NextAuth v5 | ✅ | Credentials provider, JWT strategy, adapter Prisma, bcrypt |
| 0.5 Struktur folder | ✅ | `src/actions/` (server actions), `src/components/` (client), `src/lib/` (utils), `src/app/` (routes per role) |
| 0.6 Linting & formatting | ✅ | ESLint + Prettier configured |

**Catatan**: Upgrade dari rencana Next.js 14 ke 16.2.6, React 19, NextAuth v5 beta.31.

---

## Phase 1: Database Schema & Models

| Model | Key Fields | Status |
|-------|-----------|--------|
| User | id, email, password (bcrypt), role (PENGURUS/BENDAHARA/PENGAWAS/ANGGOTA), anggotaId? | ✅ |
| Anggota | nik, noAnggota `KDMP-CBR-{6 digit}`, nama, status (AKTIF/NONAKTIF/KELUAR) | ✅ |
| Akun (COA) | kode, nama, tipe (ASET/LIABILITAS/EKUITAS/PENDAPATAN/BEBAN), saldoNormal (DEBIT/KREDIT) | ✅ 38 akun |
| JenisSimpanan | kode (POKOK/WAJIB/SUKARELA), nama, nominal default | ✅ |
| Simpanan | anggotaId + jenisSimpananId (unique), saldo | ✅ |
| TransaksiSimpanan | tipe (SETORAN/PENARIKAN), nominal, saldoSetelah | ✅ |
| JenisPinjaman | nama (Konsumsi 1.5%/Pendidikan 1%/Produktif 2%), bunga | ✅ |
| Pinjaman | jumlah, tenor, bunga, status (enum 6 values), sisaPinjaman | ✅ |
| Angsuran | pinjamanId, angsuranKe, pokok, jasa, denda, status (BELUM_LUNAS/LUNAS/TERLAMBAT) | ✅ |
| JurnalUmum + DetailJurnal | noJurnal (auto `JRN-YYYYMMDD-XXXX`), tanggal, debit/kredit per akun | ✅ |
| SHU + SHUAnggota + AlokasiSHU | tahun, totalSHU, status (DRAFT/FINAL) | ✅ |
| IndikatorSHU | kode (JM/JU/CD/PN/PW/PS), persentase, kelompok (ANGGOTA/DANA), akunId tujuan | ✅ |
| AuditLog | userId, action (CREATE/UPDATE/DELETE/APPROVE), entityType, old/new value | ✅ |

**Enum**: `LoanStatus` = PENGAJUAN | DISETUJUI | DITOLAK | **DICAIKKAN** | LUNAS | GAGAL (bukan DICAIRKAN)

---

## Phase 2: Authentication & RBAC

| Fitur | Detail | Status |
|-------|--------|--------|
| Halaman Login | Email + password, redirect by role | ✅ |
| NextAuth config | Credentials + JWT + bcrypt compare | ✅ |
| Middleware RBAC | Proteksi route: `/pengurus/*`, `/anggota/*`, `/pengawas/*` | ✅ |
| Layout per Role | 3 layout: Pengurus (full sidebar), Anggota (terbatas), Pengawas (read-only) | ✅ |
| Profile & Ganti Password | Untuk semua role | ✅ |

**User test**: admin@simko.com / admin123 (PENGURUS), bendahara@simko.test / pengurus123 (BENDAHARA), pengawas@simko.test / pengawas123 (PENGAWAS)

---

## Phase 3: Manajemen Anggota

| Fitur | Detail | Status |
|-------|--------|--------|
| Registrasi | Validasi Zod, NIK 16 digit, noAnggota auto-generate | ✅ |
| Daftar Anggota | DataTable dengan server-side pagination, search, filter status | ✅ |
| Detail Anggota | Tab: profil, simpanan, pinjaman, riwayat transaksi | ✅ |
| Edit Anggota | NIK readonly, field lain editable | ✅ |
| Ubah Status | Aktif/Nonaktif/Keluar dengan validasi | ✅ |

---

## Phase 4: Simpanan

| Fitur | Detail | Status |
|-------|--------|--------|
| Setor Simpanan | Pilih anggota + jenis + nominal → update saldo + jurnal otomatis (Debit Kas, Kredit akun simpanan) | ✅ |
| Tarik Simpanan | Khusus sukarela, validasi saldo cukup, generate jurnal | ✅ |
| Mutasi Simpanan | Tabel filter tanggal, jenis, saldo berjalan | ✅ |
| Portal Anggota | Read-only view saldo & mutasi | ✅ |
| Tagihan Wajib | Daftar anggota yang belum bayar wajib bulan ini | ✅ |

---

## Phase 5: Pinjaman

| Fitur | Detail | Status |
|-------|--------|--------|
| Pengajuan (Anggota) | Form jumlah + tenor, plafon otomatis 3× saldo | ✅ |
| Persetujuan (Pengurus) | Dasbor pengajuan pending, detail + riwayat anggota | ✅ |
| Aksi Setujui/Tolak | Setuju → generate jadwal angsuran flat + update status DICAIKKAN | ✅ |
| Jadwal Angsuran Flat | `angsuranPokok = pokok / tenor`, `jasa = pokok × bungaBln` | ✅ |
| Bayar Angsuran | Input nominal, deteksi kelebihan/kekurangan, auto denda | ✅ |
| Kalkulator Denda | `denda = totalAngsuran × rateDenda` | ✅ |
| Riwayat Pinjaman | Per anggota, status per angsuran, total terbayar | ✅ |

---

## Phase 6: Buku Besar & Jurnal

### Jurnal
| Fitur | Detail | Status |
|-------|--------|--------|
| Jurnal Otomatis | Setiap transaksi (simpanan, angsuran, beban) → insert jurnal dalam 1 transaksi | ✅ |
| Jurnal Manual | Form entry jurnal: pilih akun, debit/kredit, validasi balance | ✅ |
| Buku Besar | Per akun, filter periode, saldo berjalan | ✅ |

### Laporan Keuangan

| Laporan | Fungsi | Detail | Status |
|---------|--------|--------|--------|
| Neraca Saldo | `getNeracaSaldo()` | Trial balance seluruh akun, filter sampai tanggal | ✅ |
| Neraca | `getNeraca()` | Balance sheet: `ASET = LIABILITAS + EKUITAS`. **Laba bersih otomatis masuk ekuitas sebagai 3.1.2** agar balance meski tutup buku belum jalan | ✅ |
| Laba/Rugi | `getLabaRugi(dari, sampai)` | Income statement per periode. **Bug fix: `dari` parameter diabaikan** — sekarang `getSaldoAkunTipe()` menerima `dariTanggal` | ✅ |
| Arus Kas | `getArusKas(dari, sampai)` | Mutasi kas (debit/kredit akun 1.1.1) | ✅ |

### Export Excel (`src/actions/export-laporan.ts`)
- `exportNeraca`, `exportLabaRugi` (also fixed `dariTanggal`), `exportArusKas`, `exportSHU`
- Duplikasi fungsi `getSaldoAkunTipe` antara `jurnal.ts` dan `export-laporan.ts`

---

## Phase 7: SHU & Tutup Buku

### SHU (`src/lib/shu.ts`)
| Fitur | Detail | Status |
|-------|--------|--------|
| Hitung SHU | `hitungSHU(tahun)`: PENDAPATAN - BEBAN → total SHU | ✅ |
| Jasa Modal | Proporsi saldo simpanan terhadap total simpanan | ✅ |
| Jasa Usaha | Proporsi angsuran pokok terhadap total angsuran | ✅ |
| Generate SHU | Simpan sebagai DRAFT (estimasi, belum final) | ✅ |

### Tutup Buku (`src/actions/tutup-buku.ts`)
`prosesTutupBuku(tahun)` dalam 1 transaksi:

| Langkah | Detail |
|---------|--------|
| 1 | Update status SHU → FINAL |
| 2 | Jurnal penutup: Debit PENDAPATAN, Kredit BEBAN (reset ke 0) |
| 3 | Distribusi ANGGOTA → **langsung Kredit 2.1.3 (Simpanan Sukarela)** — tidak lewat 3.1.2 |
| 4 | Distribusi DANA → **langsung ke akun indikator masing-masing** (tidak ada jurnal distribusi terpisah) |
| 5 | Sisa rounding → 3.1.2 jika ada |
| 6 | Update saldo simpanan sukarela per anggota + buat transaksi |

**Keputusan desain**:
- Jurnal penutup langsung split ANGGOTA ke 2.1.3, DANA ke akun masing-masing
- Tidak ada jurnal distribusi DANA terpisah
- `3.1.2` hanya untuk sisa rounding
- **Tidak bisa di-reverse**: sekali FINAL, tidak bisa dikembalikan ke DRAFT
- **Tab SHU di navigasi akuntansi dihapus** (redundan dengan Laba/Rugi + halaman SHU terpisah)

---

## Phase 8: Konfigurasi

| Fitur | Detail | Status |
|-------|--------|--------|
| Halaman Konfigurasi | Update parameter: plafon, rate bunga, denda, dll | ✅ |
| Manajemen Indikator SHU | CRUD persentase per pos, link ke akun tujuan DANA | ✅ |
| Manajemen Jenis Pinjaman | CRUD jenis pinjaman (nama, default bunga) | ✅ |
| Manajemen Akun (COA) | Tambah/nonaktifkan akun | ✅ |

---

## Phase 9: Dashboard

| Fitur | Detail | Status |
|-------|--------|--------|
| Dashboard Pengurus | Kartu statistik: total anggota, simpanan, pinjaman outstanding, SHU. Grafik Recharts | ✅ |
| Dashboard Anggota | Saldo simpanan, tagihan aktif, status SHU | ✅ |
| Dashboard Pengawas | Ringkasan read-only | ✅ |

---

## Bug Fixes (Lintas Phase)

1. **`<div>` dalam `<p>`** (Phase 7) — `Badge` shadcn render `<div>` di dalam `<p>` → hydration error. Fix: ganti `<p>` jadi `<div>` di `tutup-buku-page.tsx`
2. **`dari` parameter di `getLabaRugi()`** (Phase 6) — parameter diabaikan, filter cuma pakai `sampai`. Akibatnya filter "1 Jan 2026" tetap menyertakan data 2025. Fix: tambah `dariTanggal` di `getSaldoAkunTipe()`
3. **`sisaPinjaman` rounding** (Phase 5) — threshold `sisa <= angsuranPokok` → status LUNAS
4. **Missing `})`** (Phase 7) — syntax error: transaksi `tutup-buku.ts` kurang kurung tutup

---

## Seed Data (`prisma/reset-test-data.ts`)

### 4 Skenario Pinjaman Kompleks
| Anggota | Jenis | Jumlah | Tenor | Mulai | Status | Detail |
|---------|-------|--------|-------|-------|--------|--------|
| Ali | Konsumsi (1.5%) | Rp 5jt | 6 bln | Jan 2025 | **LUNAS** | 6 angsuran Feb-Jul 2025 |
| Budi | Produktif (2.0%) | Rp 20jt | 12 bln | Jan 2025 | **LUNAS** | 12 angsuran Feb 2025 - Jan 2026 (full) |
| Citra | Pendidikan (1.0%) | Rp 10jt | 12 bln | Sep 2025 | **Berjalan** | a=1-7 (Okt-Apr) LUNAS, a=8 (Mei) TERLAMBAT + denda 0.5%, a=9-12 BELUM_LUNAS |
| Dewi | Konsumsi (1.5%) | Rp 4jt | 6 bln | Jun 2025 | **LUNAS** | 6 angsuran Jul-Des 2025 |

### Data Lain
- Simpanan: pokok (1×), wajib (bulanan), sukarela (variatif)
- Jurnal simpanan gabung per bulan (pokok + wajib + sukarela) → 12 jurnal
- Beban operasional: Gaji 400rb, Listrik 100rb, ATK 50rb, Transportasi 50rb × 12 bln
- Pendapatan administrasi: 300rb × 12 bln
- Pendapatan lain: denda 150rb
- **SHU 2025: Rp 2.060.000 (DRAFT)**
- **Total seed: 109 jurnal / 417 detail / 95 transaksi simpanan / 36 angsuran**

### Catatan Seed
- Jurnal hanya untuk angsuran LUNAS/TERLAMBAT
- Akun `4.1.3` (Pendapatan Denda) untuk installment TERLAMBAT
- Status pinjaman: `DICAIKKAN` (dengan sisa) atau `LUNAS`
- Rounding LUNAS: `sisaPinjaman <= angsuranPokok`
- Full tenor tanpa batas tahun — jurnal masuk sesuai tanggal pembayaran

---

## Status Database Saat Ini
- **Semua data transaksional dibersihkan** (detail_jurnal, jurnal_umum, angsuran, pinjaman, transaksi_simpanan, simpanan, SHU, audit_log)
- Tersisa: **38 akun (COA)**, **8 user**, **5 anggota**, jenis simpanan/pinjaman, indikator SHU
- Siap untuk reseed test data atau mulai transaksi baru

---

## Ringkasan Progress

| Phase | Status |
|-------|--------|
| 0 - Foundation | ✅ |
| 1 - Database Schema | ✅ |
| 2 - Auth & RBAC | ✅ |
| 3 - Manajemen Anggota | ✅ |
| 4 - Simpanan | ✅ |
| 5 - Pinjaman | ✅ |
| 6 - Buku Besar & Jurnal | ✅ |
| 7 - SHU & Tutup Buku | ✅ |
| 8 - Konfigurasi | ✅ |
| 9 - Dashboard | ✅ |
| 10 - Testing | ⏳ Belum dimulai |
| 11 - Deployment | ⏳ Belum dimulai |
