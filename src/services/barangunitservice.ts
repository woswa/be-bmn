import prisma from "../prismaClient";
import { Prisma, StatusB } from "../../generated/prisma";

export const barangUnitService = {
  create: (data: Prisma.BarangUnitCreateInput) => 
    prisma.barangUnit.create({ 
      data,
      select: {
        nup: true,
        kodeBarang: true,
        lokasi: true,
        nikUser: true,
        status: true,
        createdAt: true,
        dataBarang: {
          select: {
            kode_barang: true,
            jenis_barang: true,
            merek: true,
          }
        },
        dataLokasi: {
          select: {
            kode_lokasi: true,
            lokasi: true,
            status: true,
          }
        },
        user: {
          select: {
            nik: true,
            nama: true,
            email: true,
            role: true,
          }
        }
      }
    }),

  findAll: (filters?: { 
    status?: StatusB; 
    lokasi?: string; 
    kodeBarang?: string;
  }) => {
    const where: Prisma.BarangUnitWhereInput = {};
    
    if (filters?.status) where.status = filters.status;
    if (filters?.lokasi) where.lokasi = filters.lokasi;
    if (filters?.kodeBarang) where.kodeBarang = filters.kodeBarang;

    return prisma.barangUnit.findMany({ 
      where,
      include: { 
        user: {
          select: {
            nik: true,
            nama: true,
            email: true,
            role: true,
          }
        },
        dataBarang: {
          select: {
            kode_barang: true,
            jenis_barang: true,
            merek: true,
          }
        },
        dataLokasi: {
          select: {
            kode_lokasi: true,
            lokasi: true,
            status: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  },

  findOne: (nup: string) => 
    prisma.barangUnit.findUnique({ 
      where: { nup }, 
      include: { 
        user: {
          select: {
            nik: true,
            nama: true,
            email: true,
            role: true,
          }
        },
        dataBarang: {
          select: {
            kode_barang: true,
            jenis_barang: true,
            merek: true,
          }
        },
        dataLokasi: {
          select: {
            kode_lokasi: true,
            lokasi: true,
            status: true,
          }
        },
        monitoring: {
          select: {
            id: true,
            waktu: true,
            kondisiBarang: true,
            keterangan: true,
          },
          orderBy: {
            waktu: 'desc'
          },
          take: 5 // 5 monitoring terakhir
        }
      } 
    }),

  update: (nup: string, data: Prisma.BarangUnitUpdateInput) => 
    prisma.barangUnit.update({ 
      where: { nup }, 
      data,
      select: {
        nup: true,
        kodeBarang: true,
        lokasi: true,
        nikUser: true,
        status: true,
        createdAt: true,
      }
    }),

  delete: (nup: string) => 
    prisma.barangUnit.delete({ 
      where: { nup },
      select: {
        nup: true,
        kodeBarang: true,
        dataBarang: {
          select: {
            jenis_barang: true,
            merek: true,
          }
        }
      }
    }),

  setStatus: (nup: string, status: StatusB) => 
    prisma.barangUnit.update({ 
      where: { nup }, 
      data: { status },
      select: {
        nup: true,
        status: true,
      }
    }),

  checkExists: async (nup: string): Promise<boolean> => {
    const count = await prisma.barangUnit.count({
      where: { nup }
    });
    return count > 0;
  },

  checkDataBarangExists: async (kodeBarang: string): Promise<boolean> => {
    const count = await prisma.dataBarang.count({
      where: { kode_barang: kodeBarang }
    });
    return count > 0;
  },

  checkLokasiExists: async (kodeLokasi: string): Promise<boolean> => {
    const count = await prisma.dataLokasi.count({
      where: { kode_lokasi: kodeLokasi }
    });
    return count > 0;
  },

  checkUserExists: async (nik: string): Promise<boolean> => {
    const count = await prisma.user.count({
      where: { nik }
    });
    return count > 0;
  }
};
