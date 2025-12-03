import prisma from "../prismaClient";
import {
  Prisma,
  StatusB,
  StatusP,
  StatusBooking,
  StatusLokasi,
  Role,
} from "../../generated/prisma";

export const peminjamanService = {
  // CREATE (booking + barang)
  create: async (data: {
    userNik: string;
    kodeLokasi?: string;
    lokasiTambahan?: string;
    no_hp: string;
    Agenda: string;
    waktuMulai: Date;
    waktuSelesai: Date;
    barangList: string[]; // Array of NUP
  }) => {
    const {
      userNik,
      kodeLokasi,
      lokasiTambahan,
      no_hp,
      Agenda,
      waktuMulai,
      waktuSelesai,
      barangList,
    } = data;

    // Validasi barang list
    if (!barangList || barangList.length === 0) {
      throw new Error("Daftar barang (barangList) wajib diisi minimal 1 item");
    }

    // Validasi lokasi (salah satu harus ada)
    if (!kodeLokasi && !lokasiTambahan) {
      throw new Error("Lokasi atau lokasi tambahan wajib diisi");
    }

    if (kodeLokasi && lokasiTambahan) {
      throw new Error(
        "Tidak boleh mengisi kodeLokasi dan lokasiTambahan bersamaan"
      );
    }

    // RULE 1 — hanya 1 booking/aktif per user
    const existingActive = await prisma.peminjamanP.findFirst({
      where: {
        userNik,
        status: { in: [StatusP.booking, StatusP.aktif] },
      },
    });

    if (existingActive) {
      throw new Error(
        "Anda masih memiliki peminjaman aktif. Selesaikan terlebih dahulu"
      );
    }

    // RULE 2 — maksimal 3 peminjaman (exclude batal)
    const total = await prisma.peminjamanP.count({
      where: {
        userNik,
        NOT: { status: StatusP.batal },
      },
    });

    if (total >= 3) {
      throw new Error("Anda sudah mencapai batas maksimal 3 peminjaman");
    }

    // CEK VALIDASI BARANG
    const barangChecks = await prisma.barangUnit.findMany({
      where: { nup: { in: barangList } },
      select: {
        nup: true,
        status: true,
        dataBarang: {
          select: {
            jenis_barang: true,
            merek: true,
          },
        },
      },
    });

    // Cek apakah semua barang ditemukan
    if (barangChecks.length !== barangList.length) {
      const foundNups = barangChecks.map((b) => b.nup);
      const notFound = barangList.filter((nup) => !foundNups.includes(nup));
      throw new Error(`Barang tidak ditemukan: ${notFound.join(", ")}`);
    }

    // Cek apakah ada barang yang tidak tersedia
    const unavailable = barangChecks.filter(
      (b) => b.status !== StatusB.Tersedia
    );
    if (unavailable.length > 0) {
      const unavailableList = unavailable
        .map((b) => `${b.nup} (${b.dataBarang.jenis_barang})`)
        .join(", ");
      throw new Error(`Barang tidak tersedia: ${unavailableList}`);
    }

    // Validasi lokasi jika menggunakan kodeLokasi
    if (kodeLokasi) {
      const lokasiData = await prisma.dataLokasi.findUnique({
        where: { kode_lokasi: kodeLokasi },
      });

      if (!lokasiData) {
        throw new Error(`Lokasi dengan kode ${kodeLokasi} tidak ditemukan`);
      }

      if (lokasiData.status === StatusLokasi.dipinjam) {
        throw new Error("Lokasi sedang dipinjam");
      }

      if (lokasiData.status === StatusLokasi.belumTersedia) {
        throw new Error("Lokasi belum tersedia");
      }
    }

    // BUAT PEMINJAMAN + ITEMS dalam transaction
    const pinjam = await prisma.$transaction(async (tx) => {
      const newPeminjaman = await tx.peminjamanP.create({
        data: {
          userNik,
          kodeLokasi: kodeLokasi || null,
          lokasiTambahan: lokasiTambahan || null,
          no_hp,
          Agenda,
          waktuMulai: new Date(waktuMulai),
          waktuSelesai: new Date(waktuSelesai),
          status: StatusP.booking,
          verifikasi: StatusBooking.pending,
          // waktuAmbil & waktuKembali dibiarkan null (belum scan)
          items: {
            create: barangList.map((nup: string) => ({
              nupBarang: nup,
            })),
          },
        },
        include: {
          items: {
            include: {
              barangUnit: {
                include: {
                  dataBarang: true,
                },
              },
            },
          },
          user: {
            select: {
              nik: true,
              nama: true,
              email: true,
            },
          },
          lokasi: true,
        },
      });

      // Model lama: barang langsung TidakTersedia, lokasi langsung dipinjam
      await tx.barangUnit.updateMany({
        where: { nup: { in: barangList } },
        data: { status: StatusB.TidakTersedia },
      });

      if (kodeLokasi) {
        await tx.dataLokasi.update({
          where: { kode_lokasi: kodeLokasi },
          data: { status: StatusLokasi.dipinjam },
        });
      }

      return newPeminjaman;
    });

    return pinjam;
  },

  // BATALKAN
  cancel: async (id: number, userNik: string) => {
    const pem = await prisma.peminjamanP.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!pem) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    // Validasi ownership
    if (pem.userNik !== userNik) {
      throw new Error(
        "Anda tidak memiliki akses untuk membatalkan peminjaman ini"
      );
    }

    // Hanya bisa cancel jika status booking atau pending
    if (pem.status === StatusP.selesai) {
      throw new Error("Peminjaman sudah selesai, tidak dapat dibatalkan");
    }

    if (pem.status === StatusP.batal) {
      throw new Error("Peminjaman sudah dibatalkan sebelumnya");
    }

    if (pem.status === StatusP.aktif) {
      throw new Error(
        "Peminjaman sudah aktif, hubungi staff untuk pembatalan"
      );
    }

    // Cancel dalam transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.peminjamanP.update({
        where: { id },
        data: { status: StatusP.batal, verifikasi: StatusBooking.ditolak },
        include: {
          items: {
            include: {
              barangUnit: {
                include: {
                  dataBarang: true,
                },
              },
            },
          },
          user: true,
          lokasi: true,
        },
      });

      await tx.barangUnit.updateMany({
        where: { nup: { in: pem.items.map((i) => i.nupBarang) } },
        data: { status: StatusB.Tersedia },
      });

      if (pem.kodeLokasi) {
        await tx.dataLokasi.update({
          where: { kode_lokasi: pem.kodeLokasi },
          data: { status: StatusLokasi.tidakDipinjam },
        });
      }

      return updated;
    });

    return result;
  },

  // VERIFIKASI (staff_prodi & kepala_bagian_akademik)
  verify: async (id: number, verifikasi: StatusBooking, role: Role) => {
    const pem = await prisma.peminjamanP.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            barangUnit: {
              include: {
                dataBarang: true,
              },
            },
          },
        },
      },
    });

    if (!pem) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    if (pem.status !== StatusP.booking) {
      throw new Error(
        "Hanya peminjaman dengan status booking yang dapat diverifikasi"
      );
    }

    // Helper: cek apakah jenis_barang termasuk proyektor/infokus
    const isProyektorJenis = (jenis: string | null | undefined) => {
      if (!jenis) return false;
      const j = jenis.toLowerCase();
      return j.includes("proyektor") || j.includes("infokus");
    };

    const semuaBarangProyektor = pem.items.every((item) =>
      isProyektorJenis(item.barangUnit?.dataBarang?.jenis_barang)
    );

    const adaBarangNonProyektor = pem.items.some(
      (item) => !isProyektorJenis(item.barangUnit?.dataBarang?.jenis_barang)
    );

    // RULE ROLE VERIFIKASI
    if (role === Role.staff_prodi) {
      if (!semuaBarangProyektor) {
        throw new Error(
          "Staff Prodi hanya boleh memverifikasi peminjaman proyektor/infokus"
        );
      }
    } else if (role === Role.kepala_bagian_akademik) {
      if (!adaBarangNonProyektor) {
        throw new Error(
          "Peminjaman ini hanya berisi proyektor/infokus dan harus diverifikasi oleh Staff Prodi"
        );
      }
    } else {
      throw new Error("Anda tidak memiliki hak untuk memverifikasi peminjaman ini");
    }

    // Jika ditolak, kembalikan barang dan lokasi
    if (verifikasi === StatusBooking.ditolak) {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.peminjamanP.update({
          where: { id },
          data: {
            verifikasi,
            status: StatusP.batal,
          },
          include: {
            items: true,
            user: true,
            lokasi: true,
          },
        });

        const items = await tx.peminjamanItem.findMany({
          where: { peminjamanId: id },
        });

        await tx.barangUnit.updateMany({
          where: { nup: { in: items.map((i) => i.nupBarang) } },
          data: { status: StatusB.Tersedia },
        });

        if (pem.kodeLokasi) {
          await tx.dataLokasi.update({
            where: { kode_lokasi: pem.kodeLokasi },
            data: { status: StatusLokasi.tidakDipinjam },
          });
        }

        return updated;
      });

      return result;
    }

    // Jika diterima, update verifikasi saja
    return await prisma.peminjamanP.update({
      where: { id },
      data: { verifikasi },
      include: {
        items: {
          include: {
            barangUnit: {
              include: {
                dataBarang: true,
              },
            },
          },
        },
        user: true,
        lokasi: true,
      },
    });
  },

  // AKTIVASI (staff mengaktifkan setelah barang diambil)
  activate: async (id: number) => {
    const pem = await prisma.peminjamanP.findUnique({
      where: { id },
    });

    if (!pem) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    if (pem.verifikasi !== StatusBooking.diterima) {
      throw new Error("Peminjaman harus diverifikasi terlebih dahulu");
    }

    if (pem.status !== StatusP.booking) {
      throw new Error(
        "Hanya peminjaman dengan status booking yang dapat diaktifkan"
      );
    }

    return await prisma.peminjamanP.update({
      where: { id },
      data: { status: StatusP.aktif },
      include: {
        items: {
          include: {
            barangUnit: {
              include: {
                dataBarang: true,
              },
            },
          },
        },
        user: true,
        lokasi: true,
      },
    });
  },

  // SELESAIKAN (staff memproses pengembalian)
  returnBarang: async (id: number) => {
    const pem = await prisma.peminjamanP.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!pem) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    if (pem.status !== StatusP.aktif) {
      throw new Error("Hanya peminjaman aktif yang dapat dikembalikan");
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.peminjamanP.update({
        where: { id },
        data: { status: StatusP.selesai, waktuKembali: new Date() },
        include: {
          items: {
            include: {
              barangUnit: {
                include: {
                  dataBarang: true,
                },
              },
            },
          },
          user: true,
          lokasi: true,
        },
      });

      await tx.barangUnit.updateMany({
        where: { nup: { in: pem.items.map((i) => i.nupBarang) } },
        data: { status: StatusB.Tersedia },
      });

      if (pem.kodeLokasi) {
        await tx.dataLokasi.update({
          where: { kode_lokasi: pem.kodeLokasi },
          data: { status: StatusLokasi.tidakDipinjam },
        });
      }

      return updated;
    });

    return result;
  },

  // SCAN PICKUP (QR pertama / harian) – catat log + waktuAmbil pertama
  scanPickup: async (id: number, petugasNik: string) => {
    const pem = await prisma.peminjamanP.findUnique({
      where: { id },
    });

    if (!pem) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    if (pem.verifikasi !== StatusBooking.diterima) {
      throw new Error("Peminjaman belum diterima, tidak dapat scan pickup");
    }

    // Boleh scan pickup selama status booking atau aktif
    if (pem.status !== StatusP.booking && pem.status !== StatusP.aktif) {
      throw new Error("Peminjaman tidak dalam status yang dapat di-scan pickup");
      }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      // Set waktuAmbil pertama kali & status aktif kalau masih booking
      const updateData: Prisma.PeminjamanPUpdateInput = {};
      if (!pem.waktuAmbil) {
        (updateData as any).waktuAmbil = now;
      }
      if (pem.status === StatusP.booking) {
        (updateData as any).status = StatusP.aktif;
      }

      const pemAfterUpdate =
        Object.keys(updateData).length > 0
          ? await tx.peminjamanP.update({
              where: { id },
              data: updateData,
            })
          : pem;

      // Insert log scan
      await tx.logScanBMN.create({
        data: {
          peminjamanId: id,
          jenis: "pickup",
          waktuScan: now,
          petugasNik,
        },
      });

      return pemAfterUpdate;
    });

    return updated;
  },

  // SCAN RETURN (QR kedua / harian) – catat log + waktuKembali terakhir (opsional)
  scanReturn: async (id: number, petugasNik: string) => {
    const pem = await prisma.peminjamanP.findUnique({
      where: { id },
    });

    if (!pem) {
      throw new Error("Peminjaman tidak ditemukan");
    }

    if (pem.status !== StatusP.aktif) {
      throw new Error("Hanya peminjaman aktif yang dapat di-scan return");
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      // Catat log setiap scan return
      await tx.logScanBMN.create({
        data: {
          peminjamanId: id,
          jenis: "return",
          waktuScan: now,
          petugasNik,
        },
      });

      // Opsional: update waktuKembali setiap scan,
      // atau hanya kalau ini scan terakhir (di sini kita update saja).
      const pemAfterUpdate = await tx.peminjamanP.update({
        where: { id },
        data: {
          waktuKembali: now,
        },
      });

      return pemAfterUpdate;
    });

    return updated;
  },

  // FIND ALL dengan filter
  findAll: (filters?: {
    userNik?: string;
    status?: StatusP;
    verifikasi?: StatusBooking;
  }) => {
    const where: Prisma.PeminjamanPWhereInput = {};

    if (filters?.userNik) where.userNik = filters.userNik;
    if (filters?.status) where.status = filters.status;
    if (filters?.verifikasi) where.verifikasi = filters.verifikasi;

    return prisma.peminjamanP.findMany({
      where,
      include: {
        items: {
          include: {
            barangUnit: {
              include: {
                dataBarang: true,
              },
            },
          },
        },
        user: {
          select: {
            nik: true,
            nama: true,
            email: true,
            role: true,
          },
        },
        lokasi: {
          select: {
            kode_lokasi: true,
            lokasi: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findOne: (id: number) =>
    prisma.peminjamanP.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            barangUnit: {
              include: {
                dataBarang: true,
              },
            },
          },
        },
        user: {
          select: {
            nik: true,
            nama: true,
            email: true,
            role: true,
          },
        },
        lokasi: true,
      },
    }),

  checkExists: async (id: number): Promise<boolean> => {
    const count = await prisma.peminjamanP.count({
      where: { id },
    });
    return count > 0;
  },
};
