import prisma from "../prismaClient";
import { Prisma, KondisiBarangM } from "../../generated/prisma";

export const monitoringService = {
  create: (data: {
    id: string;
    nupBarang: string;
    waktu: Date;
    plt: string;
    kondisiBarang: KondisiBarangM;
    lokasiBarang?: string;
    lokasiTambahan?: string;
    foto: string;
    keterangan?: string;
  }) => 
    prisma.monitoring.create({ 
      data,
      select: {
        id: true,
        nupBarang: true,
        waktu: true,
        plt: true,
        kondisiBarang: true,
        lokasiBarang: true,
        lokasiTambahan: true,
        foto: true,
        keterangan: true,
        barangUnit: {
          select: {
            nup: true,
            dataBarang: {
              select: {
                kode_barang: true,
                jenis_barang: true,
                merek: true,
              }
            }
          }
        },
        dataLokasi: {
          select: {
            kode_lokasi: true,
            lokasi: true,
            status: true,
          }
        }
      }
    }),

  findAll: (filters?: {
    nupBarang?: string;
    kondisiBarang?: KondisiBarangM;
    lokasiBarang?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    const where: Prisma.MonitoringWhereInput = {};

    if (filters?.nupBarang) where.nupBarang = filters.nupBarang;
    if (filters?.kondisiBarang) where.kondisiBarang = filters.kondisiBarang;
    if (filters?.lokasiBarang) where.lokasiBarang = filters.lokasiBarang;
    
    if (filters?.startDate || filters?.endDate) {
      where.waktu = {};
      if (filters.startDate) where.waktu.gte = filters.startDate;
      if (filters.endDate) where.waktu.lte = filters.endDate;
    }

    return prisma.monitoring.findMany({
      where,
      include: {
        barangUnit: {
          select: {
            nup: true,
            status: true,
            dataBarang: {
              select: {
                kode_barang: true,
                jenis_barang: true,
                merek: true,
              }
            }
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
        waktu: 'desc'
      }
    });
  },

  findOne: (id: string) =>
    prisma.monitoring.findUnique({
      where: { id },
      include: {
        barangUnit: {
          select: {
            nup: true,
            status: true,
            lokasi: true,
            nikUser: true,
            dataBarang: {
              select: {
                kode_barang: true,
                jenis_barang: true,
                merek: true,
              }
            },
            user: {
              select: {
                nik: true,
                nama: true,
                email: true,
              }
            }
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
    }),

  update: (id: string, data: Prisma.MonitoringUpdateInput) =>
    prisma.monitoring.update({
      where: { id },
      data,
      select: {
        id: true,
        nupBarang: true,
        waktu: true,
        plt: true,
        kondisiBarang: true,
        lokasiBarang: true,
        lokasiTambahan: true,
        foto: true,
        keterangan: true,
      }
    }),

  delete: (id: string) =>
    prisma.monitoring.delete({
      where: { id },
      select: {
        id: true,
        nupBarang: true,
        waktu: true,
        kondisiBarang: true,
      }
    }),

  checkExists: async (id: string): Promise<boolean> => {
    const count = await prisma.monitoring.count({
      where: { id }
    });
    return count > 0;
  },

  checkBarangExists: async (nup: string): Promise<boolean> => {
    const count = await prisma.barangUnit.count({
      where: { nup }
    });
    return count > 0;
  },

  checkLokasiExists: async (kode: string): Promise<boolean> => {
    const count = await prisma.dataLokasi.count({
      where: { kode_lokasi: kode }
    });
    return count > 0;
  },

  // Get monitoring history by barang
  findByBarang: (nup: string) =>
    prisma.monitoring.findMany({
      where: { nupBarang: nup },
      include: {
        dataLokasi: {
          select: {
            kode_lokasi: true,
            lokasi: true,
          }
        }
      },
      orderBy: {
        waktu: 'desc'
      }
    }),

  // Get latest monitoring by barang
  findLatestByBarang: (nup: string) =>
    prisma.monitoring.findFirst({
      where: { nupBarang: nup },
      orderBy: {
        waktu: 'desc'
      },
      include: {
        dataLokasi: {
          select: {
            kode_lokasi: true,
            lokasi: true,
          }
        }
      }
    })
};
