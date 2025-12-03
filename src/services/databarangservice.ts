import prisma from "../prismaClient";
import { Prisma } from "../../generated/prisma";

export const dataBarangService = {
  create: (data: Prisma.DataBarangCreateInput) => 
    prisma.dataBarang.create({ 
      data,
      select: {
        kode_barang: true,
        jenis_barang: true,
        merek: true,
        barangUnit: {
          select: {
            nup: true,
            status: true,
            lokasi: true,
          }
        }
      }
    }),

  findAll: () => 
    prisma.dataBarang.findMany({ 
      include: { 
        barangUnit: {
          select: {
            nup: true,
            status: true,
            lokasi: true,
          }
        } 
      },
      orderBy: {
        kode_barang: 'asc'
      }
    }),

  findOne: (kode: string) => 
    prisma.dataBarang.findUnique({ 
      where: { kode_barang: kode }, 
      include: { 
        barangUnit: {
          select: {
            nup: true,
            status: true,
            lokasi: true,
            createdAt: true,
          }
        } 
      } 
    }),

  update: (kode: string, data: Prisma.DataBarangUpdateInput) => 
    prisma.dataBarang.update({ 
      where: { kode_barang: kode }, 
      data,
      select: {
        kode_barang: true,
        jenis_barang: true,
        merek: true,
      }
    }),

  remove: (kode: string) => 
    prisma.dataBarang.delete({ 
      where: { kode_barang: kode },
      select: {
        kode_barang: true,
        jenis_barang: true,
        merek: true,
      }
    }),

  checkExists: async (kode: string): Promise<boolean> => {
    const count = await prisma.dataBarang.count({
      where: { kode_barang: kode }
    });
    return count > 0;
  }
};
