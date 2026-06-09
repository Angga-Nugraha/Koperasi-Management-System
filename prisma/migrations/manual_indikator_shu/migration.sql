-- Drop existing FK and recreate (MySQL 8 compatible)
ALTER TABLE `alokasi_shu` DROP FOREIGN KEY `alokasi_shu_shuId_fkey`;
DROP INDEX `alokasi_shu_shuId_pos_key` ON `alokasi_shu`;

-- Create IndikatorSHU table
CREATE TABLE IF NOT EXISTS `indikator_shu` (
    `id` VARCHAR(36) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `persentase` DECIMAL(5,2) NOT NULL,
    `kelompok` VARCHAR(191) NOT NULL,
    `akunId` VARCHAR(36) NULL,
    `urutan` INT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `indikator_shu_kode_key` (`kode`),
    INDEX `indikator_shu_akunId_idx` (`akunId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indikatorId to alokasi_shu
ALTER TABLE `alokasi_shu` ADD COLUMN `indikatorId` VARCHAR(36) NULL;
ALTER TABLE `alokasi_shu` ADD INDEX `alokasi_shu_indikatorId_idx` (`indikatorId`);
