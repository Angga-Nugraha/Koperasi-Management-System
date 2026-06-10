-- CreateTable: kepengurusan
CREATE TABLE `kepengurusan` (
    `id` VARCHAR(191) NOT NULL,
    `jabatan` VARCHAR(191) NOT NULL,
    `tipe` VARCHAR(191) NOT NULL,
    `anggotaId` VARCHAR(191) NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kepengurusan_jabatan_key`(`jabatan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kepengurusan` ADD CONSTRAINT `kepengurusan_anggotaId_fkey` FOREIGN KEY (`anggotaId`) REFERENCES `anggota`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
