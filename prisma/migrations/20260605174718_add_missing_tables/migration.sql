-- CreateTable: device_tokens
CREATE TABLE `device_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `device_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: notifikasi
CREATE TABLE `notifikasi` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `relatedId` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `notifikasi_userId_isRead_idx`(`userId`, `isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: tagihan_simpanan
CREATE TABLE `tagihan_simpanan` (
    `id` VARCHAR(191) NOT NULL,
    `anggotaId` VARCHAR(191) NOT NULL,
    `jenisSimpananId` VARCHAR(191) NOT NULL,
    `bulan` INTEGER NOT NULL,
    `tahun` INTEGER NOT NULL,
    `nominal` DECIMAL(18, 2) NOT NULL,
    `jatuhTempo` DATETIME(3) NOT NULL,
    `tglBayar` DATETIME(3) NULL,
    `status` ENUM('BELUM_LUNAS', 'LUNAS', 'TERLAMBAT') NOT NULL,
    `noStruk` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `tagihan_simpanan_anggotaId_jenisSimpananId_bulan_tahun_key`(`anggotaId`, `jenisSimpananId`, `bulan`, `tahun`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKeys
ALTER TABLE `device_tokens` ADD CONSTRAINT `device_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tagihan_simpanan` ADD CONSTRAINT `tagihan_simpanan_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tagihan_simpanan` ADD CONSTRAINT `tagihan_simpanan_jenisSimpananId_fkey` FOREIGN KEY (`jenisSimpananId`) REFERENCES `jenis_simpanan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
