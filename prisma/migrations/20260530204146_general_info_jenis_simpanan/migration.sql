-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('PENGURUS', 'BENDAHARA', 'ANGGOTA', 'PENGAWAS') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `anggotaId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_anggotaId_key`(`anggotaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `general_info` (
    `id` VARCHAR(191) NOT NULL,
    `namaKoperasi` VARCHAR(191) NOT NULL DEFAULT 'Koperasi Simpan Pinjam',
    `alamat` TEXT NULL,
    `noAhu` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anggota` (
    `id` VARCHAR(191) NOT NULL,
    `nik` VARCHAR(191) NOT NULL,
    `noAnggota` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `alamat` TEXT NOT NULL,
    `pekerjaan` VARCHAR(191) NULL,
    `penghasilan` DECIMAL(18, 2) NULL,
    `foto` VARCHAR(191) NULL,
    `ktp` VARCHAR(191) NULL,
    `tglMasuk` DATETIME(3) NOT NULL,
    `status` ENUM('AKTIF', 'NONAKTIF', 'KELUAR') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `anggota_nik_key`(`nik`),
    UNIQUE INDEX `anggota_noAnggota_key`(`noAnggota`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jenis_simpanan` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `minimalSetoran` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `keterangan` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jenis_simpanan_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `simpanan` (
    `id` VARCHAR(191) NOT NULL,
    `anggotaId` VARCHAR(191) NOT NULL,
    `jenisSimpananId` VARCHAR(191) NOT NULL,
    `saldo` DECIMAL(18, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `simpanan_anggotaId_jenisSimpananId_key`(`anggotaId`, `jenisSimpananId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaksi_simpanan` (
    `id` VARCHAR(191) NOT NULL,
    `anggotaId` VARCHAR(191) NOT NULL,
    `jenisSimpananId` VARCHAR(191) NOT NULL,
    `tipe` VARCHAR(191) NOT NULL,
    `nominal` DECIMAL(18, 2) NOT NULL,
    `saldoSetelah` DECIMAL(18, 2) NOT NULL,
    `keterangan` TEXT NULL,
    `dibuatOlehId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jenis_pinjaman` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `bunga` DECIMAL(5, 2) NOT NULL,
    `keterangan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jenis_pinjaman_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pinjaman` (
    `id` VARCHAR(191) NOT NULL,
    `anggotaId` VARCHAR(191) NOT NULL,
    `jenisPinjamanId` VARCHAR(191) NOT NULL,
    `jumlah` DECIMAL(18, 2) NOT NULL,
    `tenor` INTEGER NOT NULL,
    `bunga` DECIMAL(5, 2) NOT NULL,
    `angsuranPokok` DECIMAL(18, 2) NOT NULL,
    `angsuranJasa` DECIMAL(18, 2) NOT NULL,
    `angsuranTotal` DECIMAL(18, 2) NOT NULL,
    `sisaPinjaman` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('PENGAJUAN', 'DISETUJUI', 'DITOLAK', 'DICAIKKAN', 'LUNAS', 'GAGAL') NOT NULL,
    `tglPengajuan` DATETIME(3) NOT NULL,
    `tglDisetujui` DATETIME(3) NULL,
    `tglDitolak` DATETIME(3) NULL,
    `tglCair` DATETIME(3) NULL,
    `keterangan` TEXT NULL,
    `disetujuiOlehId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `angsuran` (
    `id` VARCHAR(191) NOT NULL,
    `pinjamanId` VARCHAR(191) NOT NULL,
    `angsuranKe` INTEGER NOT NULL,
    `jatuhTempo` DATETIME(3) NOT NULL,
    `tglBayar` DATETIME(3) NULL,
    `pokok` DECIMAL(18, 2) NOT NULL,
    `jasa` DECIMAL(18, 2) NOT NULL,
    `denda` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('BELUM_LUNAS', 'LUNAS', 'TERLAMBAT') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `angsuran_pinjamanId_angsuranKe_key`(`pinjamanId`, `angsuranKe`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `akun` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `tipe` ENUM('ASET', 'LIABILITAS', 'EKUITAS', 'PENDAPATAN', 'BEBAN') NOT NULL,
    `saldoNormal` ENUM('DEBIT', 'KREDIT') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `akun_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jurnal_umum` (
    `id` VARCHAR(191) NOT NULL,
    `noJurnal` VARCHAR(191) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `keterangan` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `jurnal_umum_noJurnal_key`(`noJurnal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_jurnal` (
    `id` VARCHAR(191) NOT NULL,
    `jurnalId` VARCHAR(191) NOT NULL,
    `akunId` VARCHAR(191) NOT NULL,
    `debit` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `kredit` DECIMAL(18, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shu` (
    `id` VARCHAR(191) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `totalSHU` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('DRAFT', 'FINAL') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shu_tahun_key`(`tahun`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alokasi_shu` (
    `id` VARCHAR(191) NOT NULL,
    `shuId` VARCHAR(191) NOT NULL,
    `pos` VARCHAR(191) NOT NULL,
    `persentase` DECIMAL(5, 2) NOT NULL,
    `nominal` DECIMAL(18, 2) NOT NULL,

    UNIQUE INDEX `alokasi_shu_shuId_pos_key`(`shuId`, `pos`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shu_anggota` (
    `id` VARCHAR(191) NOT NULL,
    `anggotaId` VARCHAR(191) NOT NULL,
    `shuId` VARCHAR(191) NOT NULL,
    `jasaModal` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `jasaUsaha` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(18, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `shu_anggota_anggotaId_shuId_key`(`anggotaId`, `shuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `oldValue` JSON NULL,
    `newValue` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `konfigurasi` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `tipeData` VARCHAR(191) NOT NULL,
    `keterangan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `konfigurasi_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `simpanan` ADD CONSTRAINT `simpanan_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `simpanan` ADD CONSTRAINT `simpanan_jenisSimpananId_fkey` FOREIGN KEY (`jenisSimpananId`) REFERENCES `jenis_simpanan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_simpanan` ADD CONSTRAINT `transaksi_simpanan_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_simpanan` ADD CONSTRAINT `transaksi_simpanan_jenisSimpananId_fkey` FOREIGN KEY (`jenisSimpananId`) REFERENCES `jenis_simpanan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinjaman` ADD CONSTRAINT `pinjaman_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pinjaman` ADD CONSTRAINT `pinjaman_jenisPinjamanId_fkey` FOREIGN KEY (`jenisPinjamanId`) REFERENCES `jenis_pinjaman`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `angsuran` ADD CONSTRAINT `angsuran_pinjamanId_fkey` FOREIGN KEY (`pinjamanId`) REFERENCES `pinjaman`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_jurnal` ADD CONSTRAINT `detail_jurnal_jurnalId_fkey` FOREIGN KEY (`jurnalId`) REFERENCES `jurnal_umum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_jurnal` ADD CONSTRAINT `detail_jurnal_akunId_fkey` FOREIGN KEY (`akunId`) REFERENCES `akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alokasi_shu` ADD CONSTRAINT `alokasi_shu_shuId_fkey` FOREIGN KEY (`shuId`) REFERENCES `shu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shu_anggota` ADD CONSTRAINT `shu_anggota_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shu_anggota` ADD CONSTRAINT `shu_anggota_shuId_fkey` FOREIGN KEY (`shuId`) REFERENCES `shu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
