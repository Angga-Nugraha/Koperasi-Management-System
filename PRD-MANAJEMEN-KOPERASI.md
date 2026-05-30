# Product Requirements Document: Sistem Manajemen Koperasi (Simko)

## 1. Executive Summary

**Problem Statement**: Koperasi tidak memiliki sistem digital — proses simpan pinjam, pencatatan iuran, dan pelaporan keuangan masih dilakukan secara manual sehingga rawan kesalahan, tidak transparan, dan menyulitkan anggota mengakses informasi secara real-time.

**Proposed Solution**: Aplikasi web manajemen koperasi yang mengotomatisasi siklus simpan pinjam, manajemen anggota, buku besar keuangan, dan distribusi SHU, dengan tiga portal peran (pengurus, anggota, pengawas).

**Success Criteria**:
- Waktu pemrosesan pinjaman dari pengajuan hingga pencairan turun dari rata-rata 3 hari menjadi ≤1 hari.
- Laporan keuangan (neraca, laba-rugi, SHU) dapat dihasilkan dalam ≤5 detik.
- 100% anggota tercatat memiliki akses ke portal anggota untuk melihat saldo dan riwayat.
- Akurasi perhitungan SHU mencapai 100% (terverifikasi via uji manual periodik).
- Waktu RAT (Rapat Anggota Tahunan) untuk penyajian data keuangan berkurang 60%.

## 2. User Experience & Functionality

### User Personas

| Persona | Peran | Kebutuhan Utama |
|---------|-------|-----------------|
| **Pengurus** (Ketua, Sekretaris, Bendahara) | Mengelola operasional harian koperasi | Entri data anggota, transaksi simpan pinjam, generate laporan |
| **Anggota** | Peserta koperasi | Lihat saldo simpanan, ajukan pinjaman, cek tagihan angsuran |
| **Pengawas** | Auditor internal | Akses audit trail, review laporan keuangan, validasi SHU |

### User Stories

#### EPIC 1: Manajemen Anggota

- **Story 1.1**: Sebagai pengurus, saya ingin mendaftarkan anggota baru (dengan data KTP, pekerjaan, dsb.) sehingga data keanggotaan tercatat rapi.
  - **AC**:
    - Form registrasi mencakup: NIK, nama, alamat, pekerjaan, penghasilan, tanggal masuk.
    - Nomor anggota digenerate otomatis dengan format `KOP-{tahun}-{urutan}`.
    - Setiap anggota otomatis tercatat memiliki simpanan pokok dan wajib awal.
    - Duplikasi NIK dicegah.

- **Story 1.2**: Sebagai pengurus, saya ingin mengubah status anggota (aktif/nonaktif/keluar) sehingga data keanggotaan selalu mutakhir.
  - **AC**:
    - Anggota nonaktif tidak bisa mengajukan pinjaman baru.
    - Riwayat transaksi anggota tetap tersimpan.

#### EPIC 2: Simpanan

- **Story 2.1**: Sebagai bendahara, saya ingin mencatat setoran simpanan (pokok, wajib, sukarela) anggota sehingga buku simpanan selalu update.
  - **AC**:
    - Tersedia tiga jenis simpanan: Pokok (sekali), Wajib (bulanan), Sukarela (kapan saja).
    - Setiap setoran langsung memengaruhi saldo anggota dan buku besar.
    - Notifikasi otomatis ke anggota jika saldo bertambah.

- **Story 2.2**: Sebagai anggota, saya ingin melihat mutasi dan saldo simpanan saya sehingga saya tahu posisi simpanan kapan saja.
  - **AC**:
    - Tampilkan daftar transaksi (setor/tarik) dengan filter tanggal.
    - Saldo akhir selalu real-time.

#### EPIC 3: Pinjaman

- **Story 3.1**: Sebagai anggota, saya ingin mengajukan pinjaman dengan mengisi jumlah dan tenor sehingga saya bisa mendapatkan dana pinjaman.
  - **AC**:
    - Plafon pinjaman otomatis dihitung berdasarkan saldo simpanan × kelipatan (misal 3×).
    - Pengajuan masuk ke antrian persetujuan pengurus.
    - Status pengajuan bisa dilacak (diajukan → disetujui/ditolak → dicairkan → lunas).

- **Story 3.2**: Sebagai pengurus, saya ingin menyetujui/menolak pengajuan pinjaman sehingga pencairan hanya terjadi setelah verifikasi.
  - **AC**:
    - Dasbor menampilkan pengajuan pending dengan detail anggota dan riwayat pembayaran.
    - Keputusan (setuju/tolak) disertai catatan wajib.
    - Jika disetujui, jadwal angsuran digenerate otomatis (metode anuitas/flat).

- **Story 3.3**: Sebagai bendahara, saya ingin mencatat pembayaran angsuran sehingga pinjaman tercatat berkurang secara sistematis.
  - **AC**:
    - Angsuran terdiri dari pokok + jasa (bunga).
    - Keterlambatan dikenakan denda otomatis sesuai aturan koperasi.
    - Riwayat pembayaran angsuran tercatat di profil anggota.

#### EPIC 4: Buku Besar & Laporan Keuangan

- **Story 4.1**: Sebagai bendahara, saya ingin setiap transaksi otomatis tercatat di jurnal umum sehingga buku besar selalu balance.
  - **AC**:
    - Setiap transaksi (simpanan, pinjaman, angsuran, biaya operasional) mencatat debit/kredit sesuai akun yang tepat.
    - Jurnal tidak bisa diedit manual setelah diposting (audit trail).
    - Pembukuan menggunakan akun standar koperasi (Kas, Piutang, Simpanan Pokok, dll.).

- **Story 4.2**: Sebagai pengurus, saya ingin mencetak laporan (Neraca, Laba-Rugi, Arus Kas, SHU) untuk periode tertentu.
  - **AC**:
    - Laporan bisa diekspor PDF/Excel.
    - Data SHU dihitung otomatis dari sisa hasil usaha setelah biaya operasional.

- **Story 4.3**: Sebagai pengawas, saya ingin mengakses log audit semua transaksi sehingga bisa memvalidasi kepatuhan.
  - **AC**:
    - Log mencatat: siapa, apa, kapan, dan data sebelum-sesudah.
    - Log tidak bisa dihapus oleh siapa pun.

#### EPIC 5: SHU (Sisa Hasil Usaha)

- **Story 5.1**: Sebagai pengurus, saya ingin sistem menghitung SHU per anggota berdasarkan proporsi simpanan dan transaksi.
  - **AC**:
    - Perhitungan SHU berdasarkan rumus: `(Jasa Modal + Jasa Usaha) × Proporsi Anggota`.
    - Jasa Modal = persentase × (saldo simpanan anggota / total simpanan).
    - Jasa Usaha = persentase × (total angsuran anggota / total seluruh angsuran).
    - SHU bisa disetujui/diverifikasi sebelum dipublikasikan ke anggota.

### Non-Goals (Tidak Termasuk dalam Cakupan Awal)

- **Multi-koperasi**: Sistem hanya untuk satu badan koperasi. Multi-tenant tidak diakomodasi di MVP.
- **Mobile App**: Hanya web app responsif. Push notification via web, bukan native.
- **Payment Gateway Integrasi**: Pembayaran dilakukan secara tunai/transfer manual, dicatat oleh bendahara. Integrasi payment gateway untuk phase 2.
- **E-Commerce atau Toko Koperasi**: Tidak termasuk belanja online atau manajemen inventaris barang.
- **Manajemen Aset/Inventaris**: Pencatatan inventaris koperasi di luar scope.
- **Gaji Karyawan Koperasi**: Payroll untuk pengurus gaji tidak termasuk.

## 3. AI System Requirements (Jika Diperlukan)

> **Catatan**: Sistem ini berbasis transaksi keuangan deterministik. AI tidak digunakan pada MVP untuk menjaga akurasi dan kepercayaan anggota. Potensi penggunaan AI di phase 2:
>
> - **Klasifikasi Otomatis Akun Jurnal** (dari deskripsi transaksi).
> - **Deteksi Anomali Transaksi** untuk pengawasan.

Saat ini tidak ada komponen AI dalam sistem.

## 4. Technical Specifications

### Architecture Overview

```
[Browser] ←→ [Next.js App (React + SSR)] ←→ [API Routes / tRPC] ←→ [MySql + Prisma ORM]
                        ↕
               [NextAuth.js (Session/JWT)]
                        ↕
             [Role-based Access Control (RBAC)]
```

**Pola Arsitektur**:
- **Monolith Web App** menggunakan Next.js 14+ (App Router).
- **Server Actions** untuk mutasi data.
- **Database**: MySql dengan Prisma ORM.
- **Deployment**: Docker container di VPS (atau platform seperti Railway/Render).

### Tech Stack Rekomendasi

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Framework | Next.js 14+ (App Router) | Fullstack, React, SSR untuk performa |
| Language | TypeScript strict | Type safety penuh |
| Database | MySql | Relasional, transaksional, ACID |
| ORM | Prisma | Type-safe query, migration terkelola |
| Auth | NextAuth.js v5 | RBAC, adapter Prisma ready |
| UI | Tailwind CSS + shadcn/ui | Komponen accessible, kustomisasi mudah |
| Validasi | Zod | Type-safe runtime validation |
| Testing | Vitest + Playwright | Unit + E2E |
| Chart | Recharts | Laporan keuangan visual |

### Integration Points

| Integrasi | Tujuan | Metode |
|-----------|--------|--------|
| Export PDF | Laporan keuangan cetak | `@react-pdf/renderer` atau Puppeteer |
| Export Excel | Data mentah untuk audit | `exceljs` |

### Database Schema Inti (Entity Overview)

```
Anggota ──┬── Simpanan (1:N)
          ├── Pinjaman (1:N) ── Angsuran (1:N)
          ├── SHU (1:1 per tahun)
          └── User (1:1, untuk login)

Jurnal Umum ── Detail Jurnal (akun debit/kredit)
Akun (chart of accounts)

Transaksi (polymorphic: simpanan, pinjaman, biaya, dll.)
```

### Security & Privacy

- **RBAC**: Tiga role (`PENGURUS`, `ANGGOTA`, `PANGAWAS`). Akses endpoint dibatasi oleh role.
- **Enkripsi**: Password dengan bcrypt (via NextAuth). Data sensitif (NIK, penghasilan) dienkripsi di DB.
- **Audit Log**: Semua mutasi data finansial dicatat dengan `createdById`, `createdAt`, `oldValue`, `newValue`.
- **Session**: JWT dengan httpOnly cookie, Samesite=Strict.
- **HTTPS**: Wajib di production.
- **Compliance**: Data anggota disimpan sesuai UU Perlindungan Data Pribadi (UU PDP) — hak akses dan hapus data diakomodasi.

## 5. Risks & Roadmap

### Phased Rollout

| Phase | Fitur | Timeline Estimasi |
|-------|-------|-------------------|
| **MVP** | Manajemen Anggota + 3 Jenis Simpanan + Pinjaman (ajukan-setujui-cair-angsuran) + Jurnal Umum + RBAC | 2-3 bulan |
| **v1.1** | Laporan Keuangan (Neraca, Laba-Rugi, Arus Kas, SHU) + Export PDF/Excel + Audit Log | +1 bulan |
| **v1.2** | Portal Anggota lengkap (mutasi, tagihan) + Notifikasi + Dasbor Pengawas | +1 bulan |
| **v2.0** | Distribusi SHU otomatis + Analitik + (Opsional) Payment Gateway + (Opsional) Multi-Koperasi | +2-3 bulan |

### Technical Risks

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Perhitungan SHU rumit (banyak variabel) | Kesalahan alokasi dana anggota | Gunakan rumus terdokumentasi + uji coba dengan data historis manual di QA |
| Deadlock transaksi konkuren (banyak setoran bersamaan) | Data tidak konsisten | Gunakan transaksi database (BEGIN/COMMIT), Prisma interactive transactions |
| Beban laporan keuangan jika data sudah besar | Loading lambat | Agregasi dengan materialized view, pagination, cache periodik |
| Migrasi data dari sistem manual | Data tidak akurat / duplikat | Buat template import CSV, validasi ketat, periode uji coba paralel |


