# SIMKO — Final Consolidated Code Review

**Tanggal:** 2026-06-07  
**Cakupan:** Ringkasan gabungan dari `REPORT-REVIEW.md`, `REVIEW-V2.md`, `SOLID-REUSABILITY-REVIEW.md`, `REVIEW-V3.md`, dan perbaikan terakhir.  
**Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 7, MySQL/MariaDB, NextAuth v5.

---

## Executive Summary

Aplikasi SIMKO sudah mengalami perbaikan besar dari review awal. Banyak temuan critical/high sudah ditutup, terutama authorization, IDOR, upload security, webhook/payment hardening, Excel injection, test suite, financial rounding, COA constants, dan race condition nomor anggota.

**Status akhir:** 🟢 **Near Production Ready dengan sisa technical debt terkontrol**

Aplikasi belum 100% bebas temuan, tetapi risiko terbesar sudah jauh berkurang. Sisa pekerjaan utama berada pada hardening lanjutan, refactor maintainability/SOLID, export scalability, timezone consistency, dan UX loading/error handling.

---

## Verifikasi Terakhir

| Check | Status | Catatan |
|-------|--------|---------|
| Unit tests | ✅ Pass | 7 files, 74 tests passed via Vitest |
| TypeScript | ✅ Pass | `npx tsc --noEmit` tanpa error |
| ESLint | ✅ Pass with warnings | 0 errors, 19 warnings lama terkait `<img>`, Link, hook dependency, dll |
| Test infrastructure | ✅ Ada | Vitest configured with alias `@` |

---

## Ringkasan Status Semua Temuan

| Kategori | Status |
|----------|--------|
| Critical security awal | ✅ Mayoritas fixed |
| High priority correctness/security | 🟡 Mayoritas fixed, beberapa partial |
| Medium maintainability | 🟡 Partial |
| SOLID/reusability | 🟡 Partial, masih perlu refactor bertahap |
| UX/accessibility/loading | 🟡 Masih banyak low-priority debt |
| Automated tests | ✅ Fixed |

---

# Sudah Terimplementasi / Sudah Diperbaiki

## 1. Authorization & IDOR

### Fixed

| Issue | Sebelum | Sekarang |
|-------|---------|----------|
| Missing auth dashboard/export | Beberapa action hanya cek `session?.user` atau tidak cek sama sekali | Banyak action sudah pakai `assertRole()` |
| IDOR dashboard anggota | `getDashboardAnggota(anggotaId)` bisa akses data anggota lain | Role `ANGGOTA` dibatasi hanya boleh akses `anggotaId` miliknya |
| Redundant auth export | `auth()` lalu `assertRole()` | Dihapus menjadi langsung `assertRole()` pada export actions |
| Auth helper | Inline role check tersebar | Centralized `assertRole()` tersedia |

### Perbaikan terakhir

- `src/lib/jurnal.ts`
  - `getSaldoAkun()` diberi role check jika dipanggil tanpa transaction client.
  - `getSaldoAkunTipe()` diberi role check jika dipanggil tanpa transaction client.
- `src/lib/shu.ts`
  - `getIndikatorSHU()` diberi `assertRole()`.
  - `saveIndikatorSHU()` diberi `assertRole()`.
  - `deleteIndikatorSHU()` diberi `assertRole()`.
  - `getTotalPendapatanBeban()` diberi `assertRole()`.
  - `getSaldoPerAnggota()` diberi `assertRole()`.
  - `getTotalAngsuranAnggota()` diberi `assertRole()`.
  - `hitungSHU()` diberi `assertRole()`.

---

## 2. Security Hardening API & Upload

### Fixed

| Issue | Sebelum | Sekarang |
|-------|---------|----------|
| Change password no rate limit | Bisa brute force password lama | Rate limit max 3 request / 60 detik |
| File upload unsafe | Ekstensi dari filename, MIME kurang divalidasi | MIME validation, size check, safe filename |
| Upload no rate limit | Bisa spam upload | Rate limit upload ditambahkan |
| FCM token hijacking | Token bisa di-claim user lain | Ownership check saat register token |
| JSON parsing | `req.json()` tanpa try/catch | API routes dibungkus error handling |
| Excel formula injection | Raw string bisa mulai `=`, `+`, `-`, `@` | `sanitizeCellValue()` dipakai untuk export |

---

## 3. Midtrans / Online Payment

### Fixed

| Issue | Sebelum | Sekarang |
|-------|---------|----------|
| Webhook no idempotency | Webhook duplicate bisa diproses ulang | Dedup/idempotency map dengan TTL |
| Webhook error leak | Response mengembalikan `error.message` | Response generic `Internal server error` |
| Midtrans no timeout | `fetch()` bisa hang | `AbortController` timeout 15 detik |
| Payment status concurrent sync | Banyak tab bisa hit API bersamaan | Request dedup via `pendingSyncRequests` |
| Audit actor wrong | Pakai admin pertama sebagai actor | Pakai user anggota yang melakukan payment |
| Notification loop | Serial notification ke admin | `notifyAdmins()` parallel via `Promise.all()` |

---

## 4. Financial Calculation Precision

### Fixed

Sebelumnya banyak kalkulasi finansial memakai:

```ts
Math.round(value * 100) / 100
Number(value.toFixed(2))
```

Sekarang dibuat utility:

```ts
src/lib/math.ts
```

Dengan `round2()` berbasis `decimal.js`.

### Area yang sudah diperbaiki

| File | Perbaikan |
|------|-----------|
| `src/lib/jurnal.ts` | Saldo akun tipe dibulatkan dengan `round2()` |
| `src/lib/shu.ts` | Total pendapatan, beban, SHU, alokasi, jasa modal/usaha pakai `round2()` |
| `src/actions/pinjaman.ts` | Plafon, angsuran pokok, angsuran jasa, total angsuran pakai `round2()` |
| `src/actions/dashboard.ts` | SHU, saldo kas, kewajiban lancar, cash ratio, piutang pakai `round2()` |
| `src/actions/tutup-buku.ts` | Saldo penutup, SHU TB, sisa rounding pakai `round2()` |
| `src/actions/jurnal.ts` | Saldo awal buku besar pakai `round2()` |
| `src/actions/export-laporan.ts` | Saldo berjalan dan nominal SHU export pakai `round2()` |

---

## 5. Test Suite

### Fixed

Sebelumnya tidak ada automated test.

Sekarang sudah ada:

| Area | Status |
|------|--------|
| Vitest config | ✅ Ada `vitest.config.ts` |
| Test files | ✅ 7 test files |
| Total tests | ✅ 74 tests |
| Result terakhir | ✅ 74 passed |

Test coverage mencakup:

- Date utilities
- Format utilities
- Member number generator
- COA constants / jurnal utilities
- SHU validation
- Filter builders
- Other core utility behavior

---

## 6. COA Constants / Hardcoded Account Codes

### Fixed

Sebelumnya kode akun seperti `1.1.1`, `1.2.1`, `2.1.3`, `3.1.2`, `3.1.3` tersebar di banyak file.

Sekarang ditambahkan/dipakai constants di `src/lib/jurnal.ts`:

| Constant | Code |
|----------|------|
| `COA_KAS` | `1.1.1` |
| `COA_BANK` | `1.1.2` |
| `COA_SIMPANAN_POKOK` | `2.1.1` |
| `COA_SIMPANAN_WAJIB` | `2.1.2` |
| `COA_SIMPANAN_SUKARELA` | `2.1.3` |
| `COA_PIUTANG_PINJAMAN` | `1.2.1` |
| `COA_SHU_BERJALAN` | `3.1.2` |
| `COA_SHU_DITAHAN` | `3.1.3` |
| `COA_PENDAPATAN_JASA` | `4.1.1` |
| `COA_PENDAPATAN_DENDA` | `4.1.3` |

### File yang sudah memakai constants

- `src/actions/dashboard.ts`
- `src/actions/tutup-buku.ts`
- `src/actions/jurnal.ts`
- `src/actions/export-laporan.ts`
- Existing usage di `src/actions/pinjaman.ts`, `src/actions/anggota.ts`, dll

---

## 7. Race Condition Nomor Anggota

### Fixed

Sebelumnya:

- `count() + 1` dipakai untuk nomor anggota.
- Pada create anggota regular, nomor dibuat di transaction tetapi insert dilakukan setelah transaction.
- Isolation default masih memungkinkan phantom read.

Sekarang:

| File | Perbaikan |
|------|-----------|
| `src/actions/anggota.ts` | `count()` dan `anggota.create()` digabung dalam satu `$transaction` |
| `src/actions/anggota.ts` | Transaction memakai `Prisma.TransactionIsolationLevel.Serializable` |
| `src/actions/import-anggota.ts` | Import transaction memakai `Serializable` |

Ini mengurangi risiko duplicate sequence saat concurrent create/import.

---

## 8. Reusability / Shared Utilities

### Fixed / Improved

| Area | Perbaikan |
|------|-----------|
| Excel sanitization | `sanitizeCellValue()` dipindah ke shared `@/lib/excel` |
| Date range | Shared helper `tahunRange`, `tahunMulai`, `tahunSelesai`, `hinggaAkhirTahun` |
| Notification | `notifyAdmins()` dan `notifyMember()` mengurangi loop manual |
| Struk | Deduplikasi `generateNoStruk*` menjadi shared generator |
| Financial rounding | Shared `round2()` |
| Filters | Shared filter builders di `@/lib/where` |

---

## 9. React / UI Bugs

### Fixed / Improved

| Issue | Status |
|-------|--------|
| Edit anggota menggunakan `document.getElementById` | ✅ Diganti controlled React state |
| Jurnal manual form `key={entry.id}` undefined | ✅ Kondisi terakhir tidak lagi memakai `entry.id`; sudah aman dari undefined key |
| Pagination labels sebagian | 🔶 Sebagian sudah membaik |
| FCM retry flaw | ✅ `initialized.current` dipindah setelah init sukses |

---

## 10. Bug Logic Lain yang Ikut Diperbaiki

| Issue | Status |
|-------|--------|
| Status pinjaman typo `DICAIKKAN` | ✅ Diganti ke `DICAIRKAN` di beberapa query |
| Import anggota partial transaction | ✅ Import dibungkus transaction |
| Jurnal number collision | ✅ Random suffix approach |
| Config cache serverless issue | ✅ Cache 60s diganti per-request cache |

---

# Task Selanjutnya yang Masih Perlu Diperbaiki

## Priority 1 — Production Hardening

### 1. Export Pagination / Chunking

**Status:** Belum selesai  
**Risiko:** Memory spike / timeout untuk data besar.

Lokasi utama:

- `src/actions/export.ts`
- `src/actions/export-laporan.ts`

Rekomendasi:

- Tambahkan batas maksimal tanggal/range export.
- Gunakan cursor pagination atau chunked query.
- Untuk dataset besar, buat background job/export async.
- Tambahkan guard maksimal row per export.

---

### 2. Auth Consistency Final Sweep

**Status:** Partial  
**Risiko:** Masih mungkin ada getter/action yang hanya memakai `auth()` atau belum role-specific.

Rekomendasi:

- Audit semua `src/actions/**/*.ts`, `src/lib/**/*.ts`, dan API routes.
- Standarkan pola:
  - read admin/pengurus/bendahara: `assertRole("ADMIN", "PENGURUS", "BENDAHARA")`
  - pengawas: hanya endpoint audit/report tertentu
  - anggota: wajib ownership check
- Hindari auth check di helper pure function.
- Untuk helper yang menerima `tx`, jangan auth ulang jika dipanggil internal dalam transaction.

---

### 3. API Input Validation Final Sweep

**Status:** Partial  
**Risiko:** Invalid UUID/date/query bisa masuk ke Prisma/API.

Rekomendasi:

- Buat Zod schema untuk semua API route query/body.
- Validasi UUID, enum, date range, pagination params.
- Return `400 Bad Request` untuk invalid input.

---

### 4. Rate Limiting Lebih Persisten

**Status:** Sebagian memakai in-memory map  
**Risiko:** In-memory rate limit tidak efektif di multi-instance/serverless.

Rekomendasi:

- Pakai Redis/Upstash/KV untuk rate limit production.
- Terapkan rate limit ke:
  - auth/change-password
  - upload
  - online payment create/sync
  - webhook abuse protection
  - notification APIs

---

## Priority 2 — Financial & Data Integrity

### 5. Monetary Calculation End-to-End Decimal

**Status:** Rounding sudah pakai `decimal.js`, tetapi sebagian intermediate calculation masih memakai `number`.  
**Risiko:** Precision kecil masih mungkin muncul di operasi kompleks.

Rekomendasi:

- Untuk kalkulasi besar seperti SHU, pinjaman, tutup buku: gunakan `Decimal` sepanjang operasi, convert ke number hanya di boundary return/store.
- Tambahkan test kasus edge decimal: `0.1 + 0.2`, pembagian tenor tidak habis, alokasi persentase 33.33/33.34.

---

### 6. Stronger Unique Sequence Strategy

**Status:** Sudah lebih aman dengan Serializable transaction.  
**Risiko:** Masih bergantung pada `count() + 1`; lebih aman memakai sequence table.

Rekomendasi jangka panjang:

- Buat tabel `Counter` / `Sequence` per tanggal.
- Atomic increment via row lock/upsert.
- Tambahkan unique constraint untuk format nomor anggota jika belum ada.
- Implement retry saat unique collision.

---

### 7. Transaction Boundary Refactor

**Status:** Partial  
**Risiko:** Helper yang memakai global `prisma` sulit dikomposisi secara atomic.

Rekomendasi:

- Tambahkan optional `tx` parameter untuk helper bisnis:
  - `getTotalPendapatanBeban()`
  - `getSaldoPerAnggota()`
  - `getTotalAngsuranAnggota()`
  - notification/audit helper bila dipakai dalam transaction
- Standarkan tipe `Prisma.TransactionClient`.

---

## Priority 3 — Maintainability / SOLID

### 8. Refactor God Functions

**Status:** Belum selesai  
**Risiko:** Sulit dites, sulit dirawat, rawan regresi.

Target utama:

| Function | Masalah |
|----------|---------|
| `createAnggota()` | Auth + validation + sequence + create + optional user + audit + tagihan |
| `ajukanPinjaman()` | Validation + config + calculation + create + audit + notification |
| `setorSimpanan()` | Mutation + jurnal + audit + notification |
| `prosesTutupBuku()` | Closing journal + SHU distribution + simpanan mutation |
| `prosesSuksesPaymentInternal()` | Payment status + simpanan/tagihan/angsuran + jurnal + notification + audit |

Rekomendasi:

- Pecah menjadi service-level functions:
  - validation/adapters
  - domain calculation
  - persistence mutation
  - journal creation
  - notification/audit side effects
- Buat unit test untuk pure domain calculation.

---

### 9. Prisma Type Safety / Hindari `Record<string, unknown>` dan `any`

**Status:** Partial  
**Risiko:** Type safety hilang saat refactor.

Rekomendasi:

- Gunakan `Prisma.XWhereInput` untuk dynamic where.
- Hindari `as any` kecuali sangat perlu.
- Buat helper typed untuk filter builders.

---

### 10. COA Constants Final Sweep

**Status:** ✅ **FIXED** (Centralized array `COA_KAS_BANK` now mapped cleanly inside `dashboard.ts` and `jurnal.ts` actions).  
**Risiko:** Terkontrol, tidak ada lagi hardcoded kode akun kas/bank secara literal di file-file actions utama.

Rekomendasi:
- Tambahkan konfigurasi akun kas/bank utama jika dibutuhkan di masa mendatang.

---

## Priority 4 — Timezone, UX, Accessibility

### 11. Timezone Consistency

**Status:** ✅ **FIXED** (Seluruh inline timezone `+07:00` di logic bisnis telah dihapus dan disatukan menggunakan utility `getTZOffset()`).  
**Risiko:** Terkontrol.

Rekomendasi:
- Tentukan standar: UTC atau configurable timezone via `.env` atau DB.

---

### 12. Loading States & Pending UI

**Status:** Belum selesai  
**Risiko:** UX membingungkan saat filter/pagination lambat.

Rekomendasi:

- Tambahkan skeleton/loading di table components.
- Gunakan `useTransition()` untuk filter navigation.
- Disable button saat pending mutation.

---

### 13. Silent Error Handling

**Status:** Masih ada beberapa `.catch(() => {})` / silent failure.  
**Risiko:** Error production tidak terlihat.

Rekomendasi:

- Minimal log via centralized logger.
- Return user-friendly error untuk UI.
- Untuk background side effect seperti notification/tagihan, catat warning/audit event.

---

### 14. Accessibility & Next.js Best Practices

**Status:** Lint warnings masih ada.  
**Catatan lint terakhir:** 19 warnings, 0 errors.

Rekomendasi:

- Ganti `<img>` yang relevan dengan `next/image`.
- Ganti `<a href="/internal-route">` dengan `next/link`.
- Tambahkan dependency hook yang hilang atau stabilkan callback.
- Pastikan icon-only buttons punya `aria-label`.
- Perbaiki ARIA combobox/select custom.

---

# Prioritas Implementasi Berikutnya

Urutan disarankan:

1. **Export pagination/chunking** — risiko performa production paling nyata.
2. **Auth/API validation final sweep** — security hardening final.
3. **Rate limit persistent** — ganti in-memory rate limit untuk deployment multi-instance.
4. **Timezone config** — hindari bug laporan lintas timezone.
5. **Refactor god functions** — maintainability jangka panjang.
6. **Decimal end-to-end** — precision financial lebih kuat.
7. **Loading/error/accessibility cleanup** — polish UX dan lint warnings.

---

# Kesimpulan Final

SIMKO sekarang sudah jauh lebih matang dibanding review awal. Temuan paling berbahaya sudah banyak ditutup:

- Authorization dan IDOR sudah jauh lebih aman.
- Upload, FCM, webhook, payment, dan Excel export sudah di-hardening.
- Test suite sudah tersedia dan passing.
- Financial rounding sudah pakai `decimal.js` utility.
- Race nomor anggota sudah diperbaiki dengan transaction + serializable isolation.
- COA constants sudah mulai terpusat.

Namun, untuk production-grade jangka panjang, masih perlu menyelesaikan scalability export, persistent rate limiting, final auth/API validation sweep, timezone consistency, dan refactor god functions agar kode lebih maintainable dan mudah dites.
