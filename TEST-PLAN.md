# Test Plan: Sistem Manajemen Koperasi (Simko)

## 1. Scope

### In Scope
- All pure utility functions in `src/lib/` (date, format, anggota utils, where filters, jurnal COA)
- Zod validation schemas for all entities (anggota, simpanan, pinjaman, jurnal, user)
- SHU business logic (indikator percentage validation)
- Build compilation (TypeScript check)
- Lint compliance (ESLint)
- Static page generation

### Out of Scope
- Database-dependent integration tests (require running MySQL/MariaDB)
- E2E UI tests (require Playwright + running app)
- External service integrations (Firebase, Midtrans, Firebase Cloud Messaging)

## 2. Test Types

| Type | Location | Tool |
|------|----------|------|
| Unit Tests (Utilities) | `src/lib/__tests__/` | Vitest |
| Schema Validation Tests | `src/lib/__tests__/validations.test.ts` | Vitest |
| TypeScript Compilation | `npm run build` | Next.js + TypeScript |
| Lint Compliance | `npm run lint` | ESLint |

## 3. Entry Criteria
- Codebase checked out and dependencies installed (`npm install`)
- Prisma client generated (`npx prisma generate`)
- Environment variables configured in `.env`
- MySQL/MariaDB database running (for build, not for unit tests)

## 4. Exit Criteria
- All unit tests pass (74 tests across 7 test files)
- TypeScript build succeeds with 0 errors
- Lint passes with 0 errors
- All P0 bugs fixed and verified

## 5. Environment
- **OS**: Ubuntu 24.04
- **Node**: v22+
- **Database**: MariaDB 10.11+ (via `simko` database)
- **Framework**: Next.js 16.2.6 (Turbopack)
- **ORM**: Prisma 7.8.0

## 6. Test Case Summary

### 6.1 Date Utilities (`src/lib/__tests__/date.test.ts`)
| ID | Test Case | Priority |
|----|-----------|----------|
| TC-DATE-001 | `tahunRange` returns correct date range | P0 |
| TC-DATE-002 | `tahunMulai` returns Jan 1 | P0 |
| TC-DATE-003 | `tahunSelesai` returns Jan 1 of next year | P0 |
| TC-DATE-004 | `hinggaAkhirTahun` returns Dec 31 23:59:59 | P0 |

### 6.2 Format Utilities (`src/lib/__tests__/format.test.ts`)
| ID | Test Case | Priority |
|----|-----------|----------|
| TC-FMT-001 | `formatTanggal` formats Date object | P0 |
| TC-FMT-002 | `formatTanggal` formats ISO string | P0 |
| TC-FMT-003 | `formatTanggal` pads single-digit day/month | P0 |
| TC-FMT-004 | `formatCompact` formats < 1000 | P0 |
| TC-FMT-005 | `formatCompact` formats thousands as K | P0 |
| TC-FMT-006 | `formatCompact` formats millions as M | P0 |
| TC-FMT-007 | `formatCompact` formats billions as B | P0 |
| TC-FMT-008 | `formatCompact` formats trillions as T | P0 |
| TC-FMT-009 | `formatCompact` removes trailing .0 | P0 |
| TC-FMT-010 | `formatCompact` handles zero | P1 |

### 6.3 Anggota Number Generation (`src/lib/__tests__/utils.anggota.test.ts`)
| ID | Test Case | Priority |
|----|-----------|----------|
| TC-AGT-001 | Generates correct format `AGT{YYMMDD}{0001}-{SUFFIX}` | P0 |
| TC-AGT-002 | Pads sequence number to 4 digits | P0 |
| TC-AGT-003 | Handles large sequence numbers | P1 |
| TC-AGT-004 | Generates unique suffix per call | P1 |

### 6.4 Query Filter Builders (`src/lib/__tests__/where.test.ts`)
| ID | Test Case | Priority |
|----|-----------|----------|
| TC-WHR-001 | `jurnalFilter` empty params | P0 |
| TC-WHR-002 | `jurnalFilter` search with OR | P0 |
| TC-WHR-003 | `jurnalFilter` date range | P0 |
| TC-WHR-004 | `anggotaFilter` empty params | P0 |
| TC-WHR-005 | `anggotaFilter` SEMUA status | P0 |
| TC-WHR-006 | `anggotaFilter` specific status | P0 |
| TC-WHR-007 | `anggotaFilter` search across 3 fields | P0 |
| TC-WHR-008 | `detailJurnalFilter` empty params | P0 |
| TC-WHR-009 | `detailJurnalFilter` by akunId | P0 |
| TC-WHR-010 | `detailJurnalFilter` by multiple akunIds | P1 |
| TC-WHR-011 | `detailJurnalFilter` exclude closing | P1 |
| TC-WHR-012 | `detailJurnalFilter` date range | P0 |
| TC-WHR-013 | `anggotaTanggalFilter` same-day range | P0 |

### 6.5 Jurnal / COA Constants (`src/lib/__tests__/jurnal.test.ts`)
| ID | Test Case | Priority |
|----|-----------|----------|
| TC-COA-001 | COA constants have correct codes | P0 |
| TC-COA-002 | `getSimpananAkun` POKOK | P0 |
| TC-COA-003 | `getSimpananAkun` WAJIB | P0 |
| TC-COA-004 | `getSimpananAkun` SUKARELA | P0 |
| TC-COA-005 | `getSimpananAkun` throws for unknown | P0 |

### 6.6 Zod Validation Schemas (`src/lib/__tests__/validations.test.ts`)
| ID | Test Case | Priority |
|----|-----------|----------|
| TC-VAL-001 | `anggotaSchema` valid data | P0 |
| TC-VAL-002 | `anggotaSchema` rejects short NIK | P0 |
| TC-VAL-003 | `anggotaSchema` rejects non-numeric NIK | P0 |
| TC-VAL-004 | `anggotaSchema` rejects short nama | P0 |
| TC-VAL-005 | `anggotaSchema` accepts optional fields | P1 |
| TC-VAL-006 | `anggotaSchema` accepts empty optionals | P1 |
| TC-VAL-007 | `anggotaSchema` rejects negative penghasilan | P1 |
| TC-VAL-008 | `anggotaStatusSchema` accepts AKTIF | P0 |
| TC-VAL-009 | `anggotaStatusSchema` accepts NONAKTIF | P0 |
| TC-VAL-010 | `anggotaStatusSchema` accepts KELUAR | P0 |
| TC-VAL-011 | `anggotaStatusSchema` rejects invalid status | P0 |
| TC-VAL-012 | `resetPasswordSchema` valid password | P0 |
| TC-VAL-013 | `resetPasswordSchema` rejects short password | P0 |
| TC-VAL-014 | `setorSimpananSchema` valid deposit | P0 |
| TC-VAL-015 | `setorSimpananSchema` rejects zero nominal | P0 |
| TC-VAL-016 | `setorSimpananSchema` rejects negative | P0 |
| TC-VAL-017 | `setorSimpananSchema` rejects empty anggotaId | P0 |
| TC-VAL-018 | `tarikSimpananSchema` valid withdrawal | P0 |
| TC-VAL-019 | `getTagihanListSchema` defaults page/size | P1 |
| TC-VAL-020 | `getTagihanListSchema` valid month/year | P1 |
| TC-VAL-021 | `getTagihanListSchema` rejects invalid month | P1 |
| TC-VAL-022 | `generateTagihanSchema` valid input | P1 |
| TC-VAL-023 | `generateTagihanSchema` empty input | P1 |
| TC-VAL-024 | `bayarTagihanSchema` valid | P0 |
| TC-VAL-025 | `bayarTagihanSchema` rejects empty | P0 |
| TC-VAL-026 | `ajukanPinjamanSchema` valid | P0 |
| TC-VAL-027 | `ajukanPinjamanSchema` rejects zero tenor | P0 |
| TC-VAL-028 | `ajukanPinjamanSchema` rejects zero jumlah | P0 |
| TC-VAL-029 | `cairkanPinjamanSchema` valid | P0 |
| TC-VAL-030 | `bayarAngsuranSchema` valid | P0 |
| TC-VAL-031 | `bayarAngsuranSchema` rejects zero nominal | P0 |
| TC-VAL-032 | `hapusPinjamanSchema` valid | P0 |

### 6.7 SHU Business Logic (`src/lib/__tests__/shu-validation.test.ts`)
| ID | Test Case | Priority |
|----|-----------|----------|
| TC-SHU-001 | Accepts items totalling exactly 100% | P0 |
| TC-SHU-002 | Rejects items totalling < 100% | P0 |
| TC-SHU-003 | Rejects items totalling > 100% | P0 |
| TC-SHU-004 | Accepts floating point = 100% | P1 |

## 7. Test Execution Results

### 7.1 Unit Tests (Vitest)
| Suite | Tests | Passed | Failed | Blocked |
|-------|-------|--------|--------|---------|
| date.test.ts | 4 | 4 | 0 | 0 |
| format.test.ts | 10 | 10 | 0 | 0 |
| utils.anggota.test.ts | 4 | 4 | 0 | 0 |
| where.test.ts | 13 | 13 | 0 | 0 |
| jurnal.test.ts | 5 | 5 | 0 | 0 |
| validations.test.ts | 34 | 34 | 0 | 0 |
| shu-validation.test.ts | 4 | 4 | 0 | 0 |
| **Total** | **74** | **74** | **0** | **0** |

### 7.2 Build & TypeScript
| Check | Result |
|-------|--------|
| TypeScript Compilation | ✅ Compiled successfully |
| Static Pages | ✅ 41/41 generated in 1.86s |
| Lint (Errors) | ✅ 0 errors |
| Lint (Warnings) | 19 warnings (non-blocking) |

## 8. Risks & Issues

### Resolved
- Fixed unused variable `urutan` in `anggota.ts:168`
- Fixed 15+ lint errors across components (`set-state-in-effect`)
- Fixed 7+ TypeScript errors (Prisma 7.x type changes)
- Fixed missing import `tahunMulai`/`tahunSelesai` in `tutup-buku.ts`
- Fixed unused imports (`auth`, `session`, `Prisma`, `kirimNotifikasi`, `useEffect`)
- Fixed `Entry.id` type error in `jurnal-manual-form.tsx`
- Fixed `raw` vs `data` variable name bug in `simpanan.ts`
- Fixed `Prisma.DbNull` type issue in `audit.ts`

### Open (Non-blocking)
- 19 lint warnings (mostly `@next/next/no-img-element` for `<img>` usage, non-critical)
- No integration tests cover database-dependent operations
- No E2E tests exist yet (recommend Playwright for Phase 2)

## 9. Release Sign-Off

| Criterion | Status |
|-----------|--------|
| All P0 test cases executed | ✅ |
| All P0 bugs fixed and verified | ✅ |
| All P1 bugs fixed or documented workaround | ✅ |
| Regression suite passed (build) | ✅ |
| Test coverage meets threshold (74/74 tests pass) | ✅ |
| Lint passes (0 errors) | ✅ |
| Build succeeds (41 static pages) | ✅ |

**Decision: ✅ APPROVED FOR RELEASE**

**Sign-Off By**: QA Engineer  
**Date**: 2026-06-06  
**Build Version**: Next.js 16.2.6 (Turbopack)  
**Test Framework**: Vitest v4.1.8
