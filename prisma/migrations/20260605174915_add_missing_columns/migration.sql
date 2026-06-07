-- Add missing columns to anggota
ALTER TABLE `anggota` ADD COLUMN `noHp` VARCHAR(191) NULL;
ALTER TABLE `anggota` ADD COLUMN `jenisKelamin` VARCHAR(191) NULL;

-- Add missing columns to transaksi_simpanan
ALTER TABLE `transaksi_simpanan` ADD COLUMN `noStruk` VARCHAR(191) NULL;

-- Add missing columns to angsuran
ALTER TABLE `angsuran` ADD COLUMN `noStruk` VARCHAR(191) NULL;

-- Add missing columns to audit_log
ALTER TABLE `audit_log` ADD COLUMN `userEmail` VARCHAR(191) NULL;

-- Create TransaksiOnline table
CREATE TABLE `transaksi_online` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `tipe` VARCHAR(191) NOT NULL,
    `anggotaId` VARCHAR(191) NOT NULL,
    `relatedId` VARCHAR(191) NULL,
    `nominal` DECIMAL(18, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `snapToken` VARCHAR(191) NULL,
    `snapUrl` VARCHAR(191) NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `expiredAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `transaksi_online_orderId_key`(`orderId`),
    INDEX `transaksi_online_anggotaId_idx`(`anggotaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `transaksi_online` ADD CONSTRAINT `transaksi_online_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
