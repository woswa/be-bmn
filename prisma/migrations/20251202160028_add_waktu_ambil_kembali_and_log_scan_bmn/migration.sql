-- AlterTable
ALTER TABLE "PeminjamanP" ADD COLUMN     "waktuAmbil" TIMESTAMP(3),
ADD COLUMN     "waktuKembali" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LogScanBMN" (
    "id" SERIAL NOT NULL,
    "peminjamanId" INTEGER NOT NULL,
    "jenis" TEXT NOT NULL,
    "waktuScan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "petugasNik" TEXT NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "LogScanBMN_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LogScanBMN" ADD CONSTRAINT "LogScanBMN_peminjamanId_fkey" FOREIGN KEY ("peminjamanId") REFERENCES "PeminjamanP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
