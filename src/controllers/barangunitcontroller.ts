import { Request, Response } from "express";
import { barangUnitService } from "../services/barangunitservice";
import { Prisma, StatusB } from "../../generated/prisma";

export const barangUnitController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nup, kodeBarang, lokasi, nikUser, status } = req.body;

      // Validasi input wajib
      if (!nup || !kodeBarang || !lokasi || !nikUser) {
        res.status(400).json({ 
          success: false,
          message: "NUP, kode barang, lokasi, dan NIK user wajib diisi" 
        });
        return;
      }

      // Cek apakah NUP sudah ada
      const nupExists = await barangUnitService.checkExists(nup);
      if (nupExists) {
        res.status(409).json({ 
          success: false,
          message: `Barang unit dengan NUP ${nup} sudah terdaftar` 
        });
        return;
      }

      // Cek apakah data barang exists
      const barangExists = await barangUnitService.checkDataBarangExists(kodeBarang);
      if (!barangExists) {
        res.status(404).json({ 
          success: false,
          message: `Data barang dengan kode ${kodeBarang} tidak ditemukan` 
        });
        return;
      }

      // Cek apakah lokasi exists
      const lokasiExists = await barangUnitService.checkLokasiExists(lokasi);
      if (!lokasiExists) {
        res.status(404).json({ 
          success: false,
          message: `Data lokasi dengan kode ${lokasi} tidak ditemukan` 
        });
        return;
      }

      // Cek apakah user exists
      const userExists = await barangUnitService.checkUserExists(nikUser);
      if (!userExists) {
        res.status(404).json({ 
          success: false,
          message: `User dengan NIK ${nikUser} tidak ditemukan` 
        });
        return;
      }

      // Validasi status jika diberikan
      let barangStatus: StatusB = StatusB.Tersedia;
      if (status && Object.values(StatusB).includes(status)) {
        barangStatus = status as StatusB;
      }

      const data = await barangUnitService.create({
        nup,
        dataBarang: {
          connect: { kode_barang: kodeBarang }
        },
        dataLokasi: {
          connect: { kode_lokasi: lokasi }
        },
        user: {
          connect: { nik: nikUser }
        },
        status: barangStatus
      });

      res.status(201).json({ 
        success: true,
        message: "Barang unit berhasil ditambahkan",
        data 
      });
    } catch (err: any) {
      console.error("Create barang unit error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          res.status(409).json({ 
            success: false,
            message: "NUP sudah terdaftar" 
          });
          return;
        }
        if (err.code === 'P2003') {
          res.status(400).json({ 
            success: false,
            message: "Foreign key constraint gagal. Pastikan kode barang, lokasi, dan NIK user valid" 
          });
          return;
        }
      }

      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  findAll: async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, lokasi, kodeBarang } = req.query;

      // Build filters
      const filters: { 
        status?: StatusB; 
        lokasi?: string; 
        kodeBarang?: string;
      } = {};

      if (status && Object.values(StatusB).includes(status as StatusB)) {
        filters.status = status as StatusB;
      }
      if (lokasi && typeof lokasi === 'string') {
        filters.lokasi = lokasi;
      }
      if (kodeBarang && typeof kodeBarang === 'string') {
        filters.kodeBarang = kodeBarang;
      }

      const data = await barangUnitService.findAll(filters);
      
      res.json({ 
        success: true,
        message: "Data barang unit berhasil diambil",
        data,
        total: data.length,
        filters: Object.keys(filters).length > 0 ? filters : null
      });
    } catch (err: any) {
      console.error("Find all barang unit error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  findOne: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nup } = req.params;

      if (!nup) {
        res.status(400).json({ 
          success: false,
          message: "NUP wajib diisi" 
        });
        return;
      }

      const data = await barangUnitService.findOne(nup);

      if (!data) {
        res.status(404).json({ 
          success: false,
          message: `Barang unit dengan NUP ${nup} tidak ditemukan` 
        });
        return;
      }

      res.json({ 
        success: true,
        message: "Data barang unit berhasil diambil",
        data 
      });
    } catch (err: any) {
      console.error("Find one barang unit error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nup } = req.params;
      const { kodeBarang, lokasi, nikUser, status } = req.body;

      if (!nup) {
        res.status(400).json({ 
          success: false,
          message: "NUP wajib diisi" 
        });
        return;
      }

      // Validasi minimal ada satu field untuk update
      if (!kodeBarang && !lokasi && !nikUser && !status) {
        res.status(400).json({ 
          success: false,
          message: "Minimal satu field harus diisi untuk update" 
        });
        return;
      }

      // Cek apakah barang unit exists
      const exists = await barangUnitService.checkExists(nup);
      if (!exists) {
        res.status(404).json({ 
          success: false,
          message: `Barang unit dengan NUP ${nup} tidak ditemukan` 
        });
        return;
      }

      // Build update data
      const updateData: Prisma.BarangUnitUpdateInput = {};

      if (kodeBarang) {
        const barangExists = await barangUnitService.checkDataBarangExists(kodeBarang);
        if (!barangExists) {
          res.status(404).json({ 
            success: false,
            message: `Data barang dengan kode ${kodeBarang} tidak ditemukan` 
          });
          return;
        }
        updateData.dataBarang = { connect: { kode_barang: kodeBarang } };
      }

      if (lokasi) {
        const lokasiExists = await barangUnitService.checkLokasiExists(lokasi);
        if (!lokasiExists) {
          res.status(404).json({ 
            success: false,
            message: `Data lokasi dengan kode ${lokasi} tidak ditemukan` 
          });
          return;
        }
        updateData.dataLokasi = { connect: { kode_lokasi: lokasi } };
      }

      if (nikUser) {
        const userExists = await barangUnitService.checkUserExists(nikUser);
        if (!userExists) {
          res.status(404).json({ 
            success: false,
            message: `User dengan NIK ${nikUser} tidak ditemukan` 
          });
          return;
        }
        updateData.user = { connect: { nik: nikUser } };
      }

      if (status && Object.values(StatusB).includes(status)) {
        updateData.status = status as StatusB;
      }

      const data = await barangUnitService.update(nup, updateData);

      res.json({ 
        success: true,
        message: "Barang unit berhasil diupdate",
        data 
      });
    } catch (err: any) {
      console.error("Update barang unit error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          res.status(404).json({ 
            success: false,
            message: "Barang unit tidak ditemukan" 
          });
          return;
        }
        if (err.code === 'P2003') {
          res.status(400).json({ 
            success: false,
            message: "Foreign key constraint gagal" 
          });
          return;
        }
      }

      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  delete: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nup } = req.params;

      if (!nup) {
        res.status(400).json({ 
          success: false,
          message: "NUP wajib diisi" 
        });
        return;
      }

      // Cek apakah barang unit exists
      const exists = await barangUnitService.checkExists(nup);
      if (!exists) {
        res.status(404).json({ 
          success: false,
          message: `Barang unit dengan NUP ${nup} tidak ditemukan` 
        });
        return;
      }

      const data = await barangUnitService.delete(nup);

      res.json({ 
        success: true,
        message: "Barang unit berhasil dihapus",
        data 
      });
    } catch (err: any) {
      console.error("Delete barang unit error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2003') {
          res.status(409).json({ 
            success: false,
            message: "Tidak dapat menghapus barang unit karena masih memiliki data terkait (monitoring atau peminjaman)" 
          });
          return;
        }
        if (err.code === 'P2025') {
          res.status(404).json({ 
            success: false,
            message: "Barang unit tidak ditemukan" 
          });
          return;
        }
      }

      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  updateStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { nup } = req.params;
      const { status } = req.body;

      if (!nup) {
        res.status(400).json({ 
          success: false,
          message: "NUP wajib diisi" 
        });
        return;
      }

      if (!status || !Object.values(StatusB).includes(status)) {
        res.status(400).json({ 
          success: false,
          message: `Status harus salah satu dari: ${Object.values(StatusB).join(", ")}` 
        });
        return;
      }

      const exists = await barangUnitService.checkExists(nup);
      if (!exists) {
        res.status(404).json({ 
          success: false,
          message: `Barang unit dengan NUP ${nup} tidak ditemukan` 
        });
        return;
      }

      const data = await barangUnitService.setStatus(nup, status as StatusB);

      res.json({ 
        success: true,
        message: "Status barang unit berhasil diupdate",
        data 
      });
    } catch (err: any) {
      console.error("Update status error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  }
};
