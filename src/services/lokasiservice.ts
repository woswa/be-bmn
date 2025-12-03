import prisma from "../prismaClient";
import { Prisma, StatusLokasi } from "../../generated/prisma";

export const lokasiService = {
  create: (data: Prisma.DataLokasiCreateInput) => 
    prisma.dataLokasi.create({ 
      data,
      select: {
        kode_lokasi: true,
        lokasi: true,
        status: true,
      }
    }),

  findAll: (filters?: { status?: StatusLokasi }) => {
    const where: Prisma.DataLokasiWhereInput = {};
    
    if (filters?.status) where.status = filters.status;

    return prisma.dataLokasi.findMany({ 
      where,
      include: { 
        barangUnit: {
          select: {
            nup: true,
            status: true,
            dataBarang: {
              select: {
                jenis_barang: true,
                merek: true,
              }
            }
          }
        },
        peminjamanP: {
          where: {
            status: {
              in: ['booking', 'aktif'] // Hanya peminjaman aktif
            }
          },
          select: {
            id: true,
            userNik: true,
            Agenda: true,
            waktuMulai: true,
            waktuSelesai: true,
            status: true,
            verifikasi: true,
            no_hp: true, // no_hp ada di PeminjamanP, bukan di User
            user: {
              select: {
                nama: true,
                email: true,
              }
            }
          },
          orderBy: {
            waktuMulai: 'desc'
          }
        },
        monitoring: {
          select: {
            id: true,
            waktu: true,
            kondisiBarang: true,
            plt: true,
          },
          orderBy: {
            waktu: 'desc'
          },
          take: 10 // 10 monitoring terakhir
        }
      },
      orderBy: {
        kode_lokasi: 'asc'
      }
    });
  },

  findOne: (kode: string) => 
    prisma.dataLokasi.findUnique({ 
      where: { kode_lokasi: kode }, 
      include: { 
        barangUnit: {
          select: {
            nup: true,
            status: true,
            createdAt: true,
            dataBarang: {
              select: {
                kode_barang: true,
                jenis_barang: true,
                merek: true,
              }
            }
          }
        },
        peminjamanP: {
          select: {
            id: true,
            userNik: true,
            Agenda: true,
            waktuMulai: true,
            waktuSelesai: true,
            status: true,
            verifikasi: true,
            no_hp: true, // no_hp ada di PeminjamanP
            createdAt: true,
            user: {
              select: {
                nik: true,
                nama: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        monitoring: {
          select: {
            id: true,
            nupBarang: true,
            waktu: true,
            plt: true,
            kondisiBarang: true,
            keterangan: true,
            barangUnit: {
              select: {
                dataBarang: {
                  select: {
                    jenis_barang: true,
                    merek: true,
                  }
                }
              }
            }
          },
          orderBy: {
            waktu: 'desc'
          }
        }
      } 
    }),

  update: (kode: string, data: Prisma.DataLokasiUpdateInput) => 
    prisma.dataLokasi.update({ 
      where: { kode_lokasi: kode }, 
      data,
      select: {
        kode_lokasi: true,
        lokasi: true,
        status: true,
      }
    }),

  delete: (kode: string) =>
    prisma.dataLokasi.delete({ 
      where: { kode_lokasi: kode },
      select: {
        kode_lokasi: true,
        lokasi: true,
      }
    }),

  setStatus: (kode: string, status: StatusLokasi) =>
    prisma.dataLokasi.update({
      where: { kode_lokasi: kode },
      data: { status },
      select: {
        kode_lokasi: true,
        lokasi: true,
        status: true,
      }
    }),

  checkExists: async (kode: string): Promise<boolean> => {
    const count = await prisma.dataLokasi.count({
      where: { kode_lokasi: kode }
    });
    return count > 0;
  },

  // Cek apakah lokasi sedang digunakan (ada barang atau peminjaman aktif)
  checkInUse: async (kode: string): Promise<{
    hasBarang: boolean;
    hasPeminjaman: boolean;
  }> => {
    const [barangCount, peminjamanCount] = await Promise.all([
      prisma.barangUnit.count({
        where: { lokasi: kode }
      }),
      prisma.peminjamanP.count({
        where: {
          kodeLokasi: kode,
          status: {
            in: ['booking', 'aktif']
          }
        }
      })
    ]);

    return {
      hasBarang: barangCount > 0,
      hasPeminjaman: peminjamanCount > 0
    };
  },

  // Get available lokasi (tidak sedang dipinjam)
  findAvailable: () =>
    prisma.dataLokasi.findMany({
      where: {
        status: StatusLokasi.tidakDipinjam
      },
      select: {
        kode_lokasi: true,
        lokasi: true,
        status: true,
      },
      orderBy: {
        lokasi: 'asc'
      }
    })
};
