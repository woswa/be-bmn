/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nomor_identitas_tunggal]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nomor_identitas_tunggal` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusBooking" AS ENUM ('pending', 'diterima', 'ditolak');

-- CreateEnum
CREATE TYPE "StatusP" AS ENUM ('booking', 'aktif', 'selesai');

-- CreateEnum
CREATE TYPE "StatusB" AS ENUM ('Tersedia', 'TidakTersedia');

-- CreateEnum
CREATE TYPE "KondisiBarangM" AS ENUM ('baik', 'rusak_ringan', 'rusak_berat');

-- CreateEnum
CREATE TYPE "StatusLokasi" AS ENUM ('dipinjam', 'tidakDipinjam');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'KEPALA_PRODI';

-- DropIndex
DROP INDEX "public"."User_nik_key";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "nomor_identitas_tunggal" TEXT NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("nik");

-- CreateTable
CREATE TABLE "BarangUnit" (
    "nup" TEXT NOT NULL,
    "kodeBarang" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "nikUser" TEXT NOT NULL,
    "status" "StatusB" NOT NULL DEFAULT 'Tersedia',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarangUnit_pkey" PRIMARY KEY ("nup")
);

-- CreateTable
CREATE TABLE "DataBarang" (
    "kode_barang" TEXT NOT NULL,
    "jenis_barang" TEXT NOT NULL,
    "merek" TEXT NOT NULL,

    CONSTRAINT "DataBarang_pkey" PRIMARY KEY ("kode_barang")
);

-- CreateTable
CREATE TABLE "DataLokasi" (
    "kode_lokasi" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "status" "StatusLokasi" NOT NULL DEFAULT 'dipinjam',

    CONSTRAINT "DataLokasi_pkey" PRIMARY KEY ("kode_lokasi")
);

-- CreateTable
CREATE TABLE "PeminjamanP" (
    "id" SERIAL NOT NULL,
    "userNik" TEXT NOT NULL,
    "barangUnitId" TEXT NOT NULL,
    "kodeLokasi" TEXT,
    "lokasiTambahan" TEXT,
    "no_hp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Agenda" TEXT NOT NULL,
    "waktuMulai" TIMESTAMP(3) NOT NULL,
    "waktuSelesai" TIMESTAMP(3) NOT NULL,
    "verifikasi" "StatusBooking" NOT NULL DEFAULT 'pending',
    "status" "StatusP" NOT NULL DEFAULT 'booking',

    CONSTRAINT "PeminjamanP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitoring" (
    "id" TEXT NOT NULL,
    "nupBarang" TEXT NOT NULL,
    "waktu" TIMESTAMP(3) NOT NULL,
    "plt" TEXT NOT NULL,
    "kondisiBarang" "KondisiBarangM" NOT NULL DEFAULT 'baik',
    "lokasiBarang" TEXT,
    "lokasiTambahan" TEXT,
    "foto" TEXT NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "Monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nomor_identitas_tunggal_key" ON "User"("nomor_identitas_tunggal");

-- AddForeignKey
ALTER TABLE "BarangUnit" ADD CONSTRAINT "BarangUnit_nikUser_fkey" FOREIGN KEY ("nikUser") REFERENCES "User"("nik") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangUnit" ADD CONSTRAINT "BarangUnit_kodeBarang_fkey" FOREIGN KEY ("kodeBarang") REFERENCES "DataBarang"("kode_barang") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangUnit" ADD CONSTRAINT "BarangUnit_lokasi_fkey" FOREIGN KEY ("lokasi") REFERENCES "DataLokasi"("kode_lokasi") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeminjamanP" ADD CONSTRAINT "PeminjamanP_kodeLokasi_fkey" FOREIGN KEY ("kodeLokasi") REFERENCES "DataLokasi"("kode_lokasi") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeminjamanP" ADD CONSTRAINT "PeminjamanP_barangUnitId_fkey" FOREIGN KEY ("barangUnitId") REFERENCES "BarangUnit"("nup") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeminjamanP" ADD CONSTRAINT "PeminjamanP_userNik_fkey" FOREIGN KEY ("userNik") REFERENCES "User"("nik") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitoring" ADD CONSTRAINT "Monitoring_lokasiBarang_fkey" FOREIGN KEY ("lokasiBarang") REFERENCES "DataLokasi"("kode_lokasi") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitoring" ADD CONSTRAINT "Monitoring_nupBarang_fkey" FOREIGN KEY ("nupBarang") REFERENCES "BarangUnit"("nup") ON DELETE RESTRICT ON UPDATE CASCADE;
