-- DropForeignKey
ALTER TABLE "public"."PeminjamanP" DROP CONSTRAINT "PeminjamanP_barangUnitId_fkey";

-- AlterTable
ALTER TABLE "PeminjamanP" ALTER COLUMN "barangUnitId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PeminjamanItem" (
    "id" SERIAL NOT NULL,
    "peminjamanId" INTEGER NOT NULL,
    "nupBarang" TEXT NOT NULL,

    CONSTRAINT "PeminjamanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PeminjamanItem_peminjamanId_idx" ON "PeminjamanItem"("peminjamanId");

-- CreateIndex
CREATE INDEX "PeminjamanItem_nupBarang_idx" ON "PeminjamanItem"("nupBarang");

-- AddForeignKey
ALTER TABLE "PeminjamanItem" ADD CONSTRAINT "PeminjamanItem_peminjamanId_fkey" FOREIGN KEY ("peminjamanId") REFERENCES "PeminjamanP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeminjamanItem" ADD CONSTRAINT "PeminjamanItem_nupBarang_fkey" FOREIGN KEY ("nupBarang") REFERENCES "BarangUnit"("nup") ON DELETE RESTRICT ON UPDATE CASCADE;
