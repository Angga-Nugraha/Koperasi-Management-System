# Database Design Document (DDD)

# Sistem Manajemen Koperasi (SIMKO)

Version: 1.0

---

# 1. Database Overview

Database Engine: MySQL 8+

ORM: Prisma ORM

Character Set:

```sql
utf8mb4
```

Collation:

```sql
utf8mb4_unicode_ci
```

---

# 2. ERD (High Level)

```text
User
 │
 └── Anggota
      │
      ├── Simpanan
      │
      ├── Pinjaman
      │      │
      │      └── Angsuran
      │
      ├── SHU
      │
      └── Notifikasi


Akun
 │
 └── Jurnal
       │
       └── DetailJurnal


AuditLog
```

---

# 3. Enumerations

## Role

```text
PENGURUS
BENDAHARA
ANGGOTA
PENGAWAS
```

## MemberStatus

```text
ACTIVE
INACTIVE
EXITED
```

## SavingType

```text
POKOK
WAJIB
SUKARELA
```

## LoanStatus

```text
PENDING
APPROVED
REJECTED
DISBURSED
PAID_OFF
```

## InstallmentStatus

```text
UNPAID
PAID
OVERDUE
```

## JournalStatus

```text
DRAFT
POSTED
```

## SHUStatus

```text
DRAFT
VERIFIED
PUBLISHED
```

---

# 4. User Table

Menyimpan akun login.

| Column       | Type         |
| ------------ | ------------ |
| id           | UUID         |
| email        | VARCHAR(191) |
| passwordHash | VARCHAR(255) |
| role         | ENUM         |
| isActive     | BOOLEAN      |
| createdAt    | DATETIME     |
| updatedAt    | DATETIME     |

Constraint:

* email unique

---

# 5. Anggota Table

Menyimpan data anggota koperasi.

| Column       | Type          |
| ------------ | ------------- |
| id           | UUID          |
| userId       | UUID          |
| memberNumber | VARCHAR(50)   |
| nik          | VARCHAR(255)  |
| fullName     | VARCHAR(255)  |
| address      | TEXT          |
| occupation   | VARCHAR(255)  |
| income       | DECIMAL(18,2) |
| joinDate     | DATE          |
| status       | ENUM          |
| createdAt    | DATETIME      |
| updatedAt    | DATETIME      |

Constraint:

* memberNumber unique
* nik unique

---

# 6. Simpanan Table

Semua transaksi simpanan.

| Column          | Type          |
| --------------- | ------------- |
| id              | UUID          |
| anggotaId       | UUID          |
| type            | ENUM          |
| amount          | DECIMAL(18,2) |
| transactionDate | DATETIME      |
| note            | TEXT          |
| createdById     | UUID          |
| createdAt       | DATETIME      |

---

# 7. SaldoSimpanan Table

Materialized balance untuk performa.

| Column          | Type          |
| --------------- | ------------- |
| anggotaId       | UUID          |
| pokokBalance    | DECIMAL(18,2) |
| wajibBalance    | DECIMAL(18,2) |
| sukarelaBalance | DECIMAL(18,2) |
| totalBalance    | DECIMAL(18,2) |
| updatedAt       | DATETIME      |

---

# 8. Pinjaman Table

| Column             | Type          |
| ------------------ | ------------- |
| id                 | UUID          |
| anggotaId          | UUID          |
| principalAmount    | DECIMAL(18,2) |
| interestRate       | DECIMAL(5,2)  |
| tenureMonths       | INT           |
| monthlyInstallment | DECIMAL(18,2) |
| remainingBalance   | DECIMAL(18,2) |
| status             | ENUM          |
| applicationDate    | DATETIME      |
| approvedDate       | DATETIME      |
| disbursedDate      | DATETIME      |
| notes              | TEXT          |
| approvedById       | UUID          |
| createdAt          | DATETIME      |

---

# 9. Angsuran Table

| Column          | Type          |
| --------------- | ------------- |
| id              | UUID          |
| pinjamanId      | UUID          |
| installmentNo   | INT           |
| dueDate         | DATE          |
| principalAmount | DECIMAL(18,2) |
| interestAmount  | DECIMAL(18,2) |
| penaltyAmount   | DECIMAL(18,2) |
| totalAmount     | DECIMAL(18,2) |
| paidDate        | DATETIME      |
| status          | ENUM          |

---

# 10. Akun Table

Chart of Accounts.

| Column      | Type         |
| ----------- | ------------ |
| id          | UUID         |
| accountCode | VARCHAR(20)  |
| accountName | VARCHAR(255) |
| category    | VARCHAR(100) |
| isActive    | BOOLEAN      |

Contoh:

```text
101 Kas
102 Bank

201 Simpanan Pokok
202 Simpanan Wajib

301 Piutang Pinjaman

401 Pendapatan Jasa

501 Beban Operasional
```

---

# 11. Jurnal Table

Header jurnal.

| Column          | Type        |
| --------------- | ----------- |
| id              | UUID        |
| journalNo       | VARCHAR(50) |
| transactionDate | DATETIME    |
| description     | TEXT        |
| status          | ENUM        |
| createdById     | UUID        |
| createdAt       | DATETIME    |

---

# 12. DetailJurnal Table

| Column   | Type          |
| -------- | ------------- |
| id       | UUID          |
| jurnalId | UUID          |
| akunId   | UUID          |
| debit    | DECIMAL(18,2) |
| credit   | DECIMAL(18,2) |

Constraint:

```text
SUM(debit) = SUM(credit)
```

---

# 13. SHU Table

Per anggota per tahun.

| Column    | Type          |
| --------- | ------------- |
| id        | UUID          |
| anggotaId | UUID          |
| year      | INT           |
| jasaModal | DECIMAL(18,2) |
| jasaUsaha | DECIMAL(18,2) |
| totalSHU  | DECIMAL(18,2) |
| status    | ENUM          |
| createdAt | DATETIME      |

Constraint:

```text
UNIQUE(anggotaId, year)
```

---

# 14. AuditLog Table

| Column     | Type         |
| ---------- | ------------ |
| id         | UUID         |
| userId     | UUID         |
| entityName | VARCHAR(100) |
| entityId   | UUID         |
| action     | VARCHAR(50)  |
| oldValue   | JSON         |
| newValue   | JSON         |
| createdAt  | DATETIME     |

---

# 15. Notification Table

| Column    | Type         |
| --------- | ------------ |
| id        | UUID         |
| anggotaId | UUID         |
| title     | VARCHAR(255) |
| message   | TEXT         |
| isRead    | BOOLEAN      |
| createdAt | DATETIME     |

---

# 16. Recommended Indexes

```sql
idx_anggota_member_number
idx_anggota_nik

idx_simpanan_anggota
idx_simpanan_date

idx_pinjaman_anggota
idx_pinjaman_status

idx_angsuran_pinjaman
idx_angsuran_due_date

idx_jurnal_date

idx_audit_entity
idx_audit_user

idx_shu_year
```

---

# 17. Data Integrity Rules

Rule 1

Anggota INACTIVE atau EXITED tidak boleh membuat pinjaman baru.

Rule 2

Jurnal POSTED tidak boleh diubah.

Rule 3

Pinjaman PAID_OFF tidak boleh menerima pembayaran lagi.

Rule 4

Saldo simpanan tidak boleh negatif.

Rule 5

SHU hanya dapat dipublish setelah status VERIFIED.

Rule 6

Audit log tidak boleh dihapus dari aplikasi.


