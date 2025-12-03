import { Request, Response } from "express";
import { dataBarangService } from "../services/databarangservice";
import { Prisma } from "../../generated/prisma";

export const dataBarangController = {
  create: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kode_barang, jenis_barang, merek } = req.body;

      // Validasi input
      if (!kode_barang || !jenis_barang || !merek) {
        res.status(400).json({ 
          success: false,
          message: "Kode barang, jenis barang, dan merek wajib diisi" 
        });
        return;
      }

      // Cek apakah kode sudah ada
      const exists = await dataBarangService.checkExists(kode_barang);
      if (exists) {
        res.status(409).json({ 
          success: false,
          message: `Barang dengan kode ${kode_barang} sudah terdaftar` 
        });
        return;
      }

      const data = await dataBarangService.create({
        kode_barang,
        jenis_barang,
        merek
      });

      res.status(201).json({ 
        success: true,
        message: "Data barang berhasil ditambahkan",
        data 
      });
    } catch (err: any) {
      console.error("Create barang error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          res.status(409).json({ 
            success: false,
            message: "Kode barang sudah ada" 
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

  findAll: async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await dataBarangService.findAll();
      
      res.json({ 
        success: true,
        message: "Data barang berhasil diambil",
        data,
        total: data.length
      });
    } catch (err: any) {
      console.error("Find all barang error:", err);
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
          message: "Kode barang wajib diisi" 
        });
        return;
      }

      const data = await dataBarangService.findOne(kode);

      if (!data) {
        res.status(404).json({ 
          success: false,
          message: `Barang dengan kode ${kode} tidak ditemukan` 
        });
        return;
      }

      res.json({ 
        success: true,
        message: "Data barang berhasil diambil",
        data 
      });
    } catch (err: any) {
      console.error("Find one barang error:", err);
      res.status(500).json({ 
        success: false,
        message: "Terjadi kesalahan server" 
      });
    }
  },

  update: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kode } = req.params;
      const { jenis_barang, merek } = req.body;

      if (!kode) {
        res.status(400).json({ 
          success: false,
          message: "Kode barang wajib diisi" 
        });
        return;
      }

      // Validasi minimal ada satu field untuk diupdate
      if (!jenis_barang && !merek) {
        res.status(400).json({ 
          success: false,
          message: "Minimal satu field (jenis_barang atau merek) harus diisi untuk update" 
        });
        return;
      }

      // Cek apakah barang exists
      const exists = await dataBarangService.checkExists(kode);
      if (!exists) {
        res.status(404).json({ 
          success: false,
          message: `Barang dengan kode ${kode} tidak ditemukan` 
        });
        return;
      }

      // Build update data
      const updateData: Prisma.DataBarangUpdateInput = {};
      if (jenis_barang) updateData.jenis_barang = jenis_barang;
      if (merek) updateData.merek = merek;

      const data = await dataBarangService.update(kode, updateData);

      res.json({ 
        success: true,
        message: "Data barang berhasil diupdate",
        data 
      });
    } catch (err: any) {
      console.error("Update barang error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          res.status(404).json({ 
            success: false,
            message: "Barang tidak ditemukan" 
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

  remove: async (req: Request, res: Response): Promise<void> => {
    try {
      const { kode } = req.params;

      if (!kode) {
        res.status(400).json({ 
          success: false,
          message: "Kode barang wajib diisi" 
        });
        return;
      }

      // Cek apakah barang exists
      const exists = await dataBarangService.checkExists(kode);
      if (!exists) {
        res.status(404).json({ 
          success: false,
          message: `Barang dengan kode ${kode} tidak ditemukan` 
        });
        return;
      }

      const data = await dataBarangService.remove(kode);

      res.json({ 
        success: true,
        message: "Data barang berhasil dihapus",
        data 
      });
    } catch (err: any) {
      console.error("Delete barang error:", err);

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2003') {
          res.status(409).json({ 
            success: false,
            message: "Tidak dapat menghapus barang karena masih memiliki unit barang terkait" 
          });
          return;
        }
        if (err.code === 'P2025') {
          res.status(404).json({ 
            success: false,
            message: "Barang tidak ditemukan" 
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
};
