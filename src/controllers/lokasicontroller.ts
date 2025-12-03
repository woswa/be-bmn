import { Request, Response } from "express";
import { lokasiService } from "../services/lokasiservice";
import { Prisma, StatusLokasi } from "../../generated/prisma";

export const lokasiController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kode_lokasi, lokasi, status } = req.body;

      // Validasi input wajib
      if (!kode_lokasi || !lokasi) {
        res.status(400).json({ 
          success: false,
          message: "Kode lokasi dan nama lokasi wajib diisi" 
        });
        return;
      }

      // Cek apakah kode lokasi sudah ada
      const exists = await lokasiService.checkExists(kode_lokasi);
      if (exists) {
        res.status(409).json({ 
          success: false,
          message: `Lokasi dengan kode ${kode_lokasi} sudah terdaftar` 
        });
        return;
      }

      // Validasi status jika diberikan
      let lokasiStatus: StatusLokasi = StatusLokasi.tidakDipinjam;
      if (status && Object.values(StatusLokasi).includes(status)) {
        lokasiStatus = status as StatusLokasi;
      }

      const data = await lokasiService.create({
        kode_lokasi,
        lokasi,
        status: lokasiStatus
      });

      res.status(201).json({ 
        success: true,
        message: "Data lokasi berhasil ditambahkan",
        data 
      });
    } catch (err: any) {
      console.error("Create lokasi error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          res.status(409).json({ 
            success: false,
            message: "Kode lokasi sudah terdaftar" 
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
      const { status } = req.query;

      // Build filters
      const filters: { status?: StatusLokasi } = {};

      if (status && Object.values(StatusLokasi).includes(status as StatusLokasi)) {
        filters.status = status as StatusLokasi;
      }

      const data = await lokasiService.findAll(filters);
      
      res.json({ 
        success: true,
        message: "Data lokasi berhasil diambil",
        data,
        total: data.length,
        filters: Object.keys(filters).length > 0 ? filters : null
      });
    } catch (err: any) {
      console.error("Find all lokasi error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  findOne: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kode } = req.params;

      if (!kode) {
        res.status(400).json({ 
          success: false,
          message: "Kode lokasi wajib diisi" 
        });
        return;
      }

      const data = await lokasiService.findOne(kode);

      if (!data) {
        res.status(404).json({ 
          success: false,
          message: `Lokasi dengan kode ${kode} tidak ditemukan` 
        });
        return;
      }

      res.json({ 
        success: true,
        message: "Data lokasi berhasil diambil",
        data 
      });
    } catch (err: any) {
      console.error("Find one lokasi error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kode } = req.params;
      const { lokasi, status } = req.body;

      if (!kode) {
        res.status(400).json({ 
          success: false,
          message: "Kode lokasi wajib diisi" 
        });
        return;
      }

      // Validasi minimal ada satu field untuk update
      if (!lokasi && !status) {
        res.status(400).json({ 
          success: false,
          message: "Minimal satu field (lokasi atau status) harus diisi untuk update" 
        });
        return;
      }

      // Cek apakah lokasi exists
      const exists = await lokasiService.checkExists(kode);
      if (!exists) {
        res.status(404).json({ 
          success: false,
          message: `Lokasi dengan kode ${kode} tidak ditemukan` 
        });
        return;
      }

      // Build update data
      const updateData: Prisma.DataLokasiUpdateInput = {};
      if (lokasi) updateData.lokasi = lokasi;
      if (status && Object.values(StatusLokasi).includes(status)) {
        updateData.status = status as StatusLokasi;
      }

      const data = await lokasiService.update(kode, updateData);

      res.json({ 
        success: true,
        message: "Data lokasi berhasil diupdate",
        data 
      });
    } catch (err: any) {
      console.error("Update lokasi error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          res.status(404).json({ 
            success: false,
            message: "Lokasi tidak ditemukan" 
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
      const { kode } = req.params;

      if (!kode) {
        res.status(400).json({ 
          success: false,
          message: "Kode lokasi wajib diisi" 
        });
        return;
      }

      // Cek apakah lokasi exists
      const exists = await lokasiService.checkExists(kode);
      if (!exists) {
        res.status(404).json({ 
          success: false,
          message: `Lokasi dengan kode ${kode} tidak ditemukan` 
        });
        return;
      }

      // Cek apakah lokasi sedang digunakan
      const inUse = await lokasiService.checkInUse(kode);
      if (inUse.hasBarang) {
        res.status(409).json({ 
          success: false,
          message: "Tidak dapat menghapus lokasi karena masih ada barang unit di lokasi ini" 
        });
        return;
      }
      if (inUse.hasPeminjaman) {
        res.status(409).json({ 
          success: false,
          message: "Tidak dapat menghapus lokasi karena masih ada peminjaman aktif di lokasi ini" 
        });
        return;
      }

      const data = await lokasiService.delete(kode);

      res.json({ 
        success: true,
        message: "Data lokasi berhasil dihapus",
        data 
      });
    } catch (err: any) {
      console.error("Delete lokasi error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2003') {
          res.status(409).json({ 
            success: false,
            message: "Tidak dapat menghapus lokasi karena masih memiliki data terkait" 
          });
          return;
        }
        if (err.code === 'P2025') {
          res.status(404).json({ 
            success: false,
            message: "Lokasi tidak ditemukan" 
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
      const { kode } = req.params;
      const { status } = req.body;

      if (!kode) {
        res.status(400).json({ 
          success: false,
          message: "Kode lokasi wajib diisi" 
        });
        return;
      }

      if (!status || !Object.values(StatusLokasi).includes(status)) {
        res.status(400).json({ 
          success: false,
          message: `Status harus salah satu dari: ${Object.values(StatusLokasi).join(", ")}` 
        });
        return;
      }

      const exists = await lokasiService.checkExists(kode);
      if (!exists) {
        res.status(404).json({ 
          success: false,
          message: `Lokasi dengan kode ${kode} tidak ditemukan` 
        });
        return;
      }

      const data = await lokasiService.setStatus(kode, status as StatusLokasi);

      res.json({ 
        success: true,
        message: "Status lokasi berhasil diupdate",
        data 
      });
    } catch (err: any) {
      console.error("Update status lokasi error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  findAvailable: async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await lokasiService.findAvailable();
      
      res.json({ 
        success: true,
        message: "Data lokasi tersedia berhasil diambil",
        data,
        total: data.length
      });
    } catch (err: any) {
      console.error("Find available lokasi error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  }
};
