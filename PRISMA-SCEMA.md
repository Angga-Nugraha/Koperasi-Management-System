## PRSMA SCHEMA
enum Role {
  PENGURUS
  BENDAHARA
  ANGGOTA
  PENGAWAS
}

enum MemberStatus {
  ACTIVE
  INACTIVE
  EXITED
}

enum SavingType {
  POKOK
  WAJIB
  SUKARELA
}

enum LoanStatus {
  PENDING
  APPROVED
  REJECTED
  DISBURSED
  PAID_OFF
}

enum InstallmentStatus {
  UNPAID
  PAID
  OVERDUE
}

enum JournalStatus {
  DRAFT
  POSTED
}

enum SHUStatus {
  DRAFT
  VERIFIED
  PUBLISHED
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         Role
  isActive     Boolean  @default(true)

  anggota      Anggota?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Anggota {
  id             String @id @default(uuid())
  userId         String? @unique

  memberNumber   String @unique
  nik            String @unique

  fullName       String
  address        String @db.Text
  occupation     String?
  income         Decimal? @db.Decimal(18,2)

  joinDate       DateTime
  status         MemberStatus

  user           User? @relation(fields: [userId], references: [id])

  simpanan       Simpanan[]
  pinjaman       Pinjaman[]
  shu            SHU[]
  notifications  Notification[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Simpanan {
  id              String @id @default(uuid())
  anggotaId       String

  type            SavingType
  amount          Decimal @db.Decimal(18,2)

  transactionDate DateTime

  note            String? @db.Text

  anggota         Anggota @relation(fields: [anggotaId], references: [id])

  createdAt       DateTime @default(now())
}

model Pinjaman {
  id                   String @id @default(uuid())
  anggotaId            String

  principalAmount      Decimal @db.Decimal(18,2)
  interestRate         Decimal @db.Decimal(5,2)

  tenureMonths         Int

  monthlyInstallment   Decimal @db.Decimal(18,2)
  remainingBalance     Decimal @db.Decimal(18,2)

  status               LoanStatus

  applicationDate      DateTime
  approvedDate         DateTime?
  disbursedDate        DateTime?

  notes                String? @db.Text

  anggota              Anggota @relation(fields: [anggotaId], references: [id])

  angsuran             Angsuran[]

  createdAt            DateTime @default(now())
}

model Angsuran {
  id                String @id @default(uuid())
  pinjamanId        String

  installmentNo     Int

  dueDate           DateTime
  paidDate          DateTime?

  principalAmount   Decimal @db.Decimal(18,2)
  interestAmount    Decimal @db.Decimal(18,2)
  penaltyAmount     Decimal @db.Decimal(18,2)
  totalAmount       Decimal @db.Decimal(18,2)

  status            InstallmentStatus

  pinjaman          Pinjaman @relation(fields: [pinjamanId], references: [id])
}

model Akun {
  id            String @id @default(uuid())
  accountCode   String @unique
  accountName   String
  category      String

  details       DetailJurnal[]
}

model Jurnal {
  id              String @id @default(uuid())

  journalNo       String @unique

  transactionDate DateTime

  description     String? @db.Text

  status          JournalStatus

  details         DetailJurnal[]

  createdAt       DateTime @default(now())
}

model DetailJurnal {
  id          String @id @default(uuid())

  jurnalId    String
  akunId      String

  debit       Decimal @db.Decimal(18,2)
  credit      Decimal @db.Decimal(18,2)

  jurnal      Jurnal @relation(fields: [jurnalId], references: [id])
  akun        Akun @relation(fields: [akunId], references: [id])
}

model SHU {
  id          String @id @default(uuid())

  anggotaId   String

  year        Int

  jasaModal   Decimal @db.Decimal(18,2)
  jasaUsaha   Decimal @db.Decimal(18,2)
  totalSHU    Decimal @db.Decimal(18,2)

  status      SHUStatus

  anggota     Anggota @relation(fields: [anggotaId], references: [id])

  @@unique([anggotaId, year])
}

model AuditLog {
  id          String @id @default(uuid())

  userId      String?

  entityName  String
  entityId    String

  action      String

  oldValue    Json?
  newValue    Json?

  createdAt   DateTime @default(now())
}

model Notification {
  id          String @id @default(uuid())

  anggotaId   String

  title       String
  message     String @db.Text

  isRead      Boolean @default(false)

  anggota     Anggota @relation(fields: [anggotaId], references: [id])

  createdAt   DateTime @default(now())
}