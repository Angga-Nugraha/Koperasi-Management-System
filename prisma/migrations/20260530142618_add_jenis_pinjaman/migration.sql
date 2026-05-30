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

-- Seed default jenis pinjaman
INSERT INTO `jenis_pinjaman` (`id`, `nama`, `bunga`, `keterangan`, `createdAt`, `updatedAt`) VALUES
(UUID(), 'Konsumsi', 2.00, 'Pinjaman untuk kebutuhan konsumsi', NOW(), NOW()),
(UUID(), 'Pendidikan', 1.50, 'Pinjaman untuk biaya pendidikan', NOW(), NOW()),
(UUID(), 'Modal Usaha', 1.00, 'Pinjaman untuk modal usaha anggota', NOW(), NOW()),
(UUID(), 'Karyawan', 1.50, 'Pinjaman khusus karyawan', NOW(), NOW()),
(UUID(), 'Multiguna', 2.50, 'Pinjaman multiguna', NOW(), NOW());

-- Add column as nullable first
ALTER TABLE `pinjaman` ADD COLUMN `jenisPinjamanId` VARCHAR(191) NULL;

-- Update existing rows with the ID of 'Konsumsi' jenis
UPDATE `pinjaman` SET `jenisPinjamanId` = (SELECT `id` FROM `jenis_pinjaman` WHERE `nama` = 'Konsumsi' LIMIT 1);

-- Now make it NOT NULL
ALTER TABLE `pinjaman` MODIFY COLUMN `jenisPinjamanId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `pinjaman` ADD CONSTRAINT `pinjaman_jenisPinjamanId_fkey` FOREIGN KEY (`jenisPinjamanId`) REFERENCES `jenis_pinjaman`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
